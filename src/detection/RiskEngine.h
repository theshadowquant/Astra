#ifndef ANG_RAKSHA_RISK_ENGINE_H
#define ANG_RAKSHA_RISK_ENGINE_H

#include <Arduino.h>
#include "../config/Config.h"
#include "../types/SystemTypes.h"

/**
 * @brief Assesses Environmental Risk and Determines System Operational State
 */
class RiskEngine {
public:
    RiskEngine();

    RiskLevel evaluateRisk(const SensorSnapshot& snapshot,
                           bool rapidApproach,
                           SystemState& outState);

    bool isDegradedMode() const { return _isDegraded; }

private:
    bool _isDegraded;
};

#endif // ANG_RAKSHA_RISK_ENGINE_H
