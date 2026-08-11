import { NextResponse } from 'next/server';
import { connectorRegistry } from '@/lib/connectors/registry';

export async function GET() {
  try {
    const infos = connectorRegistry.getAllConnectorInfos();
    const statusMap: Record<string, { configured: boolean; status: string; envVarsRequired: string[] }> = {};

    infos.forEach((info) => {
      statusMap[info.id] = {
        configured: info.configured,
        status: info.configured ? 'Not Connected' : 'Not Configured',
        envVarsRequired: info.envVarsRequired,
      };
    });

    return NextResponse.json(statusMap);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve connector statuses' }, { status: 500 });
  }
}
