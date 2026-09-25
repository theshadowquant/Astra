#ifndef ANG_RAKSHA_CONFIG_H
#define ANG_RAKSHA_CONFIG_H

#include <stdint.h>

/**
 * @file Config.h
 * @brief Algorithmic Thresholds, Hysteresis Bands, Timing Windows, and Safety Parameters.
 *
 * Centralized calibration parameters for the entire decision, fusion, and haptic pipeline.
 */

// =============================================================================
// DISTANCE THRESHOLDS & HYSTERESIS (Centimeters)
// =============================================================================
#define DISTANCE_MIN_VALID_CM       4.0f     // Physical ultrasonic blind spot limit
#define DISTANCE_MAX_VALID_CM       150.0f   // Bounded envelope for deterministic <50ms scan time

#define THRESHOLD_CLEAR_CM          100.0f   // > 100 cm: Clear path
#define THRESHOLD_CAUTION_CM        60.0f    // 60 - 100 cm: Caution zone
#define THRESHOLD_DANGER_CM         35.0f    // < 35 cm: Immediate Danger zone
#define THRESHOLD_CRITICAL_STOP_CM  25.0f    // < 25 cm: Emergency stop limit

#define HYSTERESIS_BAND_CM          5.0f     // ±5 cm deadband to prevent threshold flapping

// Rapid Approach Detection
#define RAPID_APPROACH_SPEED_CM_S   80.0f    // Closing speed delta triggering instant stop
#define SENSOR_STALE_TIMEOUT_MS     150      // Reading older than this is marked STALE

// =============================================================================
// IMU TEMPORAL MOTION-EVENT THRESHOLDS
// =============================================================================
#define IMU_SAMPLE_INTERVAL_MS      20       // 50 Hz acquisition interval
#define IMU_TEMPORAL_WINDOW_MS      100      // 100 ms rolling temporal evaluation window
#define IMU_WINDOW_SAMPLE_COUNT     5        // 5 consecutive samples at 50 Hz

#define IMU_FREEFALL_ACCEL_G        0.35f    // Low-g free-fall threshold (|a| < 0.35g)
#define IMU_IMPACT_ACCEL_G          2.50f    // Post-drop impact threshold (|a| > 2.5g)
#define IMU_GYRO_RATE_DEG_S         200.0f   // Angular rate threshold for sudden slip
#define IMU_TILT_MAX_PITCH_DEG      45.0f    // Off-vertical tilt threshold
#define IMU_TILT_MAX_ROLL_DEG       45.0f

#define GROUND_HAZARD_HOLD_MS       1200     // Alert latch duration for ground hazard

// =============================================================================
// HAPTIC TIMINGS (Milliseconds)
// =============================================================================
// Directional Guidance Pulse (Left / Right)
#define HAPTIC_PULSE_ON_MS          120
#define HAPTIC_PULSE_OFF_MS         180

// High-Urgency Directional Pulse (Front + One Side Blocked)
#define HAPTIC_FAST_PULSE_ON_MS     80
#define HAPTIC_FAST_PULSE_OFF_MS    90

// Ground Hazard Pattern (Short-Short-Long on Center Motor)
#define HAPTIC_GROUND_P1_ON_MS      70
#define HAPTIC_GROUND_G1_OFF_MS     70
#define HAPTIC_GROUND_P2_ON_MS      70
#define HAPTIC_GROUND_G2_OFF_MS     140
#define HAPTIC_GROUND_P3_ON_MS      250
#define HAPTIC_GROUND_CYCLE_MS      800

// Stop Tone Duration
#define HAPTIC_STOP_TONE_MS         200

// =============================================================================
// EMERGENCY & BUTTON DEBOUNCE
// =============================================================================
#define SOS_DEBOUNCE_MS             50

// =============================================================================
// DIRECTION SCORING & STABILITY HYSTERESIS
// =============================================================================
#define STABILITY_BIAS_BONUS        15.0f    // Bonus awarded to currently active direction
#define CLEARANCE_WEIGHT            1.0f     // Weight for free distance in cm
#define PENALTY_DANGER_ZONE         100.0f   // Penalty if zone is in danger
#define PENALTY_CAUTION_ZONE        30.0f    // Penalty if zone is in caution
#define SWITCHING_MARGIN_CM         15.0f    // Alternate corridor must be > 15 cm clearer to switch

// =============================================================================
// DIAGNOSTICS & TELEMETRY
// =============================================================================
#define SERIAL_BAUD_RATE            115200
#define TELEMETRY_INTERVAL_MS       100      // Stream diagnostic telemetry every 100 ms

#endif // ANG_RAKSHA_CONFIG_H
