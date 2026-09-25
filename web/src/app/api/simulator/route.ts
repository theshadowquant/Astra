import { NextRequest, NextResponse } from 'next/server';
import { stateStore } from '@/lib/stateStore';
import { TelemetryPayload } from '@/types';

let simLat = 12.9716;
let simLng = 77.5946;
let simBattery = 87;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, deviceId = 'ASTRA-001' } = body;

    simLat += (Math.random() - 0.48) * 0.00015;
    simLng += (Math.random() - 0.48) * 0.00015;
    simBattery = Math.max(10, simBattery - 0.1);

    let payload: TelemetryPayload = {
      deviceId,
      source: 'SIMULATED',
      timestamp: new Date().toISOString(),
      location: {
        latitude: simLat,
        longitude: simLng,
        accuracyM: 4.2,
        speedKmh: 1.2,
        headingDeg: 88,
        fix: 'LOCKED',
      },
      battery: {
        percent: Math.round(simBattery),
        voltage: 3.91,
      },
      sensors: {
        left: { distanceCm: 145, status: 'VALID' },
        front: { distanceCm: 150, status: 'VALID' },
        right: { distanceCm: 140, status: 'VALID' },
        waterDetected: false,
        dropStairDetected: false,
        imu: { status: 'OK', accelG: 1.01, pitchDeg: 2.1 },
      },
      navigation: {
        risk: 'CLEAR',
        guidance: 'FORWARD',
        state: 'ALL_CLEAR',
      },
      emergency: { sosActive: false },
    };

    if (payload.sensors && payload.navigation && payload.emergency) {
      switch (mode) {
        case 'OBSTACLE_FRONT_LEFT_CLEAR':
          payload.sensors.front = { distanceCm: 25, status: 'VALID' };
          payload.sensors.left = { distanceCm: 85, status: 'VALID' };
          payload.sensors.right = { distanceCm: 20, status: 'VALID' };
          payload.navigation.risk = 'WARNING';
          payload.navigation.guidance = 'LEFT';
          payload.navigation.state = 'GUIDE_LEFT';
          break;

        case 'OBSTACLE_FRONT_RIGHT_CLEAR':
          payload.sensors.front = { distanceCm: 25, status: 'VALID' };
          payload.sensors.left = { distanceCm: 20, status: 'VALID' };
          payload.sensors.right = { distanceCm: 85, status: 'VALID' };
          payload.navigation.risk = 'WARNING';
          payload.navigation.guidance = 'RIGHT';
          payload.navigation.state = 'GUIDE_RIGHT';
          break;

        case 'ALL_BLOCKED':
          payload.sensors.front = { distanceCm: 20, status: 'VALID' };
          payload.sensors.left = { distanceCm: 20, status: 'VALID' };
          payload.sensors.right = { distanceCm: 20, status: 'VALID' };
          payload.navigation.risk = 'CRITICAL';
          payload.navigation.guidance = 'STOP';
          payload.navigation.state = 'STOP';
          break;

        case 'WATER_DETECTED':
          payload.sensors.waterDetected = true;
          payload.sensors.waterAdcValue = 2400;
          payload.navigation.risk = 'CRITICAL';
          payload.navigation.guidance = 'STOP';
          payload.navigation.state = 'WATER_HAZARD';
          break;

        case 'GROUND_HAZARD':
          payload.sensors.dropStairDetected = true;
          payload.sensors.imu = { status: 'OK', accelG: 0.28, pitchDeg: 48.0 };
          payload.navigation.risk = 'CRITICAL';
          payload.navigation.guidance = 'STOP';
          payload.navigation.state = 'GROUND_HAZARD';
          break;

        case 'SOS_TRIGGER':
          payload.navigation.risk = 'CRITICAL';
          payload.navigation.guidance = 'STOP';
          payload.navigation.state = 'SOS';
          payload.emergency.sosActive = true;
          break;

        case 'GPS_LOST':
          if (payload.location) {
            payload.location.latitude = 0;
            payload.location.longitude = 0;
            payload.location.fix = 'NO_FIX';
          }
          break;

        case 'NORMAL':
        default:
          break;
      }
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
