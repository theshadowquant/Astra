#ifndef ANG_RAKSHA_SOS_MANAGER_H
#define ANG_RAKSHA_SOS_MANAGER_H

#include <Arduino.h>
#include "../config/HardwareConfig.h"
#include "../config/Config.h"

/**
 * @brief High-Integrity SOS Emergency Switch Handler
 */
class SOSManager {
public:
    SOSManager();
    void begin();
    void update(uint32_t currentMillis);
    
    bool isTriggered() const { return _sosActive; }
    void clear() { _sosActive = false; }

    static void IRAM_ATTR isrHandler();

private:
    static volatile bool _isrFlag;
    static volatile uint32_t _lastIsrMicros;

    bool _sosActive;
    uint32_t _lastDebounceMs;
};

#endif // ANG_RAKSHA_SOS_MANAGER_H
