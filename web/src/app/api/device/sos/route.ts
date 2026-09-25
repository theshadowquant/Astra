import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId = 'ASTRA-001', action } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'ACKNOWLEDGE') {
      stateStore.acknowledgeSOS(deviceId);

      // Sync to Supabase
      const derivedState = stateStore.getDevice(deviceId);
      await supabaseAdmin.from('device_state').upsert({
        device_id: deviceId,
        payload: derivedState,
        updated_at: now,
      }, { onConflict: 'device_id' });

      await supabaseAdmin.from('sos_events')
        .update({ status: 'ACKNOWLEDGED', acknowledged_at: now })
        .eq('device_id', deviceId)
        .eq('status', 'ACTIVE');

      return NextResponse.json({ success: true, message: 'SOS Acknowledged by Guardian' });
    }

    if (action === 'RESET') {
      stateStore.resetSOS(deviceId);

      // Sync to Supabase
      const derivedState = stateStore.getDevice(deviceId);
      await supabaseAdmin.from('device_state').upsert({
        device_id: deviceId,
        payload: derivedState,
        updated_at: now,
      }, { onConflict: 'device_id' });

      await supabaseAdmin.from('sos_events')
        .update({ status: 'RESOLVED', resolved_at: now })
        .eq('device_id', deviceId)
        .in('status', ['ACTIVE', 'ACKNOWLEDGED']);

      return NextResponse.json({ success: true, message: 'SOS Reset to Normal' });
    }

    // Direct SOS trigger from hardware/external
    const dev = stateStore.getDevice(deviceId);
    stateStore.updateFromTelemetry({
      deviceId,
      timestamp: now,
      sensors: {
        left:  { distanceCm: 150, status: 'VALID' },
        front: { distanceCm: 150, status: 'VALID' },
        right: { distanceCm: 150, status: 'VALID' },
        imu:   { status: 'OK', accelG: 1.0, pitchDeg: 0 },
      },
      navigation: { risk: 'CRITICAL', guidance: 'STOP', state: 'SOS' },
      emergency: { sosActive: true },
    });

    const derivedState = stateStore.getDevice(deviceId);

    // Write SOS event to Supabase (Realtime broadcasts immediately)
    const sosId = `SOS-${Date.now()}`;
    await supabaseAdmin.from('sos_events').insert({
      id: sosId,
      device_id: deviceId,
      triggered_at: now,
      latitude: derivedState.location.latitude,
      longitude: derivedState.location.longitude,
      battery_percent: derivedState.battery.percent,
      status: 'ACTIVE',
      source: derivedState.source,
    });

    // Upsert device state
    await supabaseAdmin.from('device_state').upsert({
      device_id: deviceId,
      payload: derivedState,
      updated_at: now,
    }, { onConflict: 'device_id' });

    return NextResponse.json({ success: true, message: 'Emergency SOS Registered' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process SOS', details: err.message }, { status: 500 });
  }
}

export async function GET() {
  const sosEvents = stateStore.getSOSEvents();
  return NextResponse.json({ sosEvents });
}
