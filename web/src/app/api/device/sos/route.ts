import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId = 'ASTRA-001', action } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    if (action === 'ACKNOWLEDGE') {
      stateStore.acknowledgeSOS(deviceId);
      return NextResponse.json({ success: true, message: 'SOS Acknowledged by Guardian' });
    } else if (action === 'RESET') {
      stateStore.resetSOS(deviceId);
      return NextResponse.json({ success: true, message: 'SOS Reset to Normal' });
    }

    // Direct SOS trigger payload
    stateStore.updateFromTelemetry({
      deviceId,
      timestamp: new Date().toISOString(),
      sensors: {
        left: { distanceCm: 150, status: 'VALID' },
        front: { distanceCm: 150, status: 'VALID' },
        right: { distanceCm: 150, status: 'VALID' },
        imu: { status: 'OK', accelG: 1.0, pitchDeg: 0 },
      },
      navigation: {
        risk: 'CRITICAL',
        guidance: 'STOP',
        state: 'SOS',
      },
      emergency: { sosActive: true },
    });

    return NextResponse.json({ success: true, message: 'Emergency SOS Registered' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process SOS', details: err.message }, { status: 500 });
  }
}

export async function GET() {
  const sosEvents = stateStore.getSOSEvents();
  return NextResponse.json({ sosEvents });
}
