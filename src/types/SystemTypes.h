#ifndef ANG_RAKSHA_SYSTEM_TYPES_H
#define ANG_RAKSHA_SYSTEM_TYPES_H

#include <stdint.h>
#include <stdbool.h>

/**
 * @brief Spatial Zone Identifiers for Pedestrian Guidance
 */
enum class SensorZone : uint8_t {
    LEFT = 0,
    FRONT = 1,
    RIGHT = 2,
    GROUND = 3,
    ZONE_COUNT = 4
};

/**
 * @brief Explicit Sensor Measurement Validity State
 * Ensures invalid/timeout readings are NEVER confused with 0cm or clear paths.
 */
enum class ReadingValidity : uint8_t {
    VALID = 0,           // Range ping received within physical envelope
    TIMEOUT = 1,         // No echo returned before timeout bound (open space or out of range)
    OUT_OF_BOUNDS = 2,   // Measured value below min blind spot (<4cm) or above max (>350cm)
    DISCONNECTED = 3,    // Pin floating, no response, or electrical fault
    STALE = 4            // Reading has not been updated within freshness window
};

/**
 * @brief Discrete Distance Classification Buckets (with Hysteresis)
 */
enum class DistanceBucket : uint8_t {
    CLEAR = 0,           // Unobstructed corridor (> threshold)
    CAUTION = 1,         // Moderate distance hazard
    DANGER = 2,          // Immediate obstacle within stopping envelope
    INVALID = 3          // Degraded or unverified reading
};

/**
 * @brief Overall System Risk Severity Level
 */
enum class RiskLevel : uint8_t {
    SAFE = 0,            // Path ahead is clear
    CAUTION = 1,         // Obstacle present, alternate vector available
    WARNING = 2,         // Safe vector narrowing, immediate steering needed
    CRITICAL = 3         // Total impasse, imminent collision, or system fault
};

/**
 * @brief Recommended Safe Direction for Pedestrian Steerage
 */
enum class Direction : uint8_t {
    NONE = 0,            // Forward path is clear (idle / no steering prompt)
    FORWARD = 1,         // Forward vector confirmed
    LEFT = 2,            // Steer Left (left corridor is safest)
    RIGHT = 3,           // Steer Right (right corridor is safest)
    STOP = 4             // Halt (all vectors blocked or critical hazard)
};

/**
 * @brief Operational State Machine States
 */
enum class SystemState : uint8_t {
    STARTUP = 0,
    NORMAL = 1,
    CAUTION = 2,
    WARNING = 3,
    CRITICAL = 4,
    GROUND_HAZARD = 5,
    STOP = 6,
    SOS = 7,
    SENSOR_FAULT = 8,
    DEGRADED = 9
};

/**
 * @brief Named Spatial Haptic Feedback Patterns
 */
enum class HapticPattern : uint8_t {
    PATTERN_OFF = 0,
    PATTERN_GUIDE_LEFT = 1,
    PATTERN_GUIDE_RIGHT = 2,
    PATTERN_FORWARD_CLEAR = 3,
    PATTERN_WARNING_PULSE = 4,
    PATTERN_CRITICAL_STOP = 5,
    PATTERN_GROUND_HAZARD = 6,
    PATTERN_SOS_EMERGENCY = 7,
    PATTERN_SENSOR_FAULT = 8
};

/**
 * @brief Audio Alert Patterns
 */
enum class BuzzerPattern : uint8_t {
    BUZZER_OFF = 0,
    BUZZER_BOOT_CHIRP = 1,
    BUZZER_STOP_TONE = 2,
    BUZZER_GROUND_ALERT = 3,
    BUZZER_SOS_ALARM = 4,
    BUZZER_FAULT_BEEP = 5
};

/**
 * @brief Single Distance Sensor Snapshot with Full Validity Tracking
 */
struct DistanceReading {
    float distanceCm;              // Normalized distance measurement in cm
    float rawDistanceCm;           // Pre-filtered distance measurement
    ReadingValidity validity;      // Explicit validity state
    bool isFresh;                  // True if updated in current cycle
    uint32_t timestampMs;          // Millis timestamp of capture
    float confidence;              // Confidence score (0.0f - 1.0f)
    DistanceBucket bucket;         // Hysteresis-filtered classification bucket
};

/**
 * @brief IMU Motion Event & Temporal State
 */
struct IMUReading {
    float accelX;                  // Accel in g
    float accelY;
    float accelZ;
    float accelMagnitude;          // |a| in g
    float gyroMagnitudeDegS;       // |w| in deg/s
    float pitchDeg;                // Off-vertical tilt angle
    float rollDeg;
    bool freeFallSustained;        // True if low-g sustained across temporal window
    bool severeTiltSustained;      // True if tilt exceeded threshold
    bool valid;                    // I2C communication integrity
    uint32_t timestampMs;
};

/**
 * @brief Unified Snapshot for Zero-Decoupling Fusion Pipeline
 */
struct SensorSnapshot {
    DistanceReading left;
    DistanceReading front;
    DistanceReading right;
    IMUReading imu;
    bool sosActive;
    uint32_t snapshotTimestampMs;
    uint32_t acquisitionDurationUs; // Measured sensor acquisition duration
};

/**
 * @brief Safe Direction Candidate Evaluation Result
 */
struct DirectionCandidate {
    Direction direction;
    float score;
    bool navigable;
    RiskLevel localRisk;
};

#endif // ANG_RAKSHA_SYSTEM_TYPES_H
