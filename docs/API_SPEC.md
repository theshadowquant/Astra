# AngRaksha — REST API & Telematics Specification

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  

---

## 1. Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/device/telemetry` | Ingests real-time spatial distances, IMU, battery, and guidance state | Device API Key / Bearer |
| `GET` | `/api/device/telemetry` | Retrieves snapshot summary of all active devices | Guardian Session |
| `POST` | `/api/device/sos` | Registers hardware SOS trigger or updates resolution status | Public / Device / Guardian |
| `GET` | `/api/device/sos` | Lists active and historical SOS events | Guardian Session |
| `GET` | `/api/device/:deviceId` | Retrieves granular device telemetry, location trail, and audit log | Guardian Session |
| `POST` | `/api/simulator` | Injects pre-programmed mobility scenarios for hackathon demonstrations | Public / Demo Mode |

---

## 2. Ingest Telemetry (`POST /api/device/telemetry`)

### Request Headers
```http
Content-Type: application/json
X-Device-Key: astra_secret_device_token_2026
```

### Request Body
```json
{
  "deviceId": "ASTRA-001",
  "timestamp": "2026-09-25T10:20:00.000Z",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "accuracyMeters": 4.5,
    "speedMps": 1.2,
    "headingDegrees": 85
  },
  "battery": {
    "percent": 87,
    "voltage": 3.91
  },
  "sensors": {
    "left": { "distanceCm": 142, "status": "VALID" },
    "front": { "distanceCm": 150, "status": "VALID" },
    "right": { "distanceCm": 135, "status": "VALID" },
    "imu": {
      "status": "OK",
      "accelG": 1.01,
      "pitchDeg": 2.4,
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
    "latencyMs": 25,
    "scanBoundMs": 42,
    "actualScanMs": 26.8
  }
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "deviceId": "ASTRA-001",
  "receivedAt": "2026-09-25T10:20:00.120Z"
}
```

---

## 3. Emergency SOS Control (`POST /api/device/sos`)

### Request Body (Acknowledge)
```json
{
  "deviceId": "ASTRA-001",
  "action": "ACKNOWLEDGE"
}
```

### Request Body (Reset)
```json
{
  "deviceId": "ASTRA-001",
  "action": "RESET"
}
```
