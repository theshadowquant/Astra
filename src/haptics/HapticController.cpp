#include "HapticController.h"

HapticController::HapticController()
    : _activePattern(HapticPattern::PATTERN_OFF),
      _patternStartTimeMs(0) {}

void HapticController::begin() {
#if HAPTIC_USE_DIGITAL_IO
    pinMode(PIN_MOTOR_LEFT, OUTPUT);
    pinMode(PIN_MOTOR_CENTER, OUTPUT);
    pinMode(PIN_MOTOR_RIGHT, OUTPUT);
    digitalWrite(PIN_MOTOR_LEFT, LOW);
    digitalWrite(PIN_MOTOR_CENTER, LOW);
    digitalWrite(PIN_MOTOR_RIGHT, LOW);
#else
    ledcSetup(LEDC_CHANNEL_LEFT, HAPTIC_PWM_FREQ_HZ, HAPTIC_PWM_RESOLUTION);
    ledcAttachPin(PIN_MOTOR_LEFT, LEDC_CHANNEL_LEFT);

    ledcSetup(LEDC_CHANNEL_CENTER, HAPTIC_PWM_FREQ_HZ, HAPTIC_PWM_RESOLUTION);
    ledcAttachPin(PIN_MOTOR_CENTER, LEDC_CHANNEL_CENTER);

    ledcSetup(LEDC_CHANNEL_RIGHT, HAPTIC_PWM_FREQ_HZ, HAPTIC_PWM_RESOLUTION);
    ledcAttachPin(PIN_MOTOR_RIGHT, LEDC_CHANNEL_RIGHT);
#endif
    applyOutputs(false, false, false);
}

void HapticController::writeMotor(uint8_t pin, uint8_t channel, bool on) {
#if HAPTIC_USE_DIGITAL_IO
    digitalWrite(pin, on ? HIGH : LOW);
#else
    ledcWrite(channel, on ? HAPTIC_INTENSITY_MAX : HAPTIC_INTENSITY_OFF);
#endif
}

void HapticController::applyOutputs(bool leftOn, bool centerOn, bool rightOn) {
    writeMotor(PIN_MOTOR_LEFT, LEDC_CHANNEL_LEFT, leftOn);
    writeMotor(PIN_MOTOR_CENTER, LEDC_CHANNEL_CENTER, centerOn);
    writeMotor(PIN_MOTOR_RIGHT, LEDC_CHANNEL_RIGHT, rightOn);
}

void HapticController::setPattern(HapticPattern pattern) {
    if (_activePattern != pattern) {
        _activePattern = pattern;
        _patternStartTimeMs = millis();
        if (pattern == HapticPattern::PATTERN_OFF) {
            applyOutputs(false, false, false);
        }
    }
}

void HapticController::update(uint32_t currentMillis) {
    uint32_t elapsed = currentMillis - _patternStartTimeMs;

    switch (_activePattern) {
        case HapticPattern::PATTERN_OFF:
            applyOutputs(false, false, false);
            break;

        case HapticPattern::PATTERN_GUIDE_LEFT: {
            uint32_t cycleTime = elapsed % (HAPTIC_PULSE_ON_MS + HAPTIC_PULSE_OFF_MS);
            bool leftState = (cycleTime < HAPTIC_PULSE_ON_MS);
            applyOutputs(leftState, false, false);
            break;
        }

        case HapticPattern::PATTERN_GUIDE_RIGHT: {
            uint32_t cycleTime = elapsed % (HAPTIC_PULSE_ON_MS + HAPTIC_PULSE_OFF_MS);
            bool rightState = (cycleTime < HAPTIC_PULSE_ON_MS);
            applyOutputs(false, false, rightState);
            break;
        }

        case HapticPattern::PATTERN_FORWARD_CLEAR: {
            // Single brief confirmation pulse
            bool centerState = (elapsed < 80);
            applyOutputs(false, centerState, false);
            break;
        }

        case HapticPattern::PATTERN_WARNING_PULSE: {
            // Fast pulse on center motor
            uint32_t cycleTime = elapsed % (HAPTIC_FAST_PULSE_ON_MS + HAPTIC_FAST_PULSE_OFF_MS);
            bool centerState = (cycleTime < HAPTIC_FAST_PULSE_ON_MS);
            applyOutputs(false, centerState, false);
            break;
        }

        case HapticPattern::PATTERN_CRITICAL_STOP:
            // Continuous vibration across center (or both lateral)
            applyOutputs(true, true, true);
            break;

        case HapticPattern::PATTERN_GROUND_HAZARD: {
            // Distinct Short-Short-Long pattern on Center Motor
            uint32_t t = elapsed % HAPTIC_GROUND_CYCLE_MS;
            bool centerOn = false;

            uint32_t p1End = HAPTIC_GROUND_P1_ON_MS;
            uint32_t g1End = p1End + HAPTIC_GROUND_G1_OFF_MS;
            uint32_t p2End = g1End + HAPTIC_GROUND_P2_ON_MS;
            uint32_t g2End = p2End + HAPTIC_GROUND_G2_OFF_MS;
            uint32_t p3End = g2End + HAPTIC_GROUND_P3_ON_MS;

            if (t < p1End) {
                centerOn = true;
            } else if (t >= g1End && t < p2End) {
                centerOn = true;
            } else if (t >= g2End && t < p3End) {
                centerOn = true;
            }

            applyOutputs(false, centerOn, false);
            break;
        }

        case HapticPattern::PATTERN_SOS_EMERGENCY: {
            // High-intensity rapid burst across all 3 motors
            uint32_t cycleTime = elapsed % 300;
            bool burstOn = (cycleTime < 200);
            applyOutputs(burstOn, burstOn, burstOn);
            break;
        }

        case HapticPattern::PATTERN_SENSOR_FAULT: {
            // Slow periodic tick
            uint32_t cycleTime = elapsed % 1000;
            bool faultTick = (cycleTime < 50);
            applyOutputs(faultTick, false, faultTick);
            break;
        }
    }
}
