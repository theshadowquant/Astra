# AngRaksha — Directional Hazard Detection & Intuitive Spatial Haptic Guidance

**Team Astra** | **NIRMAAN 2026** | **Track:** Smart Mobility & Aerospace  
**Problem Statement:** Directional Hazard Detection and Intuitive Haptic Guidance for Visually Impaired Pedestrians

---

## 🚀 Overview

**AngRaksha** is an electronic travel aid (ETA) designed for visually impaired pedestrians. Unlike traditional obstacle buzzers that simply beep at any blockage, AngRaksha continuously analyzes the pedestrian's spatial environment, evaluates risk severity, and **actively calculates and communicates safe navigable corridors in real time** through a 3-motor spatial haptic matrix and contextual acoustic tones.

```
[ SENSE ] ──► [ CLASSIFY ] ──► [ ASSESS RISK ] ──► [ FIND SAFE DIRECTION ] ──► [ GUIDE ] ──► [ PROTECT ]
```

---

## ⚡ Key Technical Features

1. **Zero Cloud & Zero Network Dependency**: Operates 100% locally on the ESP32 with deterministic non-blocking C++.
2. **Spatial Multi-Zone Guidance**:
   - **Front Blocked, Left Clear** $\rightarrow$ Rhythmic pulse on **Left Motor** ("Steer Left").
   - **Front Blocked, Right Clear** $\rightarrow$ Rhythmic pulse on **Right Motor** ("Steer Right").
   - **All Vectors Blocked** $\rightarrow$ Continuous high-intensity vibration + 200 ms acoustic stop tone.
3. **Multi-Signal Ground Hazard Detection**: 5-sample (100 ms) temporal IMU window detects free-fall drops ($|\mathbf{a}| < 0.35\text{g}$) and severe cane tilt ($> 45^\circ$), firing a distinct *short-short-long* pulse on the Center motor.
4. **Instant SOS Emergency Override**: Debounced hardware interrupt triggers an immediate continuous siren and 3-motor emergency burst.
5. **Anti-Chattering Hysteresis & Stability Bias**: Incorporates a $\pm5\text{ cm}$ zone deadband and a $15.0\text{ pt}$ directional stability bonus to eliminate navigation flapping in narrow hallways.
6. **Hardware-Protected Electrical Architecture**: Explicit voltage divider on HC-SR04 5V Echo lines ($1\text{ k}\Omega / 2\text{ k}\Omega \rightarrow 3.33\text{V}$) and CN6009 5.0V boosted power distribution.

---

## 📁 Repository Structure

```
ASTRA/
├── platformio.ini              # PlatformIO project configuration (ESP32 DevKit)
├── HARDWARE_STATUS.md          # Hardware inventory & pre-power checklist
├── README.md                   # This overview guide
│
├── docs/
│   ├── ARCHITECTURE.md         # System pipeline & latency analysis
│   ├── HARDWARE.md             # Electrical schematics & pin mapping table
│   ├── HAPTIC_PROTOCOL.md      # 3-motor spatial matrix & pulse semantics
│   ├── STATE_MACHINE.md        # Explicit state machine specification
│   └── TEST_PLAN.md            # Benchmark validation & judge demo script
│
├── src/
│   ├── main.cpp                # Non-blocking Sense-Classify-Assess-Guide-Protect pipeline
│   │
│   ├── config/
│   │   ├── HardwareConfig.h    # Pin definitions, PWM channels, and bus speeds
│   │   └── Config.h            # Tunable thresholds, timings, and hysteresis parameters
│   │
│   ├── types/
│   │   └── SystemTypes.h       # Strongly-typed structs, validity enums, snapshots
│   │
│   ├── utils/
│   │   └── MedianFilter.h      # 3-tap noise suppression filter
│   │
│   ├── sensors/
│   │   ├── DistanceSensor.h/.cpp # Non-blocking microsecond echo driver
│   │   ├── SensorManager.h/.cpp  # Sequential staggered ping scheduler
│   │   └── IMUManager.h/.cpp     # 50 Hz MPU-6050 acquisition & temporal patterns
│   │
│   ├── detection/
│   │   ├── HazardClassifier.h/.cpp # Zone hysteresis & rapid approach tracking
│   │   └── RiskEngine.h/.cpp       # Multi-factor severity & degraded modes
│   │
│   ├── navigation/
│   │   └── SafeDirectionEngine.h/.cpp # Explainable clearance scoring & stability bias
│   │
│   ├── haptics/
│   │   └── HapticController.h/.cpp # 3-motor spatial pulse generator & priority resolver
│   │
│   ├── audio/
│   │   └── BuzzerController.h/.cpp # Non-blocking context acoustic tones
│   │
│   ├── safety/
│   │   └── SOSManager.h/.cpp       # Debounced interrupt emergency handler
│   │
│   └── diagnostics/
│       └── Telemetry.h/.cpp        # ASCII serial stream & loop profiler
│
└── test/
    ├── test_logic.cpp          # Native C++ logic validation suite
    └── run_tests.py            # Automated 12-scenario test runner
```

---

## 🧪 Verification & Logic Validation

All 12 core test scenarios can be verified locally:
```bash
python test/run_tests.py
```
**Results: 12 / 12 Tests Passed (100% Coverage)**
- [x] **Test 1**: All Clear $\rightarrow$ `Direction::NONE`, Motors OFF
- [x] **Test 2**: Front Blocked, Left Clear $\rightarrow$ `Direction::LEFT` (Pulse Left)
- [x] **Test 3**: Front Blocked, Right Clear $\rightarrow$ `Direction::RIGHT` (Pulse Right)
- [x] **Test 4**: Front Blocked, Both Clear $\rightarrow$ Deterministic Tie-Breaker
- [x] **Test 5**: All Blocked $\rightarrow$ `Direction::STOP` (Continuous Stop Tone)
- [x] **Test 6**: Ground Hazard (IMU Drop) $\rightarrow$ `GROUND_HAZARD` (Short-Short-Long)
- [x] **Test 7**: Lateral Sensor Disconnected $\rightarrow$ `DEGRADED` / Safe Lateral Fallback
- [x] **Test 8**: SOS Button Pressed $\rightarrow$ `SOS_EMERGENCY` Override
- [x] **Test 9**: Rapid Approach Detected $\rightarrow$ Instant `CRITICAL`
- [x] **Test 10**: All Distance Sensors Faulted $\rightarrow$ `SENSOR_FAULT`
- [x] **Test 11**: Stability Hysteresis $\rightarrow$ Prevents Left/Right Chattering
- [x] **Test 12**: Front Sensor Disconnected $\rightarrow$ Conservative Warning

---

## 🛠️ Building & Flashing

### Via PlatformIO:
```bash
# Build firmware
pio run

# Flash to connected ESP32
pio run --target upload

# Open Serial Monitor (115200 baud)
pio device monitor
```

### Via Arduino IDE:
1. Open the repository in Arduino IDE.
2. Select **Board**: `ESP32 Dev Module`.
3. Ensure the `Adafruit MPU6050` and `Adafruit Unified Sensor` libraries are installed via the Library Manager.
4. Open [main.cpp](file:///c:/Users/ShadowQuant/Desktop/ASTRA/src/main.cpp) (or save as `AngRaksha.ino`) and upload.
