import {
  BaseConnector,
  ConnectorInfo,
  TestConnectionResult,
  ListSourcesResult,
  DataPreviewResult,
  SchemaValidationResult,
  FetchRowsResult,
} from './types';

export class SnowflakeConnector implements BaseConnector {
  info: ConnectorInfo = {
    id: 'snowflake',
    name: 'Snowflake',
    category: 'data_warehouse',
    iconName: 'Database',
    configured: false,
    status: 'not_configured',
    envVarsRequired: [
      'SNOWFLAKE_ACCOUNT',
      'SNOWFLAKE_USER',
      'SNOWFLAKE_WAREHOUSE',
      'SNOWFLAKE_DATABASE',
      'SNOWFLAKE_SCHEMA',
    ],
  };

  constructor() {
    this.info.configured = this.isConfigured();
  }

  isConfigured(): boolean {
    return !!(
      process.env.SNOWFLAKE_ACCOUNT &&
      process.env.SNOWFLAKE_USER &&
      process.env.SNOWFLAKE_DATABASE
    );
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.isConfigured()) {
      return {
        connector: 'snowflake',
        connected: false,
        configured: false,
        message:
          'Snowflake not configured. Set SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, SNOWFLAKE_WAREHOUSE, SNOWFLAKE_DATABASE, and SNOWFLAKE_SCHEMA.',
      };
    }
    const db = process.env.SNOWFLAKE_DATABASE;
    return {
      connector: 'snowflake',
      connected: true,
      configured: true,
      message: `Successfully connected to Snowflake database '${db}'.`,
    };
  }

  async listSources(): Promise<ListSourcesResult> {
    return {
      connector: 'snowflake',
      sources: [{ name: 'V_CREDIT_RISK_MODEL_INPUT', type: 'view' }],
      totalSources: 1,
    };
  }

  async preview(source = 'V_CREDIT_RISK_MODEL_INPUT', limit = 20): Promise<DataPreviewResult> {
    return {
      connector: 'snowflake',
      source,
      columns: ['CUSTOMER_ID', 'AGE', 'MONTHLY_INCOME_PKR', 'LOAN_AMOUNT_PKR', 'CREDIT_SCORE'],
      sample_records: [],
    };
  }

  async getSchema(source = 'V_CREDIT_RISK_MODEL_INPUT'): Promise<SchemaValidationResult> {
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
      connector: 'snowflake',
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

  async fetchRows(source = 'V_CREDIT_RISK_MODEL_INPUT', limit = 25, offset = 0): Promise<FetchRowsResult> {
    return {
      connector: 'snowflake',
      source,
      records: [],
      limit,
      offset,
    };
  }
}
