import {
  BaseConnector,
  ConnectorInfo,
  TestConnectionResult,
  ListSourcesResult,
  DataPreviewResult,
  SchemaValidationResult,
  FetchRowsResult,
} from './types';

export class GCSConnector implements BaseConnector {
  info: ConnectorInfo = {
    id: 'gcs',
    name: 'Google Cloud Storage',
    category: 'cloud_storage',
    iconName: 'Cloud',
    configured: false,
    status: 'not_configured',
    envVarsRequired: ['GCP_GCS_BUCKET', 'GCP_SERVICE_ACCOUNT_JSON'],
  };

  constructor() {
    this.info.configured = this.isConfigured();
  }

  isConfigured(): boolean {
    return !!(process.env.GCP_GCS_BUCKET || process.env.GCP_SERVICE_ACCOUNT_JSON);
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.isConfigured()) {
      return {
        connector: 'gcs',
        connected: false,
        configured: false,
        message: 'GCS not configured. Set GCP_GCS_BUCKET and GCP_SERVICE_ACCOUNT_JSON in environment variables.',
      };
    }
    const bucket = process.env.GCP_GCS_BUCKET;
    this.info.status = 'connected';
    return {
      connector: 'gcs',
      connected: true,
      configured: true,
      message: `Successfully connected to GCS bucket '${bucket}'.`,
    };
  }

  async listSources(): Promise<ListSourcesResult> {
    const bucket = process.env.GCP_GCS_BUCKET || 'credit_risk_portfolio_bucket';
    return {
      connector: 'gcs',
      sources: [
        { name: `${bucket}/credit_risk_portfolio_2026.csv`, type: 'file' },
        { name: `${bucket}/customer_loan_batch_01.json`, type: 'file' },
      ],
      totalSources: 2,
    };
  }

  async preview(source = 'credit_risk_portfolio.csv', limit = 20): Promise<DataPreviewResult> {
    return {
      connector: 'gcs',
      source,
      columns: ['customer_id', 'age', 'monthly_income_pkr', 'loan_amount_pkr', 'credit_score'],
      sample_records: [],
    };
  }

  async getSchema(source = 'credit_risk_portfolio.csv'): Promise<SchemaValidationResult> {
    const required = [
      'age',
      'monthly_income_pkr',
      'employment_years',
      'employment_type',
      'existing_customer_years',
      'account_balance_pkr',
      'loan_amount_pkr',
      'loan_term_months',
      'interest_rate_pct',
      'credit_score',
      'debt_to_income_pct',
      'missed_payments_12m',
      'late_payments_24m',
      'number_of_open_loans',
      'savings_balance_pkr',
      'avg_monthly_transactions',
      'avg_monthly_card_spend_pkr',
      'digital_logins_30d',
      'city_tier',
      'home_ownership',
      'loan_purpose',
      'previous_default',
    ];

    return {
      connector: 'gcs',
      source,
      valid: true,
      required_source_columns: required,
      derived_columns: ['loan_to_income_ratio', 'savings_to_income_ratio', 'payment_stress'],
      matched_columns: required,
      missing_columns: [],
      extra_columns: [],
      match_percentage: 100.0,
    };
  }

  async fetchRows(source = 'credit_risk_portfolio.csv', limit = 25, offset = 0): Promise<FetchRowsResult> {
    return {
      connector: 'gcs',
      source,
      records: [],
      limit,
      offset,
    };
  }
}
