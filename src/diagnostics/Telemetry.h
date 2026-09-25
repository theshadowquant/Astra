#ifndef ANG_RAKSHA_TELEMETRY_H
#define ANG_RAKSHA_TELEMETRY_H

#include <Arduino.h>
#include "../config/Config.h"
#include "../config/HardwareConfig.h"
#include "../types/SystemTypes.h"

/**
 * @brief Structured Serial Diagnostics and Multi-Metric Latency Profiler
 */
class Telemetry {
public:
    Telemetry();
    void begin();
    void stream(uint32_t currentMillis,
                const SensorSnapshot& snapshot,
                RiskLevel risk,
                Direction direction,
                SystemState state,
                HapticPattern haptic,
                uint32_t controlLatencyUs,
                uint32_t measuredScanDurationUs);

private:
    uint32_t _lastStreamMs;

    const char* riskToStr(RiskLevel risk);
    const char* directionToStr(Direction dir);
    const char* stateToStr(SystemState st);
    const char* hapticToStr(HapticPattern pat);
};

#endif // ANG_RAKSHA_TELEMETRY_H
