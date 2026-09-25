import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';
import { TelemetryPayload } from '@/types';

// Global simulation state variables
let simLat = 12.9716;
let simLng = 77.5946;
let simBattery = 87;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, deviceId = 'ASTRA-001' } = body;

    // Small walk delta
    simLat += (Math.random() - 0.48) * 0.00015;
    simLng += (Math.random() - 0.48) * 0.00015;
    simBattery = Math.max(10, simBattery - 0.1);

    let payload: TelemetryPayload = {
      deviceId,
      timestamp: new Date().toISOString(),
      location: {
        latitude: simLat,
        longitude: simLng,
        accuracyMeters: 4.2,
        speedMps: 1.2,
        headingDegrees: 88,
      },
      battery: {
        percent: Math.round(simBattery),
        voltage: 3.9,
      },
      sensors: {
        left: { distanceCm: 145, status: 'VALID' },
        front: { distanceCm: 150, status: 'VALID' },
        right: { distanceCm: 140, status: 'VALID' },
        imu: { status: 'OK', accelG: 1.01, pitchDeg: 2.1, groundHazard: false },
      },
      safety: {
        risk: 'SAFE',
        direction: 'FORWARD',
        state: 'NORMAL',
      },
      sos: { active: false },
      connectivity: {
        latencyMs: 24,
        scanBoundMs: 42,
        actualScanMs: 27.2,
      },
    };

    switch (mode) {
      case 'OBSTACLE_FRONT_LEFT_CLEAR':
        payload.sensors.front = { distanceCm: 25, status: 'VALID' };
        payload.sensors.left = { distanceCm: 85, status: 'VALID' };
        payload.sensors.right = { distanceCm: 20, status: 'VALID' };
        payload.safety.risk = 'WARNING';
        payload.safety.direction = 'LEFT';
        payload.safety.state = 'WARNING';
        break;

      case 'OBSTACLE_FRONT_RIGHT_CLEAR':
        payload.sensors.front = { distanceCm: 25, status: 'VALID' };
        payload.sensors.left = { distanceCm: 20, status: 'VALID' };
        payload.sensors.right = { distanceCm: 85, status: 'VALID' };
        payload.safety.risk = 'WARNING';
        payload.safety.direction = 'RIGHT';
        payload.safety.state = 'WARNING';
        break;

      case 'ALL_BLOCKED':
        payload.sensors.front = { distanceCm: 20, status: 'VALID' };
        payload.sensors.left = { distanceCm: 20, status: 'VALID' };
        payload.sensors.right = { distanceCm: 20, status: 'VALID' };
        payload.safety.risk = 'CRITICAL';
        payload.safety.direction = 'STOP';
        payload.safety.state = 'STOP';
        break;

      case 'GROUND_HAZARD':
        payload.sensors.imu = { status: 'OK', accelG: 0.28, pitchDeg: 48.0, groundHazard: true };
        payload.safety.risk = 'CRITICAL';
        payload.safety.direction = 'STOP';
        payload.safety.state = 'GROUND_HAZARD';
        break;

      case 'SOS_TRIGGER':
        payload.safety.risk = 'CRITICAL';
        payload.safety.direction = 'STOP';
        payload.safety.state = 'SOS';
        payload.sos.active = true;
        break;

      case 'GPS_LOST':
        payload.location = { latitude: 0, longitude: 0, accuracyMeters: 0, speedMps: 0, headingDegrees: 0 };
        break;

      case 'SENSOR_FAULT':
        payload.sensors.left = { distanceCm: 0, status: 'FAULT' };
        payload.sensors.front = { distanceCm: 0, status: 'FAULT' };
        payload.sensors.right = { distanceCm: 0, status: 'FAULT' };
        payload.safety.risk = 'CRITICAL';
        payload.safety.direction = 'STOP';
        payload.safety.state = 'SENSOR_FAULT';
        break;

      case 'NORMAL':
      default:
        // Defaults to nominal forward walk
        break;
    }

    stateStore.updateFromTelemetry(payload);

    return NextResponse.json({
      success: true,
      mode,
      payload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Simulator error', details: err.message }, { status: 500 });
  }
}
