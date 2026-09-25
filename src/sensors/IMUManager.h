#ifndef ANG_RAKSHA_IMU_MANAGER_H
#define ANG_RAKSHA_IMU_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include "../config/HardwareConfig.h"
#include "../config/Config.h"
#include "../types/SystemTypes.h"

/**
 * @brief High-Integrity IMU Acquisition & Temporal Motion-Event Subsystem
 */
class IMUManager {
public:
    IMUManager();
    bool begin();
    void update(uint32_t currentMillis);
    IMUReading getReading() const;

private:
    Adafruit_MPU6050 _mpu;
    IMUReading _latestReading;
    uint32_t _lastSampleTimeMs;

    // Temporal rolling window buffers
    float _accelMagHistory[IMU_WINDOW_SAMPLE_COUNT];
    float _tiltHistory[IMU_WINDOW_SAMPLE_COUNT];
    uint8_t _historyIdx;
    bool _historyFilled;

    uint32_t _groundHazardTriggerTimeMs;
    bool _groundHazardLatched;

    void processTemporalPatterns(uint32_t currentMillis);
};

#endif // ANG_RAKSHA_IMU_MANAGER_H
