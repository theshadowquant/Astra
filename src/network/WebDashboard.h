#ifndef ANG_RAKSHA_WEB_DASHBOARD_H
#define ANG_RAKSHA_WEB_DASHBOARD_H

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include "../types/SystemTypes.h"
#include "../config/Config.h"

/**
 * @brief Embedded Wi-Fi Access Point & Live Guardian Safety Web Dashboard
 * 
 * Runs 100% locally on the ESP32 without requiring external internet or cloud backends.
 * Any phone or laptop can connect to the 'AngRaksha-Guardian' Wi-Fi network and open
 * http://192.168.4.1 to view real-time ultrasonic radar, IMU status, live map coordinates,
 * and instant emergency SOS broadcast alerts.
 */
class WebDashboard {
public:
    WebDashboard();
    void begin();
    void update(uint32_t currentMillis,
                const SensorSnapshot& snapshot,
                RiskLevel risk,
                Direction direction,
                SystemState state,
                HapticPattern haptic);

private:
    WebServer _server;
    uint32_t _lastClientHandleMs;

    // Cached telemetry for JSON endpoint
    float _leftCm;
    float _frontCm;
    float _rightCm;
    float _accelG;
    float _pitchDeg;
    const char* _riskStr;
    const char* _dirStr;
    const char* _stateStr;
    const char* _hapticStr;
    bool _sosActive;
    bool _groundHazard;
    uint32_t _uptimeMs;

    void handleRoot();
    void handleTelemetryJson();
    void handleNotFound();
};

#endif // ANG_RAKSHA_WEB_DASHBOARD_H
