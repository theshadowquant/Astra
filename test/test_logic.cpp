#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <math.h>
#include <assert.h>

#include "../src/types/SystemTypes.h"
#include "../src/config/Config.h"
#include "../src/detection/HazardClassifier.h"
#include "../src/detection/RiskEngine.h"
#include "../src/navigation/SafeDirectionEngine.h"

// Test Summary Counter
static int g_testsPassed = 0;
static int g_testsTotal = 0;

#define RUN_TEST(fn) do { \
    printf("[RUNNING] %s ... ", #fn); \
    g_testsTotal++; \
    if (fn()) { \
        printf("PASS\n"); \
        g_testsPassed++; \
    } else { \
        printf("FAIL\n"); \
    } \
} while(0)

// Helper to create valid reading
DistanceReading makeReading(float cm, ReadingValidity val = ReadingValidity::VALID) {
    DistanceReading r;
    r.distanceCm = cm;
    r.rawDistanceCm = cm;
    r.validity = val;
    r.isFresh = true;
    r.timestampMs = 1000;
    r.confidence = 1.0f;
    r.bucket = (cm < THRESHOLD_DANGER_CM) ? DistanceBucket::DANGER :
               (cm < THRESHOLD_CAUTION_CM) ? DistanceBucket::CAUTION : DistanceBucket::CLEAR;
    return r;
}

IMUReading makeNominalIMU() {
    IMUReading imu;
    imu.accelX = 0.0f;
    imu.accelY = 0.0f;
    imu.accelZ = 1.0f;
    imu.accelMagnitude = 1.0f;
    imu.gyroMagnitudeDegS = 0.0f;
    imu.pitchDeg = 0.0f;
    imu.rollDeg = 0.0f;
    imu.freeFallSustained = false;
    imu.severeTiltSustained = false;
    imu.valid = true;
    imu.timestampMs = 1000;
    return imu;
}

// TEST 1: All Clear -> Direction NONE
bool test_all_clear() {
    HazardClassifier classifier;
    RiskEngine riskEngine;
    SafeDirectionEngine directionEngine;

    SensorSnapshot snap;
    classifier.classifySnapshot(makeReading(150.0f), makeReading(150.0f), makeReading(150.0f),
                                makeNominalIMU(), false, 1000, snap);

    SystemState state = SystemState::STARTUP;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);
    Direction dir = directionEngine.determineDirection(snap, risk, state);

    return (risk == RiskLevel::SAFE && dir == Direction::NONE && state == SystemState::NORMAL);
}

// TEST 2: Front blocked, Left clear, Right blocked -> Guide LEFT
bool test_front_blocked_left_clear() {
    HazardClassifier classifier;
    RiskEngine riskEngine;
    SafeDirectionEngine directionEngine;

    SensorSnapshot snap;
    classifier.classifySnapshot(makeReading(85.0f), makeReading(25.0f), makeReading(20.0f),
                                makeNominalIMU(), false, 1000, snap);

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);
    Direction dir = directionEngine.determineDirection(snap, risk, state);

    return (risk == RiskLevel::WARNING && dir == Direction::LEFT);
}

// TEST 3: Front blocked, Right clear, Left blocked -> Guide RIGHT
bool test_front_blocked_right_clear() {
    HazardClassifier classifier;
    RiskEngine riskEngine;
    SafeDirectionEngine directionEngine;

    SensorSnapshot snap;
    classifier.classifySnapshot(makeReading(20.0f), makeReading(25.0f), makeReading(85.0f),
                                makeNominalIMU(), false, 1000, snap);

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);
    Direction dir = directionEngine.determineDirection(snap, risk, state);

    return (risk == RiskLevel::WARNING && dir == Direction::RIGHT);
}

// TEST 4: Front blocked, Both sides clear -> Deterministic tie breaker
bool test_front_blocked_both_clear() {
    HazardClassifier classifier;
    RiskEngine riskEngine;
    SafeDirectionEngine directionEngine;

    SensorSnapshot snap;
    classifier.classifySnapshot(makeReading(90.0f), makeReading(25.0f), makeReading(90.0f),
                                makeNominalIMU(), false, 1000, snap);

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);
    Direction dir = directionEngine.determineDirection(snap, risk, state);

    return (dir == Direction::LEFT || dir == Direction::RIGHT);
}

// TEST 5: All blocked -> STOP / CRITICAL
bool test_all_blocked_stop() {
    HazardClassifier classifier;
    RiskEngine riskEngine;
    SafeDirectionEngine directionEngine;

    SensorSnapshot snap;
    classifier.classifySnapshot(makeReading(20.0f), makeReading(20.0f), makeReading(20.0f),
                                makeNominalIMU(), false, 1000, snap);

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);
    Direction dir = directionEngine.determineDirection(snap, risk, state);

    return (risk == RiskLevel::CRITICAL && dir == Direction::STOP && state == SystemState::STOP);
}

// TEST 6: Ground Hazard (IMU Drop) -> GROUND_HAZARD
bool test_ground_hazard() {
    HazardClassifier classifier;
    RiskEngine riskEngine;
    SafeDirectionEngine directionEngine;

    IMUReading imu = makeNominalIMU();
    imu.freeFallSustained = true;

    SensorSnapshot snap;
    classifier.classifySnapshot(makeReading(150.0f), makeReading(150.0f), makeReading(150.0f),
                                imu, false, 1000, snap);

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);
    Direction dir = directionEngine.determineDirection(snap, risk, state);

    return (risk == RiskLevel::CRITICAL && state == SystemState::GROUND_HAZARD && dir == Direction::STOP);
}

// TEST 7: Sensor Invalid / Degraded Behavior
bool test_sensor_invalid_degraded() {
    HazardClassifier classifier;
    RiskEngine riskEngine;
    SafeDirectionEngine directionEngine;

    SensorSnapshot snap;
    // Left sensor disconnected
    classifier.classifySnapshot(makeReading(0.0f, ReadingValidity::DISCONNECTED),
                                makeReading(25.0f), makeReading(80.0f),
                                makeNominalIMU(), false, 1000, snap);

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);
    Direction dir = directionEngine.determineDirection(snap, risk, state);

    return (state == SystemState::DEGRADED && dir == Direction::RIGHT);
}

// TEST 8: SOS Triggered -> Emergency State
bool test_sos_emergency() {
    HazardClassifier classifier;
    RiskEngine riskEngine;
    SafeDirectionEngine directionEngine;

    SensorSnapshot snap;
    classifier.classifySnapshot(makeReading(150.0f), makeReading(150.0f), makeReading(150.0f),
                                makeNominalIMU(), true, 1000, snap);

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);
    Direction dir = directionEngine.determineDirection(snap, risk, state);

    return (state == SystemState::SOS && risk == RiskLevel::CRITICAL && dir == Direction::STOP);
}

// TEST 9: Rapid Approach -> Elevated Risk
bool test_rapid_approach() {
    RiskEngine riskEngine;
    SensorSnapshot snap;
    snap.front = makeReading(80.0f);
    snap.left = makeReading(150.0f);
    snap.right = makeReading(150.0f);
    snap.imu = makeNominalIMU();
    snap.sosActive = false;

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, true, state); // rapidApproach = true

    return (risk == RiskLevel::CRITICAL && state == SystemState::CRITICAL);
}

// TEST 10: All Sensors Failed -> SENSOR_FAULT
bool test_all_sensors_fault() {
    RiskEngine riskEngine;
    SensorSnapshot snap;
    snap.front = makeReading(0.0f, ReadingValidity::DISCONNECTED);
    snap.left = makeReading(0.0f, ReadingValidity::DISCONNECTED);
    snap.right = makeReading(0.0f, ReadingValidity::DISCONNECTED);
    snap.imu = makeNominalIMU();
    snap.sosActive = false;

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);

    return (state == SystemState::SENSOR_FAULT && risk == RiskLevel::CRITICAL);
}

// TEST 11: Direction Stability Bias (Prevents Flapping)
bool test_direction_stability_bias() {
    SafeDirectionEngine directionEngine;
    SensorSnapshot snap;
    snap.front = makeReading(25.0f); // Front blocked
    snap.left = makeReading(80.0f);  // Left open
    snap.right = makeReading(60.0f); // Right open

    // First cycle: Select LEFT
    Direction dir1 = directionEngine.determineDirection(snap, RiskLevel::WARNING, SystemState::WARNING);
    if (dir1 != Direction::LEFT) return false;

    // Second cycle: Right becomes marginally clearer (82cm vs Left 80cm)
    // Because 82cm is within the 15cm switching margin, it should STAY on LEFT
    snap.right = makeReading(82.0f);
    Direction dir2 = directionEngine.determineDirection(snap, RiskLevel::WARNING, SystemState::WARNING);
    return (dir2 == Direction::LEFT);
}

// TEST 12: Front Sensor Failure -> Conservative Halt
bool test_front_sensor_failure() {
    RiskEngine riskEngine;
    SafeDirectionEngine directionEngine;

    SensorSnapshot snap;
    snap.front = makeReading(0.0f, ReadingValidity::DISCONNECTED);
    snap.left = makeReading(120.0f);
    snap.right = makeReading(120.0f);
    snap.imu = makeNominalIMU();
    snap.sosActive = false;

    SystemState state = SystemState::NORMAL;
    RiskLevel risk = riskEngine.evaluateRisk(snap, false, state);

    return (state == SystemState::DEGRADED && risk == RiskLevel::WARNING);
}

int main() {
    printf("==================================================\n");
    printf(" AngRaksha Firmware Logic Test Suite\n");
    printf(" NIRMAAN 2026 - Team Astra\n");
    printf("==================================================\n");

    RUN_TEST(test_all_clear);
    RUN_TEST(test_front_blocked_left_clear);
    RUN_TEST(test_front_blocked_right_clear);
    RUN_TEST(test_front_blocked_both_clear);
    RUN_TEST(test_all_blocked_stop);
    RUN_TEST(test_ground_hazard);
    RUN_TEST(test_sensor_invalid_degraded);
    RUN_TEST(test_sos_emergency);
    RUN_TEST(test_rapid_approach);
    RUN_TEST(test_all_sensors_fault);
    RUN_TEST(test_direction_stability_bias);
    RUN_TEST(test_front_sensor_failure);

    printf("==================================================\n");
    printf(" Summary: %d / %d Tests Passed\n", g_testsPassed, g_testsTotal);
    printf("==================================================\n");

    return (g_testsPassed == g_testsTotal) ? 0 : 1;
}
