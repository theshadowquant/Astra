#include "WebDashboard.h"

// Beautiful single-page Guardian Dashboard HTML + CSS + JS stored in PROGMEM flash
static const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AngRaksha — Guardian Safety & Telemetry Hub</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        :root {
            --bg: #0b0f19;
            --card-bg: rgba(30, 41, 59, 0.7);
            --card-border: rgba(255, 255, 255, 0.08);
            --accent-cyan: #38bdf8;
            --accent-emerald: #10b981;
            --accent-amber: #f59e0b;
            --accent-rose: #f43f5e;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: var(--bg); color: var(--text-main); min-height: 100vh; padding: 16px; }
        .container { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

        /* SOS Alert Banner */
        .sos-banner {
            display: none;
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            color: white;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
            font-weight: 800;
            font-size: 1.2rem;
            letter-spacing: 1px;
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
            animation: pulse-sos 1s infinite alternate;
        }
        @keyframes pulse-sos {
            from { transform: scale(1); box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
            to { transform: scale(1.02); box-shadow: 0 0 30px rgba(239, 68, 68, 0.9); }
        }

        /* Header */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 16px 20px;
            border-radius: 12px;
            backdrop-filter: blur(12px);
        }
        .logo-group h1 { font-size: 1.4rem; font-weight: 700; color: var(--text-main); }
        .logo-group p { font-size: 0.8rem; color: var(--text-muted); }
        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 600;
            background: rgba(16, 185, 129, 0.15);
            color: var(--accent-emerald);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

        /* Grid */
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 640px) { .grid-3 { grid-template-columns: 1fr; } }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 16px;
            border-radius: 12px;
            backdrop-filter: blur(12px);
        }
        .card-title { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .card-val { font-size: 1.8rem; font-weight: 700; color: var(--accent-cyan); }
        .card-unit { font-size: 0.9rem; color: var(--text-muted); font-weight: 400; }
        
        .progress-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--accent-cyan); width: 50%; transition: width 0.2s, background-color 0.2s; }

        /* Guidance Banner */
        .guidance-card {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid rgba(56, 189, 248, 0.2);
        }
        .guide-vector { font-size: 1.5rem; font-weight: 800; color: var(--accent-amber); }

        /* Map Section */
        #map { height: 280px; width: 100%; border-radius: 12px; border: 1px solid var(--card-border); z-index: 1; }
        .map-meta { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; }

        /* Telemetry Stream */
        .telemetry-row { font-family: monospace; font-size: 0.8rem; color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 6px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <!-- SOS Alert -->
        <div id="sosAlert" class="sos-banner">
            🚨 CRITICAL SOS ALERT — USER EMERGENCY BROADCAST ACTIVE! 🚨
        </div>

        <!-- Header -->
        <header>
            <div class="logo-group">
                <h1>AngRaksha Guardian</h1>
                <p>Team Astra • NIRMAAN 2026 • Real-Time Safety Telematics</p>
            </div>
            <div id="statePill" class="status-pill">
                <span class="status-dot"></span>
                <span id="stateText">OPERATIONAL</span>
            </div>
        </header>

        <!-- Spatial Ultrasonic Matrix -->
        <div class="grid-3">
            <div class="card">
                <div class="card-title">Left Zone Distance</div>
                <div class="card-val"><span id="distL">--</span> <span class="card-unit">cm</span></div>
                <div class="progress-bar"><div id="fillL" class="progress-fill"></div></div>
            </div>
            <div class="card">
                <div class="card-title">Front Zone Distance</div>
                <div class="card-val"><span id="distF">--</span> <span class="card-unit">cm</span></div>
                <div class="progress-bar"><div id="fillF" class="progress-fill"></div></div>
            </div>
            <div class="card">
                <div class="card-title">Right Zone Distance</div>
                <div class="card-val"><span id="distR">--</span> <span class="card-unit">cm</span></div>
                <div class="progress-bar"><div id="fillR" class="progress-fill"></div></div>
            </div>
        </div>

        <!-- Guidance & IMU Status -->
        <div class="card guidance-card">
            <div>
                <div class="card-title">Recommended Direction Vector</div>
                <div id="dirGuide" class="guide-vector">FORWARD</div>
            </div>
            <div style="text-align: right;">
                <div class="card-title">IMU / Cane State</div>
                <div id="imuStatus" style="font-size: 1.1rem; font-weight: 600; color: var(--accent-emerald);">NORMAL (1.00g)</div>
            </div>
        </div>

        <!-- Live Location Map -->
        <div class="card" style="padding: 12px;">
            <div class="card-title" style="margin-bottom: 6px;">Live Pedestrian Geolocation</div>
            <div id="map"></div>
            <div class="map-meta">
                <span>Coordinates: <b id="coordText">12.9716° N, 77.5946° E</b></span>
                <span>Signal: <b>ESP32 SoftAP Telemetry Link</b></span>
            </div>
        </div>

        <!-- Diagnostic Stream -->
        <div class="telemetry-row">
            <span id="rawStream">Connecting to AngRaksha Core...</span>
        </div>
    </div>

    <script>
        // Initialize Leaflet Map (Default: Bengaluru coordinates from proposal)
        var userLat = 12.9716, userLng = 77.5946;
        var map = L.map('map').setView([userLat, userLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        var userMarker = L.marker([userLat, userLng]).addTo(map)
            .bindPopup('<b>AngRaksha Device Active</b><br>User Live Vector').openPopup();

        // Optional browser geolocation update if internet/GPS is accessible on phone
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                userLat = pos.coords.latitude;
                userLng = pos.coords.longitude;
                map.setView([userLat, userLng], 16);
                userMarker.setLatLng([userLat, userLng]);
                document.getElementById('coordText').innerText = userLat.toFixed(4) + '° N, ' + userLng.toFixed(4) + '° E';
            }, function(err) {}, { timeout: 5000 });
        }

        // Live Poll Telemetry (every 150ms)
        function updateGauges() {
            fetch('/api/telemetry')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('distL').innerText = data.left >= 0 ? data.left : 'MAX';
                    document.getElementById('distF').innerText = data.front >= 0 ? data.front : 'MAX';
                    document.getElementById('distR').innerText = data.right >= 0 ? data.right : 'MAX';

                    // Update Progress Bars (150cm scale)
                    function setFill(elemId, val) {
                        var elem = document.getElementById(elemId);
                        var pct = Math.min(100, Math.max(0, (val / 150) * 100));
                        elem.style.width = pct + '%';
                        if (val < 35) elem.style.backgroundColor = 'var(--accent-rose)';
                        else if (val < 60) elem.style.backgroundColor = 'var(--accent-amber)';
                        else elem.style.backgroundColor = 'var(--accent-emerald)';
                    }
                    setFill('fillL', data.left >= 0 ? data.left : 150);
                    setFill('fillF', data.front >= 0 ? data.front : 150);
                    setFill('fillR', data.right >= 0 ? data.right : 150);

                    // Direction & State
                    document.getElementById('dirGuide').innerText = data.direction;
                    document.getElementById('stateText').innerText = data.state;
                    document.getElementById('imuStatus').innerText = data.imu;

                    // SOS Banner
                    var sosBanner = document.getElementById('sosAlert');
                    if (data.sos) {
                        sosBanner.style.display = 'block';
                        document.body.style.borderColor = '#ef4444';
                    } else {
                        sosBanner.style.display = 'none';
                    }

                    // Raw stream
                    document.getElementById('rawStream').innerText = 
                        '[' + data.uptime + 'ms] L:' + data.left + 'cm F:' + data.front + 'cm R:' + data.right + 
                        'cm | RISK:' + data.risk + ' | DIR:' + data.direction + ' | STATE:' + data.state + 
                        ' | HAPTIC:' + data.haptic;
                })
                .catch(e => {
                    document.getElementById('rawStream').innerText = 'Reconnecting to telemetry socket...';
                });
        }

        setInterval(updateGauges, 150);
    </script>
</body>
</html>
)rawliteral";

WebDashboard::WebDashboard()
    : _server(80),
      _lastClientHandleMs(0),
      _leftCm(150.0f),
      _frontCm(150.0f),
      _rightCm(150.0f),
      _accelG(1.0f),
      _pitchDeg(0.0f),
      _riskStr("SAFE"),
      _dirStr("FORWARD"),
      _stateStr("NORMAL"),
      _hapticStr("OFF"),
      _sosActive(false),
      _groundHazard(false),
      _uptimeMs(0) {}

void WebDashboard::begin() {
    // Configure ESP32 SoftAP
    WiFi.mode(WIFI_AP);
    WiFi.softAP("AngRaksha-Guardian", "astra2026");

    IPAddress ip = WiFi.softAPIP();
    Serial.println();
    Serial.println(F("=================================================="));
    Serial.print(F("[WIFI] Guardian SoftAP Active: "));
    Serial.println(F("AngRaksha-Guardian (Pass: astra2026)"));
    Serial.print(F("[WIFI] Web Dashboard URL: http://"));
    Serial.println(ip);
    Serial.println(F("=================================================="));

    // Endpoints
    _server.on("/", HTTP_GET, [this]() {
        handleRoot();
    });

    _server.on("/api/telemetry", HTTP_GET, [this]() {
        handleTelemetryJson();
    });

    _server.onNotFound([this]() {
        handleNotFound();
    });

    _server.begin();
}

void WebDashboard::handleRoot() {
    _server.send_P(200, "text/html", INDEX_HTML);
}

void WebDashboard::handleTelemetryJson() {
    char jsonBuf[384];
    snprintf(jsonBuf, sizeof(jsonBuf),
             "{\"left\":%.1f,\"front\":%.1f,\"right\":%.1f,\"risk\":\"%s\",\"direction\":\"%s\",\"state\":\"%s\",\"haptic\":\"%s\",\"imu\":\"%s (%.2fg)\",\"sos\":%s,\"uptime\":%u}",
             _leftCm, _frontCm, _rightCm,
             _riskStr, _dirStr, _stateStr, _hapticStr,
             _groundHazard ? "DROP/HAZARD!" : "NORMAL", _accelG,
             _sosActive ? "true" : "false",
             _uptimeMs);

    _server.send(200, "application/json", jsonBuf);
}

void WebDashboard::handleNotFound() {
    _server.send(404, "text/plain", "AngRaksha 404: Not Found");
}

void WebDashboard::update(uint32_t currentMillis,
                          const SensorSnapshot& snapshot,
                          RiskLevel risk,
                          Direction direction,
                          SystemState state,
                          HapticPattern haptic) {
    // Cache latest telemetry data
    _leftCm = (snapshot.left.validity == ReadingValidity::VALID) ? snapshot.left.distanceCm : -1.0f;
    _frontCm = (snapshot.front.validity == ReadingValidity::VALID) ? snapshot.front.distanceCm : -1.0f;
    _rightCm = (snapshot.right.validity == ReadingValidity::VALID) ? snapshot.right.distanceCm : -1.0f;
    _accelG = snapshot.imu.accelMagnitude;
    _pitchDeg = snapshot.imu.pitchDeg;
    _sosActive = snapshot.sosActive;
    _groundHazard = (state == SystemState::GROUND_HAZARD || snapshot.imu.freeFallSustained);
    _uptimeMs = currentMillis;

    // Convert string pointers
    switch (risk) {
        case RiskLevel::SAFE: _riskStr = "SAFE"; break;
        case RiskLevel::CAUTION: _riskStr = "CAUTION"; break;
        case RiskLevel::WARNING: _riskStr = "WARNING"; break;
        case RiskLevel::CRITICAL: _riskStr = "CRITICAL"; break;
        default: _riskStr = "UNKNOWN"; break;
    }

    switch (direction) {
        case Direction::NONE: _dirStr = "FORWARD"; break;
        case Direction::FORWARD: _dirStr = "FORWARD"; break;
        case Direction::LEFT: _dirStr = "GUIDE LEFT"; break;
        case Direction::RIGHT: _dirStr = "GUIDE RIGHT"; break;
        case Direction::STOP: _dirStr = "HALT / STOP"; break;
        default: _dirStr = "UNKNOWN"; break;
    }

    switch (state) {
        case SystemState::STARTUP: _stateStr = "STARTUP"; break;
        case SystemState::NORMAL: _stateStr = "OPERATIONAL"; break;
        case SystemState::CAUTION: _stateStr = "CAUTION"; break;
        case SystemState::WARNING: _stateStr = "WARNING"; break;
        case SystemState::CRITICAL: _stateStr = "CRITICAL"; break;
        case SystemState::GROUND_HAZARD: _stateStr = "GROUND HAZARD"; break;
        case SystemState::STOP: _stateStr = "IMPASSE / STOP"; break;
        case SystemState::SOS: _stateStr = "SOS EMERGENCY"; break;
        case SystemState::SENSOR_FAULT: _stateStr = "SENSOR FAULT"; break;
        case SystemState::DEGRADED: _stateStr = "DEGRADED MODE"; break;
        default: _stateStr = "OPERATIONAL"; break;
    }

    switch (haptic) {
        case HapticPattern::PATTERN_OFF: _hapticStr = "OFF"; break;
        case HapticPattern::PATTERN_GUIDE_LEFT: _hapticStr = "PULSE LEFT"; break;
        case HapticPattern::PATTERN_GUIDE_RIGHT: _hapticStr = "PULSE RIGHT"; break;
        case HapticPattern::PATTERN_FORWARD_CLEAR: _hapticStr = "PING CENTER"; break;
        case HapticPattern::PATTERN_WARNING_PULSE: _hapticStr = "WARN PULSE"; break;
        case HapticPattern::PATTERN_CRITICAL_STOP: _hapticStr = "CONTINUOUS STOP"; break;
        case HapticPattern::PATTERN_GROUND_HAZARD: _hapticStr = "SHORT-SHORT-LONG"; break;
        case HapticPattern::PATTERN_SOS_EMERGENCY: _hapticStr = "SOS BURST"; break;
        case HapticPattern::PATTERN_SENSOR_FAULT: _hapticStr = "FAULT TICK"; break;
        default: _hapticStr = "OFF"; break;
    }

    // Handle HTTP Client requests non-blockingly (rate-limited to every 20ms)
    if (currentMillis - _lastClientHandleMs >= 20) {
        _lastClientHandleMs = currentMillis;
        _server.handleClient();
    }
}
