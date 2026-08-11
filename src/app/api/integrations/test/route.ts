import { NextRequest, NextResponse } from 'next/server';
import { connectorRegistry } from '@/lib/connectors/registry';
import { ConnectorType } from '@/lib/connectors/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sourceType = (body.source_type || body.connector) as ConnectorType;

    if (!sourceType) {
      return NextResponse.json({ error: 'source_type or connector is required' }, { status: 400 });
    }

    const connector = connectorRegistry.getConnector(sourceType);
    const result = await connector.testConnection();

    if (!result.configured) {
      return NextResponse.json(
        {
          error: result.message,
          connector: result.connector,
          connected: false,
          configured: false,
        },
        { status: 501 }
      );
    }

    if (!result.connected) {
      return NextResponse.json(
        {
          error: result.message,
          connector: result.connector,
          connected: false,
          configured: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Integration test failed' }, { status: 500 });
  }
}
