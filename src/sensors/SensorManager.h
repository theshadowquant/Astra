#ifndef ANG_RAKSHA_SENSOR_MANAGER_H
#define ANG_RAKSHA_SENSOR_MANAGER_H

#include <Arduino.h>
#include "DistanceSensor.h"
#include "../config/HardwareConfig.h"
#include "../config/Config.h"
#include "../types/SystemTypes.h"

/**
 * @brief State Machine for Sequential Staggered Ultrasonic Acquisition
 */
enum class PingState : uint8_t {
    IDLE = 0,
    TRIGGER_SENSOR = 1,
    AWAITING_ECHO = 2,
    GUARD_INTERVAL = 3
};

/**
 * @brief Orchestrates Multi-Sensor Sequencing to prevent Acoustic Crosstalk
 */
class SensorManager {
public:
    SensorManager();
    void begin();
    void update(uint32_t currentMillis, uint32_t currentMicros);

    DistanceReading getLeftReading() const;
    DistanceReading getFrontReading() const;
    DistanceReading getRightReading() const;

    bool isCycleComplete() const { return _cycleJustCompleted; }
    uint32_t getLastCycleDurationUs() const { return _lastCycleDurationUs; }

private:
    DistanceSensor _sensorLeft;
    DistanceSensor _sensorFront;
    DistanceSensor _sensorRight;

    uint8_t _activeSensorIdx;
    PingState _pingState;

    uint32_t _stateTimestampMs;
    uint32_t _cycleStartMicros;
    uint32_t _lastCycleDurationUs;
    bool _cycleJustCompleted;

    DistanceSensor* getActiveSensor();
    void advanceToNextSensor();
};

#endif // ANG_RAKSHA_SENSOR_MANAGER_H
