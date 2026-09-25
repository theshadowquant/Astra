# AngRaksha — Hardware Status & Electrical Specifications

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  
**Problem Statement:** Directional Hazard Detection and Intuitive Spatial Haptic Guidance for Visually Impaired Pedestrians  

---

## 1. Confirmed Hardware Inventory

| Component | Physical Part / Model | Status | Interface / Protocol | Driver / Circuit Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32 (30/38 pin) | **CONFIRMED** | 3.3V Logic | Powered via VIN (5.0V from CN6009) or USB |
| **Spatial Distance** | 3x HC-SR04 (Ultrasonic Array) | **CONFIRMED** | GPIO Trig (Out) + Echo (In) | **5V VCC Rail + MANDATORY 1k/2k Divider on ECHO** |
| **IMU (Motion & Tilt)** | MPU-6050 (GY-521) | **CONFIRMED** | I2C (Address `0x68`) | 3.3V Power from ESP32 3V3, Fast-Mode I2C (400 kHz) |
| **Haptic Motors** | 3x Coin ERM Vibration Motors | **CONFIRMED** | GPIO / LEDC PWM | **NPN Low-Side Driver (Base resistor + Flyback Diode)** |
| **Audio Buzzer** | 5V Active Piezo Buzzer | **CONFIRMED** | GPIO 4 | 5V Rail switched via NPN or Direct GPIO |
| **Emergency Input** | 2-Pin Tactile Push Button | **CONFIRMED** | GPIO 15 | `INPUT_PULLUP` (Active LOW) + Interrupt / Fast Poll |
| **Power Converter** | CN6009 / XL6009 Step-Up Module | **CONFIRMED** | Boost DC-DC | **Trimmed strictly to 5.0V before connecting loads** |
| **Battery** | 3.7V Li-ion Cell | **CONFIRMED** | Power Source | Input to CN6009 Boost Module |
| **GPS Module** | NEO-6M / GPS6MV2 | **AVAILABLE** | UART (Serial2) | *Isolated from core 24h mobility pipeline* |

---

## 2. Power Architecture & Voltage Rail Distribution

```
                   ┌────────────────────────────────────────────────────────┐
                   │               3.7V Li-ion Battery                      │
                   └───────────────────┬────────────────────────────────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
               [ CN6009 Boost Converter ]     [ Raw 3.7V Battery Rail ]
               (Trimmed to strictly 5.00V)            │
                        │                             │
        ┌───────────────┼───────────────┐             │ (If motors are 3.0V rated)
        ▼               ▼               ▼             ▼
   [ ESP32 VIN ]   [ 3x HC-SR04 VCC ] [ 5V Buzzer ] [ 3x ERM Motors ]
        │                                             ▲
    (3.3V LDO)                                        │ (Via NPN Low-Side)
        │                                             │
   ┌────┴────┐                                        │
   ▼         ▼                                        │
[ MPU6050 ] [ SOS Button ] ──► ESP32 GPIOs ───────────┘
```

> [!CAUTION]
> **PRE-POWER CHECKLIST FOR CN6009**:
> 1. Disconnect all loads (ESP32, HC-SR04, Buzzer).
> 2. Connect 3.7V Battery to `IN+` and `IN-`.
> 3. Measure `OUT+` and `OUT-` with a digital multimeter.
> 4. Turn the multi-turn trimpot until the output reads **strictly 5.00V - 5.10V**.
> 5. Only then wire the 5V bus to the sensors, buzzer, and ESP32 VIN.

---

## 3. Mandatory Sensor Protection: 1kΩ / 2kΩ Voltage Divider

Standard HC-SR04 ECHO pins output 5V TTL pulses. ESP32 inputs are 3.3V maximum:

```
  HC-SR04 (5V ECHO)
         │
       [ 1 kΩ ]  (R1)
         │
         ├───► CONNECT TO ESP32 GPIO (PIN_LEFT_ECHO / FRONT_ECHO / RIGHT_ECHO)
         │
       [ 2 kΩ ]  (R2)
         │
        GND (Common Ground)
```

$$\mathbf{V_{\text{out}}} = 5.0\,\text{V} \times \frac{2\text{ k}\Omega}{1\text{ k}\Omega + 2\text{ k}\Omega} = \mathbf{3.33\,\text{V}}$$

---

## 4. Vibration Motor Low-Side Switching Circuit

```
  +3.7V Raw (or 5.0V) ─────────────────────────┐
                                               │
                                           ┌───┴───┐
                                           │ Motor │  [ Flyback Diode 1N4148 / 1N4007 ]
                                           └───┬───┘
                                               │
  ESP32 GPIO (25/26/27) ──[ 1kΩ Base Res ]─── Base ┤ NPN Transistor (e.g. 2N2222 / SS8050)
                                            Emitter
                                               │
                                            GND (Common Ground)
```

---

## 5. Pin Mapping Summary

| Signal Name | ESP32 GPIO | Connected Component | Electrical Condition |
| :--- | :--- | :--- | :--- |
| `I2C_SDA` | **GPIO 21** | MPU-6050 SDA | 3.3V Logic |
| `I2C_SCL` | **GPIO 22** | MPU-6050 SCL | 3.3V Logic |
| `PIN_LEFT_TRIG` | **GPIO 5** | Left HC-SR04 Trig | 3.3V Trigger pulse |
| `PIN_LEFT_ECHO` | **GPIO 18** | Left HC-SR04 Echo | **1k/2k Divider $\rightarrow$ 3.33V** |
| `PIN_FRONT_TRIG` | **GPIO 19** | Center HC-SR04 Trig | 3.3V Trigger pulse |
| `PIN_FRONT_ECHO` | **GPIO 23** | Center HC-SR04 Echo | **1k/2k Divider $\rightarrow$ 3.33V** |
| `PIN_RIGHT_TRIG` | **GPIO 13** | Right HC-SR04 Trig | 3.3V Trigger pulse |
| `PIN_RIGHT_ECHO` | **GPIO 14** | Right HC-SR04 Echo | **1k/2k Divider $\rightarrow$ 3.33V** |
| `PIN_MOTOR_LEFT` | **GPIO 25** | Left Motor Driver | 1k Base Resistor to NPN |
| `PIN_MOTOR_CENTER`| **GPIO 26** | Center Motor Driver | 1k Base Resistor to NPN |
| `PIN_MOTOR_RIGHT` | **GPIO 27** | Right Motor Driver | 1k Base Resistor to NPN |
| `PIN_BUZZER` | **GPIO 4** | Active Buzzer Driver | Digital Output |
| `PIN_SOS_BUTTON` | **GPIO 15** | SOS Tactile Switch | `INPUT_PULLUP` to GND |
| `PIN_STATUS_LED` | **GPIO 2** | Onboard LED | Visual System Heartbeat |
