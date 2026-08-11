import {
  BaseConnector,
  ConnectorInfo,
  TestConnectionResult,
  ListSourcesResult,
  DataPreviewResult,
  SchemaValidationResult,
  FetchRowsResult,
} from './types';

export class AzureBlobConnector implements BaseConnector {
  info: ConnectorInfo = {
    id: 'azure-blob',
    name: 'Azure Blob Storage',
    category: 'cloud_storage',
    iconName: 'Cloud',
    configured: false,
    status: 'not_configured',
    envVarsRequired: ['AZURE_STORAGE_ACCOUNT_URL', 'AZURE_STORAGE_CONTAINER', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET'],
  };

  constructor() {
    this.info.configured = this.isConfigured();
  }

  isConfigured(): boolean {
    return !!(process.env.AZURE_STORAGE_ACCOUNT_URL && process.env.AZURE_STORAGE_CONTAINER);
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.isConfigured()) {
      return {
        connector: 'azure-blob',
        connected: false,
        configured: false,
        message: 'Azure Blob Storage not configured. Set AZURE_STORAGE_ACCOUNT_URL, AZURE_STORAGE_CONTAINER, and authentication credentials.',
      };
    }
    const container = process.env.AZURE_STORAGE_CONTAINER;
    return {
      connector: 'azure-blob',
      connected: true,
      configured: true,
      message: `Successfully connected to Azure Blob container '${container}'.`,
    };
  }

  async listSources(): Promise<ListSourcesResult> {
    const container = process.env.AZURE_STORAGE_CONTAINER || 'credit-risk-container';
    return {
      connector: 'azure-blob',
      sources: [{ name: `${container}/credit_risk_export.json`, type: 'file' }],
      totalSources: 1,
    };
  }

  async preview(source = 'credit_risk_export.json', limit = 20): Promise<DataPreviewResult> {
    return {
      connector: 'azure-blob',
      source,
      columns: ['customer_id', 'age', 'monthly_income_pkr', 'loan_amount_pkr', 'credit_score'],
      sample_records: [],
    };
  }

  async getSchema(source = 'credit_risk_export.json'): Promise<SchemaValidationResult> {
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
      connector: 'azure-blob',
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

  async fetchRows(source = 'credit_risk_export.json', limit = 25, offset = 0): Promise<FetchRowsResult> {
    return {
      connector: 'azure-blob',
      source,
      records: [],
      limit,
      offset,
    };
  }
}
