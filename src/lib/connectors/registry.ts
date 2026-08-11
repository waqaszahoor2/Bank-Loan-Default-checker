import { BaseConnector, ConnectorType, ConnectorInfo } from './types';
import { BigQueryConnector } from './bigquery';
import { GCSConnector } from './gcs';
import { PostgresConnector } from './postgres';
import { MySQLConnector } from './mysql';
import { S3Connector } from './s3';
import { AzureBlobConnector } from './azure-blob';
import { SnowflakeConnector } from './snowflake';

class ConnectorRegistry {
  private connectors: Map<ConnectorType, BaseConnector> = new Map();

  constructor() {
    this.register(new BigQueryConnector());
    this.register(new GCSConnector());
    this.register(new PostgresConnector());
    this.register(new MySQLConnector());
    this.register(new S3Connector());
    this.register(new AzureBlobConnector());
    this.register(new SnowflakeConnector());
  }

  private register(connector: BaseConnector) {
    this.connectors.set(connector.info.id, connector);
  }

  getConnector(type: ConnectorType): BaseConnector {
    const conn = this.connectors.get(type);
    if (!conn) {
      throw new Error(`Connector '${type}' is not registered or supported.`);
    }
    return conn;
  }

  getAllConnectorInfos(): ConnectorInfo[] {
    return Array.from(this.connectors.values()).map((c) => ({
      ...c.info,
      configured: c.isConfigured(),
    }));
  }
}

export const connectorRegistry = new ConnectorRegistry();
