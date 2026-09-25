#include <Arduino.h>
#include <Wire.h>

#include "config/HardwareConfig.h"
#include "config/Config.h"
#include "types/SystemTypes.h"

#include "sensors/SensorManager.h"
#include "sensors/IMUManager.h"
#include "detection/HazardClassifier.h"
#include "detection/RiskEngine.h"
#include "navigation/SafeDirectionEngine.h"
#include "haptics/HapticController.h"
#include "audio/BuzzerController.h"
#include "safety/SOSManager.h"
#include "diagnostics/Telemetry.h"
#include "network/WebDashboard.h"

// Subsystem Instances
static SensorManager       g_sensorManager;
static IMUManager          g_imuManager;
static HazardClassifier    g_hazardClassifier;
static RiskEngine          g_riskEngine;
static SafeDirectionEngine g_safeDirectionEngine;
static HapticController    g_hapticController;
static BuzzerController    g_buzzerController;
static SOSManager          g_sosManager;
static Telemetry           g_telemetry;
static WebDashboard        g_webDashboard;

// Pipeline State
static SensorSnapshot      g_snapshot;
static RiskLevel           g_riskLevel       = RiskLevel::SAFE;
static Direction           g_safeDirection   = Direction::NONE;
static SystemState         g_systemState     = SystemState::STARTUP;
static HapticPattern       g_hapticPattern   = HapticPattern::PATTERN_OFF;
static BuzzerPattern       g_buzzerPattern   = BuzzerPattern::BUZZER_OFF;

void setup() {
    // 1. Diagnostics & Serial Monitor
    g_telemetry.begin();
    Serial.println();
    Serial.println(F("=================================================="));
    Serial.println(F("   AngRaksha Embedded Firmware v1.0.0            "));
    Serial.println(F("   Team Astra — NIRMAAN 2026                      "));
    Serial.println(F("   Track: Smart Mobility & Aerospace             "));
    Serial.println(F("=================================================="));

    // Status LED
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, HIGH);

    // 2. Actuators
    g_hapticController.begin();
    g_buzzerController.begin();
    g_buzzerController.setPattern(BuzzerPattern::BUZZER_BOOT_CHIRP);

    // 3. Inputs & Safety
    g_sosManager.begin();

    // 4. Sensors
    g_sensorManager.begin();
    bool imuOk = g_imuManager.begin();
    if (imuOk) {
        Serial.println(F("[INIT] MPU-6050 IMU Online (400 kHz Fast-Mode)."));
    } else {
        Serial.println(F("[WARN] MPU-6050 Offline! Running spatial guidance in Degraded Mode."));
    }

    // 5. Guardian Web Dashboard & Local SoftAP
    g_webDashboard.begin();

    g_systemState = SystemState::NORMAL;
    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println(F("[INIT] Non-Blocking Pipeline Initialized Successfully."));
}

void loop() {
    uint32_t nowUs = micros();
    uint32_t nowMs = millis();

    // -------------------------------------------------------------
    // STAGE 1: SENSE (Non-Blocking Hardware Acquisition)
    // -------------------------------------------------------------
    g_sosManager.update(nowMs);
    g_sensorManager.update(nowMs, nowUs);
    g_imuManager.update(nowMs);

    DistanceReading rawLeft  = g_sensorManager.getLeftReading();
    DistanceReading rawFront = g_sensorManager.getFrontReading();
    DistanceReading rawRight = g_sensorManager.getRightReading();
    IMUReading imuData       = g_imuManager.getReading();
    bool sosPressed          = g_sosManager.isTriggered();

    // -------------------------------------------------------------
    // STAGE 2: CLASSIFY (Zone Hysteresis & Rapid Approach)
    // -------------------------------------------------------------
    g_hazardClassifier.classifySnapshot(rawLeft, rawFront, rawRight,
                                        imuData, sosPressed,
                                        nowMs, g_snapshot);
    bool rapidApproach = g_hazardClassifier.isRapidApproachDetected();

    // -------------------------------------------------------------
    // STAGE 3: ASSESS RISK (Multi-Factor Severity Scoring)
    // -------------------------------------------------------------
    g_riskLevel = g_riskEngine.evaluateRisk(g_snapshot, rapidApproach, g_systemState);

    // -------------------------------------------------------------
    // STAGE 4: FIND SAFE DIRECTION (Explainable Clearance Scoring)
    // -------------------------------------------------------------
    g_safeDirection = g_safeDirectionEngine.determineDirection(g_snapshot, g_riskLevel, g_systemState);

    // -------------------------------------------------------------
    // STAGE 5: GUIDE & PROTECT (Strict Priority Actuator Matrix)
    // -------------------------------------------------------------
    // Priority 0: SOS Emergency Trigger
    if (g_systemState == SystemState::SOS) {
        g_hapticPattern = HapticPattern::PATTERN_SOS_EMERGENCY;
        g_buzzerPattern = BuzzerPattern::BUZZER_SOS_ALARM;
    }
    // Priority 1: Ground Hazard / Drop / Severe Tilt (IMU)
    else if (g_systemState == SystemState::GROUND_HAZARD) {
        g_hapticPattern = HapticPattern::PATTERN_GROUND_HAZARD;
        g_buzzerPattern = BuzzerPattern::BUZZER_GROUND_ALERT;
    }
    // Priority 2: Critical Impasse / Stop / Imminent Collision
    else if (g_systemState == SystemState::STOP || g_systemState == SystemState::CRITICAL || g_safeDirection == Direction::STOP) {
        g_hapticPattern = HapticPattern::PATTERN_CRITICAL_STOP;
        g_buzzerPattern = BuzzerPattern::BUZZER_STOP_TONE;
    }
    // Priority 3: Guide Left (Front blocked, left open)
    else if (g_safeDirection == Direction::LEFT) {
        g_hapticPattern = HapticPattern::PATTERN_GUIDE_LEFT;
        g_buzzerPattern = BuzzerPattern::BUZZER_OFF;
    }
    // Priority 4: Guide Right (Front blocked, right open)
    else if (g_safeDirection == Direction::RIGHT) {
        g_hapticPattern = HapticPattern::PATTERN_GUIDE_RIGHT;
        g_buzzerPattern = BuzzerPattern::BUZZER_OFF;
    }
    // Priority 5: Sensor Fault
    else if (g_systemState == SystemState::SENSOR_FAULT) {
        g_hapticPattern = HapticPattern::PATTERN_SENSOR_FAULT;
        g_buzzerPattern = BuzzerPattern::BUZZER_FAULT_BEEP;
    }
    // Priority 6: Path Clear / Forward (Idle - No Sensory Fatigue)
    else {
        g_hapticPattern = HapticPattern::PATTERN_OFF;
        g_buzzerPattern = BuzzerPattern::BUZZER_OFF;
    }

    // Dispatch to Actuators
    g_hapticController.setPattern(g_hapticPattern);
    g_buzzerController.setPattern(g_buzzerPattern);

    g_hapticController.update(nowMs);
    g_buzzerController.update(nowMs);

    // -------------------------------------------------------------
    // STAGE 6: GUARDIAN WEB DASHBOARD & DIAGNOSTICS
    // -------------------------------------------------------------
    g_webDashboard.update(nowMs, g_snapshot, g_riskLevel, g_safeDirection, g_systemState, g_hapticPattern);

    uint32_t loopLatencyUs = micros() - nowUs;
    g_telemetry.stream(nowMs, g_snapshot, g_riskLevel, g_safeDirection,
                       g_systemState, g_hapticPattern,
                       loopLatencyUs, g_sensorManager.getLastCycleDurationUs());

    // Visual Heartbeat
    digitalWrite(PIN_STATUS_LED, (nowMs % 1000 < 50) ? HIGH : LOW);
}
