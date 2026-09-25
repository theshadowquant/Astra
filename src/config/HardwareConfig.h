#ifndef ANG_RAKSHA_HARDWARE_CONFIG_H
#define ANG_RAKSHA_HARDWARE_CONFIG_H

#include <stdint.h>
#include <stdbool.h>

/**
 * @file HardwareConfig.h
 * @brief Centralized Hardware Pin Mappings and Electrical Configuration.
 *
 * Single point of configuration for physical board pins, electrical interfaces,
 * and low-level driver operation modes.
 */

// =============================================================================
// I2C BUS CONFIGURATION (MPU-6050 IMU)
// =============================================================================
#define PIN_I2C_SDA                 21
#define PIN_I2C_SCL                 22
#define MPU6050_I2C_ADDR            0x68
#define I2C_FREQUENCY_HZ            400000  // Fast-mode I2C (400 kHz)

// =============================================================================
// DISTANCE SENSORS (HC-SR04 Ultrasonic Array)
// SAFETY MANDATE: Echo lines MUST connect through a 1k/2k resistor voltage divider!
// =============================================================================
#define NUM_DISTANCE_SENSORS        3       // Configurable: 2 or 3 physical sensors

// Left Sensor
#define PIN_LEFT_TRIG               5
#define PIN_LEFT_ECHO               18

// Front / Center Sensor
#define PIN_FRONT_TRIG              19
#define PIN_FRONT_ECHO              23

// Right Sensor
#define PIN_RIGHT_TRIG              13
#define PIN_RIGHT_ECHO              14

// Bounded Sensor Timing & Guard Configuration
// 150 cm envelope for pedestrian walking speeds:
// Round trip time for 150 cm = (150 * 2) / 0.0343 ≈ 8746 µs (~8.75 ms)
// Clamped hardware timeout = 9000 µs (9 ms)
// Single sensor slot = 9 ms (timeout) + 5 ms (guard) = 14 ms
// Total 3-sensor worst-case full cycle = 3 * 14 ms = 42 ms (< 50 ms guaranteed!)
#define HCSR04_MAX_RANGE_CM         150.0f  
#define HCSR04_TIMEOUT_US           9000    // Bounded 9 ms hardware echo timeout
#define HCSR04_GUARD_TIME_MS        5       // Inter-sensor acoustic dissipation guard time

// =============================================================================
// SPATIAL HAPTIC MOTORS (Transistor / MOSFET Low-Side Driver)
// =============================================================================
#define PIN_MOTOR_LEFT              25
#define PIN_MOTOR_CENTER            26
#define PIN_MOTOR_RIGHT             27

// Drive Mode Configuration:
// Set to true for simple deterministic digital on/off pulses.
// Set to false for LEDC hardware PWM intensity modulation.
#define HAPTIC_USE_DIGITAL_IO       true    

// LEDC PWM Settings (active if HAPTIC_USE_DIGITAL_IO is false)
#define HAPTIC_PWM_FREQ_HZ          1000    // 1 kHz
#define HAPTIC_PWM_RESOLUTION       8       // 8-bit (0 - 255)
#define LEDC_CHANNEL_LEFT           0
#define LEDC_CHANNEL_CENTER         1
#define LEDC_CHANNEL_RIGHT          2

// =============================================================================
// AUDIO BUZZER
// =============================================================================
#define PIN_BUZZER                  4       // 5V Active piezo buzzer GPIO
#define BUZZER_IS_PASSIVE           false   // false: Active DC buzzer (HIGH/LOW), true: Passive AC tone

// =============================================================================
// EMERGENCY INPUTS & INDICATORS
// =============================================================================
#define PIN_SOS_BUTTON              15      // INPUT_PULLUP, active LOW
#define PIN_STATUS_LED              2       // DevKit onboard LED

// =============================================================================
// WATER / LIQUID SENSING ELECTRODE (Pothole / Puddle Detection)
// =============================================================================
#define PIN_WATER_SENSOR            34      // ADC1_CH6 (Input only on ESP32)
#define WATER_ADC_THRESHOLD         1500    // ADC value threshold for liquid conduction (0 - 4095)

// =============================================================================
// OPTIONAL GPS (ISOLATED FROM CRITICAL 24H MOBILITY CORE)
// =============================================================================
#define PIN_GPS_RX                  16      // Serial2 RX (Optional)
#define PIN_GPS_TX                  17      // Serial2 TX (Optional)

#endif // ANG_RAKSHA_HARDWARE_CONFIG_H
