import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';

export async function GET(req: NextRequest, { params }: { params: { deviceId: string } }) {
  const { deviceId } = params;
  const device = stateStore.getDevice(deviceId);

  if (!device) {
    return NextResponse.json({ error: `Device ${deviceId} not found` }, { status: 404 });
  }

  const trail = stateStore.getLocationTrail(deviceId);
  const events = stateStore.getEvents(deviceId);

  return NextResponse.json({
    device,
    trail,
    events,
    timestamp: new Date().toISOString(),
  });
}
