#ifndef ANG_RAKSHA_HAPTIC_CONTROLLER_H
#define ANG_RAKSHA_HAPTIC_CONTROLLER_H

#include <Arduino.h>
#include "../config/HardwareConfig.h"
#include "../config/Config.h"
#include "../types/SystemTypes.h"

/**
 * @brief Spatial Haptic Matrix Controller (3 Motors) with Priority Resolution
 */
class HapticController {
public:
    HapticController();
    void begin();
    void setPattern(HapticPattern pattern);
    void update(uint32_t currentMillis);

    HapticPattern getCurrentPattern() const { return _activePattern; }

private:
    HapticPattern _activePattern;
    uint32_t _patternStartTimeMs;

    void applyOutputs(bool leftOn, bool centerOn, bool rightOn);
    void writeMotor(uint8_t pin, uint8_t channel, bool on);
};

#endif // ANG_RAKSHA_HAPTIC_CONTROLLER_H
