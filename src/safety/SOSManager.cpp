#include "SOSManager.h"

volatile bool SOSManager::_isrFlag = false;
volatile uint32_t SOSManager::_lastIsrMicros = 0;

SOSManager::SOSManager()
    : _sosActive(false),
      _lastDebounceMs(0) {}

void IRAM_ATTR SOSManager::isrHandler() {
    uint32_t nowUs = micros();
    // 50ms software debounce inside ISR
    if (nowUs - _lastIsrMicros > (SOS_DEBOUNCE_MS * 1000)) {
        _isrFlag = true;
        _lastIsrMicros = nowUs;
    }
}

void SOSManager::begin() {
    pinMode(PIN_SOS_BUTTON, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(PIN_SOS_BUTTON), isrHandler, FALLING);
}

void SOSManager::update(uint32_t currentMillis) {
    // Check interrupt flag
    if (_isrFlag) {
        _isrFlag = false;
        _sosActive = true;
        _lastDebounceMs = currentMillis;
    }

    // Secondary active-LOW polling check
    if (digitalRead(PIN_SOS_BUTTON) == LOW) {
        if (currentMillis - _lastDebounceMs > SOS_DEBOUNCE_MS) {
            _sosActive = true;
        }
    } else {
        _sosActive = false;
        _lastDebounceMs = currentMillis;
    }
}
