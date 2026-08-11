export type ConnectorType =
  | 'bigquery'
  | 'gcs'
  | 'postgres'
  | 'mysql'
  | 's3'
  | 'azure-blob'
  | 'snowflake';

export type ConnectorStatus = 'not_configured' | 'connecting' | 'connected' | 'failed';

export interface ConnectorInfo {
  id: ConnectorType;
  name: string;
  category: 'database' | 'cloud_storage' | 'data_warehouse';
  iconName: string;
  configured: boolean;
  status: ConnectorStatus;
  errorMessage?: string;
  envVarsRequired: string[];
}

export interface SourceItem {
  name: string;
  type: 'table' | 'view' | 'file' | 'container' | 'dataset' | 'schema';
  recordCount?: number;
  sizeBytes?: number;
  lastModified?: string;
}

export interface TestConnectionResult {
  connector: ConnectorType;
  connected: boolean;
  configured: boolean;
  message: string;
  latency_ms?: number;
}

export interface ListSourcesResult {
  connector: ConnectorType;
  sources: SourceItem[];
  totalSources: number;
}

export interface DataPreviewResult {
  connector: ConnectorType;
  source: string;
  columns: string[];
  sample_records: Record<string, any>[];
  total_rows?: number;
}

export interface SchemaValidationResult {
  connector: ConnectorType;
  source: string;
  valid: boolean;
  required_source_columns: string[];
  derived_columns: string[];
  matched_columns: string[];
  missing_columns: string[];
  extra_columns: string[];
  match_percentage: number;
}

export interface FetchRowsResult {
  connector: ConnectorType;
  source: string;
  records: Record<string, any>[];
  total_rows?: number;
  limit: number;
  offset: number;
}

export interface BaseConnector {
  info: ConnectorInfo;
  isConfigured(): boolean;
  testConnection(): Promise<TestConnectionResult>;
  listSources(): Promise<ListSourcesResult>;
  preview(source: string, limit?: number): Promise<DataPreviewResult>;
  getSchema(source: string): Promise<SchemaValidationResult>;
  fetchRows(source: string, limit?: number, offset?: number, search?: string): Promise<FetchRowsResult>;
}
