# AngRaksha — Spatial Haptic Protocol & Actuation Semantics

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  

---

## 1. Spatial Motor Layout

AngRaksha features a 3-motor ERM (Eccentric Rotating Mass) haptic feedback matrix mounted along the cane grip or wearable band:

```
    [ LEFT MOTOR ]         [ CENTER MOTOR ]         [ RIGHT MOTOR ]
       (GPIO 25)               (GPIO 26)               (GPIO 27)
     LEDC Channel 0          LEDC Channel 1          LEDC Channel 2
```

Each motor is controlled via ESP32 hardware LEDC PWM (1 kHz carrier, 8-bit resolution: 0–255 duty cycle) through discrete NPN/MOSFET low-side switches.

---

## 2. Haptic Protocol Matrix

| Pattern Identifier | Active Motor(s) | Intensity | Pulse Timing (On / Off) | Semantics & User Guidance |
| :--- | :--- | :--- | :--- | :--- |
| `PATTERN_OFF` | None | 0% | Constant OFF | **Path Clear / Idle**: No sensory fatigue. |
| `PATTERN_GUIDE_LEFT` | **LEFT** | 70% (`180`) | 120 ms ON / 180 ms OFF | **Steer Left**: Front is obstructed, safe detour detected on the left. |
| `PATTERN_GUIDE_RIGHT` | **RIGHT** | 70% (`180`) | 120 ms ON / 180 ms OFF | **Steer Right**: Front is obstructed, safe detour detected on the right. |
| `PATTERN_FORWARD_CLEAR` | **CENTER** | 45% (`120`) | Single 80 ms confirmation ping | **Forward Vector Confirmed** (optional / on-demand). |
| `PATTERN_CRITICAL_STOP` | **CENTER** or **L + R** | 100% (`255`) | Continuous ON | **HALT**: Immediate full blockage or sudden obstacle in braking envelope. |
| `PATTERN_GROUND_HAZARD` | **CENTER** | 100% (`255`) | **Short-Short-Long**: 70ms ON, 70ms OFF, 70ms ON, 140ms OFF, 250ms ON | **Ground Drop / Pothole**: Distinct rhythm to immediately differentiate from directional steering. |
| `PATTERN_SOS_EMERGENCY` | **ALL (L + C + R)** | 100% (`255`) | 200 ms ON / 100 ms OFF rapid pulsing | **Emergency SOS**: Overrides all other patterns simultaneously. |

---

## 3. Priority Resolution Rules

To prevent conflicting motor commands when multiple environmental triggers overlap, the **HapticController** executes strict priority evaluation every tick:

$$\text{SOS} > \text{GROUND\_HAZARD} > \text{CRITICAL\_STOP} > \text{GUIDE\_LEFT / RIGHT} > \text{IDLE}$$

No low-level driver or peripheral is permitted to toggle GPIOs independently. All commands must be dispatched through `HapticController::setPattern()`.
