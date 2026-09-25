import { DeviceState, SystemEvent, SOSEvent, DeviceLocation, TelemetryPayload } from '../types';

/**
 * Global In-Memory Realtime State Store
 * Maintains the canonical source of truth for active AngRaksha devices,
 * location history trails, and SOS alerts across Next.js API routes.
 */
class StateStore {
  private static instance: StateStore;

  private devices: Map<string, DeviceState> = new Map();
  private locationTrails: Map<string, DeviceLocation[]> = new Map();
  private events: SystemEvent[] = [];
  private sosEvents: SOSEvent[] = [];

  private constructor() {
    this.seedDefaultDevice();
  }

  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  private seedDefaultDevice() {
    const defaultId = 'ASTRA-001';
    const now = new Date().toISOString();

    const initialState: DeviceState = {
      deviceId: defaultId,
      name: 'AngRaksha Cane V1 (User: Rajesh K.)',
      timestamp: now,
      online: true,
      batteryPercent: 87,
      batteryVoltage: 3.91,
      gps: {
        status: 'LOCKED',
        latitude: 12.9716,
        longitude: 77.5946,
        accuracyMeters: 4.8,
        speedMps: 1.1,
        headingDegrees: 85,
      },
      sensors: {
        leftDistanceCm: 142,
        frontDistanceCm: 150,
        rightDistanceCm: 135,
        leftStatus: 'VALID',
        frontStatus: 'VALID',
        rightStatus: 'VALID',
        imuStatus: 'OK',
        accelMagnitudeG: 1.01,
        pitchDeg: 3.4,
        rollDeg: 1.2,
        groundHazardLatched: false,
      },
      safety: {
        risk: 'SAFE',
        direction: 'FORWARD',
        state: 'NORMAL',
      },
      sos: {
        active: false,
      },
      connectivity: {
        lastSeen: now,
        latencyMs: 28,
        scanBoundMs: 42,
        actualScanMs: 27.4,
      },
    };

    this.devices.set(defaultId, initialState);
    this.locationTrails.set(defaultId, [
      { latitude: 12.9710, longitude: 77.5938, timestamp: new Date(Date.now() - 60000).toISOString() },
      { latitude: 12.9712, longitude: 77.5940, timestamp: new Date(Date.now() - 40000).toISOString() },
      { latitude: 12.9714, longitude: 77.5943, timestamp: new Date(Date.now() - 20000).toISOString() },
      { latitude: 12.9716, longitude: 77.5946, timestamp: now },
    ]);

    this.addEvent({
      id: 'EVT-001',
      deviceId: defaultId,
      eventType: 'DEVICE_ONLINE',
      severity: 'INFO',
      message: 'AngRaksha telemetry link established.',
      timestamp: now,
      latitude: 12.9716,
      longitude: 77.5946,
    });
  }

  public getDevice(deviceId: string): DeviceState | undefined {
    return this.devices.get(deviceId);
  }

  public getAllDevices(): DeviceState[] {
    return Array.from(this.devices.values());
  }

  public getLocationTrail(deviceId: string): DeviceLocation[] {
    return this.locationTrails.get(deviceId) || [];
  }

  public getEvents(deviceId?: string): SystemEvent[] {
    if (deviceId) {
      return this.events.filter((e) => e.deviceId === deviceId);
    }
    return this.events;
  }

  public getSOSEvents(): SOSEvent[] {
    return this.sosEvents;
  }

  public addEvent(event: SystemEvent) {
    this.events.unshift(event);
    if (this.events.length > 100) {
      this.events.pop(); // Bound memory to 100 recent events
    }
  }

  public updateFromTelemetry(payload: TelemetryPayload) {
    const existing = this.devices.get(payload.deviceId);
    const now = payload.timestamp || new Date().toISOString();

    const updated: DeviceState = {
      deviceId: payload.deviceId,
      name: existing?.name || `AngRaksha (${payload.deviceId})`,
      timestamp: now,
      online: true,
      batteryPercent: payload.battery?.percent ?? existing?.batteryPercent ?? 85,
      batteryVoltage: payload.battery?.voltage ?? existing?.batteryVoltage ?? 3.9,
      gps: {
        status: payload.location ? (payload.location.latitude !== 0 ? 'LOCKED' : 'NO_FIX') : (existing?.gps.status || 'NO_FIX'),
        latitude: payload.location?.latitude ?? existing?.gps.latitude ?? 12.9716,
        longitude: payload.location?.longitude ?? existing?.gps.longitude ?? 77.5946,
        accuracyMeters: payload.location?.accuracyMeters ?? existing?.gps.accuracyMeters ?? 5.0,
        speedMps: payload.location?.speedMps ?? existing?.gps.speedMps ?? 0,
        headingDegrees: payload.location?.headingDegrees ?? existing?.gps.headingDegrees ?? 0,
      },
      sensors: {
        leftDistanceCm: payload.sensors.left?.distanceCm ?? existing?.sensors.leftDistanceCm ?? 150,
        frontDistanceCm: payload.sensors.front?.distanceCm ?? existing?.sensors.frontDistanceCm ?? 150,
        rightDistanceCm: payload.sensors.right?.distanceCm ?? existing?.sensors.rightDistanceCm ?? 150,
        leftStatus: payload.sensors.left?.status ?? existing?.sensors.leftStatus ?? 'VALID',
        frontStatus: payload.sensors.front?.status ?? existing?.sensors.frontStatus ?? 'VALID',
        rightStatus: payload.sensors.right?.status ?? existing?.sensors.rightStatus ?? 'VALID',
        imuStatus: payload.sensors.imu?.status ?? existing?.sensors.imuStatus ?? 'OK',
        accelMagnitudeG: payload.sensors.imu?.accelG ?? existing?.sensors.accelMagnitudeG ?? 1.0,
        pitchDeg: payload.sensors.imu?.pitchDeg ?? existing?.sensors.pitchDeg ?? 0.0,
        groundHazardLatched: payload.sensors.imu?.groundHazard ?? existing?.sensors.groundHazardLatched ?? false,
      },
      safety: {
        risk: payload.safety.risk,
        direction: payload.safety.direction,
        state: payload.safety.state,
      },
      sos: {
        active: payload.sos.active,
        triggeredAt: payload.sos.active ? (existing?.sos.triggeredAt || now) : undefined,
        acknowledged: payload.sos.active ? (existing?.sos.acknowledged || false) : undefined,
      },
      connectivity: {
        lastSeen: now,
        latencyMs: payload.connectivity?.latencyMs ?? 25,
        scanBoundMs: payload.connectivity?.scanBoundMs ?? 42,
        actualScanMs: payload.connectivity?.actualScanMs ?? 26.5,
      },
    };

    this.devices.set(payload.deviceId, updated);

    // Update location trail if valid GPS coordinates provided
    if (payload.location && payload.location.latitude !== 0 && payload.location.longitude !== 0) {
      const trail = this.locationTrails.get(payload.deviceId) || [];
      trail.push({
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
        accuracyMeters: payload.location.accuracyMeters,
        speedMps: payload.location.speedMps,
        headingDegrees: payload.location.headingDegrees,
        timestamp: now,
      });
      if (trail.length > 50) trail.shift();
      this.locationTrails.set(payload.deviceId, trail);
    }

    // Check for SOS trigger transition
    if (payload.sos.active && (!existing || !existing.sos.active)) {
      const sosEvt: SOSEvent = {
        id: `SOS-${Date.now()}`,
        deviceId: payload.deviceId,
        triggeredAt: now,
        latitude: updated.gps.latitude || 12.9716,
        longitude: updated.gps.longitude || 77.5946,
        status: 'ACTIVE',
        batteryPercent: updated.batteryPercent,
      };
      this.sosEvents.unshift(sosEvt);

      this.addEvent({
        id: `EVT-SOS-${Date.now()}`,
        deviceId: payload.deviceId,
        eventType: 'SOS_TRIGGERED',
        severity: 'CRITICAL',
        message: '🚨 CRITICAL: Hardware SOS button pressed! Emergency broadcast active.',
        timestamp: now,
        latitude: updated.gps.latitude,
        longitude: updated.gps.longitude,
      });
    }

    // Record direction change events
    if (existing && existing.safety.direction !== payload.safety.direction && payload.safety.direction !== 'NONE') {
      this.addEvent({
        id: `EVT-DIR-${Date.now()}`,
        deviceId: payload.deviceId,
        eventType: 'GUIDANCE_CHANGE',
        severity: payload.safety.direction === 'STOP' ? 'WARNING' : 'INFO',
        message: `Spatial navigation updated: Steer ${payload.safety.direction}`,
        timestamp: now,
        latitude: updated.gps.latitude,
        longitude: updated.gps.longitude,
      });
    }
  }

  public acknowledgeSOS(deviceId: string) {
    const dev = this.devices.get(deviceId);
    if (dev && dev.sos.active) {
      dev.sos.acknowledged = true;
      this.devices.set(deviceId, dev);
    }
  }

  public resetSOS(deviceId: string) {
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.sos.active = false;
      dev.sos.acknowledged = false;
      dev.safety.state = 'NORMAL';
      this.devices.set(deviceId, dev);
    }
  }
}

export const stateStore = StateStore.getInstance();
