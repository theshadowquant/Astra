#include "IMUManager.h"
#include <math.h>

IMUManager::IMUManager()
    : _lastSampleTimeMs(0),
      _historyIdx(0),
      _historyFilled(false),
      _groundHazardTriggerTimeMs(0),
      _groundHazardLatched(false) {
    _latestReading.accelX = 0.0f;
    _latestReading.accelY = 0.0f;
    _latestReading.accelZ = 1.0f;
    _latestReading.accelMagnitude = 1.0f;
    _latestReading.gyroMagnitudeDegS = 0.0f;
    _latestReading.pitchDeg = 0.0f;
    _latestReading.rollDeg = 0.0f;
    _latestReading.freeFallSustained = false;
    _latestReading.severeTiltSustained = false;
    _latestReading.valid = false;
    _latestReading.timestampMs = 0;

    for (int i = 0; i < IMU_WINDOW_SAMPLE_COUNT; i++) {
        _accelMagHistory[i] = 1.0f;
        _tiltHistory[i] = 0.0f;
    }
}

bool IMUManager::begin() {
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, I2C_FREQUENCY_HZ);
    
    if (!_mpu.begin(MPU6050_I2C_ADDR)) {
        _latestReading.valid = false;
        return false;
    }

    _mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
    _mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    _mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

    _latestReading.valid = true;
    return true;
}

void IMUManager::update(uint32_t currentMillis) {
    if (!_latestReading.valid) {
        // Attempt periodic non-blocking reconnect every 2 seconds
        if (currentMillis - _lastSampleTimeMs >= 2000) {
            _lastSampleTimeMs = currentMillis;
            if (_mpu.begin(MPU6050_I2C_ADDR)) {
                _latestReading.valid = true;
            }
        }
        return;
    }

    // 50 Hz acquisition interval (every 20 ms)
    if (currentMillis - _lastSampleTimeMs < IMU_SAMPLE_INTERVAL_MS) {
        return;
    }
    _lastSampleTimeMs = currentMillis;

    sensors_event_t a, g, temp;
    if (!_mpu.getEvent(&a, &g, &temp)) {
        _latestReading.valid = false;
        return;
    }

    // Convert raw m/s^2 to standard gravity units (1g ≈ 9.80665 m/s^2)
    float ax = a.acceleration.x / 9.80665f;
    float ay = a.acceleration.y / 9.80665f;
    float az = a.acceleration.z / 9.80665f;

    _latestReading.accelX = ax;
    _latestReading.accelY = ay;
    _latestReading.accelZ = az;

    // Vector magnitude: |a| = sqrt(ax^2 + ay^2 + az^2)
    float totalAccel = sqrtf(ax * ax + ay * ay + az * az);
    _latestReading.accelMagnitude = totalAccel;

    // Gyro angular rates in deg/s
    float gx = g.gyro.x * (180.0f / 3.14159265f);
    float gy = g.gyro.y * (180.0f / 3.14159265f);
    float gz = g.gyro.z * (180.0f / 3.14159265f);
    _latestReading.gyroMagnitudeDegS = sqrtf(gx * gx + gy * gy + gz * gz);

    // Tilt angle relative to gravity vector
    float pitch = atan2f(-ax, sqrtf(ay * ay + az * az)) * (180.0f / 3.14159265f);
    float roll = atan2f(ay, az) * (180.0f / 3.14159265f);
    _latestReading.pitchDeg = pitch;
    _latestReading.rollDeg = roll;
    _latestReading.timestampMs = currentMillis;

    // Update temporal sliding history
    _accelMagHistory[_historyIdx] = totalAccel;
    _tiltHistory[_historyIdx] = fmaxf(fabsf(pitch), fabsf(roll));
    _historyIdx = (_historyIdx + 1) % IMU_WINDOW_SAMPLE_COUNT;
    if (_historyIdx == 0) _historyFilled = true;

    processTemporalPatterns(currentMillis);
}

void IMUManager::processTemporalPatterns(uint32_t currentMillis) {
    // 1. Evaluate Sustained Free-Fall (Pothole / Step-Down)
    uint8_t lowGCount = 0;
    for (int i = 0; i < IMU_WINDOW_SAMPLE_COUNT; i++) {
        if (_accelMagHistory[i] < IMU_FREEFALL_ACCEL_G) {
            lowGCount++;
        }
    }

    // Require at least 3 samples of low-g in the 100ms window
    bool freeFallTriggered = (lowGCount >= 3);

    // 2. Evaluate Sustained Severe Tilt
    uint8_t severeTiltCount = 0;
    for (int i = 0; i < IMU_WINDOW_SAMPLE_COUNT; i++) {
        if (_tiltHistory[i] > IMU_TILT_MAX_PITCH_DEG) {
            severeTiltCount++;
        }
    }
    bool severeTiltTriggered = (severeTiltCount >= 4);

    // 3. Ground Hazard Alert Latch
    if (freeFallTriggered || severeTiltTriggered) {
        _groundHazardLatched = true;
        _groundHazardTriggerTimeMs = currentMillis;
    } else if (_groundHazardLatched && (currentMillis - _groundHazardTriggerTimeMs > GROUND_HAZARD_HOLD_MS)) {
        _groundHazardLatched = false;
    }

    _latestReading.freeFallSustained = _groundHazardLatched;
    _latestReading.severeTiltSustained = severeTiltTriggered;
}

IMUReading IMUManager::getReading() const {
    return _latestReading;
}
