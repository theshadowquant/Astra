/**
 * @file hardwareConfig.ts
 * @brief Canonical Hardware Pin & Sensor Configuration for AngRaksha Guardian Platform
 * 
 * Single source of truth for the physical ESP32 DevKit pinouts and hardware parameters.
 * Consumed across Device Health, Diagnostics, and Telemetry decoders.
 */

export interface HardwarePinMapping {
  pin: number;
  label: string;
  function: string;
  type: 'GPIO_IN' | 'GPIO_OUT' | 'ANALOG_IN' | 'I2C' | 'UART';
  electricalSpec: string;
}

export const HARDWARE_CONFIG = {
  system: {
    name: 'AngRaksha Assistive Mobility Smart Stick',
    team: 'Team Astra | NIRMAAN 2026',
    mcu: 'ESP32-WROOM-32 / DevKit V1 (30-pin)',
    firmwareVersion: '1.0.0',
    logicLevel: '3.3V',
  },
  
  // Timing & Performance Bounds
  timing: {
    hcsr04TimeoutUs: 9000,          // 9 ms hardware echo bound (~150 cm envelope)
    hcsr04GuardTimeMs: 5,           // 5 ms acoustic dissipation gap
    worstCaseScanCycleMs: 42,       // <= 42 ms theoretical bound for 3 sensors
    typicalScanCycleMs: 27.4,       // Measured typical scan
    controlLoopLatencyMs: 3.2,      // Deterministic loop execution
    heartbeatIntervalMs: 1000,
    offlineThresholdMs: 30000,      // 30s without heartbeat = OFFLINE
    staleThresholdMs: 10000,        // 10s without update = STALE
  },

  // Canonical ESP32 GPIO Assignments
  pins: {
    // Ultrasonic Front / Center
    frontTrig: { pin: 19, label: 'FRONT_TRIG', function: 'Front HC-SR04 Trigger', type: 'GPIO_OUT', electricalSpec: '3.3V Pulse (10µs)' } as HardwarePinMapping,
    frontEcho: { pin: 23, label: 'FRONT_ECHO', function: 'Front HC-SR04 Echo', type: 'GPIO_IN', electricalSpec: '1k/2k Divider (3.33V)' } as HardwarePinMapping,

    // Ultrasonic Left
    leftTrig: { pin: 5, label: 'LEFT_TRIG', function: 'Left HC-SR04 Trigger', type: 'GPIO_OUT', electricalSpec: '3.3V Pulse (10µs)' } as HardwarePinMapping,
    leftEcho: { pin: 18, label: 'LEFT_ECHO', function: 'Left HC-SR04 Echo', type: 'GPIO_IN', electricalSpec: '1k/2k Divider (3.33V)' } as HardwarePinMapping,

    // Ultrasonic Right
    rightTrig: { pin: 13, label: 'RIGHT_TRIG', function: 'Right HC-SR04 Trigger', type: 'GPIO_OUT', electricalSpec: '3.3V Pulse (10µs)' } as HardwarePinMapping,
    rightEcho: { pin: 14, label: 'RIGHT_ECHO', function: 'Right HC-SR04 Echo', type: 'GPIO_IN', electricalSpec: '1k/2k Divider (3.33V)' } as HardwarePinMapping,

    // Liquid / Water Sensing Electrode
    waterSensor: { pin: 34, label: 'WATER_ADC', function: 'Water/Puddle Electrode Probe', type: 'ANALOG_IN', electricalSpec: 'ADC1_CH6 (Threshold: 1500)' } as HardwarePinMapping,

    // MPU-6050 6-DOF IMU
    i2cSda: { pin: 21, label: 'I2C_SDA', function: 'MPU-6050 SDA', type: 'I2C', electricalSpec: '400 kHz Fast I2C (3.3V)' } as HardwarePinMapping,
    i2cScl: { pin: 22, label: 'I2C_SCL', function: 'MPU-6050 SCL', type: 'I2C', electricalSpec: '400 kHz Fast I2C (3.3V)' } as HardwarePinMapping,

    // Spatial Haptic Vibration Motors (NPN Low-Side)
    motorLeft: { pin: 25, label: 'MOTOR_L', function: 'Left Haptic Motor Driver', type: 'GPIO_OUT', electricalSpec: '1k Base Resistor to NPN' } as HardwarePinMapping,
    motorCenter: { pin: 26, label: 'MOTOR_C', function: 'Center Haptic Motor Driver', type: 'GPIO_OUT', electricalSpec: '1k Base Resistor to NPN' } as HardwarePinMapping,
    motorRight: { pin: 27, label: 'MOTOR_R', function: 'Right Haptic Motor Driver', type: 'GPIO_OUT', electricalSpec: '1k Base Resistor to NPN' } as HardwarePinMapping,

    // Piezo Buzzer
    buzzer: { pin: 4, label: 'BUZZER', function: '5V Active Piezo Buzzer', type: 'GPIO_OUT', electricalSpec: 'Digital Active HIGH' } as HardwarePinMapping,

    // Emergency Tactile Switch
    sosButton: { pin: 15, label: 'SOS_BTN', function: 'Emergency SOS Panic Button', type: 'GPIO_IN', electricalSpec: 'INPUT_PULLUP (Active LOW)' } as HardwarePinMapping,

    // Status LED
    statusLed: { pin: 2, label: 'LED_HEARTBEAT', function: 'Onboard Activity Heartbeat', type: 'GPIO_OUT', electricalSpec: 'Built-in Blue LED' } as HardwarePinMapping,

    // GPS UART2
    gpsRx: { pin: 16, label: 'GPS_RX', function: 'HW-248 / NEO-6M Serial RX', type: 'UART', electricalSpec: 'HardwareSerial UART2 (9600 baud)' } as HardwarePinMapping,
    gpsTx: { pin: 17, label: 'GPS_TX', function: 'HW-248 / NEO-6M Serial TX', type: 'UART', electricalSpec: 'HardwareSerial UART2 (9600 baud)' } as HardwarePinMapping,
  },
};
