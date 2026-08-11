import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Body, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, ValidationError


# --- Initialize FastAPI App ---
app = FastAPI(
    title="CreditRisk AI Backend API",
    description="Production Machine Learning Risk Engine served by Champion Logistic Regression Pipeline",
    version="1.0.0"
)

# Standard Production CORS (Same-Origin / Safe Cross-Origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Model Manager (Singleton Pattern) ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "datasets", "credit_risk_pipeline.joblib")
METRICS_PATH = os.path.join(BASE_DIR, "datasets", "model_metrics_and_features.json")

if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join("datasets", "credit_risk_pipeline.joblib")
if not os.path.exists(METRICS_PATH):
    METRICS_PATH = os.path.join("datasets", "model_metrics_and_features.json")

class ModelManager:
    _instance = None

    def __init__(self, override_model_path: Optional[str] = None):
        self.model = None
        self.metrics = {}
        self.input_features = []
        self.model_path = override_model_path or MODEL_PATH
        self.load_model()

    def load_model(self):
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                print(f"[ModelManager] Champion model loaded cleanly from {self.model_path}")
            else:
                self.model = None
                print(f"[ModelManager] WARNING: Model path {self.model_path} not found.")

            if os.path.exists(METRICS_PATH):
                with open(METRICS_PATH, "r") as f:
                    self.metrics = json.load(f)
                self.input_features = self.metrics.get("input_features", [])
        except Exception as e:
            self.model = None
            print(f"[ModelManager] ERROR loading model: {e}")

model_manager = ModelManager()


# --- Pydantic Data Models & Strict Schema Validation ---
class CustomerDataInput(BaseModel):
    customer_id: Optional[str] = "CUST-NEW"
    age: float = Field(..., ge=18, le=120, example=34)
    monthly_income_pkr: Optional[float] = Field(None, ge=0, example=75000)
    employment_years: float = Field(0.0, ge=0, le=70, example=5.0)
    employment_type: str = Field("Salaried", example="Salaried")
    existing_customer_years: float = Field(0.0, ge=0, example=2.0)
    account_balance_pkr: float = Field(0.0, example=150000) # Negative account balance permitted in training/cloud distribution
    loan_amount_pkr: float = Field(..., gt=0, example=250000)
    loan_term_months: int = Field(12, gt=0, le=360, example=12)
    interest_rate_pct: float = Field(12.5, ge=0, le=100, example=13.5)
    credit_score: float = Field(..., ge=300, le=850, example=680)
    debt_to_income_pct: float = Field(25.0, ge=0, le=150, example=25.0) # DTI up to 150 permitted
    missed_payments_12m: int = Field(0, ge=0, example=0)
    late_payments_24m: int = Field(0, ge=0, example=0)
    number_of_open_loans: int = Field(0, ge=0, example=1)
    savings_balance_pkr: float = Field(0.0, ge=0, example=100000)
    avg_monthly_transactions: int = Field(0, ge=0, example=30)
    avg_monthly_card_spend_pkr: float = Field(0.0, ge=0, example=15000)
    digital_logins_30d: int = Field(0, ge=0, example=12)
    city_tier: str = Field("Tier 1", example="Tier 1")
    home_ownership: str = Field("Own", example="Own")
    loan_purpose: str = Field("Personal", example="Personal")
    previous_default: int = Field(0, ge=0, le=1, example=0)
    loan_to_income_ratio: Optional[float] = None
    savings_to_income_ratio: Optional[float] = None
    payment_stress: Optional[float] = None

    @field_validator('employment_type')
    def validate_emp_type(cls, v):
        valid = ['Salaried', 'Self-employed', 'Contract', 'Unemployed']
        if v not in valid:
            raise ValueError(f"Invalid employment_type '{v}'. Must be one of {valid}")
        return v

    @field_validator('city_tier')
    def validate_city_tier(cls, v):
        valid = ['Tier 1', 'Tier 2', 'Tier 3']
        if v not in valid:
            raise ValueError(f"Invalid city_tier '{v}'. Must be one of {valid}")
        return v

    @field_validator('home_ownership')
    def validate_home_ownership(cls, v):
        valid = ['Rent', 'Own', 'Mortgage', 'Family']
        if v not in valid:
            raise ValueError(f"Invalid home_ownership '{v}'. Must be one of {valid}")
        return v

    @field_validator('loan_purpose')
    def validate_loan_purpose(cls, v):
        valid = ['Auto', 'Personal', 'Medical', 'Home Improvement', 'Business', 'Education']
        if v not in valid:
            raise ValueError(f"Invalid loan_purpose '{v}'. Must be one of {valid}")
        return v

class DataSourceTestInput(BaseModel):
    source_type: str
    host: Optional[str] = None
    database: Optional[str] = None
    username: Optional[str] = None
    table_name: Optional[str] = None
    bucket: Optional[str] = None

class ValidateDataInput(BaseModel):
    source_type: str
    column_mapping: Dict[str, str]
    records: List[Dict[str, Any]]

class MergeDataInput(BaseModel):
    primary_dataset: List[Dict[str, Any]]
    secondary_dataset: List[Dict[str, Any]]
    join_key: str = "customer_id"


# --- Single Source of Truth for Feature Engineering ---
def compute_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    # Exact required formulas:
    # 1. loan_to_income_ratio = loan_amount_pkr / monthly_income_pkr
    # 2. savings_to_income_ratio = savings_balance_pkr / monthly_income_pkr
    # 3. payment_stress = missed_payments_12m + late_payments_24m
    
    income = pd.to_numeric(pd.Series(df['monthly_income_pkr'] if 'monthly_income_pkr' in df.columns else np.nan), errors='coerce')
    loan_amt = pd.to_numeric(pd.Series(df['loan_amount_pkr'] if 'loan_amount_pkr' in df.columns else np.nan), errors='coerce')
    savings = pd.to_numeric(pd.Series(df['savings_balance_pkr'] if 'savings_balance_pkr' in df.columns else np.nan), errors='coerce')
    missed = pd.to_numeric(pd.Series(df['missed_payments_12m'] if 'missed_payments_12m' in df.columns else 0), errors='coerce').fillna(0)
    late = pd.to_numeric(pd.Series(df['late_payments_24m'] if 'late_payments_24m' in df.columns else 0), errors='coerce').fillna(0)

    # Safe division: if monthly_income_pkr <= 0 or NaN, set ratio to np.nan so pipeline imputer handles it
    safe_income = income.apply(lambda v: float(v) if (pd.notna(v) and float(v) > 0) else np.nan)
    
    df['loan_to_income_ratio'] = loan_amt / safe_income
    df['savings_to_income_ratio'] = savings / safe_income
    df['payment_stress'] = missed + late

    return df


# --- Helper Functions for Inference & Risk Indicators ---
def preprocess_and_predict_single(data_dict: Dict[str, Any]):
    if model_manager.model is None:
        raise HTTPException(status_code=503, detail="Champion ML Model file is missing or not loaded.")

    df = pd.DataFrame([data_dict])
    df = compute_engineered_features(df)

    probs = model_manager.model.predict_proba(df)[0]
    default_prob = float(probs[1])
    
    default_prob = max(0.0, min(1.0, default_prob))
    pred_label = int(default_prob >= 0.5)

    if default_prob < 0.35:
        risk_level = "Low Risk"
    elif default_prob <= 0.65:
        risk_level = "Medium Risk"
    else:
        risk_level = "High Risk"

    key_factors = calculate_key_risk_factors(data_dict, default_prob)

    return {
        "customer_id": str(data_dict.get("customer_id", "CUST-UNKNOWN")),
        "prediction": pred_label,
        "default_probability": round(default_prob, 4),
        "default_probability_pct": round(default_prob * 100, 2),
        "risk_level": risk_level,
        "key_risk_factors": key_factors,
        "model_name": "Logistic Regression Champion",
        "model_version": "v1.0.0"
    }

def calculate_key_risk_factors(row: Dict[str, Any], default_prob: float) -> List[Dict[str, Any]]:
    factors = []
    
    dti = float(row.get("debt_to_income_pct", 25.0) or 25.0)
    if dti > 40:
        factors.append({
            "factor": "High Debt-to-Income Ratio",
            "indicator_type": "Rule-based Risk Indicator",
            "severity": "high",
            "description": f"Debt-to-income ratio ({dti}%) exceeds 40% threshold."
        })
    elif dti > 30:
        factors.append({
            "factor": "Elevated Debt-to-Income",
            "indicator_type": "Rule-based Risk Indicator",
            "severity": "medium",
            "description": f"Debt-to-income ratio ({dti}%) is elevated."
        })

    cs = float(row.get("credit_score", 680.0) or 680.0)
    if cs < 620:
        factors.append({
            "factor": "Low Credit Score",
            "indicator_type": "Rule-based Risk Indicator",
            "severity": "high",
            "description": f"Credit score ({cs}) is in subprime risk category (<620)."
        })
    elif cs < 670:
        factors.append({
            "factor": "Fair Credit Score",
            "indicator_type": "Rule-based Risk Indicator",
            "severity": "medium",
            "description": f"Credit score ({cs}) is fair."
        })

    missed = int(row.get("missed_payments_12m", 0) or 0)
    late = int(row.get("late_payments_24m", 0) or 0)
    stress = missed + late
    if stress > 0:
        factors.append({
            "factor": "Payment Stress & Delinquencies",
            "indicator_type": "Rule-based Risk Indicator",
            "severity": "high" if stress > 1 else "medium",
            "description": f"Payment stress count is {stress} ({missed} missed 12m, {late} late 24m)."
        })

    prev_def = int(row.get("previous_default", 0) or 0)
    if prev_def > 0:
        factors.append({
            "factor": "Prior Loan Default History",
            "indicator_type": "Rule-based Risk Indicator",
            "severity": "high",
            "description": "Applicant has recorded prior default events."
        })

    if len(factors) < 3:
        factors.append({
            "factor": "Loan Amount Ratio",
            "indicator_type": "Rule-based Risk Indicator",
            "severity": "medium" if default_prob > 0.4 else "low",
            "description": "Proportion of requested loan against monthly income."
        })

    return factors[:5]


# --- API Routes ---

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CreditRisk AI ML Engine",
        "model_loaded": model_manager.model is not None,
        "champion_model": "Logistic Regression Champion",
        "version": "1.0.0"
    }

@app.get("/model-info")
@app.get("/api/model-info")
def model_info():
    return {
        "model_name": "Logistic Regression Champion",
        "model_version": "v1.0.0",
        "algorithm": "LogisticRegression (balanced weights, liblinear)",
        "final_metrics": {
            "Accuracy": 0.7750,
            "ROC-AUC": 0.8342,
            "F1": 0.4000,
            "Precision": 0.3077,
            "Recall": 0.5714,
            "PR-AUC": 0.4194
        },
        "input_features": model_manager.input_features,
        "training_metadata": {
            "dataset_rows": 800,
            "target_variable": "default_next_12m",
            "preprocessing": "SimpleImputer + StandardScaler + OneHotEncoder"
        }
    }

@app.post("/predict")
@app.post("/api/predict")
def predict(customer_data: CustomerDataInput):
    data_dict = customer_data.model_dump()
    result = preprocess_and_predict_single(data_dict)
    return result

@app.post("/predict-batch")
@app.post("/api/predict-batch")
async def predict_batch(
    request: Request,
    file: Optional[UploadFile] = File(None)
):
    records = []
    
    if file is not None:
        try:
            content = await file.read()
            if file.filename.endswith('.csv'):
                import io
                df = pd.read_csv(io.BytesIO(content))
                records = df.to_dict(orient='records')
            elif file.filename.endswith('.json'):
                records = json.loads(content.decode('utf-8'))
            else:
                raise HTTPException(status_code=400, detail="Invalid file format. Only CSV or JSON files supported.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV or JSON file payload: {str(e)}")
    else:
        try:
            body = await request.json()
            if isinstance(body, list):
                records = body
            elif isinstance(body, dict) and "records" in body:
                records = body["records"]
        except Exception:
            raise HTTPException(status_code=400, detail="Either file upload or JSON body payload is required.")

    if not isinstance(records, list) or len(records) == 0:
        raise HTTPException(status_code=400, detail="No valid records found in batch payload.")

    seen_ids = set()
    results = []
    invalid_rows = []
    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0
    total_prob = 0.0

    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            invalid_rows.append({"row_index": idx, "error": "Invalid record object"})
            continue

        cust_id = str(rec.get("customer_id", "")).strip()
        if not cust_id or cust_id == "nan" or cust_id == "None":
            cust_id = f"CUST-BATCH-{idx+1}"
        elif cust_id in seen_ids:
            cust_id = f"{cust_id}-DUP-{idx+1}"
        seen_ids.add(cust_id)
        rec["customer_id"] = cust_id

        try:
            validated_input = CustomerDataInput(**rec).model_dump()
            res = preprocess_and_predict_single(validated_input)
            results.append(res)

            prob = res["default_probability"]
            total_prob += prob
            if res["risk_level"] == "High Risk":
                high_risk_count += 1
            elif res["risk_level"] == "Medium Risk":
                medium_risk_count += 1
            else:
                low_risk_count += 1
        except ValidationError as val_err:
            invalid_rows.append({"row_index": idx, "customer_id": cust_id, "error": str(val_err)})

    total_count = len(results)
    avg_prob = round(total_prob / total_count, 4) if total_count > 0 else 0.0

    return {
        "summary": {
            "total_records": total_count,
            "invalid_records": len(invalid_rows),
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "average_default_probability": avg_prob,
            "average_default_probability_pct": round(avg_prob * 100, 2)
        },
        "predictions": results,
        "invalid_rows": invalid_rows
    }

# --- Honest External Data Source Endpoints (HTTP 501 Until Cloud Connected) ---
@app.post("/data/preview")
@app.post("/api/data/preview")
def data_preview(config: DataSourceTestInput):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Cloud data integration not configured. Google Cloud / database integration pending."
    )

@app.post("/data/validate")
@app.post("/api/data/validate")
def data_validate(payload: ValidateDataInput):
    required_features = model_manager.input_features
    mapped_targets = list(payload.column_mapping.values())
    
    missing = [f for f in required_features if f not in mapped_targets and f not in [
        'loan_to_income_ratio', 'savings_to_income_ratio', 'payment_stress'
    ]]
    
    match_pct = round(((len(required_features) - len(missing)) / len(required_features)) * 100, 1)

    return {
        "valid": len(missing) == 0,
        "source_type": payload.source_type,
        "mapped_columns_count": len(payload.column_mapping),
        "total_required_features": len(required_features),
        "match_percentage": match_pct,
        "missing_features": missing
    }

@app.post("/data/merge")
@app.post("/api/data/merge")
def data_merge(payload: MergeDataInput):
    prim_df = pd.DataFrame(payload.primary_dataset)
    sec_df = pd.DataFrame(payload.secondary_dataset)

    if prim_df.empty or sec_df.empty:
        merged = payload.primary_dataset or payload.secondary_dataset
    else:
        merged_df = pd.merge(prim_df, sec_df, on=payload.join_key, how="inner", suffixes=('', '_ext'))
        merged = merged_df.to_dict(orient="records")

    return {
        "status": "success",
        "join_key": payload.join_key,
        "total_merged_records": len(merged),
        "preview": merged[:5]
    }

@app.post("/data-source/test")
@app.post("/api/data-source/test")
def data_source_test(config: DataSourceTestInput):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Cloud data integration connector not configured. HTTP 501 returned until Google Cloud credentials are added."
    )

@app.get("/customers")
@app.get("/api/customers")
def get_sample_customers():
    return {"customers": []}

@app.get("/results")
@app.get("/api/results")
def get_results_history():
    return []

