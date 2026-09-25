# AngRaksha — Canonical Device Telemetry Protocol

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  

---

## 1. Canonical Telemetry JSON Schema

Every AngRaksha prototype or simulator instance transmits the following standardized payload to the `/api/device/telemetry` endpoint:

```json
{
  "deviceId": "ASTRA-001",
  "timestamp": "2026-09-25T10:15:30.125Z",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "accuracyMeters": 4.8,
    "speedMps": 1.1,
    "headingDegrees": 88
  },
  "battery": {
    "percent": 87,
    "voltage": 3.91
  },
  "sensors": {
    "left": {
      "distanceCm": 142,
      "status": "VALID"
    },
    "front": {
      "distanceCm": 150,
      "status": "VALID"
    },
    "right": {
      "distanceCm": 135,
      "status": "VALID"
    },
    "imu": {
      "status": "OK",
      "accelG": 1.01,
      "pitchDeg": 3.4,
      "groundHazard": false
    }
  },
  "safety": {
    "risk": "SAFE",
    "direction": "FORWARD",
    "state": "NORMAL"
  },
  "sos": {
    "active": false
  },
  "connectivity": {
    "latencyMs": 28,
    "scanBoundMs": 42,
    "actualScanMs": 27.4
  }
}
```

---

## 2. Field Definitions & Enumerations

| Field Path | Type | Allowed Values / Units | Description |
| :--- | :--- | :--- | :--- |
| `deviceId` | `string` | e.g. `ASTRA-001` | Unique device hardware identifier |
| `sensors.*.status` | `string` | `VALID`, `TIMEOUT`, `FAULT`, `STALE` | Sensor measurement integrity |
| `sensors.imu.groundHazard` | `boolean` | `true` / `false` | Sustained low-g free-fall or severe tilt |
| `safety.risk` | `string` | `SAFE`, `CAUTION`, `WARNING`, `CRITICAL` | Calculated environmental threat level |
| `safety.direction` | `string` | `LEFT`, `RIGHT`, `FORWARD`, `STOP`, `NONE` | Active recommended navigation vector |
| `safety.state` | `string` | `NORMAL`, `CAUTION`, `WARNING`, `CRITICAL`, `GROUND_HAZARD`, `STOP`, `SOS`, `SENSOR_FAULT`, `DEGRADED` | High-level state machine mode |
| `sos.active` | `boolean` | `true` / `false` | Hardware emergency switch active |
