import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';

export async function GET(req: NextRequest, { params }: { params: { deviceId: string } }) {
  const { deviceId } = params;
  const route = stateStore.getDayRoute(deviceId);

  return NextResponse.json({
    deviceId,
    route,
    timestamp: new Date().toISOString(),
  });
}
