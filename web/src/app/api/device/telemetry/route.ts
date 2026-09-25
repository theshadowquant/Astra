import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TelemetryPayload, SystemEvent } from '@/types';

/**
 * Fire-and-forget Supabase sync.
 * Called WITHOUT await so telemetry always responds in <5ms.
 * If Supabase tables don't exist yet, errors are silently swallowed.
 */
async function syncToSupabase(
  deviceId: string,
  derivedState: any,
  newEvents: SystemEvent[],
  lat: number,
  lng: number,
  hasFix: boolean,
  now: string
) {
  // 1. Upsert device state → triggers Realtime broadcast to all dashboards
  try {
    await supabaseAdmin.from('device_state').upsert(
      { device_id: deviceId, person_name: derivedState.personName, payload: derivedState, updated_at: now },
      { onConflict: 'device_id' }
    );
  } catch (e: any) {
    console.warn('[Supabase] device_state upsert (tables may not exist yet):', e.message);
  }

  // 2. Insert GPS trail point
  if (hasFix && lat !== 0 && lng !== 0) {
    try {
      await supabaseAdmin.from('location_trail').insert({
        device_id: deviceId,
        latitude: lat,
        longitude: lng,
        accuracy_m: derivedState.location.accuracyM ?? 4.2,
        speed_kmh: derivedState.location.speedKmh ?? 0,
        heading_deg: derivedState.location.headingDeg ?? 0,
        source: derivedState.source,
        recorded_at: now,
      });
    } catch (e: any) {
      console.warn('[Supabase] location_trail insert:', e.message);
    }
  }

  // 3. Insert new safety events → Realtime broadcasts INSERTs to event feeds
  if (newEvents.length > 0) {
    try {
      const rows = newEvents.map((evt: SystemEvent) => ({
        id: evt.id,
        device_id: evt.deviceId,
        event_type: evt.eventType,
        severity: evt.severity,
        description: evt.description,
        latitude: evt.latitude ?? null,
        longitude: evt.longitude ?? null,
        source: evt.source,
        acknowledged: evt.acknowledged ?? false,
        created_at: evt.timestamp,
      }));
      await supabaseAdmin
        .from('system_events')
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    } catch (e: any) {
      console.warn('[Supabase] system_events upsert:', e.message);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as TelemetryPayload;

    if (!payload.deviceId) {
      return NextResponse.json({ error: 'Missing deviceId parameter' }, { status: 400 });
    }

    // ─── 1. Business Logic (always runs, no Supabase dependency) ───
    const eventsBefore = stateStore.getEvents(payload.deviceId).length;
    stateStore.updateFromTelemetry(payload);
    const derivedState = stateStore.getDevice(payload.deviceId);
    const eventsAfter = stateStore.getEvents(payload.deviceId);
    const newEvents = eventsAfter.slice(0, Math.max(0, eventsAfter.length - eventsBefore));

    const now = payload.timestamp || new Date().toISOString();
    const lat = derivedState.location.latitude;
    const lng = derivedState.location.longitude;
    const hasFix =
      derivedState.location.fix === 'LOCKED' || derivedState.location.fix === 'SIMULATED';

    // ─── 2. Fire-and-forget Supabase sync (never blocks response) ───
    // This triggers Realtime broadcast to all subscribed dashboards.
    syncToSupabase(payload.deviceId, derivedState, newEvents, lat, lng, hasFix, now);

    // ─── 3. Respond immediately (Supabase sync is async in background) ───
    return NextResponse.json({
      success: true,
      deviceId: payload.deviceId,
      receivedAt: now,
      supabaseSync: 'async',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Invalid telemetry payload', details: err.message },
      { status: 400 }
    );
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
