#include "BuzzerController.h"

BuzzerController::BuzzerController()
    : _activePattern(BuzzerPattern::BUZZER_OFF),
      _patternStartTimeMs(0) {}

void BuzzerController::begin() {
    pinMode(PIN_BUZZER, OUTPUT);
    digitalWrite(PIN_BUZZER, LOW);
}

void BuzzerController::setBuzzerHardware(bool active) {
    digitalWrite(PIN_BUZZER, active ? HIGH : LOW);
}

void BuzzerController::setPattern(BuzzerPattern pattern) {
    if (_activePattern != pattern) {
        _activePattern = pattern;
        _patternStartTimeMs = millis();
        if (pattern == BuzzerPattern::BUZZER_OFF) {
            setBuzzerHardware(false);
        }
    }
}

void BuzzerController::update(uint32_t currentMillis) {
    uint32_t elapsed = currentMillis - _patternStartTimeMs;

    switch (_activePattern) {
        case BuzzerPattern::BUZZER_OFF:
            setBuzzerHardware(false);
            break;

        case BuzzerPattern::BUZZER_BOOT_CHIRP: {
            // Short 60ms startup chirp
            if (elapsed < 60) {
                setBuzzerHardware(true);
            } else {
                setBuzzerHardware(false);
                _activePattern = BuzzerPattern::BUZZER_OFF;
            }
            break;
        }

        case BuzzerPattern::BUZZER_STOP_TONE: {
            // Single 200ms stop tone
            if (elapsed < HAPTIC_STOP_TONE_MS) {
                setBuzzerHardware(true);
            } else {
                setBuzzerHardware(false);
            }
            break;
        }

        case BuzzerPattern::BUZZER_GROUND_ALERT: {
            // Dual 50ms beeps
            uint32_t t = elapsed % 400;
            bool chirp = (t < 50) || (t >= 100 && t < 150);
            setBuzzerHardware(chirp);
            break;
        }

        case BuzzerPattern::BUZZER_SOS_ALARM: {
            // Continuous loud emergency warble (150ms ON / 50ms OFF)
            uint32_t t = elapsed % 200;
            setBuzzerHardware(t < 150);
            break;
        }

        case BuzzerPattern::BUZZER_FAULT_BEEP: {
            // Intermittent warning beep
            uint32_t t = elapsed % 1500;
            setBuzzerHardware(t < 80);
            break;
        }
    }
}
