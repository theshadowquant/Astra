import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TelemetryPayload, SystemEvent } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as TelemetryPayload;

    if (!payload.deviceId) {
      return NextResponse.json({ error: 'Missing deviceId parameter' }, { status: 400 });
    }

    // ─── 1. Business Logic (geofence, hazard derivation, events) ───
    const eventsBefore = stateStore.getEvents(payload.deviceId);
    const countBefore = eventsBefore.length;

    stateStore.updateFromTelemetry(payload);

    const derivedState = stateStore.getDevice(payload.deviceId);
    const eventsAfter = stateStore.getEvents(payload.deviceId);
    const newEvents = eventsAfter.slice(0, Math.max(0, eventsAfter.length - countBefore));

    // ─── 2. Persist to Supabase (triggers Realtime broadcast) ───
    const now = new Date().toISOString();

    // 2a. Upsert full device state (Realtime broadcasts this to all dashboards)
    const { error: stateErr } = await supabaseAdmin
      .from('device_state')
      .upsert(
        {
          device_id: payload.deviceId,
          person_name: derivedState.personName,
          payload: derivedState,
          updated_at: now,
        },
        { onConflict: 'device_id' }
      );
    if (stateErr) console.error('[Supabase] device_state upsert error:', stateErr.message);

    // 2b. Insert location trail point (if valid GPS fix)
    const lat = derivedState.location.latitude;
    const lng = derivedState.location.longitude;
    const hasFix = derivedState.location.fix === 'LOCKED' || derivedState.location.fix === 'SIMULATED';

    if (hasFix && lat !== 0 && lng !== 0) {
      const { error: trailErr } = await supabaseAdmin
        .from('location_trail')
        .insert({
          device_id: payload.deviceId,
          latitude: lat,
          longitude: lng,
          accuracy_m: derivedState.location.accuracyM ?? 4.2,
          speed_kmh: derivedState.location.speedKmh ?? 0,
          heading_deg: derivedState.location.headingDeg ?? 0,
          source: derivedState.source,
          recorded_at: now,
        });
      if (trailErr) console.error('[Supabase] location_trail insert error:', trailErr.message);
    }

    // 2c. Upsert new system events (Realtime broadcasts INSERTs to event feed)
    if (newEvents.length > 0) {
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

      const { error: evtErr } = await supabaseAdmin
        .from('system_events')
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
      if (evtErr) console.error('[Supabase] system_events upsert error:', evtErr.message);
    }

    return NextResponse.json({
      success: true,
      deviceId: payload.deviceId,
      receivedAt: now,
      supabaseSync: true,
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
