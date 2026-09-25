#include "SensorManager.h"

SensorManager::SensorManager()
    : _sensorLeft(PIN_LEFT_TRIG, PIN_LEFT_ECHO, SensorZone::LEFT),
      _sensorFront(PIN_FRONT_TRIG, PIN_FRONT_ECHO, SensorZone::FRONT),
      _sensorRight(PIN_RIGHT_TRIG, PIN_RIGHT_ECHO, SensorZone::RIGHT),
      _activeSensorIdx(0),
      _pingState(PingState::IDLE),
      _stateTimestampMs(0),
      _cycleStartMicros(0),
      _lastCycleDurationUs(0),
      _cycleJustCompleted(false) {}

void SensorManager::begin() {
    _sensorLeft.begin();
    _sensorFront.begin();
    _sensorRight.begin();
    _activeSensorIdx = 0;
    _pingState = PingState::TRIGGER_SENSOR;
    _cycleStartMicros = micros();
}

DistanceSensor* SensorManager::getActiveSensor() {
    switch (_activeSensorIdx) {
        case 0: return &_sensorLeft;
        case 1: return &_sensorFront;
        case 2: return &_sensorRight;
        default: return &_sensorFront;
    }
}

void SensorManager::update(uint32_t currentMillis, uint32_t currentMicros) {
    _cycleJustCompleted = false;
    DistanceSensor* currentSensor = getActiveSensor();

    switch (_pingState) {
        case PingState::IDLE:
            _pingState = PingState::TRIGGER_SENSOR;
            break;

        case PingState::TRIGGER_SENSOR:
            currentSensor->trigger();
            _pingState = PingState::AWAITING_ECHO;
            break;

        case PingState::AWAITING_ECHO: {
            bool echoDone = currentSensor->processEcho(currentMicros);
            if (echoDone) {
                _pingState = PingState::GUARD_INTERVAL;
                _stateTimestampMs = currentMillis;
            }
            break;
        }

        case PingState::GUARD_INTERVAL:
            // Enforce inter-sensor acoustic dissipation guard time
            if (currentMillis - _stateTimestampMs >= HCSR04_GUARD_TIME_MS) {
                advanceToNextSensor();
            }
            break;
    }
}

void SensorManager::advanceToNextSensor() {
    _activeSensorIdx++;
    if (_activeSensorIdx >= NUM_DISTANCE_SENSORS) {
        _activeSensorIdx = 0;
        uint32_t nowUs = micros();
        _lastCycleDurationUs = nowUs - _cycleStartMicros;
        _cycleStartMicros = nowUs;
        _cycleJustCompleted = true;
    }
    _pingState = PingState::TRIGGER_SENSOR;
}

DistanceReading SensorManager::getLeftReading() const {
    return _sensorLeft.getReading();
}

DistanceReading SensorManager::getFrontReading() const {
    return _sensorFront.getReading();
}

DistanceReading SensorManager::getRightReading() const {
    return _sensorRight.getReading();
}
