#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ==================== WIFI & TELEMETRY CONFIG ====================
// ⚠️  EDIT THESE BEFORE FLASHING TO YOUR HARDWARE
#define WIFI_SSID       "YourWiFiSSID"
#define WIFI_PASSWORD   "YourWiFiPassword"

// URL of your running Next.js Guardian Platform (LAN or public)
// For local dev: use your PC's LAN IP (e.g. http://192.168.1.100:3000)
// For deployed: e.g. https://your-app.vercel.app
#define TELEMETRY_URL   "http://192.168.1.100:3000/api/device/telemetry"

#define DEVICE_ID       "ASTRA-001"

// Telemetry send interval in ms (3000 = every 3 seconds)
// Do NOT set below 1000 - this would starve the safety loop
#define TELEMETRY_INTERVAL_MS  3000

// ==================== PIN DEFINITIONS ====================
// Ultrasonic Sensor 1 (Center / Front)
#define TRIG_PIN_CENTER   19
#define ECHO_PIN_CENTER   23

// Ultrasonic Sensor 2 (Left)
#define TRIG_PIN_LEFT     5
#define ECHO_PIN_LEFT     18

// Ultrasonic Sensor 3 (Right)
#define TRIG_PIN_RIGHT    13
#define ECHO_PIN_RIGHT    14

// Actuators
#define BUZZER_PIN        4    // Active 5V Piezo Buzzer
#define MOTOR_LEFT_PIN    25   // Left Vibration Motor
#define MOTOR_RIGHT_PIN   27   // Right Vibration Motor

// Water / Liquid Sensing Electrode
// Connect one wire/probe to 3.3V, and the other wire to GPIO 34 with a 10k pulldown to GND
// OR connect one probe to GND and GPIO 34 with internal pullup
#define WATER_SENSOR_PIN  34   // ADC pin (Input only on ESP32)

// ==================== THRESHOLDS ====================
#define WATER_THRESHOLD   1500 // ADC value threshold for liquid conduction (0 - 4095)
#define MAX_DISTANCE_CM   200  // Maximum detection range (2 meters)

// ==================== RUNTIME STATE ====================
// Latest sensor readings (written by loop, read by sendTelemetry)
volatile float g_distFront = 400.0f;
volatile float g_distLeft  = 400.0f;
volatile float g_distRight = 400.0f;
volatile int   g_waterAdc  = 0;
volatile bool  g_water     = false;

// Telemetry timing
unsigned long lastTelemetrySendMs = 0;
bool wifiConnected = false;

// Helper function to read HC-SR04 in centimeters (clean & direct)
float readDistance(uint8_t trigPin, uint8_t echoPin) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    
    // 25ms timeout (~400cm max envelope)
    unsigned long duration = pulseIn(echoPin, HIGH, 25000);
    if (duration == 0) return 400.0f; // No echo / clear
    
    return (float)duration * 0.0343f / 2.0f;
}

// ==================== WIFI INIT ====================
void initWiFi() {
    Serial.printf("[WiFi] Connecting to '%s'...\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    // Non-blocking connect with 10s timeout
    unsigned long t = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - t < 10000) {
        delay(250);
        Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\n[WiFi] Not connected - continuing offline. Telemetry disabled.");
        Serial.println("[WiFi] Safety logic operates INDEPENDENTLY of network.");
    }
}

// ==================== TELEMETRY POST (NON-BLOCKING) ====================
// Called from loop() only every TELEMETRY_INTERVAL_MS milliseconds.
// NEVER called from an interrupt or tight loop - it uses blocking HTTP.
// The safety loop MUST HAVE already completed its cycle before this runs.
void sendTelemetry() {
    if (WiFi.status() != WL_CONNECTED) {
        // Try to reconnect once, silently
        WiFi.reconnect();
        return;
    }

    // Snapshot of latest sensor readings
    float front  = g_distFront;
    float left   = g_distLeft;
    float right  = g_distRight;
    int   water  = g_waterAdc;
    bool  isWet  = g_water;

    // Derive navigation state (mirrors server-side stateStore.ts logic)
    const char* guidance = "FORWARD";
    const char* risk     = "CLEAR";
    const char* state    = "ALL_CLEAR";

    if (isWet) {
        guidance = "STOP"; risk = "CRITICAL"; state = "WATER_HAZARD";
    } else if (front < 35.0f) {
        if (left >= 60.0f && right < 60.0f)  { guidance = "LEFT";  risk = "DANGER"; state = "GUIDE_LEFT"; }
        else if (right >= 60.0f && left < 60.0f) { guidance = "RIGHT"; risk = "DANGER"; state = "GUIDE_RIGHT"; }
        else if (left < 35.0f && right < 35.0f)  { guidance = "STOP";  risk = "CRITICAL"; state = "STOP"; }
        else { guidance = (left >= right) ? "LEFT" : "RIGHT"; risk = "DANGER"; state = (left >= right) ? "GUIDE_LEFT" : "GUIDE_RIGHT"; }
    } else if (front < 60.0f) {
        guidance = "FORWARD"; risk = "CAUTION"; state = "WARNING";
    }

    // Build compact JSON payload
    String payload = "{";
    payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
    payload += "\"source\":\"DEVICE_LIVE\",";
    payload += "\"sensors\":{";
    payload += "\"left\":{\"distanceCm\":" + String(left, 1) + ",\"status\":\"VALID\"},";
    payload += "\"front\":{\"distanceCm\":" + String(front, 1) + ",\"status\":\"VALID\"},";
    payload += "\"right\":{\"distanceCm\":" + String(right, 1) + ",\"status\":\"VALID\"},";
    payload += "\"waterDetected\":" + String(isWet ? "true" : "false") + ",";
    payload += "\"waterAdcValue\":" + String(water) + ",";
    payload += "\"dropStairDetected\":false";
    payload += "},";
    payload += "\"navigation\":{";
    payload += "\"guidance\":\"" + String(guidance) + "\",";
    payload += "\"risk\":\"" + String(risk) + "\",";
    payload += "\"state\":\"" + String(state) + "\"";
    payload += "},";
    payload += "\"emergency\":{\"sosActive\":false}";
    payload += "}";

    HTTPClient http;
    http.begin(TELEMETRY_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(2000); // 2s max — don't block longer than this

    int httpCode = http.POST(payload);

    if (httpCode == 200 || httpCode == 201) {
        Serial.printf("[Telemetry] ✓ Posted | F:%.0fcm L:%.0fcm R:%.0fcm | State:%s\n",
                      front, left, right, state);
    } else {
        Serial.printf("[Telemetry] ✗ HTTP %d (check TELEMETRY_URL)\n", httpCode);
    }

    http.end();
}

// ==================== SETUP ====================
void setup() {
    Serial.begin(115200);
    delay(500);

    // Ultrasonic Pin Modes
    pinMode(TRIG_PIN_CENTER, OUTPUT);
    pinMode(ECHO_PIN_CENTER, INPUT);
    pinMode(TRIG_PIN_LEFT, OUTPUT);
    pinMode(ECHO_PIN_LEFT, INPUT);
    pinMode(TRIG_PIN_RIGHT, OUTPUT);
    pinMode(ECHO_PIN_RIGHT, INPUT);

    // Actuator Pin Modes
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(MOTOR_LEFT_PIN, OUTPUT);
    pinMode(MOTOR_RIGHT_PIN, OUTPUT);

    // Liquid Electrode (GPIO 34 is analog input)
    pinMode(WATER_SENSOR_PIN, INPUT);

    // Initial safe states
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(MOTOR_LEFT_PIN, LOW);
    digitalWrite(MOTOR_RIGHT_PIN, LOW);

    Serial.println("=========================================");
    Serial.println("  AngRaksha Assistive Device Online!     ");
    Serial.println("  Team Astra | NIRMAAN 2026              ");
    Serial.println("=========================================");

    // Attempt WiFi for Guardian telemetry (non-blocking - safety works without it)
    initWiFi();

    Serial.println("[Safety] Safety loop active. Telemetry is decoupled.");
}

// ==================== MAIN LOOP ====================
void loop() {
    // =====================================================
    // SECTION 1: CRITICAL SAFETY LOOP (Always runs)
    // Network state NEVER affects this section.
    // =====================================================

    // 1a. LIQUID / WATER DETECTION
    int waterVal = analogRead(WATER_SENSOR_PIN);
    bool liquidDetected = (waterVal > WATER_THRESHOLD);

    // Update shared state for telemetry
    g_waterAdc = waterVal;
    g_water    = liquidDetected;

    if (liquidDetected) {
        Serial.printf("[ALERT] Liquid Detected! (ADC: %d)\n", waterVal);
        digitalWrite(BUZZER_PIN, HIGH);
        digitalWrite(MOTOR_LEFT_PIN, HIGH);
        digitalWrite(MOTOR_RIGHT_PIN, HIGH);
        delay(150);
        digitalWrite(BUZZER_PIN, LOW);
        delay(100);
        // Still allow telemetry to send below (just skip sensor reads)
        goto TELEMETRY_SECTION;
    }

    // 1b. DISTANCE MEASUREMENTS
    g_distFront = readDistance(TRIG_PIN_CENTER, ECHO_PIN_CENTER);
    delay(10);
    g_distLeft  = readDistance(TRIG_PIN_LEFT, ECHO_PIN_LEFT);
    delay(10);
    g_distRight = readDistance(TRIG_PIN_RIGHT, ECHO_PIN_RIGHT);

    {
        // Local scope for minDistance calculation
        float minDistance = g_distFront;
        if (g_distLeft  < minDistance) minDistance = g_distLeft;
        if (g_distRight < minDistance) minDistance = g_distRight;

        float distanceMeters = minDistance / 100.0f;

        // 1c. SERIAL DISTANCE REPORT
        Serial.print("Obstacle Distance: ");
        if (minDistance >= MAX_DISTANCE_CM) {
            Serial.println("Clear (> 2.0 m)");
            digitalWrite(BUZZER_PIN, LOW);
            digitalWrite(MOTOR_LEFT_PIN, LOW);
            digitalWrite(MOTOR_RIGHT_PIN, LOW);
        } else {
            Serial.printf("%.2f m (%.0f cm) | F:%.0f L:%.0f R:%.0f cm\n",
                          distanceMeters, minDistance, g_distFront, g_distLeft, g_distRight);

            // 1d. DIRECTIONAL VIBRATION ASSIST
            digitalWrite(MOTOR_LEFT_PIN,  (g_distLeft  < 50.0f) ? HIGH : LOW);
            digitalWrite(MOTOR_RIGHT_PIN, (g_distRight < 50.0f) ? HIGH : LOW);

            // 1e. PROXIMITY BEEPING (Closer = faster beeps)
            if (minDistance <= 25.0f) {
                digitalWrite(BUZZER_PIN, HIGH); delay(100);
                digitalWrite(BUZZER_PIN, LOW);  delay(30);
            } else if (minDistance <= 60.0f) {
                digitalWrite(BUZZER_PIN, HIGH); delay(50);
                digitalWrite(BUZZER_PIN, LOW);  delay(70);
            } else if (minDistance <= 120.0f) {
                digitalWrite(BUZZER_PIN, HIGH); delay(60);
                digitalWrite(BUZZER_PIN, LOW);  delay(180);
            } else {
                digitalWrite(BUZZER_PIN, HIGH); delay(80);
                digitalWrite(BUZZER_PIN, LOW);  delay(400);
            }
        }
    }

    // =====================================================
    // SECTION 2: GUARDIAN TELEMETRY (Rate-limited, after safety)
    // Only sends data every TELEMETRY_INTERVAL_MS milliseconds.
    // This section NEVER blocks the safety loop for >2s at a time.
    // =====================================================
    TELEMETRY_SECTION:
    if (wifiConnected && (millis() - lastTelemetrySendMs >= TELEMETRY_INTERVAL_MS)) {
        lastTelemetrySendMs = millis();
        sendTelemetry();
    }
}