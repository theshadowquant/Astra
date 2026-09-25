#include "Telemetry.h"

Telemetry::Telemetry() : _lastStreamMs(0) {}

void Telemetry::begin() {
    Serial.begin(SERIAL_BAUD_RATE);
}

const char* Telemetry::riskToStr(RiskLevel risk) {
    switch (risk) {
        case RiskLevel::SAFE: return "SAFE";
        case RiskLevel::CAUTION: return "CAUTION";
        case RiskLevel::WARNING: return "WARNING";
        case RiskLevel::CRITICAL: return "CRITICAL";
        default: return "UNKNOWN";
    }
}

const char* Telemetry::directionToStr(Direction dir) {
    switch (dir) {
        case Direction::NONE: return "FORWARD";
        case Direction::FORWARD: return "FORWARD";
        case Direction::LEFT: return "GUIDE_LEFT";
        case Direction::RIGHT: return "GUIDE_RIGHT";
        case Direction::STOP: return "HALT_STOP";
        default: return "UNKNOWN";
    }
}

const char* Telemetry::stateToStr(SystemState st) {
    switch (st) {
        case SystemState::STARTUP: return "STARTUP";
        case SystemState::NORMAL: return "NORMAL";
        case SystemState::CAUTION: return "CAUTION";
        case SystemState::WARNING: return "WARNING";
        case SystemState::CRITICAL: return "CRITICAL";
        case SystemState::GROUND_HAZARD: return "GROUND_HAZARD";
        case SystemState::STOP: return "STOP";
        case SystemState::SOS: return "SOS_EMERGENCY";
        case SystemState::SENSOR_FAULT: return "SENSOR_FAULT";
        case SystemState::DEGRADED: return "DEGRADED";
        default: return "UNKNOWN";
    }
}

const char* Telemetry::hapticToStr(HapticPattern pat) {
    switch (pat) {
        case HapticPattern::PATTERN_OFF: return "OFF";
        case HapticPattern::PATTERN_GUIDE_LEFT: return "PULSE_LEFT";
        case HapticPattern::PATTERN_GUIDE_RIGHT: return "PULSE_RIGHT";
        case HapticPattern::PATTERN_FORWARD_CLEAR: return "PING_CENTER";
        case HapticPattern::PATTERN_WARNING_PULSE: return "WARN_PULSE";
        case HapticPattern::PATTERN_CRITICAL_STOP: return "CONTINUOUS_STOP";
        case HapticPattern::PATTERN_GROUND_HAZARD: return "SHORT_SHORT_LONG";
        case HapticPattern::PATTERN_SOS_EMERGENCY: return "SOS_BURST";
        case HapticPattern::PATTERN_SENSOR_FAULT: return "FAULT_TICK";
        default: return "OFF";
    }
}

void Telemetry::stream(uint32_t currentMillis,
                        const SensorSnapshot& snapshot,
                        RiskLevel risk,
                        Direction direction,
                        SystemState state,
                        HapticPattern haptic,
                        uint32_t controlLatencyUs,
                        uint32_t measuredScanDurationUs) {
    if (currentMillis - _lastStreamMs < TELEMETRY_INTERVAL_MS) {
        return;
    }
    _lastStreamMs = currentMillis;

    Serial.print(F("["));
    Serial.print(currentMillis);
    Serial.print(F("ms] L:"));
    if (snapshot.left.validity == ReadingValidity::VALID) {
        Serial.print(snapshot.left.distanceCm, 0);
        Serial.print(F("cm"));
    } else {
        Serial.print(F("TIMEOUT"));
    }

    Serial.print(F(" | F:"));
    if (snapshot.front.validity == ReadingValidity::VALID) {
        Serial.print(snapshot.front.distanceCm, 0);
        Serial.print(F("cm"));
    } else {
        Serial.print(F("TIMEOUT"));
    }

    Serial.print(F(" | R:"));
    if (snapshot.right.validity == ReadingValidity::VALID) {
        Serial.print(snapshot.right.distanceCm, 0);
        Serial.print(F("cm"));
    } else {
        Serial.print(F("TIMEOUT"));
    }

    Serial.print(F(" | IMU:"));
    Serial.print(snapshot.imu.valid ? (snapshot.imu.freeFallSustained ? "DROP!" : "OK") : "FAULT");

    Serial.print(F(" | RISK:"));
    Serial.print(riskToStr(risk));

    Serial.print(F(" | DIR:"));
    Serial.print(directionToStr(direction));

    Serial.print(F(" | STATE:"));
    Serial.print(stateToStr(state));

    Serial.print(F(" | HAPTIC:"));
    Serial.print(hapticToStr(haptic));

    Serial.print(F(" | CTRL:"));
    Serial.print((float)controlLatencyUs / 1000.0f, 2);
    Serial.print(F("ms"));

    Serial.print(F(" | SCAN:"));
    Serial.print((float)measuredScanDurationUs / 1000.0f, 1);
    Serial.print(F("ms"));

    Serial.print(F(" | BOUND:"));
    // 3 sensors * (timeout_us + guard_ms * 1000) / 1000
    float boundMs = (float)(NUM_DISTANCE_SENSORS * (HCSR04_TIMEOUT_US + HCSR04_GUARD_TIME_MS * 1000)) / 1000.0f;
    Serial.print(boundMs, 1);
    Serial.println(F("ms"));
}
