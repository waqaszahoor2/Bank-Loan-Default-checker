import { NextRequest, NextResponse } from 'next/server';
import { connectorRegistry } from '@/lib/connectors/registry';
import { ConnectorType } from '@/lib/connectors/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sourceType = (body.source_type || body.connector) as ConnectorType;
    const sourceName = body.source || body.table_name || body.bucket;

    if (!sourceType) {
      return NextResponse.json({ error: 'source_type is required' }, { status: 400 });
    }

    const connector = connectorRegistry.getConnector(sourceType);
    if (!connector.isConfigured()) {
      return NextResponse.json({ error: `Connector '${sourceType}' is not configured.` }, { status: 501 });
    }

    const result = await connector.preview(sourceName, 20);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Data preview failed' }, { status: 500 });
  }
}
