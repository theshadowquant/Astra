#include "DistanceSensor.h"

DistanceSensor::DistanceSensor(uint8_t trigPin, uint8_t echoPin, SensorZone zone)
    : _trigPin(trigPin),
      _echoPin(echoPin),
      _zone(zone),
      _echoStartUs(0),
      _triggerTimestampUs(0),
      _waitingForEcho(false),
      _echoRisingCaptured(false),
      _medianFilter(250.0f) {
    _latestReading.distanceCm = 250.0f;
    _latestReading.rawDistanceCm = 250.0f;
    _latestReading.validity = ReadingValidity::TIMEOUT;
    _latestReading.isFresh = false;
    _latestReading.timestampMs = 0;
    _latestReading.confidence = 1.0f;
    _latestReading.bucket = DistanceBucket::CLEAR;
}

void DistanceSensor::begin() {
    pinMode(_trigPin, OUTPUT);
    pinMode(_echoPin, INPUT);
    digitalWrite(_trigPin, LOW);
}

void DistanceSensor::trigger() {
    digitalWrite(_trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(_trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(_trigPin, LOW);

    _triggerTimestampUs = micros();
    _echoStartUs = 0;
    _waitingForEcho = true;
    _echoRisingCaptured = false;
    _latestReading.isFresh = false;
}

bool DistanceSensor::processEcho(uint32_t currentMicros) {
    if (!_waitingForEcho) {
        return true;
    }

    // Check bounded timeout
    if (currentMicros - _triggerTimestampUs > HCSR04_TIMEOUT_US) {
        forceTimeout();
        return true;
    }

    int pinLevel = digitalRead(_echoPin);

    // Rising Edge: Echo pulse begins
    if (pinLevel == HIGH && !_echoRisingCaptured) {
        _echoStartUs = currentMicros;
        _echoRisingCaptured = true;
    }
    // Falling Edge: Echo pulse returns
    else if (pinLevel == LOW && _echoRisingCaptured) {
        uint32_t echoDurationUs = currentMicros - _echoStartUs;
        float rawCm = ((float)echoDurationUs * 0.0343f) / 2.0f;

        _latestReading.rawDistanceCm = rawCm;
        _latestReading.timestampMs = millis();
        _latestReading.isFresh = true;

        if (rawCm < DISTANCE_MIN_VALID_CM) {
            _latestReading.validity = ReadingValidity::OUT_OF_BOUNDS;
            _latestReading.distanceCm = DISTANCE_MIN_VALID_CM;
            _latestReading.confidence = 0.3f;
        } else if (rawCm > HCSR04_MAX_RANGE_CM) {
            _latestReading.validity = ReadingValidity::TIMEOUT;
            _latestReading.distanceCm = HCSR04_MAX_RANGE_CM;
            _latestReading.confidence = 0.9f;
        } else {
            _latestReading.validity = ReadingValidity::VALID;
            _latestReading.distanceCm = _medianFilter.filter(rawCm);
            _latestReading.confidence = 1.0f;
        }

        _waitingForEcho = false;
        return true;
    }

    return false;
}

void DistanceSensor::forceTimeout() {
    _latestReading.rawDistanceCm = HCSR04_MAX_RANGE_CM;
    _latestReading.distanceCm = HCSR04_MAX_RANGE_CM;
    _latestReading.validity = ReadingValidity::TIMEOUT;
    _latestReading.isFresh = true;
    _latestReading.timestampMs = millis();
    _latestReading.confidence = 0.9f;
    _waitingForEcho = false;
}

DistanceReading DistanceSensor::getReading() const {
    return _latestReading;
}
