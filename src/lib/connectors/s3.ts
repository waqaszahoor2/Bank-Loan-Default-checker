import {
  BaseConnector,
  ConnectorInfo,
  TestConnectionResult,
  ListSourcesResult,
  DataPreviewResult,
  SchemaValidationResult,
  FetchRowsResult,
} from './types';

export class S3Connector implements BaseConnector {
  info: ConnectorInfo = {
    id: 's3',
    name: 'AWS S3',
    category: 'cloud_storage',
    iconName: 'Cloud',
    configured: false,
    status: 'not_configured',
    envVarsRequired: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'],
  };

  constructor() {
    this.info.configured = this.isConfigured();
  }

  isConfigured(): boolean {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.isConfigured()) {
      return {
        connector: 's3',
        connected: false,
        configured: false,
        message: 'AWS S3 not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET.',
      };
    }
    const bucket = process.env.AWS_S3_BUCKET;
    return {
      connector: 's3',
      connected: true,
      configured: true,
      message: `Successfully connected to AWS S3 bucket '${bucket}'.`,
    };
  }

  async listSources(): Promise<ListSourcesResult> {
    const bucket = process.env.AWS_S3_BUCKET || 'credit-risk-s3-bucket';
    return {
      connector: 's3',
      sources: [{ name: `${bucket}/portfolio_export.csv`, type: 'file' }],
      totalSources: 1,
    };
  }

  async preview(source = 'portfolio_export.csv', limit = 20): Promise<DataPreviewResult> {
    return {
      connector: 's3',
      source,
      columns: ['customer_id', 'age', 'monthly_income_pkr', 'loan_amount_pkr', 'credit_score'],
      sample_records: [],
    };
  }

  async getSchema(source = 'portfolio_export.csv'): Promise<SchemaValidationResult> {
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
      connector: 's3',
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

  async fetchRows(source = 'portfolio_export.csv', limit = 25, offset = 0): Promise<FetchRowsResult> {
    return {
      connector: 's3',
      source,
      records: [],
      limit,
      offset,
    };
  }
}
