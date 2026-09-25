#ifndef ANG_RAKSHA_SAFE_DIRECTION_ENGINE_H
#define ANG_RAKSHA_SAFE_DIRECTION_ENGINE_H

#include <Arduino.h>
#include "../config/Config.h"
#include "../types/SystemTypes.h"

/**
 * @brief Computes Explainable Clearance Scores and Determines Optimal Navigation Vectors
 */
class SafeDirectionEngine {
public:
    SafeDirectionEngine();

    Direction determineDirection(const SensorSnapshot& snapshot,
                                 RiskLevel globalRisk,
                                 SystemState systemState);

    Direction getCurrentDirection() const { return _currentDirection; }
    float getLeftScore() const { return _lastScoreLeft; }
    float getRightScore() const { return _lastScoreRight; }
    float getForwardScore() const { return _lastScoreForward; }

private:
    Direction _currentDirection;
    float _lastScoreLeft;
    float _lastScoreRight;
    float _lastScoreForward;

    float computeZoneScore(const DistanceReading& reading, bool isCurrentChoice);
};

#endif // ANG_RAKSHA_SAFE_DIRECTION_ENGINE_H
