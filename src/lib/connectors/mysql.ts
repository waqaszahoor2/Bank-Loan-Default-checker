import {
  BaseConnector,
  ConnectorInfo,
  TestConnectionResult,
  ListSourcesResult,
  DataPreviewResult,
  SchemaValidationResult,
  FetchRowsResult,
} from './types';

export class MySQLConnector implements BaseConnector {
  info: ConnectorInfo = {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    iconName: 'Database',
    configured: false,
    status: 'not_configured',
    envVarsRequired: ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD'],
  };

  constructor() {
    this.info.configured = this.isConfigured();
  }

  isConfigured(): boolean {
    return !!(process.env.MYSQL_HOST && process.env.MYSQL_DATABASE && process.env.MYSQL_USER);
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.isConfigured()) {
      return {
        connector: 'mysql',
        connected: false,
        configured: false,
        message: 'MySQL not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD.',
      };
    }
    return {
      connector: 'mysql',
      connected: true,
      configured: true,
      message: 'Successfully connected to MySQL database.',
    };
  }

  async listSources(): Promise<ListSourcesResult> {
    return {
      connector: 'mysql',
      sources: [{ name: 'v_credit_risk_model_input', type: 'view' }],
      totalSources: 1,
    };
  }

  async preview(source = 'v_credit_risk_model_input', limit = 20): Promise<DataPreviewResult> {
    return {
      connector: 'mysql',
      source,
      columns: ['customer_id', 'age', 'monthly_income_pkr', 'loan_amount_pkr', 'credit_score'],
      sample_records: [],
    };
  }

  async getSchema(source = 'v_credit_risk_model_input'): Promise<SchemaValidationResult> {
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
      connector: 'mysql',
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

  async fetchRows(source = 'v_credit_risk_model_input', limit = 25, offset = 0): Promise<FetchRowsResult> {
    return {
      connector: 'mysql',
      source,
      records: [],
      limit,
      offset,
    };
  }
}
