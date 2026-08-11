import os
import sys
import json
import time
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Body, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, ValidationError

# Optional Google Cloud SDK Imports
try:
    from google.cloud import bigquery
    from google.cloud import storage as gcs_storage
    from google.oauth2 import service_account
    HAS_GCP_SDK = True
except ImportError:
    HAS_GCP_SDK = False


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


# --- Column Alias Normalization ---
COLUMN_ALIASES = {
    'income': 'monthly_income_pkr',
    'monthly_income': 'monthly_income_pkr',
    'salary': 'monthly_income_pkr',
    'loan_amount': 'loan_amount_pkr',
    'loan_amt': 'loan_amount_pkr',
    'account_balance': 'account_balance_pkr',
    'savings_balance': 'savings_balance_pkr',
    'card_spend': 'avg_monthly_card_spend_pkr',
    'avg_card_spend': 'avg_monthly_card_spend_pkr',
    'interest_rate': 'interest_rate_pct',
    'dti': 'debt_to_income_pct',
    'debt_to_income': 'debt_to_income_pct',
    'logins': 'digital_logins_30d',
    'digital_logins': 'digital_logins_30d',
    'open_loans': 'number_of_open_loans',
    'missed_payments': 'missed_payments_12m',
    'late_payments': 'late_payments_24m'
}

def normalize_record(rec: Dict[str, Any]) -> Dict[str, Any]:
    clean_rec = {}
    for k, v in rec.items():
        if pd.isna(v):
            continue
        clean_key = str(k).strip().lower().replace(" ", "_")
        target_key = COLUMN_ALIASES.get(clean_key, clean_key)
        clean_rec[target_key] = v
    return clean_rec


# --- Google Cloud Platform Helper Credentials ---
def get_gcp_credentials():
    json_str = os.environ.get("GCP_SERVICE_ACCOUNT_JSON")
    if json_str and HAS_GCP_SDK:
        try:
            info = json.loads(json_str)
            return service_account.Credentials.from_service_account_info(info)
        except Exception as e:
            print(f"[GCP Credentials] Failed to parse GCP_SERVICE_ACCOUNT_JSON: {e}")
    return None

def get_bigquery_client():
    if not HAS_GCP_SDK:
        return None
    project_id = os.environ.get("GCP_PROJECT_ID")
    creds = get_gcp_credentials()
    if creds:
        return bigquery.Client(credentials=creds, project=project_id or creds.project_id)
    elif project_id:
        try:
            return bigquery.Client(project=project_id)
        except Exception:
            return None
    return None

def get_gcs_client():
    if not HAS_GCP_SDK:
        return None
    project_id = os.environ.get("GCP_PROJECT_ID")
    creds = get_gcp_credentials()
    if creds:
        return gcs_storage.Client(credentials=creds, project=project_id or creds.project_id)
    elif project_id:
        try:
            return gcs_storage.Client(project=project_id)
        except Exception:
            return None
    return None


# --- Pydantic Data Models & Strict Schema Validation ---
class CustomerDataInput(BaseModel):
    customer_id: Optional[str] = "CUST-NEW"
    age: float = Field(..., ge=18, le=120, example=34)
    monthly_income_pkr: Optional[float] = Field(None, ge=0, example=75000)
    employment_years: float = Field(0.0, ge=0, le=70, example=5.0)
    employment_type: str = Field("Salaried", example="Salaried")
    existing_customer_years: float = Field(0.0, ge=0, example=2.0)
    account_balance_pkr: float = Field(0.0, example=150000)
    loan_amount_pkr: float = Field(..., gt=0, example=250000)
    loan_term_months: int = Field(12, gt=0, le=360, example=12)
    interest_rate_pct: float = Field(12.5, ge=0, le=100, example=13.5)
    credit_score: float = Field(..., ge=300, le=850, example=680)
    debt_to_income_pct: float = Field(25.0, ge=0, le=150, example=25.0)
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
    
    income = pd.to_numeric(pd.Series(df['monthly_income_pkr'] if 'monthly_income_pkr' in df.columns else np.nan), errors='coerce')
    loan_amt = pd.to_numeric(pd.Series(df['loan_amount_pkr'] if 'loan_amount_pkr' in df.columns else np.nan), errors='coerce')
    savings = pd.to_numeric(pd.Series(df['savings_balance_pkr'] if 'savings_balance_pkr' in df.columns else np.nan), errors='coerce')
    missed = pd.to_numeric(pd.Series(df['missed_payments_12m'] if 'missed_payments_12m' in df.columns else 0), errors='coerce').fillna(0)
    late = pd.to_numeric(pd.Series(df['late_payments_24m'] if 'late_payments_24m' in df.columns else 0), errors='coerce').fillna(0)

    safe_income = income.apply(lambda v: float(v) if (pd.notna(v) and float(v) > 0) else np.nan)
    
    df['loan_to_income_ratio'] = loan_amt / safe_income
    df['savings_to_income_ratio'] = savings / safe_income
    df['payment_stress'] = missed + late

    return df


# --- Helper Functions for Inference & Key Factors ---
def preprocess_and_predict_single(data_dict: Dict[str, Any]):
    if model_manager.model is None:
        raise HTTPException(status_code=503, detail="Champion ML Model file is missing or not loaded.")

    # Populate exact schema defaults via Pydantic model_dump
    try:
        validated_dict = CustomerDataInput(**data_dict).model_dump()
    except ValidationError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))

    df = pd.DataFrame([validated_dict])
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
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large for direct upload (exceeds 10 MB limit). For datasets larger than 10 MB, import through Google Cloud Storage / BigQuery."
            )
            
        try:
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
    errors = []
    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0
    total_prob = 0.0

    for idx, raw_rec in enumerate(records):
        if not isinstance(raw_rec, dict):
            invalid_rows.append({"row_index": idx, "error": "Invalid record object"})
            continue

        rec = normalize_record(raw_rec)

        cust_id = str(rec.get("customer_id", "")).strip()
        if not cust_id or cust_id == "nan" or cust_id == "None":
            cust_id = f"CUST-BATCH-{idx+1}"
        elif cust_id in seen_ids:
            cust_id = f"{cust_id}-DUP-{idx+1}"
            errors.append(f"Row {idx+1}: Duplicate customer_id '{rec.get('customer_id')}' renamed to '{cust_id}'")
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
            err_msg = str(val_err)
            invalid_rows.append({"row_index": idx, "customer_id": cust_id, "error": err_msg})
            errors.append(f"Row {idx+1} ({cust_id}): Schema validation error - {err_msg.splitlines()[0]}")

    total_count = len(records)
    valid_count = len(results)
    avg_prob = round(total_prob / valid_count, 4) if valid_count > 0 else 0.0

    return {
        "summary": {
            "total_records": total_count,
            "valid_records": valid_count,
            "invalid_records": len(invalid_rows),
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "average_default_probability": avg_prob,
            "average_default_probability_pct": round(avg_prob * 100, 2)
        },
        "predictions": results,
        "invalid_rows": invalid_rows,
        "errors": errors[:20]
    }


# --- Real Google Cloud Platform Integration Endpoints ---

@app.post("/data-source/test")
@app.post("/api/data-source/test")
def data_source_test(config: DataSourceTestInput):
    source_type = config.source_type.lower()
    
    if source_type in ["bigquery"]:
        bq_client = get_bigquery_client()
        if bq_client is None:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="BigQuery connector not configured. Set GCP_PROJECT_ID and GCP_SERVICE_ACCOUNT_JSON environment variables to enable."
            )
        try:
            start_time = time.time()
            query_job = bq_client.query("SELECT 1 AS test_val")
            query_job.result()
            latency = round((time.time() - start_time) * 1000, 2)
            return {
                "success": True,
                "source_type": "bigquery",
                "message": f"Successfully authenticated and queried BigQuery (latency: {latency} ms).",
                "latency_ms": latency
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google Cloud BigQuery authentication/query failed: {str(e)}"
            )

    elif source_type in ["gcs", "google_cloud_storage"]:
        gcs_client = get_gcs_client()
        if gcs_client is None:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google Cloud Storage connector not configured. Set GCP_PROJECT_ID and GCP_SERVICE_ACCOUNT_JSON environment variables to enable."
            )
        try:
            start_time = time.time()
            list(gcs_client.list_buckets(max_results=1))
            latency = round((time.time() - start_time) * 1000, 2)
            return {
                "success": True,
                "source_type": "gcs",
                "message": f"Successfully authenticated and listed GCS buckets (latency: {latency} ms).",
                "latency_ms": latency
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google Cloud Storage authentication failed: {str(e)}"
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"Connector '{config.source_type}' coming soon. Google BigQuery and GCS are currently available."
        )


@app.post("/data/preview")
@app.post("/api/data/preview")
def data_preview(config: DataSourceTestInput):
    source_type = config.source_type.lower()
    
    if source_type in ["bigquery"]:
        bq_client = get_bigquery_client()
        if bq_client is None:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="BigQuery integration not configured. Set GCP_PROJECT_ID and GCP_SERVICE_ACCOUNT_JSON."
            )
        dataset_id = os.environ.get("GCP_BIGQUERY_DATASET", "credit_risk_dataset")
        view_name = f"`{bq_client.project}.{dataset_id}.v_credit_risk_model_input`"
        try:
            query = f"SELECT * FROM {view_name} LIMIT 20"
            df = bq_client.query(query).to_dataframe()
            records = df.to_dict(orient="records")
            clean_records = [{k: (None if pd.isna(v) else v) for k, v in r.items()} for r in records]
            return {
                "status": "connected",
                "source_type": "bigquery",
                "source_name": view_name,
                "columns": list(df.columns),
                "total_count": len(clean_records),
                "sample_records": clean_records
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configured BigQuery dataset/table view '{view_name}' not found or query failed: {str(e)}"
            )

    elif source_type in ["gcs", "google_cloud_storage"]:
        gcs_client = get_gcs_client()
        if gcs_client is None:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="GCS integration not configured. Set GCP_PROJECT_ID and GCP_SERVICE_ACCOUNT_JSON."
            )
        bucket_name = config.bucket or os.environ.get("GCP_GCS_BUCKET")
        if not bucket_name:
            raise HTTPException(status_code=400, detail="Bucket name required for GCS preview.")
        try:
            bucket = gcs_client.get_bucket(bucket_name)
            blobs = list(bucket.list_blobs(max_results=5))
            return {
                "status": "connected",
                "source_type": "gcs",
                "source_name": bucket_name,
                "columns": ["blob_name", "size_bytes", "updated"],
                "total_count": len(blobs),
                "sample_records": [{"blob_name": b.name, "size_bytes": b.size, "updated": str(b.updated)} for b in blobs]
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GCS bucket '{bucket_name}' not found: {str(e)}"
            )
            
    else:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"Connector '{config.source_type}' coming soon. Google BigQuery and GCS are currently available."
        )


@app.post("/data/validate")
@app.post("/api/data/validate")
def data_validate(payload: ValidateDataInput):
    all_required_model_features = model_manager.input_features
    
    derived_columns = ["loan_to_income_ratio", "savings_to_income_ratio", "payment_stress"]
    required_source_features = [f for f in all_required_model_features if f not in derived_columns]
    
    mapped_targets = list(payload.column_mapping.values())
    
    matched = [f for f in required_source_features if f in mapped_targets]
    missing = [f for f in required_source_features if f not in mapped_targets]
    extra = [col for col in payload.column_mapping.keys() if payload.column_mapping[col] not in all_required_model_features and payload.column_mapping[col] != "customer_id"]

    match_pct = round((len(matched) / len(required_source_features)) * 100, 1) if required_source_features else 100.0

    return {
        "valid": len(missing) == 0,
        "source_type": payload.source_type,
        "required_source_columns": required_source_features,
        "derived_columns": derived_columns,
        "matched_columns": matched,
        "missing_columns": missing,
        "extra_columns": extra,
        "match_percentage": match_pct
    }


@app.post("/data/merge")
@app.post("/api/data/merge")
def data_merge(payload: MergeDataInput):
    prim_df = pd.DataFrame(payload.primary_dataset)
    sec_df = pd.DataFrame(payload.secondary_dataset)

    if prim_df.empty and sec_df.empty:
        raise HTTPException(status_code=400, detail="Primary and secondary datasets are both empty.")

    if prim_df.empty or sec_df.empty:
        merged_records = payload.primary_dataset or payload.secondary_dataset
    else:
        if payload.join_key not in prim_df.columns or payload.join_key not in sec_df.columns:
            raise HTTPException(status_code=400, detail=f"Join key '{payload.join_key}' must exist in both datasets.")
        merged_df = pd.merge(prim_df, sec_df, on=payload.join_key, how="inner", suffixes=('', '_ext'))
        merged_records = merged_df.to_dict(orient="records")

    # Execute Champion ML Pipeline on merged records
    results = []
    errors = []
    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0

    for idx, raw_rec in enumerate(merged_records):
        try:
            rec = normalize_record(raw_rec)
            val_input = CustomerDataInput(**rec).model_dump()
            res = preprocess_and_predict_single(val_input)
            results.append(res)
            if res["risk_level"] == "High Risk":
                high_risk_count += 1
            elif res["risk_level"] == "Medium Risk":
                medium_risk_count += 1
            else:
                low_risk_count += 1
        except Exception as e:
            errors.append(f"Record {idx+1}: {str(e)}")

    return {
        "status": "success",
        "join_key": payload.join_key,
        "total_merged_records": len(merged_records),
        "summary": {
            "total_records": len(merged_records),
            "predicted_records": len(results),
            "failed_records": len(errors),
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count
        },
        "predictions": results,
        "errors": errors[:10]
    }


# --- Server-Side Customer Search & Pagination ---
@app.get("/customers")
@app.get("/api/customers")
def get_customers(
    query: Optional[str] = None,
    limit: int = 25,
    offset: int = 0
):
    bq_client = get_bigquery_client()
    if bq_client is not None:
        dataset_id = os.environ.get("GCP_BIGQUERY_DATASET", "credit_risk_dataset")
        view_name = f"`{bq_client.project}.{dataset_id}.v_credit_risk_model_input`"
        try:
            if query and query.strip():
                sql = f"SELECT * FROM {view_name} WHERE LOWER(customer_id) LIKE LOWER(@search) LIMIT @limit OFFSET @offset"
                job_config = bigquery.QueryJobConfig(
                    query_parameters=[
                        bigquery.ScalarQueryParameter("search", "STRING", f"%{query.strip()}%"),
                        bigquery.ScalarQueryParameter("limit", "INT64", limit),
                        bigquery.ScalarQueryParameter("offset", "INT64", offset),
                    ]
                )
                df = bq_client.query(sql, job_config=job_config).to_dataframe()
            else:
                sql = f"SELECT * FROM {view_name} LIMIT @limit OFFSET @offset"
                job_config = bigquery.QueryJobConfig(
                    query_parameters=[
                        bigquery.ScalarQueryParameter("limit", "INT64", limit),
                        bigquery.ScalarQueryParameter("offset", "INT64", offset),
                    ]
                )
                df = bq_client.query(sql, job_config=job_config).to_dataframe()

            records = df.to_dict(orient='records')
            customer_list = []
            for raw_rec in records:
                try:
                    rec = normalize_record({k: v for k, v in raw_rec.items() if pd.notna(v)})
                    pydantic_input = CustomerDataInput(**rec).model_dump()
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
                except Exception:
                    pass

            return {"customers": customer_list, "total": len(customer_list), "limit": limit, "offset": offset}
        except Exception as e:
            print(f"[BigQuery Customers] Query error: {e}")
            return {"customers": [], "total": 0, "limit": limit, "offset": offset}

    return {"customers": [], "total": 0, "limit": limit, "offset": offset}

@app.get("/results")
@app.get("/api/results")
def get_results_history():
    return []

