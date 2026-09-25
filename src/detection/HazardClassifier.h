#ifndef ANG_RAKSHA_HAZARD_CLASSIFIER_H
#define ANG_RAKSHA_HAZARD_CLASSIFIER_H

#include <Arduino.h>
#include "../config/Config.h"
#include "../types/SystemTypes.h"

/**
 * @brief Classifies Distance Readings into Discrete Zones with Hysteresis & Rapid Approach Detection
 */
class HazardClassifier {
public:
    HazardClassifier();
    
    void classifySnapshot(const DistanceReading& rawLeft,
                          const DistanceReading& rawFront,
                          const DistanceReading& rawRight,
                          const IMUReading& imu,
                          bool sosActive,
                          uint32_t currentMillis,
                          SensorSnapshot& outSnapshot);

    bool isRapidApproachDetected() const { return _rapidApproachDetected; }

private:
    float _prevFilteredLeft;
    float _prevFilteredFront;
    float _prevFilteredRight;

    uint32_t _lastFrontTimestampMs;
    float _lastFrontDistanceCm;
    bool _rapidApproachDetected;

    DistanceBucket classifyBucket(float distCm, DistanceBucket prevBucket, ReadingValidity validity);
    float applyHysteresis(float rawCm, float prevFilteredCm);
};

#endif // ANG_RAKSHA_HAZARD_CLASSIFIER_H
