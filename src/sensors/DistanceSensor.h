#ifndef ANG_RAKSHA_DISTANCE_SENSOR_H
#define ANG_RAKSHA_DISTANCE_SENSOR_H

#include <Arduino.h>
#include "../config/HardwareConfig.h"
#include "../config/Config.h"
#include "../types/SystemTypes.h"
#include "../utils/MedianFilter.h"

/**
 * @brief Non-Blocking Hardware Driver for a Single HC-SR04 Ultrasonic Sensor
 */
class DistanceSensor {
public:
    DistanceSensor(uint8_t trigPin, uint8_t echoPin, SensorZone zone);
    void begin();
    
    // Non-blocking state-machine methods
    void trigger();
    bool processEcho(uint32_t currentMicros);
    void forceTimeout();

    // Query methods
    DistanceReading getReading() const;
    bool isWaitingForEcho() const { return _waitingForEcho; }
    SensorZone getZone() const { return _zone; }

private:
    uint8_t _trigPin;
    uint8_t _echoPin;
    SensorZone _zone;

    uint32_t _echoStartUs;
    uint32_t _triggerTimestampUs;
    bool _waitingForEcho;
    bool _echoRisingCaptured;

    DistanceReading _latestReading;
    MedianFilter3 _medianFilter;
};

#endif // ANG_RAKSHA_DISTANCE_SENSOR_H
