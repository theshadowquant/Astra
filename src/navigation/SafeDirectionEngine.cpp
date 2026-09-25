#include "SafeDirectionEngine.h"

SafeDirectionEngine::SafeDirectionEngine()
    : _currentDirection(Direction::NONE),
      _lastScoreLeft(0.0f),
      _lastScoreRight(0.0f),
      _lastScoreForward(0.0f) {}

float SafeDirectionEngine::computeZoneScore(const DistanceReading& reading, bool isCurrentChoice) {
    if (reading.validity == ReadingValidity::DISCONNECTED || reading.validity == ReadingValidity::STALE) {
        return -200.0f; // Invalid channel cannot be navigated
    }

    float score = reading.distanceCm * CLEARANCE_WEIGHT;

    // Apply penalties based on classified bucket
    if (reading.bucket == DistanceBucket::DANGER) {
        score -= PENALTY_DANGER_ZONE;
    } else if (reading.bucket == DistanceBucket::CAUTION) {
        score -= PENALTY_CAUTION_ZONE;
    }

    // Apply stability bonus to currently active recommendation
    if (isCurrentChoice) {
        score += STABILITY_BIAS_BONUS;
    }

    return score;
}

Direction SafeDirectionEngine::determineDirection(const SensorSnapshot& snapshot,
                                                  RiskLevel globalRisk,
                                                  SystemState systemState) {
    // 1. Unconditional Halt Conditions
    if (systemState == SystemState::SOS ||
        systemState == SystemState::STOP ||
        systemState == SystemState::SENSOR_FAULT ||
        globalRisk == RiskLevel::CRITICAL) {
        _currentDirection = Direction::STOP;
        return Direction::STOP;
    }

    // 2. Unobstructed Path Ahead (Nominal Forward)
    if (snapshot.front.bucket == DistanceBucket::CLEAR &&
        snapshot.left.bucket != DistanceBucket::DANGER &&
        snapshot.right.bucket != DistanceBucket::DANGER) {
        _currentDirection = Direction::NONE;
        return Direction::NONE;
    }

    // 3. Score Candidate Vectors
    _lastScoreLeft = computeZoneScore(snapshot.left, (_currentDirection == Direction::LEFT));
    _lastScoreRight = computeZoneScore(snapshot.right, (_currentDirection == Direction::RIGHT));
    _lastScoreForward = computeZoneScore(snapshot.front, (_currentDirection == Direction::FORWARD || _currentDirection == Direction::NONE));

    // Both lateral sides unsafe
    bool leftNavigable = (snapshot.left.distanceCm >= THRESHOLD_DANGER_CM &&
                          snapshot.left.validity != ReadingValidity::DISCONNECTED &&
                          snapshot.left.validity != ReadingValidity::STALE);
    bool rightNavigable = (snapshot.right.distanceCm >= THRESHOLD_DANGER_CM &&
                           snapshot.right.validity != ReadingValidity::DISCONNECTED &&
                           snapshot.right.validity != ReadingValidity::STALE);

    if (!leftNavigable && !rightNavigable && snapshot.front.bucket == DistanceBucket::DANGER) {
        _currentDirection = Direction::STOP;
        return Direction::STOP;
    }

    // 4. Lateral Detour Selection with Switching Margin
    if (leftNavigable && !rightNavigable) {
        _currentDirection = Direction::LEFT;
        return Direction::LEFT;
    }
    
    if (rightNavigable && !leftNavigable) {
        _currentDirection = Direction::RIGHT;
        return Direction::RIGHT;
    }

    // Both sides are navigable: compare scored clearance
    if (leftNavigable && rightNavigable) {
        if (_lastScoreLeft > (_lastScoreRight + SWITCHING_MARGIN_CM)) {
            _currentDirection = Direction::LEFT;
            return Direction::LEFT;
        } else if (_lastScoreRight > (_lastScoreLeft + SWITCHING_MARGIN_CM)) {
            _currentDirection = Direction::RIGHT;
            return Direction::RIGHT;
        } else {
            // Within switching deadband: retain current direction to prevent jitter
            if (_currentDirection == Direction::LEFT) return Direction::LEFT;
            if (_currentDirection == Direction::RIGHT) return Direction::RIGHT;

            // Deterministic default tie-breaker: prefer the side with numerically greater raw distance
            _currentDirection = (snapshot.left.distanceCm >= snapshot.right.distanceCm) ? Direction::LEFT : Direction::RIGHT;
            return _currentDirection;
        }
    }

    _currentDirection = Direction::STOP;
    return Direction::STOP;
}
