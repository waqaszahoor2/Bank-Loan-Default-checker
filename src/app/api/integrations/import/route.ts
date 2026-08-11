import { NextRequest, NextResponse } from 'next/server';
import { connectorRegistry } from '@/lib/connectors/registry';
import { ConnectorType } from '@/lib/connectors/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sourceType = (body.source_type || body.connector) as ConnectorType;
    const sourceName = body.source || body.table_name || body.bucket;
    const limit = body.limit || 100;
    const offset = body.offset || 0;

    if (!sourceType) {
      return NextResponse.json({ error: 'source_type is required' }, { status: 400 });
    }

    const connector = connectorRegistry.getConnector(sourceType);
    if (!connector.isConfigured()) {
      return NextResponse.json({ error: `Connector '${sourceType}' is not configured.` }, { status: 501 });
    }

    const rowData = await connector.fetchRows(sourceName, limit, offset);
    
    if (!rowData.records || rowData.records.length === 0) {
      return NextResponse.json({
        summary: {
          total_records: 0,
          predicted_records: 0,
          failed_records: 0,
          low_risk_count: 0,
          medium_risk_count: 0,
          high_risk_count: 0,
          average_default_probability: 0,
          average_default_probability_pct: 0,
        },
        predictions: [],
        message: 'No records found in selected data source.',
      });
    }

    // Call Python ML batch prediction engine
    const origin = req.nextUrl.origin;
    const mlResponse = await fetch(`${origin}/api/predict-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowData.records),
    });

    if (!mlResponse.ok) {
      const err = await mlResponse.json().catch(() => ({ detail: 'ML Model inference failed' }));
      return NextResponse.json({ error: err.detail || 'ML Model inference failed' }, { status: mlResponse.status });
    }

    const predictionsResult = await mlResponse.json();

    return NextResponse.json({
      status: 'success',
      connector: sourceType,
      source: sourceName,
      ...predictionsResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Import and prediction failed' }, { status: 500 });
  }
}
