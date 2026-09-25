# AngRaksha — ESP32 to Web Platform Integration Contract

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  

---

## 1. Dual Deployment Modes

The AngRaksha web architecture supports two flexible integration topologies:

### Mode A: Embedded Local Access Point (Zero Cloud / Offline Demo)
- ESP32 broadcasts its own Wi-Fi SoftAP: **`AngRaksha-Guardian`** (Password: `astra2026`).
- Directly serves the embedded web dashboard at `http://192.168.4.1`.
- Any phone or laptop connecting to the Wi-Fi sees live radar, coordinates, and SOS events with zero external network required.

### Mode B: Connected Guardian Cloud Platform (Vercel / Next.js)
- ESP32 connects to local Wi-Fi / Mobile Hotspot / Cellular Gateway.
- Periodically dispatches standard HTTP POST telemetry to `https://your-angraksha-domain.vercel.app/api/device/telemetry`.
- Remote guardians anywhere in the world can monitor the pedestrian in real time.

---

## 2. Arduino C++ Dispatch Snippet

```cpp
#include <HTTPClient.h>
#include <WiFi.h>

void sendTelemetryToCloud(const SensorSnapshot& snap, RiskLevel risk, Direction dir, SystemState st) {
    if (WiFi.status() != WL_CONNECTED) return;

    HTTPClient http;
    http.begin("https://your-angraksha-domain.vercel.app/api/device/telemetry");
    http.addHeader("Content-Type", "application/json");

    char jsonPayload[384];
    snprintf(jsonPayload, sizeof(jsonPayload),
        "{\"deviceId\":\"ASTRA-001\",\"sensors\":{\"left\":{\"distanceCm\":%.0f,\"status\":\"VALID\"},"
        "\"front\":{\"distanceCm\":%.0f,\"status\":\"VALID\"},\"right\":{\"distanceCm\":%.0f,\"status\":\"VALID\"},"
        "\"imu\":{\"status\":\"OK\",\"accelG\":%.2f,\"pitchDeg\":%.1f,\"groundHazard\":%s}},"
        "\"safety\":{\"risk\":\"%s\",\"direction\":\"%s\",\"state\":\"%s\"},\"sos\":{\"active\":%s}}",
        snap.left.distanceCm, snap.front.distanceCm, snap.right.distanceCm,
        snap.imu.accelMagnitude, snap.imu.pitchDeg,
        (st == SystemState::GROUND_HAZARD) ? "true" : "false",
        "SAFE", (dir == Direction::LEFT ? "LEFT" : dir == Direction::RIGHT ? "RIGHT" : "FORWARD"),
        "NORMAL", (st == SystemState::SOS) ? "true" : "false"
    );

    int httpResponseCode = http.POST(jsonPayload);
    http.end();
}
```
