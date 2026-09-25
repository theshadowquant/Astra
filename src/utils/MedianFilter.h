#ifndef ANG_RAKSHA_MEDIAN_FILTER_H
#define ANG_RAKSHA_MEDIAN_FILTER_H

#include <stdint.h>

/**
 * @brief Lightweight 3-Tap Median Filter for Range Measurements
 * Eliminates single-sample acoustic glitches without introducing lag.
 */
class MedianFilter3 {
public:
    MedianFilter3(float initialVal = 250.0f) {
        _buffer[0] = initialVal;
        _buffer[1] = initialVal;
        _buffer[2] = initialVal;
        _idx = 0;
    }

    float filter(float newVal) {
        _buffer[_idx] = newVal;
        _idx = (_idx + 1) % 3;

        float a = _buffer[0];
        float b = _buffer[1];
        float c = _buffer[2];

        // 3-element median sorting network
        if ((a <= b && b <= c) || (c <= b && b <= a)) return b;
        if ((b <= a && a <= c) || (c <= a && a <= b)) return a;
        return c;
    }

    void reset(float val = 250.0f) {
        _buffer[0] = val;
        _buffer[1] = val;
        _buffer[2] = val;
        _idx = 0;
    }

private:
    float _buffer[3];
    uint8_t _idx;
};

#endif // ANG_RAKSHA_MEDIAN_FILTER_H
