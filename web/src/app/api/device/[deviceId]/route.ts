import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { stateStore } from '@/lib/stateStore';

export async function GET(req: NextRequest, { params }: { params: { deviceId: string } }) {
  const { deviceId } = params;

  // ─── Try Supabase (5s timeout) — fall back to in-memory stateStore ───
  let device: any = null;
  let trail: any[] = [];
  let events: any[] = [];

  try {
    // Race Supabase against a 5-second timeout
    const supabasePromise = supabaseAdmin
      .from('device_state')
      .select('payload, updated_at')
      .eq('device_id', deviceId)
      .single();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Supabase timeout') }), 5000)
    );

    const { data: stateRow } = await Promise.race([supabasePromise, timeoutPromise]) as any;

    if (stateRow?.payload) {
      device = stateRow.payload;

      // Evaluate freshness
      const ageMs = Date.now() - new Date(device.connectivity?.lastSeen || 0).getTime();
      if (ageMs > 30000) device.status = 'OFFLINE';
      else if (ageMs > 8000) device.status = 'STALE';
      else device.status = 'ONLINE';
      device.connectivity.heartbeatAgeSec = Math.floor(ageMs / 1000);

      // Fetch trail (with timeout)
      const trailPromise = supabaseAdmin
        .from('location_trail')
        .select('latitude, longitude, accuracy_m, speed_kmh, heading_deg, source, recorded_at')
        .eq('device_id', deviceId)
        .order('recorded_at', { ascending: false })
        .limit(100);

      const { data: trailRows } = await Promise.race([
        trailPromise,
        new Promise<{ data: null }>((r) => setTimeout(() => r({ data: null }), 3000)),
      ]) as any;

      trail = ((trailRows || []) as any[]).reverse().map((r: any) => ({
        latitude: r.latitude,
        longitude: r.longitude,
        accuracyMeters: r.accuracy_m,
        speedKmh: r.speed_kmh,
        headingDeg: r.heading_deg,
        timestamp: r.recorded_at,
        source: r.source,
      }));

      // Fetch events (with timeout)
      const eventsPromise = supabaseAdmin
        .from('system_events')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: eventRows } = await Promise.race([
        eventsPromise,
        new Promise<{ data: null }>((r) => setTimeout(() => r({ data: null }), 3000)),
      ]) as any;

      events = ((eventRows || []) as any[]).map((r: any) => ({
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
    }
  } catch (err: any) {
    console.warn('[API] Supabase unavailable, using in-memory stateStore:', err.message);
  }

  // ─── Fallback: always use stateStore if Supabase returned nothing ───
  if (!device) {
    device = stateStore.getDevice(deviceId);
    trail = stateStore.getLocationTrail(deviceId);
    events = stateStore.getEvents(deviceId).slice(0, 50);
  }

  if (!device) {
    return NextResponse.json({ error: `Device ${deviceId} not found` }, { status: 404 });
  }

  return NextResponse.json({
    device,
    trail,
    events,
    timestamp: new Date().toISOString(),
  });
}
