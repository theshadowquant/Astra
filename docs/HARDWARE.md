# AngRaksha — Hardware Wiring & Electrical Integration Guide

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  

---

## 1. System Power Architecture

```
                                  +───────────────────────────────────+
                                  |     3.7V Li-ion Battery           |
                                  +─────────────────┬─────────────────+
                                                    |
                                     +──────────────┴──────────────+
                                     |                             |
                                     v                             v
                       +───────────────────────────+   +───────────────────────+
                       | CN6009 Boost Converter    |   | Raw 3.7V Battery Rail |
                       | (Trimmed strictly to 5.0V)|   +───────────┬───────────+
                       +─────────────┬─────────────+               |
                                     |                             |
            +────────────────────────┼────────────────────────+    | (If motors 3V)
            v                        v                        v    v
     +──────────────+         +──────────────+         +───────────────+
     |  ESP32 VIN   |         | 3x HC-SR04   |         | 3x ERM Motors |
     |  (5V input)  |         | (VCC = 5.0V) |         | (via NPN)     |
     +──────┬───────+         +──────────────+         +───────────────+
            |
        (3.3V LDO)
            |
     +──────┴───────+
     |  MPU-6050    |
     |  (3.3V VCC)  |
     +──────────────+
```

---

## 2. Complete Pin Connection Table

| Subsystem | Signal Name | ESP32 GPIO | External Connection & Conditioning |
| :--- | :--- | :--- | :--- |
| **I2C Bus** | `I2C_SDA` | **GPIO 21** | MPU-6050 SDA (3.3V logic) |
| | `I2C_SCL` | **GPIO 22** | MPU-6050 SCL (3.3V logic) |
| **Ultrasonic Left** | `PIN_LEFT_TRIG` | **GPIO 5** | Left HC-SR04 Trig |
| | `PIN_LEFT_ECHO` | **GPIO 18** | **Through 1kΩ / 2kΩ Voltage Divider** |
| **Ultrasonic Front** | `PIN_FRONT_TRIG` | **GPIO 19** | Center HC-SR04 Trig |
| | `PIN_FRONT_ECHO` | **GPIO 23** | **Through 1kΩ / 2kΩ Voltage Divider** |
| **Ultrasonic Right** | `PIN_RIGHT_TRIG` | **GPIO 13** | Right HC-SR04 Trig |
| | `PIN_RIGHT_ECHO` | **GPIO 14** | **Through 1kΩ / 2kΩ Voltage Divider** |
| **Haptics Left** | `PIN_MOTOR_LEFT` | **GPIO 25** | 1kΩ base resistor $\rightarrow$ NPN Transistor Collector to Motor $(-)$ |
| **Haptics Center** | `PIN_MOTOR_CENTER`| **GPIO 26** | 1kΩ base resistor $\rightarrow$ NPN Transistor Collector to Motor $(-)$ |
| **Haptics Right** | `PIN_MOTOR_RIGHT` | **GPIO 27** | 1kΩ base resistor $\rightarrow$ NPN Transistor Collector to Motor $(-)$ |
| **Audio Buzzer** | `PIN_BUZZER` | **GPIO 4** | 5V Active Buzzer Driver |
| **SOS Button** | `PIN_SOS_BUTTON` | **GPIO 15** | 2-pin tactile switch to GND (`INPUT_PULLUP`) |
| **Status Indicator**| `PIN_STATUS_LED` | **GPIO 2** | Onboard LED (Heartbeat) |

---

## 3. Benchtop Calibration & Safety Checklist

1. **CN6009 Boost Trimming**:
   - Turn potentiometer counter-clockwise or clockwise until output voltage reads **5.00V $\pm 0.05$V** with no load connected.
2. **Common Ground**:
   - Verify all GND pins (Battery, CN6009 OUT-, ESP32 GND, MPU6050 GND, HC-SR04 GND, Transistor Emitters) are physically tied together.
3. **Echo Level Shifting**:
   - Verify every HC-SR04 Echo pin passes through $1\text{ k}\Omega$ before hitting the ESP32 GPIO, with $2\text{ k}\Omega$ to GND.
4. **Flyback Diodes**:
   - Place a 1N4148 or 1N4007 diode across each vibration motor (Cathode to $+$ power, Anode to Transistor Collector) to suppress inductive kickback.
