#include "RiskEngine.h"

RiskEngine::RiskEngine() : _isDegraded(false) {}

RiskLevel RiskEngine::evaluateRisk(const SensorSnapshot& snapshot,
                                   bool rapidApproach,
                                   SystemState& outState) {
    // 1. Priority 0: SOS Emergency
    if (snapshot.sosActive) {
        outState = SystemState::SOS;
        return RiskLevel::CRITICAL;
    }

    // 2. Hardware Integrity & Degraded Mode Assessment
    bool leftFailed  = (snapshot.left.validity == ReadingValidity::DISCONNECTED || snapshot.left.validity == ReadingValidity::STALE);
    bool frontFailed = (snapshot.front.validity == ReadingValidity::DISCONNECTED || snapshot.front.validity == ReadingValidity::STALE);
    bool rightFailed = (snapshot.right.validity == ReadingValidity::DISCONNECTED || snapshot.right.validity == ReadingValidity::STALE);

    // Total distance sensor failure
    if (leftFailed && frontFailed && rightFailed) {
        outState = SystemState::SENSOR_FAULT;
        return RiskLevel::CRITICAL;
    }

    // Single or partial sensor failure
    _isDegraded = (leftFailed || frontFailed || rightFailed || !snapshot.imu.valid);

    // If front sensor fails, we cannot verify clearance ahead -> Conservative WARNING/STOP
    if (frontFailed) {
        outState = SystemState::DEGRADED;
        return RiskLevel::WARNING;
    }

    // 3. Dynamic Motion & Ground Hazards (IMU)
    if (snapshot.imu.valid && (snapshot.imu.freeFallSustained || snapshot.imu.severeTiltSustained)) {
        outState = SystemState::GROUND_HAZARD;
        return RiskLevel::CRITICAL;
    }

    // 4. Multi-Direction Impasse (Front blocked AND both lateral sides blocked)
    bool frontDanger = (snapshot.front.bucket == DistanceBucket::DANGER);
    bool leftDanger  = (snapshot.left.bucket == DistanceBucket::DANGER || leftFailed);
    bool rightDanger = (snapshot.right.bucket == DistanceBucket::DANGER || rightFailed);

    if (frontDanger && leftDanger && rightDanger) {
        outState = SystemState::STOP;
        return RiskLevel::CRITICAL;
    }

    // 5. Rapid Approach / Emergency Braking Envelope
    if (rapidApproach || snapshot.front.distanceCm < THRESHOLD_CRITICAL_STOP_CM) {
        outState = SystemState::CRITICAL;
        return RiskLevel::CRITICAL;
    }

    // 6. Warning Level (Front Danger, but at least one lateral vector is open)
    if (frontDanger) {
        outState = _isDegraded ? SystemState::DEGRADED : SystemState::WARNING;
        return RiskLevel::WARNING;
    }

    // 7. Caution Level (Obstacle in Caution range or lateral obstacle encroaching)
    bool frontCaution = (snapshot.front.bucket == DistanceBucket::CAUTION);
    bool leftCaution  = (snapshot.left.bucket == DistanceBucket::CAUTION);
    bool rightCaution = (snapshot.right.bucket == DistanceBucket::CAUTION);

    if (frontCaution || leftDanger || rightDanger || leftCaution || rightCaution) {
        outState = _isDegraded ? SystemState::DEGRADED : SystemState::CAUTION;
        return RiskLevel::CAUTION;
    }

    // 8. Nominal Clear Path
    outState = _isDegraded ? SystemState::DEGRADED : SystemState::NORMAL;
    return RiskLevel::SAFE;
}
