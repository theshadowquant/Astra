import {
  DeviceState,
  SystemEvent,
  SOSEvent,
  DeviceLocation,
  TelemetryPayload,
  GeofenceConfig,
  DayRouteSummary,
  TelemetrySource,
} from '../types';
import { HARDWARE_CONFIG } from './hardwareConfig';

/**
 * Calculates Great-Circle distance in meters using Haversine formula
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Global In-Memory Realtime State Store
 * Maintains the canonical source of truth for active AngRaksha devices,
 * location history trails, geofence, and SOS alerts across Next.js.
 */
class StateStore {
  private static instance: StateStore;

  private devices: Map<string, DeviceState> = new Map();
  private locationTrails: Map<string, DeviceLocation[]> = new Map();
  private dayRoutes: Map<string, DeviceLocation[]> = new Map();
  private events: SystemEvent[] = [];
  private sosEvents: SOSEvent[] = [];
  private geofences: Map<string, GeofenceConfig> = new Map();

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

    const homeLat = 12.9716;
    const homeLng = 77.5946;

    const geofence: GeofenceConfig = {
      id: 'GEO-001',
      name: 'Home & Neighborhood Safe Zone',
      centerLat: homeLat,
      centerLng: homeLng,
      radiusMeters: 500,
      enabled: true,
    };
    this.geofences.set(defaultId, geofence);

    const initialState: DeviceState = {
      deviceId: defaultId,
      personName: 'Rajesh K.',
      timestamp: now,
      source: 'DEVICE_LIVE',
      status: 'ONLINE',
      location: {
        latitude: homeLat,
        longitude: homeLng,
        accuracyM: 4.2,
        speedKmh: 1.2,
        headingDeg: 88,
        fix: 'LOCKED',
        updatedAt: now,
        source: 'DEVICE_LIVE',
      },
      battery: {
        percent: 87,
        voltage: 3.91,
        status: 'HEALTHY',
        updatedAt: now,
      },
      sensors: {
        left: { distanceCm: 142, status: 'VALID', updatedAt: now },
        front: { distanceCm: 150, status: 'VALID', updatedAt: now },
        right: { distanceCm: 135, status: 'VALID', updatedAt: now },
        waterDetected: false,
        waterAdcValue: 240,
        dropStairDetected: false,
        imuStatus: 'OK',
        accelMagnitudeG: 0.99,
        pitchDeg: 2.1,
        rollDeg: 1.0,
      },
      navigation: {
        guidance: 'FORWARD',
        risk: 'CLEAR',
        state: 'ALL_CLEAR',
        description: 'Path is unobstructed. All directional sectors clear.',
      },
      emergency: {
        sosActive: false,
      },
      geofence: {
        status: 'INSIDE',
        distanceToCenterM: 0,
        config: geofence,
      },
      health: {
        esp32: 'HEALTHY',
        gps: 'HEALTHY',
        mpu6050: 'HEALTHY',
        leftUltrasonic: 'HEALTHY',
        frontUltrasonic: 'HEALTHY',
        rightUltrasonic: 'HEALTHY',
        waterSensor: 'HEALTHY',
        haptics: 'HEALTHY',
        buzzer: 'HEALTHY',
        sosButton: 'HEALTHY',
        battery: 'HEALTHY',
      },
      connectivity: {
        lastSeen: now,
        controlLatencyMs: HARDWARE_CONFIG.timing.controlLoopLatencyMs,
        scanDurationMs: HARDWARE_CONFIG.timing.typicalScanCycleMs,
        scanBoundMs: HARDWARE_CONFIG.timing.worstCaseScanCycleMs,
        heartbeatAgeSec: 1,
      },
    };

    this.devices.set(defaultId, initialState);

    // Seed realistic daytime trajectory
    const trailPoints: DeviceLocation[] = [
      { latitude: 12.9698, longitude: 77.5925, speedKmh: 1.1, headingDeg: 45, timestamp: new Date(Date.now() - 3600000).toISOString(), source: 'DEVICE_LIVE' },
      { latitude: 12.9702, longitude: 77.5931, speedKmh: 1.3, headingDeg: 50, timestamp: new Date(Date.now() - 2700000).toISOString(), source: 'DEVICE_LIVE' },
      { latitude: 12.9708, longitude: 77.5938, speedKmh: 1.2, headingDeg: 60, timestamp: new Date(Date.now() - 1800000).toISOString(), source: 'DEVICE_LIVE' },
      { latitude: 12.9712, longitude: 77.5942, speedKmh: 1.0, headingDeg: 75, timestamp: new Date(Date.now() - 900000).toISOString(), source: 'DEVICE_LIVE' },
      { latitude: 12.9716, longitude: 77.5946, speedKmh: 1.2, headingDeg: 88, timestamp: now, source: 'DEVICE_LIVE' },
    ];
    this.locationTrails.set(defaultId, [...trailPoints]);
    this.dayRoutes.set(defaultId, [...trailPoints]);

    this.addEvent({
      id: 'EVT-001',
      deviceId: defaultId,
      eventType: 'DEVICE_ONLINE',
      severity: 'INFO',
      description: 'AngRaksha telemetry link established on secure guardian channel.',
      timestamp: now,
      latitude: homeLat,
      longitude: homeLng,
      source: 'DEVICE_LIVE',
    });
  }

  public getDevice(deviceId: string = 'ASTRA-001'): DeviceState {
    let dev = this.devices.get(deviceId);
    if (!dev) {
      this.seedDefaultDevice();
      dev = this.devices.get(deviceId)!;
    }

    // Evaluate live freshness
    const lastSeenMs = new Date(dev.connectivity.lastSeen).getTime();
    const ageMs = Date.now() - lastSeenMs;
    const ageSec = Math.floor(ageMs / 1000);

    dev.connectivity.heartbeatAgeSec = ageSec;

    if (ageMs > HARDWARE_CONFIG.timing.offlineThresholdMs) {
      dev.status = 'OFFLINE';
      if (dev.source === 'DEVICE_LIVE') {
        dev.location.source = 'LAST_KNOWN';
      }
    } else if (ageMs > HARDWARE_CONFIG.timing.staleThresholdMs) {
      dev.status = 'STALE';
    } else {
      dev.status = 'ONLINE';
    }

    return dev;
  }

  public getAllDevices(): DeviceState[] {
    return Array.from(this.devices.values());
  }

  public getLocationTrail(deviceId: string = 'ASTRA-001'): DeviceLocation[] {
    return this.locationTrails.get(deviceId) || [];
  }

  public getDayRoute(deviceId: string = 'ASTRA-001'): DayRouteSummary {
    const waypoints = this.dayRoutes.get(deviceId) || [];
    let totalDistM = 0;

    for (let i = 1; i < waypoints.length; i++) {
      totalDistM += calculateDistanceMeters(
        waypoints[i - 1].latitude,
        waypoints[i - 1].longitude,
        waypoints[i].latitude,
        waypoints[i].longitude
      );
    }

    const dev = this.getDevice(deviceId);

    return {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      totalDistanceKm: Number((totalDistM / 1000).toFixed(2)),
      walkingDurationMinutes: Math.max(15, waypoints.length * 4),
      stopsCount: 3,
      hazardsDetected: this.events.filter((e) => e.severity === 'WARNING' || e.severity === 'CRITICAL').length,
      sosCount: this.sosEvents.length,
      geofenceViolations: this.events.filter((e) => e.eventType.includes('GEOFENCE')).length,
      averageSpeedKmh: 1.3,
      waypoints,
      source: dev.source,
    };
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
    if (this.events.length > 150) {
      this.events.pop();
    }
  }

  public getGeofence(deviceId: string = 'ASTRA-001'): GeofenceConfig | undefined {
    return this.geofences.get(deviceId);
  }

  public updateGeofence(deviceId: string, config: GeofenceConfig) {
    this.geofences.set(deviceId, config);
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.geofence.config = config;
    }
  }

  public updateFromTelemetry(payload: TelemetryPayload) {
    const existing = this.getDevice(payload.deviceId);
    const now = payload.timestamp || new Date().toISOString();
    const source: TelemetrySource = payload.source || (existing?.source ?? 'DEVICE_LIVE');

    const lat = payload.location?.latitude ?? existing.location.latitude;
    const lng = payload.location?.longitude ?? existing.location.longitude;

    // Geofence Evaluation
    const geofenceCfg = this.geofences.get(payload.deviceId);
    let geofenceStatus: any = 'INSIDE';
    let distToCenterM = 0;

    if (geofenceCfg && geofenceCfg.enabled && lat && lng) {
      distToCenterM = calculateDistanceMeters(lat, lng, geofenceCfg.centerLat, geofenceCfg.centerLng);
      if (distToCenterM > geofenceCfg.radiusMeters) {
        geofenceStatus = 'OUTSIDE';
        if (existing.geofence.status !== 'OUTSIDE') {
          this.addEvent({
            id: `EVT-GEO-${Date.now()}`,
            deviceId: payload.deviceId,
            eventType: 'GEOFENCE_EXIT',
            severity: 'WARNING',
            description: `⚠️ Person exited safe zone (${Math.round(distToCenterM)}m from center).`,
            timestamp: now,
            latitude: lat,
            longitude: lng,
            source,
          });
        }
      } else if (distToCenterM > geofenceCfg.radiusMeters * 0.85) {
        geofenceStatus = 'APPROACHING';
      }
    }

    // Coherent Hazard & Safety Derivation
    const leftCm = payload.sensors?.left?.distanceCm ?? existing.sensors.left.distanceCm;
    const frontCm = payload.sensors?.front?.distanceCm ?? existing.sensors.front.distanceCm;
    const rightCm = payload.sensors?.right?.distanceCm ?? existing.sensors.right.distanceCm;
    const water = payload.sensors?.waterDetected ?? existing.sensors.waterDetected ?? false;
    const drop = payload.sensors?.dropStairDetected ?? existing.sensors.dropStairDetected ?? false;
    const sos = payload.emergency?.sosActive ?? existing.emergency.sosActive ?? false;

    let guidance: any = payload.navigation?.guidance ?? existing.navigation.guidance;
    let risk: any = payload.navigation?.risk ?? existing.navigation.risk;
    let state: any = payload.navigation?.state ?? existing.navigation.state;
    let desc = 'Normal navigation. Sector unobstructed.';

    if (sos) {
      guidance = 'STOP';
      risk = 'CRITICAL';
      state = 'SOS';
      desc = '🚨 EMERGENCY SOS ACTIVE! Physical panic trigger latched.';
    } else if (water) {
      guidance = 'STOP';
      risk = 'CRITICAL';
      state = 'WATER_HAZARD';
      desc = '💧 Water / puddle detected by tip electrode. Impasse warned.';
    } else if (drop) {
      guidance = 'STOP';
      risk = 'CRITICAL';
      state = 'GROUND_HAZARD';
      desc = '⚠️ Down-stairs or curb drop detected by IMU freefall.';
    } else if (frontCm < 35) {
      if (leftCm >= 60 && rightCm < 60) {
        guidance = 'LEFT';
        risk = 'DANGER';
        state = 'GUIDE_LEFT';
        desc = `Front obstacle at ${frontCm}cm. Steer LEFT corridor.`;
      } else if (rightCm >= 60 && leftCm < 60) {
        guidance = 'RIGHT';
        risk = 'DANGER';
        state = 'GUIDE_RIGHT';
        desc = `Front obstacle at ${frontCm}cm. Steer RIGHT corridor.`;
      } else if (leftCm < 35 && rightCm < 35) {
        guidance = 'STOP';
        risk = 'CRITICAL';
        state = 'STOP';
        desc = `All forward pathways blocked (<35cm). Full stop.`;
      } else {
        guidance = leftCm >= rightCm ? 'LEFT' : 'RIGHT';
        risk = 'DANGER';
        state = guidance === 'LEFT' ? 'GUIDE_LEFT' : 'GUIDE_RIGHT';
        desc = `Front obstacle at ${frontCm}cm. Steer ${guidance}.`;
      }
    } else if (frontCm < 60) {
      guidance = 'FORWARD';
      risk = 'CAUTION';
      state = 'WARNING';
      desc = `Approaching obstacle at ${frontCm}cm. Slow pace.`;
    } else {
      guidance = 'FORWARD';
      risk = 'CLEAR';
      state = 'ALL_CLEAR';
      desc = 'Path clear. Forward navigation active.';
    }

    const updated: DeviceState = {
      deviceId: payload.deviceId,
      personName: existing.personName,
      timestamp: now,
      source,
      status: 'ONLINE',
      location: {
        latitude: lat,
        longitude: lng,
        accuracyM: payload.location?.accuracyM ?? existing.location.accuracyM ?? 4.2,
        speedKmh: payload.location?.speedKmh ?? existing.location.speedKmh ?? 0,
        headingDeg: payload.location?.headingDeg ?? existing.location.headingDeg ?? 0,
        fix: payload.location?.fix ?? (lat !== 0 ? 'LOCKED' : 'NO_FIX'),
        updatedAt: now,
        source,
      },
      battery: {
        percent: payload.battery?.percent ?? existing.battery.percent,
        voltage: payload.battery?.voltage ?? existing.battery.voltage,
        status: (payload.battery?.percent ?? existing.battery.percent) < 20 ? 'LOW' : 'HEALTHY',
        updatedAt: now,
      },
      sensors: {
        left: {
          distanceCm: leftCm,
          status: payload.sensors?.left?.status ?? existing.sensors.left.status,
          updatedAt: now,
        },
        front: {
          distanceCm: frontCm,
          status: payload.sensors?.front?.status ?? existing.sensors.front.status,
          updatedAt: now,
        },
        right: {
          distanceCm: rightCm,
          status: payload.sensors?.right?.status ?? existing.sensors.right.status,
          updatedAt: now,
        },
        waterDetected: water,
        waterAdcValue: payload.sensors?.waterAdcValue ?? existing.sensors.waterAdcValue ?? (water ? 2100 : 250),
        dropStairDetected: drop,
        imuStatus: payload.sensors?.imu?.status ?? existing.sensors.imuStatus,
        accelMagnitudeG: payload.sensors?.imu?.accelG ?? existing.sensors.accelMagnitudeG ?? 1.0,
        pitchDeg: payload.sensors?.imu?.pitchDeg ?? existing.sensors.pitchDeg ?? 0.0,
      },
      navigation: {
        guidance,
        risk,
        state,
        description: desc,
      },
      emergency: {
        sosActive: sos,
        triggeredAt: sos ? (existing.emergency.triggeredAt || now) : undefined,
        acknowledged: sos ? (existing.emergency.acknowledged || false) : undefined,
      },
      geofence: {
        status: geofenceStatus,
        distanceToCenterM: Math.round(distToCenterM),
        config: geofenceCfg,
      },
      health: { ...existing.health },
      connectivity: {
        lastSeen: now,
        controlLatencyMs: payload.connectivity?.controlLatencyMs ?? HARDWARE_CONFIG.timing.controlLoopLatencyMs,
        scanDurationMs: payload.connectivity?.scanDurationMs ?? HARDWARE_CONFIG.timing.typicalScanCycleMs,
        scanBoundMs: HARDWARE_CONFIG.timing.worstCaseScanCycleMs,
        heartbeatAgeSec: 0,
      },
    };

    this.devices.set(payload.deviceId, updated);

    // Record Waypoints
    if (lat && lng && (lat !== 0 || lng !== 0)) {
      const trail = this.locationTrails.get(payload.deviceId) || [];
      const dayTrail = this.dayRoutes.get(payload.deviceId) || [];

      const pt: DeviceLocation = {
        latitude: lat,
        longitude: lng,
        accuracyMeters: updated.location.accuracyM,
        speedKmh: updated.location.speedKmh,
        headingDeg: updated.location.headingDeg,
        timestamp: now,
        source,
      };

      trail.push(pt);
      if (trail.length > 100) trail.shift();
      this.locationTrails.set(payload.deviceId, trail);

      dayTrail.push(pt);
      this.dayRoutes.set(payload.deviceId, dayTrail);
    }

    // Trigger SOS Alert Event
    if (sos && !existing.emergency.sosActive) {
      const sosEvt: SOSEvent = {
        id: `SOS-${Date.now()}`,
        deviceId: payload.deviceId,
        triggeredAt: now,
        latitude: lat,
        longitude: lng,
        batteryPercent: updated.battery.percent,
        status: 'ACTIVE',
        source,
      };
      this.sosEvents.unshift(sosEvt);

      this.addEvent({
        id: `EVT-SOS-${Date.now()}`,
        deviceId: payload.deviceId,
        eventType: 'SOS_TRIGGERED',
        severity: 'CRITICAL',
        description: '🚨 CRITICAL: Hardware SOS button pressed! Caregiver emergency broadcast active.',
        timestamp: now,
        latitude: lat,
        longitude: lng,
        source,
      });
    }

    // Trigger Water Warning Event
    if (water && !existing.sensors.waterDetected) {
      this.addEvent({
        id: `EVT-WATER-${Date.now()}`,
        deviceId: payload.deviceId,
        eventType: 'WATER_HAZARD',
        severity: 'WARNING',
        description: '💧 Liquid electrode sensed puddle/water depth on ground.',
        timestamp: now,
        latitude: lat,
        longitude: lng,
        source,
      });
    }

    // Trigger Drop Warning Event
    if (drop && !existing.sensors.dropStairDetected) {
      this.addEvent({
        id: `EVT-DROP-${Date.now()}`,
        deviceId: payload.deviceId,
        eventType: 'STAIR_DROP_DETECTED',
        severity: 'CRITICAL',
        description: '⚠️ IMU accelerometer detected sudden drop / downward staircase step.',
        timestamp: now,
        latitude: lat,
        longitude: lng,
        source,
      });
    }
  }

  public acknowledgeSOS(deviceId: string) {
    const dev = this.devices.get(deviceId);
    if (dev && dev.emergency.sosActive) {
      dev.emergency.acknowledged = true;
      dev.emergency.acknowledgedAt = new Date().toISOString();
      this.devices.set(deviceId, dev);
    }
    const sosEvt = this.sosEvents.find((e) => e.deviceId === deviceId && e.status === 'ACTIVE');
    if (sosEvt) {
      sosEvt.status = 'ACKNOWLEDGED';
      sosEvt.acknowledgedAt = new Date().toISOString();
    }
  }

  public resetSOS(deviceId: string) {
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.emergency.sosActive = false;
      dev.emergency.acknowledged = false;
      dev.navigation.state = 'ALL_CLEAR';
      this.devices.set(deviceId, dev);
    }
    const sosEvt = this.sosEvents.find((e) => e.deviceId === deviceId && (e.status === 'ACTIVE' || e.status === 'ACKNOWLEDGED'));
    if (sosEvt) {
      sosEvt.status = 'RESOLVED';
      sosEvt.resolvedAt = new Date().toISOString();
    }
  }
}

export const stateStore = StateStore.getInstance();
