#include "HazardClassifier.h"
#include <math.h>

HazardClassifier::HazardClassifier()
    : _prevFilteredLeft(250.0f),
      _prevFilteredFront(250.0f),
      _prevFilteredRight(250.0f),
      _lastFrontTimestampMs(0),
      _lastFrontDistanceCm(250.0f),
      _rapidApproachDetected(false) {}

float HazardClassifier::applyHysteresis(float rawCm, float prevFilteredCm) {
    if (fabsf(rawCm - prevFilteredCm) < HYSTERESIS_BAND_CM) {
        return prevFilteredCm;
    }
    return rawCm;
}

DistanceBucket HazardClassifier::classifyBucket(float distCm, DistanceBucket prevBucket, ReadingValidity validity) {
    if (validity == ReadingValidity::DISCONNECTED || validity == ReadingValidity::STALE) {
        return DistanceBucket::INVALID;
    }

    if (validity == ReadingValidity::TIMEOUT) {
        return DistanceBucket::CLEAR;
    }

    // Apply directional threshold hysteresis
    switch (prevBucket) {
        case DistanceBucket::CLEAR:
            if (distCm < THRESHOLD_DANGER_CM) return DistanceBucket::DANGER;
            if (distCm < THRESHOLD_CAUTION_CM) return DistanceBucket::CAUTION;
            return DistanceBucket::CLEAR;

        case DistanceBucket::CAUTION:
            if (distCm < THRESHOLD_DANGER_CM) return DistanceBucket::DANGER;
            if (distCm > (THRESHOLD_CLEAR_CM + HYSTERESIS_BAND_CM)) return DistanceBucket::CLEAR;
            return DistanceBucket::CAUTION;

        case DistanceBucket::DANGER:
            if (distCm > (THRESHOLD_DANGER_CM + HYSTERESIS_BAND_CM)) {
                if (distCm > THRESHOLD_CLEAR_CM) return DistanceBucket::CLEAR;
                return DistanceBucket::CAUTION;
            }
            return DistanceBucket::DANGER;

        default:
            if (distCm < THRESHOLD_DANGER_CM) return DistanceBucket::DANGER;
            if (distCm < THRESHOLD_CAUTION_CM) return DistanceBucket::CAUTION;
            return DistanceBucket::CLEAR;
    }
}

void HazardClassifier::classifySnapshot(const DistanceReading& rawLeft,
                                         const DistanceReading& rawFront,
                                         const DistanceReading& rawRight,
                                         const IMUReading& imu,
                                         bool sosActive,
                                         uint32_t currentMillis,
                                         SensorSnapshot& outSnapshot) {
    // Populate Left
    outSnapshot.left = rawLeft;
    outSnapshot.left.distanceCm = applyHysteresis(rawLeft.distanceCm, _prevFilteredLeft);
    _prevFilteredLeft = outSnapshot.left.distanceCm;
    outSnapshot.left.bucket = classifyBucket(outSnapshot.left.distanceCm, rawLeft.bucket, rawLeft.validity);

    // Populate Front
    outSnapshot.front = rawFront;
    outSnapshot.front.distanceCm = applyHysteresis(rawFront.distanceCm, _prevFilteredFront);
    _prevFilteredFront = outSnapshot.front.distanceCm;
    outSnapshot.front.bucket = classifyBucket(outSnapshot.front.distanceCm, rawFront.bucket, rawFront.validity);

    // Populate Right
    outSnapshot.right = rawRight;
    outSnapshot.right.distanceCm = applyHysteresis(rawRight.distanceCm, _prevFilteredRight);
    _prevFilteredRight = outSnapshot.right.distanceCm;
    outSnapshot.right.bucket = classifyBucket(outSnapshot.right.distanceCm, rawRight.bucket, rawRight.validity);

    // Rapid Approach Detection on Front Channel
    _rapidApproachDetected = false;
    if (rawFront.validity == ReadingValidity::VALID && _lastFrontTimestampMs > 0) {
        uint32_t dtMs = currentMillis - _lastFrontTimestampMs;
        if (dtMs > 10 && dtMs < 200) {
            float deltaDist = _lastFrontDistanceCm - outSnapshot.front.distanceCm;
            float speedCmS = (deltaDist / (float)dtMs) * 1000.0f;
            if (speedCmS > RAPID_APPROACH_SPEED_CM_S && outSnapshot.front.distanceCm < 150.0f) {
                _rapidApproachDetected = true;
            }
        }
    }
    _lastFrontDistanceCm = outSnapshot.front.distanceCm;
    _lastFrontTimestampMs = currentMillis;

    // Populate IMU and SOS
    outSnapshot.imu = imu;
    outSnapshot.sosActive = sosActive;
    outSnapshot.snapshotTimestampMs = currentMillis;
}
