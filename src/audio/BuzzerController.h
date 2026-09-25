#ifndef ANG_RAKSHA_BUZZER_CONTROLLER_H
#define ANG_RAKSHA_BUZZER_CONTROLLER_H

#include <Arduino.h>
#include "../config/HardwareConfig.h"
#include "../config/Config.h"
#include "../types/SystemTypes.h"

/**
 * @brief Non-Blocking Context Audio Alert Controller
 */
class BuzzerController {
public:
    BuzzerController();
    void begin();
    void setPattern(BuzzerPattern pattern);
    void update(uint32_t currentMillis);

    BuzzerPattern getCurrentPattern() const { return _activePattern; }

private:
    BuzzerPattern _activePattern;
    uint32_t _patternStartTimeMs;

    void setBuzzerHardware(bool active);
};

#endif // ANG_RAKSHA_BUZZER_CONTROLLER_H
