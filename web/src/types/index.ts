export type GPSStatus = 'LOCKED' | 'NO_FIX' | 'DISABLED' | 'UNKNOWN' | 'SIMULATED';
export type SensorStatus = 'VALID' | 'TIMEOUT' | 'FAULT' | 'STALE';
export type RiskLevel = 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER' | 'CRITICAL';
export type GuidanceDirection = 'LEFT' | 'RIGHT' | 'FORWARD' | 'STOP' | 'NONE';
export type SystemOperationalState =
  | 'NORMAL'
  | 'CAUTION'
  | 'WARNING'
  | 'CRITICAL'
  | 'STOP'
  | 'GROUND_HAZARD'
  | 'SOS'
  | 'DEGRADED'
  | 'SENSOR_FAULT';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitudeMeters?: number;
  speedMps?: number;
  headingDegrees?: number;
  timestamp: string;
}

export interface DeviceState {
  deviceId: string;
  name: string;
  timestamp: string;
  online: boolean;
  batteryPercent?: number;
  batteryVoltage?: number;
  gps: {
    status: GPSStatus;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
    speedMps?: number;
    headingDegrees?: number;
  };
  sensors: {
    leftDistanceCm?: number;
    frontDistanceCm?: number;
    rightDistanceCm?: number;
    leftStatus: SensorStatus;
    frontStatus: SensorStatus;
    rightStatus: SensorStatus;
    imuStatus: 'OK' | 'FAULT';
    accelMagnitudeG?: number;
    pitchDeg?: number;
    rollDeg?: number;
    groundHazardLatched?: boolean;
  };
  safety: {
    risk: RiskLevel;
    direction: GuidanceDirection;
    state: SystemOperationalState;
  };
  sos: {
    active: boolean;
    triggeredAt?: string;
    acknowledged?: boolean;
  };
  connectivity: {
    lastSeen: string;
    latencyMs?: number;
    scanBoundMs?: number;
    actualScanMs?: number;
  };
}

export interface TelemetryPayload {
  deviceId: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    speedMps?: number;
    headingDegrees?: number;
  };
  battery?: {
    percent: number;
    voltage: number;
  };
  sensors: {
    left?: {
      distanceCm: number;
      status: SensorStatus;
    };
    front?: {
      distanceCm: number;
      status: SensorStatus;
    };
    right?: {
      distanceCm: number;
      status: SensorStatus;
    };
    imu?: {
      status: 'OK' | 'FAULT';
      accelG: number;
      pitchDeg: number;
      groundHazard: boolean;
    };
  };
  safety: {
    risk: RiskLevel;
    direction: GuidanceDirection;
    state: SystemOperationalState;
  };
  sos: {
    active: boolean;
  };
  connectivity?: {
    latencyMs?: number;
    scanBoundMs?: number;
    actualScanMs?: number;
  };
}

export interface SystemEvent {
  id: string;
  deviceId: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
}

export interface SOSEvent {
  id: string;
  deviceId: string;
  triggeredAt: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  resolvedAt?: string;
  batteryPercent?: number;
}
