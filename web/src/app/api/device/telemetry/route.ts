import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';
import { TelemetryPayload } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as TelemetryPayload;

    if (!payload.deviceId) {
      return NextResponse.json({ error: 'Missing deviceId parameter' }, { status: 400 });
    }

    stateStore.updateFromTelemetry(payload);

    return NextResponse.json({
      success: true,
      deviceId: payload.deviceId,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid telemetry payload', details: err.message }, { status: 400 });
  }
}

export async function GET() {
  const devices = stateStore.getAllDevices();
  return NextResponse.json({
    devices,
    total: devices.length,
    timestamp: new Date().toISOString(),
  });
}
