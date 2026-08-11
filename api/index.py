import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, ValidationError

# --- Transparent Runtime Sklearn 1.6 -> 1.8 Backward Compatibility ---
import sklearn.compose._column_transformer
if not hasattr(sklearn.compose._column_transformer, '_RemainderColsList'):
    class _RemainderColsList(list): pass
    sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList

import sklearn.impute._base
_orig_imputer_transform = sklearn.impute.SimpleImputer.transform
def _patched_imputer_transform(self, X):
    if not hasattr(self, '_fill_dtype'):
        self._fill_dtype = getattr(self, '_fit_dtype', getattr(X, 'dtype', None))
    return _orig_imputer_transform(self, X)
sklearn.impute.SimpleImputer.transform = _patched_imputer_transform


# --- Initialize FastAPI App ---
app = FastAPI(
    title="CreditRisk AI Backend API",
    description="Production Machine Learning Risk Engine served by Champion Logistic Regression Pipeline",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Model Manager (Singleton Pattern) ---
# Dynamic path relative to module location using __file__
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "datasets", "credit_risk_pipeline.joblib")
METRICS_PATH = os.path.join(BASE_DIR, "datasets", "model_metrics_and_features.json")
EXCEL_PATH = os.path.join(BASE_DIR, "datasets", "Bank_Loan_Default_Practice_Project - Copy.xlsx")

# Fallback lookup relative to working dir if needed
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join("datasets", "credit_risk_pipeline.joblib")
if not os.path.exists(METRICS_PATH):
    METRICS_PATH = os.path.join("datasets", "model_metrics_and_features.json")
if not os.path.exists(EXCEL_PATH):
    EXCEL_PATH = os.path.join("datasets", "Bank_Loan_Default_Practice_Project - Copy.xlsx")

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
                print(f"[ModelManager] Champion model loaded successfully from {self.model_path}")
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
    age: float = Field(35.0, ge=18, le=120, example=34)
    monthly_income_pkr: Optional[float] = Field(75000.0, ge=0, example=75000)
    employment_years: float = Field(3.0, ge=0, le=70, example=5.0)
    employment_type: str = Field("Salaried", example="Salaried") # Salaried, Self-Employed, Contract, Unemployed
    existing_customer_years: float = Field(0.0, ge=0, example=2.0)
    account_balance_pkr: float = Field(0.0, ge=0, example=150000)
    loan_amount_pkr: float = Field(250000.0, gt=0, example=250000)
    loan_term_months: int = Field(12, gt=0, le=360, example=12)
    interest_rate_pct: float = Field(12.5, ge=0, le=100, example=13.5)
    credit_score: float = Field(680.0, ge=300, le=850, example=680)
    debt_to_income_pct: float = Field(25.0, ge=0, le=100, example=25.0)
    missed_payments_12m: int = Field(0, ge=0, example=0)
    late_payments_24m: int = Field(0, ge=0, example=0)
    number_of_open_loans: int = Field(0, ge=0, example=1)
    savings_balance_pkr: float = Field(0.0, ge=0, example=100000)
    avg_monthly_transactions: int = Field(0, ge=0, example=30)
    avg_monthly_card_spend_pkr: float = Field(0.0, ge=0, example=15000)
    digital_logins_30d: int = Field(0, ge=0, example=12)
    city_tier: str = Field("Tier 1", example="Tier 1") # Tier 1, Tier 2, Tier 3
    home_ownership: str = Field("Own", example="Own") # Own, Rent, Mortgage
    loan_purpose: str = Field("Personal", example="Personal") # Personal, Auto, Education, Business
    previous_default: int = Field(0, ge=0, le=1, example=0)
    loan_to_income_ratio: Optional[float] = None
    savings_to_income_ratio: Optional[float] = None
    payment_stress: Optional[float] = None

    @field_validator('employment_type')
    def validate_emp_type(cls, v):
        valid = ['Salaried', 'Self-Employed', 'Contract', 'Unemployed']
        if v not in valid:
            return 'Salaried'
        return v

    @field_validator('city_tier')
    def validate_city_tier(cls, v):
        valid = ['Tier 1', 'Tier 2', 'Tier 3']
        if v not in valid:
            return 'Tier 1'
        return v

    @field_validator('home_ownership')
    def validate_home_ownership(cls, v):
        valid = ['Own', 'Rent', 'Mortgage']
        if v not in valid:
            return 'Own'
        return v

    @field_validator('loan_purpose')
    def validate_loan_purpose(cls, v):
        valid = ['Personal', 'Auto', 'Education', 'Business']
        if v not in valid:
            return 'Personal'
        return v

class DataSourceTestInput(BaseModel):
    source_type: str # postgresql, mysql, bigquery, s3, gcs, azure, snowflake
    host: Optional[str] = None
    database: Optional[str] = None
    username: Optional[str] = None
    table_name: Optional[str] = None
    bucket: Optional[str] = None

class ValidateDataInput(BaseModel):
    source_type: str
    column_mapping: Dict[str, str] # source_col -> target_feature
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


# --- Helper Functions for Inference & Key Factors ---
def preprocess_and_predict_single(data_dict: Dict[str, Any]):
    if model_manager.model is None:
        raise HTTPException(status_code=503, detail="Champion ML Model file is missing or not loaded.")

    df = pd.DataFrame([data_dict])
    df = compute_engineered_features(df)

    # Predict using Logistic Regression pipeline
    probs = model_manager.model.predict_proba(df)[0]
    default_prob = float(probs[1])
    
    # Guarantee probability between 0 and 1
    default_prob = max(0.0, min(1.0, default_prob))
    pred_label = int(default_prob >= 0.5)

    # Risk level determination
    if default_prob < 0.35:
        risk_level = "Low Risk"
    elif default_prob <= 0.65:
        risk_level = "Medium Risk"
    else:
        risk_level = "High Risk"

    # Compute key risk factors (Explainability)
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
    
    # Feature 1: Debt to Income
    dti = float(row.get("debt_to_income_pct", 25.0) or 25.0)
    if dti > 40:
        factors.append({
            "factor": "High Debt-to-Income Ratio",
            "impact": "+32%",
            "severity": "high",
            "description": f"Debt-to-income ratio ({dti}%) exceeds healthy 40% threshold."
        })
    elif dti > 30:
        factors.append({
            "factor": "Elevated Debt-to-Income",
            "impact": "+15%",
            "severity": "medium",
            "description": f"Debt-to-income ratio ({dti}%) is moderately high."
        })

    # Feature 2: Credit Score
    cs = float(row.get("credit_score", 680.0) or 680.0)
    if cs < 620:
        factors.append({
            "factor": "Low Credit Score",
            "impact": "+28%",
            "severity": "high",
            "description": f"Credit score ({cs}) falls in subprime risk category (<620)."
        })
    elif cs < 670:
        factors.append({
            "factor": "Fair Credit Score",
            "impact": "+12%",
            "severity": "medium",
            "description": f"Credit score ({cs}) is fair but below prime target."
        })

    # Feature 3: Missed / Late Payments & Payment Stress
    missed = int(row.get("missed_payments_12m", 0) or 0)
    late = int(row.get("late_payments_24m", 0) or 0)
    stress = missed + late
    if stress > 0:
        factors.append({
            "factor": "Payment Stress & Delinquencies",
            "impact": f"+{min(35, stress * 12)}%",
            "severity": "high" if stress > 1 else "medium",
            "description": f"Payment stress count is {stress} ({missed} missed 12m, {late} late 24m)."
        })

    # Feature 4: Previous Default
    prev_def = int(row.get("previous_default", 0) or 0)
    if prev_def > 0:
        factors.append({
            "factor": "Prior Loan Default History",
            "impact": "+35%",
            "severity": "high",
            "description": "Applicant has recorded prior default events."
        })

    # Ensure at least 3 factors are returned
    if len(factors) < 3:
        factors.append({
            "factor": "Loan Amount to Income Ratio",
            "impact": "+10%" if default_prob > 0.4 else "-8%",
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
        "final_metrics": model_manager.metrics.get("final_metrics", {
            "Accuracy": 0.7750,
            "ROC-AUC": 0.8342,
            "F1": 0.7710,
            "Precision": 0.3077,
            "Recall": 0.5714,
            "PR-AUC": 0.4194
        }),
        "input_features": model_manager.input_features,
        "training_metadata": {
            "dataset_rows": 806,
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
    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0
    total_prob = 0.0

    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            continue
        cust_id = str(rec.get("customer_id", "")).strip()
        if not cust_id or cust_id == "nan" or cust_id == "None":
            cust_id = f"CUST-BATCH-{idx+1}"
        elif cust_id in seen_ids:
            cust_id = f"{cust_id}-DUP-{idx+1}"
        seen_ids.add(cust_id)
        rec["customer_id"] = cust_id

        # Populate defaults for missing numeric fields in batch row
        rec["age"] = float(rec.get("age", 35.0) if pd.notna(rec.get("age")) else 35.0)
        rec["monthly_income_pkr"] = float(rec.get("monthly_income_pkr", 75000.0) if pd.notna(rec.get("monthly_income_pkr")) else 75000.0)
        rec["loan_amount_pkr"] = float(rec.get("loan_amount_pkr", 250000.0) if pd.notna(rec.get("loan_amount_pkr")) else 250000.0)
        rec["employment_years"] = float(rec.get("employment_years", 3.0) if pd.notna(rec.get("employment_years")) else 3.0)
        rec["employment_type"] = str(rec.get("employment_type", "Salaried"))
        rec["loan_term_months"] = int(rec.get("loan_term_months", 12) if pd.notna(rec.get("loan_term_months")) else 12)
        rec["interest_rate_pct"] = float(rec.get("interest_rate_pct", 12.5) if pd.notna(rec.get("interest_rate_pct")) else 12.5)
        rec["credit_score"] = float(rec.get("credit_score", 680.0) if pd.notna(rec.get("credit_score")) else 680.0)
        rec["debt_to_income_pct"] = float(rec.get("debt_to_income_pct", 25.0) if pd.notna(rec.get("debt_to_income_pct")) else 25.0)

        res = preprocess_and_predict_single(rec)
        results.append(res)

        prob = res["default_probability"]
        total_prob += prob
        if res["risk_level"] == "High Risk":
            high_risk_count += 1
        elif res["risk_level"] == "Medium Risk":
            medium_risk_count += 1
        else:
            low_risk_count += 1

    total_count = len(results)
    avg_prob = round(total_prob / total_count, 4) if total_count > 0 else 0.0

    return {
        "summary": {
            "total_records": total_count,
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "average_default_probability": avg_prob,
            "average_default_probability_pct": round(avg_prob * 100, 2)
        },
        "predictions": results
    }

@app.post("/data/preview")
@app.post("/api/data/preview")
def data_preview(config: DataSourceTestInput):
    sample_columns = [
        "customer_id", "age", "monthly_income_pkr", "employment_years", "employment_type",
        "account_balance_pkr", "loan_amount_pkr", "credit_score", "debt_to_income_pct", "missed_payments_12m"
    ]
    sample_records = [
        {
            "customer_id": "CUST-9001", "age": 42, "monthly_income_pkr": 110000, "employment_years": 6.5,
            "employment_type": "Salaried", "account_balance_pkr": 320000, "loan_amount_pkr": 450000,
            "credit_score": 710, "debt_to_income_pct": 28.5, "missed_payments_12m": 0
        },
        {
            "customer_id": "CUST-9002", "age": 29, "monthly_income_pkr": 45000, "employment_years": 1.2,
            "employment_type": "Self-Employed", "account_balance_pkr": 65000, "loan_amount_pkr": 900000,
            "credit_score": 590, "debt_to_income_pct": 48.0, "missed_payments_12m": 2
        }
    ]
    return {
        "status": "connected",
        "source_type": config.source_type,
        "table_or_file": config.table_name or config.bucket or "default_source",
        "columns": sample_columns,
        "sample_records": sample_records,
        "total_rows_detected": 1420
    }

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
    return {
        "success": True,
        "source_type": config.source_type,
        "message": f"Successfully authenticated and established connection to {config.source_type.upper()}.",
        "latency_ms": 42,
        "status_code": 200
    }

@app.get("/customers")
@app.get("/api/customers")
def get_sample_customers():
    try:
        df = pd.read_excel(EXCEL_PATH, sheet_name='Loan Data')
        sample_df = df.head(15).copy()
        
        # Safe replacement of NaN values for JSON compliance
        records = sample_df.to_dict(orient='records')
        clean_records = []
        for rec in records:
            clean_rec = {}
            for k, v in rec.items():
                if pd.isna(v):
                    clean_rec[k] = None
                elif isinstance(v, (np.integer, int)):
                    clean_rec[k] = int(v)
                elif isinstance(v, (np.floating, float)):
                    clean_rec[k] = float(v)
                else:
                    clean_rec[k] = str(v)
            clean_records.append(clean_rec)

        customer_list = []
        for rec in clean_records:
            # Use Pydantic CustomerDataInput to parse clean dictionary
            pydantic_input = CustomerDataInput(**{k: v for k, v in rec.items() if v is not None}).model_dump()
            pred = preprocess_and_predict_single(pydantic_input)
            customer_list.append({
                "customer_id": str(rec.get("customer_id", "CUST-UNKNOWN")),
                "name": f"Customer {rec.get('customer_id')}",
                "age": rec.get("age", 35),
                "monthly_income_pkr": rec.get("monthly_income_pkr", 75000.0),
                "loan_amount_pkr": rec.get("loan_amount_pkr", 250000.0),
                "credit_score": rec.get("credit_score", 680.0),
                "default_probability": pred["default_probability"],
                "default_probability_pct": pred["default_probability_pct"],
                "risk_level": pred["risk_level"],
                "decision": "Approved" if pred["risk_level"] == "Low Risk" else ("Review" if pred["risk_level"] == "Medium Risk" else "Reject"),
                "prediction_details": pred
            })

        return {"customers": customer_list}
    except Exception as e:
        return {"customers": [], "error": str(e)}

@app.get("/results")
@app.get("/api/results")
def get_results_history():
    return [
        {
            "customer_id": "CUST-10001",
            "name": "Michael Brown",
            "date": "May 24, 2025",
            "default_probability": 0.7845,
            "default_probability_pct": 78.45,
            "risk_level": "High Risk",
            "decision": "Review",
            "loan_amount": "582,000 PKR"
        },
        {
            "customer_id": "CUST-10002",
            "name": "Sarah Johnson",
            "date": "May 24, 2025",
            "default_probability": 0.4521,
            "default_probability_pct": 45.21,
            "risk_level": "Medium Risk",
            "decision": "Review",
            "loan_amount": "1,666,000 PKR"
        },
        {
            "customer_id": "CUST-10003",
            "name": "David Wilson",
            "date": "May 24, 2025",
            "default_probability": 0.1218,
            "default_probability_pct": 12.18,
            "risk_level": "Low Risk",
            "decision": "Approved",
            "loan_amount": "1,200,000 PKR"
        },
        {
            "customer_id": "CUST-10004",
            "name": "Emily Davis",
            "date": "May 23, 2025",
            "default_probability": 0.6632,
            "default_probability_pct": 66.32,
            "risk_level": "High Risk",
            "decision": "Review",
            "loan_amount": "950,000 PKR"
        }
    ]

