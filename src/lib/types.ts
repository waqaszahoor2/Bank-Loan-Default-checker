export interface CustomerInput {
  customer_id?: string;
  age: number;
  monthly_income_pkr: number;
  employment_years: number;
  employment_type: 'Salaried' | 'Self-employed' | 'Contract' | 'Unemployed' | string;
  existing_customer_years: number;
  account_balance_pkr: number;
  loan_amount_pkr: number;
  loan_term_months: number;
  interest_rate_pct: number;
  credit_score: number;
  debt_to_income_pct: number;
  missed_payments_12m: number;
  late_payments_24m: number;
  number_of_open_loans: number;
  savings_balance_pkr: number;
  avg_monthly_transactions: number;
  avg_monthly_card_spend_pkr: number;
  digital_logins_30d: number;
  city_tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | string;
  home_ownership: 'Own' | 'Rent' | 'Mortgage' | 'Family' | string;
  loan_purpose: 'Personal' | 'Auto' | 'Education' | 'Business' | 'Medical' | 'Home Improvement' | string;
  previous_default: number;
}

export interface RiskFactor {
  factor: string;
  impact?: string;
  indicator_type?: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface PredictionResult {
  customer_id: string;
  prediction: number; // 0 = No Default, 1 = Default
  default_probability: number; // 0.0 to 1.0
  default_probability_pct: number; // 0.0 to 100.0
  risk_level: 'Low Risk' | 'Medium Risk' | 'High Risk';
  key_risk_factors: RiskFactor[];
  model_name: string;
  model_version: string;
}

export interface BatchSummary {
  total_records: number;
  valid_records?: number;
  invalid_records?: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  average_default_probability: number;
  average_default_probability_pct: number;
}

export interface BatchPredictionResponse {
  summary: BatchSummary;
  predictions: PredictionResult[];
  invalid_rows?: any[];
  errors?: string[];
}

export interface ModelMetrics {
  model_name: string;
  model_version: string;
  algorithm: string;
  final_metrics: {
    Accuracy: number;
    'ROC-AUC': number;
    F1: number;
    Precision: number;
    Recall: number;
    'PR-AUC': number;
  };
  input_features: string[];
  training_metadata: Record<string, any>;
}

export interface RecentAssessmentItem {
  customer_id: string;
  name: string;
  date: string;
  default_probability: number;
  default_probability_pct: number;
  risk_level: 'Low Risk' | 'Medium Risk' | 'High Risk';
  decision: 'Approved' | 'Review' | 'Reject';
  loan_amount: string;
}

export interface IntegrationSource {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'bigquery' | 's3' | 'gcs' | 'azure' | 'snowflake';
  connected: boolean;
  iconName: string;
  host?: string;
  database?: string;
}

// --- Universal AutoML Data Models ---
export interface ColumnSummary {
  name: string;
  data_type: 'numeric' | 'categorical' | 'datetime' | 'text';
  unique_count: number;
  missing_count: number;
  missing_pct: number;
  sample_values: any[];
  is_id_candidate: boolean;
  is_target_candidate: boolean;
  target_score: number;
  reason?: string;
}

export interface DatasetInspectionResult {
  filename: string;
  total_rows: number;
  total_columns: number;
  duplicate_rows: number;
  columns: ColumnSummary[];
  target_candidates: ColumnSummary[];
  suggested_task: 'binary' | 'multiclass' | 'regression' | 'unsupervised';
  sample_records: Record<string, any>[];
  is_credit_risk_schema: boolean;
}

export interface AutoMLTrainRequest {
  filename?: string;
  records: Record<string, any>[];
  target_column?: string | null;
  task_type?: 'binary' | 'multiclass' | 'regression' | 'unsupervised';
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface AutoMLResult {
  task_type: 'binary' | 'multiclass' | 'regression' | 'unsupervised';
  target_column?: string | null;
  best_algorithm: string;
  metrics: Record<string, number>;
  feature_importances: FeatureImportanceItem[];
  predictions: Record<string, any>[];
  total_records: number;
  train_rows: number;
  test_rows: number;
  csv_content: string;
}
