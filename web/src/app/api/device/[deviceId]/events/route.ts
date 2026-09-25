import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';

export async function GET(req: NextRequest, { params }: { params: { deviceId: string } }) {
  const { deviceId } = params;
  const events = stateStore.getEvents(deviceId);

  return NextResponse.json({
    deviceId,
    events,
    count: events.length,
    timestamp: new Date().toISOString(),
  });
}
