# AngRaksha — Test & Validation Plan

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  

---

## 1. Unit & Bench Test Matrix

| ID | Test Scenario | Input Stimulus | Expected Decision & Actuation | Pass / Fail Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **T01** | **All Zones Clear** | L > 100cm, F > 100cm, R > 100cm | `Direction::NONE`, `PATTERN_OFF` | All 3 motors 0% PWM, Buzzer silent |
| **T02** | **Front Blocked, Left Clear** | F = 25cm, L = 85cm, R = 20cm | `Direction::LEFT`, `PATTERN_GUIDE_LEFT` | Left motor rhythmic pulsing (120ms/180ms), C/R OFF |
| **T03** | **Front Blocked, Right Clear** | F = 25cm, L = 20cm, R = 85cm | `Direction::RIGHT`, `PATTERN_GUIDE_RIGHT` | Right motor rhythmic pulsing (120ms/180ms), C/L OFF |
| **T04** | **Front Blocked, Both Clear** | F = 25cm, L = 90cm, R = 90cm | Deterministic tie-breaker selection | Selects side with stability bonus, no oscillation |
| **T05** | **Full Impasse / Stop** | F = 20cm, L = 20cm, R = 20cm | `Direction::STOP`, `PATTERN_CRITICAL_STOP` | Center motor continuous ON + 200ms stop tone |
| **T06** | **Ground Hazard (IMU Drop)** | Free-fall \|a\| < 0.35g | `GROUND_HAZARD`, `PATTERN_GROUND_HAZARD` | Center motor short-short-long pattern + alert chirp |
| **T07** | **Rapid Approach** | F distance delta > 80cm/s | `CRITICAL`, `PATTERN_CRITICAL_STOP` | Immediate stop pattern before reaching danger limit |
| **T08** | **SOS Emergency** | Tactile button pressed | `SOS`, `PATTERN_SOS_EMERGENCY` | Continuous siren buzzer + 3-motor rapid pulse |
| **T09** | **Threshold Hysteresis** | F oscillating 34cm <-> 36cm | No rapid state flapping | Filtered bucket transition with ±5cm deadband |
| **T10** | **Sensor Fault Resilience** | Front sensor disconnected | `SENSOR_FAULT` / Degraded confidence | Safe fallback warning, loop does NOT hang |

---

## 2. Live Demo Script for Judges

1. **Scenario 1 (Left Guidance)**: Place obstacle in front of center sensor. Keep left side unobstructed. **Observe Left motor pulsing.**
2. **Scenario 2 (Right Guidance)**: Block center and left sensors. Keep right side open. **Observe Right motor pulsing.**
3. **Scenario 3 (Dead End / Stop)**: Cover all 3 sensors simultaneously. **Observe dual continuous vibration + stop tone.**
4. **Scenario 4 (Pothole / Drop)**: Dip or drop device quickly downwards. **Observe distinct short-short-long center vibration.**
5. **Scenario 5 (SOS Override)**: Press SOS tactile switch while guidance is active. **Observe instant emergency alarm override.**
