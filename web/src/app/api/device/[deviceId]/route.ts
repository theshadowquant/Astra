import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { stateStore } from '@/lib/stateStore';

export async function GET(req: NextRequest, { params }: { params: { deviceId: string } }) {
  const { deviceId } = params;

  // Read canonical device state from Supabase (persistent, works across restarts)
  const { data: stateRow, error: stateErr } = await supabaseAdmin
    .from('device_state')
    .select('payload, updated_at')
    .eq('device_id', deviceId)
    .single();

  // Fallback to in-memory store if Supabase not yet set up or during cold start
  const device = (stateRow?.payload) ?? stateStore.getDevice(deviceId);

  if (!device) {
    return NextResponse.json({ error: `Device ${deviceId} not found` }, { status: 404 });
  }

  // Evaluate freshness on read
  const lastSeenMs = new Date((device as any).connectivity?.lastSeen || 0).getTime();
  const ageMs = Date.now() - lastSeenMs;
  if (ageMs > 30000) (device as any).status = 'OFFLINE';
  else if (ageMs > 8000) (device as any).status = 'STALE';
  else (device as any).status = 'ONLINE';
  (device as any).connectivity.heartbeatAgeSec = Math.floor(ageMs / 1000);

  // Read last 100 location trail points from Supabase
  const { data: trailRows } = await supabaseAdmin
    .from('location_trail')
    .select('latitude, longitude, accuracy_m, speed_kmh, heading_deg, source, recorded_at')
    .eq('device_id', deviceId)
    .order('recorded_at', { ascending: false })
    .limit(100);

  const trail = (trailRows || []).reverse().map((r: any) => ({
    latitude: r.latitude,
    longitude: r.longitude,
    accuracyMeters: r.accuracy_m,
    speedKmh: r.speed_kmh,
    headingDeg: r.heading_deg,
    timestamp: r.recorded_at,
    source: r.source,
  }));

  // Read last 50 events from Supabase
  const { data: eventRows } = await supabaseAdmin
    .from('system_events')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(50);

  const events = (eventRows || []).map((r: any) => ({
    id: r.id,
    deviceId: r.device_id,
    eventType: r.event_type,
    severity: r.severity,
    description: r.description,
    timestamp: r.created_at,
    latitude: r.latitude,
    longitude: r.longitude,
    source: r.source,
    acknowledged: r.acknowledged,
  }));

  return NextResponse.json({
    device,
    trail,
    events,
    timestamp: new Date().toISOString(),
  });
}
