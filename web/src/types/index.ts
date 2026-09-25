export type TelemetrySource = 'DEVICE_LIVE' | 'SIMULATED' | 'BROWSER_GPS' | 'LAST_KNOWN';
export type ConnectionStatus = 'ONLINE' | 'STALE' | 'OFFLINE';
export type GPSStatus = 'LOCKED' | 'SEARCHING' | 'WEAK' | 'NO_FIX' | 'STALE' | 'UNAVAILABLE' | 'SIMULATED';
export type SensorStatus = 'VALID' | 'TIMEOUT' | 'FAULT' | 'STALE' | 'DISCONNECTED';
export type RiskLevel = 'CLEAR' | 'CAUTION' | 'WARNING' | 'DANGER' | 'CRITICAL';
export type GuidanceDirection = 'FORWARD' | 'LEFT' | 'RIGHT' | 'STOP' | 'NONE';
export type HazardCategory = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NOT_AVAILABLE';

export type SystemOperationalState =
  | 'ALL_CLEAR'
  | 'GUIDE_LEFT'
  | 'GUIDE_RIGHT'
  | 'WARNING'
  | 'STOP'
  | 'GROUND_HAZARD'
  | 'WATER_HAZARD'
  | 'SOS'
  | 'DEGRADED'
  | 'SENSOR_FAULT';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitudeMeters?: number;
  speedKmh?: number;
  headingDeg?: number;
  timestamp: string;
  source: TelemetrySource;
}

export interface GeofenceConfig {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  enabled: boolean;
}

export type GeofenceStatus = 'INSIDE' | 'APPROACHING' | 'OUTSIDE' | 'NOT_CONFIGURED';

export interface SensorZoneReading {
  distanceCm: number;
  status: SensorStatus;
  updatedAt?: string;
}

export interface DeviceSensors {
  left: SensorZoneReading;
  front: SensorZoneReading;
  right: SensorZoneReading;
  waterDetected: boolean;
  waterAdcValue?: number;
  dropStairDetected: boolean;
  imuStatus: 'OK' | 'FAULT' | 'UNAVAILABLE';
  accelMagnitudeG?: number;
  pitchDeg?: number;
  rollDeg?: number;
}

export interface DeviceState {
  deviceId: string;
  personName: string;
  timestamp: string;
  source: TelemetrySource;
  status: ConnectionStatus;
  
  location: {
    latitude: number;
    longitude: number;
    accuracyM?: number;
    speedKmh?: number;
    headingDeg?: number;
    fix: GPSStatus;
    updatedAt: string;
    source: TelemetrySource;
  };

  battery: {
    percent: number;
    voltage: number;
    status: 'HEALTHY' | 'LOW' | 'CRITICAL' | 'UNKNOWN';
    updatedAt?: string;
  };

  sensors: DeviceSensors;

  navigation: {
    guidance: GuidanceDirection;
    risk: RiskLevel;
    state: SystemOperationalState;
    description?: string;
  };

  emergency: {
    sosActive: boolean;
    triggeredAt?: string;
    acknowledged?: boolean;
    acknowledgedAt?: string;
  };

  geofence: {
    status: GeofenceStatus;
    distanceToCenterM?: number;
    config?: GeofenceConfig;
  };

  health: {
    esp32: 'HEALTHY' | 'WARNING' | 'FAULT';
    gps: 'HEALTHY' | 'WARNING' | 'FAULT' | 'UNAVAILABLE';
    mpu6050: 'HEALTHY' | 'WARNING' | 'FAULT' | 'UNAVAILABLE';
    leftUltrasonic: 'HEALTHY' | 'WARNING' | 'FAULT';
    frontUltrasonic: 'HEALTHY' | 'WARNING' | 'FAULT';
    rightUltrasonic: 'HEALTHY' | 'WARNING' | 'FAULT';
    waterSensor: 'HEALTHY' | 'WARNING' | 'FAULT';
    haptics: 'HEALTHY' | 'WARNING' | 'FAULT';
    buzzer: 'HEALTHY' | 'WARNING' | 'FAULT';
    sosButton: 'HEALTHY' | 'WARNING' | 'FAULT';
    battery: 'HEALTHY' | 'WARNING' | 'FAULT' | 'UNKNOWN';
  };

  connectivity: {
    lastSeen: string;
    controlLatencyMs: number;    // Control loop execution time (~3.2 ms)
    scanDurationMs: number;      // Actual ultrasonic scan cycle (~27.4 ms)
    scanBoundMs: number;         // Configured worst-case bound (<=42 ms)
    heartbeatAgeSec: number;
  };
}

export interface TelemetryPayload {
  deviceId: string;
  source?: TelemetrySource;
  timestamp?: string;
  
  location?: {
    latitude: number;
    longitude: number;
    accuracyM?: number;
    speedKmh?: number;
    headingDeg?: number;
    fix?: GPSStatus;
  };

  battery?: {
    percent: number;
    voltage: number;
  };

  sensors?: {
    left?: {
      distanceCm: number;
      status?: SensorStatus;
    };
    front?: {
      distanceCm: number;
      status?: SensorStatus;
    };
    right?: {
      distanceCm: number;
      status?: SensorStatus;
    };
    waterDetected?: boolean;
    waterAdcValue?: number;
    dropStairDetected?: boolean;
    imu?: {
      status?: 'OK' | 'FAULT';
      accelG?: number;
      pitchDeg?: number;
    };
  };

  navigation?: {
    guidance?: GuidanceDirection;
    risk?: RiskLevel;
    state?: SystemOperationalState;
  };

  emergency?: {
    sosActive?: boolean;
  };

  connectivity?: {
    controlLatencyMs?: number;
    scanDurationMs?: number;
  };
}

export interface SystemEvent {
  id: string;
  deviceId: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  source: TelemetrySource;
  acknowledged?: boolean;
  metadata?: Record<string, any>;
}

export interface SOSEvent {
  id: string;
  deviceId: string;
  triggeredAt: string;
  latitude: number;
  longitude: number;
  batteryPercent: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  source: TelemetrySource;
  resolvedAt?: string;
  acknowledgedAt?: string;
}

export interface DayRouteSummary {
  date: string;
  totalDistanceKm: number;
  walkingDurationMinutes: number;
  stopsCount: number;
  hazardsDetected: number;
  sosCount: number;
  geofenceViolations: number;
  averageSpeedKmh: number;
  waypoints: DeviceLocation[];
  source: TelemetrySource;
}
