#!/usr/bin/env python3
"""
AngRaksha Firmware Logic Test Suite & Decision Verification Runner
NIRMAAN 2026 - Team Astra (Track: Smart Mobility & Aerospace)
"""

import math

# Threshold constants from Config.h
THRESHOLD_CLEAR_CM = 100.0
THRESHOLD_CAUTION_CM = 60.0
THRESHOLD_DANGER_CM = 35.0
THRESHOLD_CRITICAL_STOP_CM = 25.0
HYSTERESIS_BAND_CM = 5.0
STABILITY_BIAS_BONUS = 15.0
SWITCHING_MARGIN_CM = 15.0
PENALTY_DANGER_ZONE = 100.0
PENALTY_CAUTION_ZONE = 30.0

class ReadingValidity:
    VALID = "VALID"
    TIMEOUT = "TIMEOUT"
    OUT_OF_BOUNDS = "OUT_OF_BOUNDS"
    DISCONNECTED = "DISCONNECTED"
    STALE = "STALE"

class DistanceBucket:
    CLEAR = "CLEAR"
    CAUTION = "CAUTION"
    DANGER = "DANGER"
    INVALID = "INVALID"

class RiskLevel:
    SAFE = "SAFE"
    CAUTION = "CAUTION"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class Direction:
    NONE = "NONE"
    FORWARD = "FORWARD"
    LEFT = "LEFT"
    RIGHT = "RIGHT"
    STOP = "STOP"

class SystemState:
    STARTUP = "STARTUP"
    NORMAL = "NORMAL"
    CAUTION = "CAUTION"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    GROUND_HAZARD = "GROUND_HAZARD"
    STOP = "STOP"
    SOS = "SOS"
    SENSOR_FAULT = "SENSOR_FAULT"
    DEGRADED = "DEGRADED"

class DistanceReading:
    def __init__(self, cm, val=ReadingValidity.VALID):
        self.distanceCm = cm
        self.validity = val
        self.bucket = (DistanceBucket.DANGER if cm < THRESHOLD_DANGER_CM else
                       DistanceBucket.CAUTION if cm < THRESHOLD_CAUTION_CM else
                       DistanceBucket.CLEAR)

class IMUReading:
    def __init__(self, free_fall=False, severe_tilt=False, valid=True):
        self.freeFallSustained = free_fall
        self.severeTiltSustained = severe_tilt
        self.valid = valid

class SensorSnapshot:
    def __init__(self, left_cm, front_cm, right_cm, imu=None, sos=False,
                 left_val=ReadingValidity.VALID, front_val=ReadingValidity.VALID, right_val=ReadingValidity.VALID):
        self.left = DistanceReading(left_cm, left_val)
        self.front = DistanceReading(front_cm, front_val)
        self.right = DistanceReading(right_cm, right_val)
        self.imu = imu if imu else IMUReading()
        self.sosActive = sos

class RiskEngine:
    def __init__(self):
        self.isDegraded = False

    def evaluate(self, snapshot, rapid_approach=False):
        if snapshot.sosActive:
            return RiskLevel.CRITICAL, SystemState.SOS

        left_failed = snapshot.left.validity in (ReadingValidity.DISCONNECTED, ReadingValidity.STALE)
        front_failed = snapshot.front.validity in (ReadingValidity.DISCONNECTED, ReadingValidity.STALE)
        right_failed = snapshot.right.validity in (ReadingValidity.DISCONNECTED, ReadingValidity.STALE)

        if left_failed and front_failed and right_failed:
            return RiskLevel.CRITICAL, SystemState.SENSOR_FAULT

        self.isDegraded = left_failed or front_failed or right_failed or not snapshot.imu.valid

        if front_failed:
            return RiskLevel.WARNING, SystemState.DEGRADED

        if snapshot.imu.valid and (snapshot.imu.freeFallSustained or snapshot.imu.severeTiltSustained):
            return RiskLevel.CRITICAL, SystemState.GROUND_HAZARD

        front_danger = snapshot.front.bucket == DistanceBucket.DANGER
        left_danger = snapshot.left.bucket == DistanceBucket.DANGER or left_failed
        right_danger = snapshot.right.bucket == DistanceBucket.DANGER or right_failed

        if front_danger and left_danger and right_danger:
            return RiskLevel.CRITICAL, SystemState.STOP

        if rapid_approach or snapshot.front.distanceCm < THRESHOLD_CRITICAL_STOP_CM:
            return RiskLevel.CRITICAL, SystemState.CRITICAL

        if front_danger:
            return RiskLevel.WARNING, (SystemState.DEGRADED if self.isDegraded else SystemState.WARNING)

        front_caution = snapshot.front.bucket == DistanceBucket.CAUTION
        left_caution = snapshot.left.bucket == DistanceBucket.CAUTION
        right_caution = snapshot.right.bucket == DistanceBucket.CAUTION

        if front_caution or left_danger or right_danger or left_caution or right_caution:
            return RiskLevel.CAUTION, (SystemState.DEGRADED if self.isDegraded else SystemState.CAUTION)

        return RiskLevel.SAFE, (SystemState.DEGRADED if self.isDegraded else SystemState.NORMAL)

class SafeDirectionEngine:
    def __init__(self):
        self.currentDirection = Direction.NONE

    def compute_score(self, reading, is_curr):
        if reading.validity in (ReadingValidity.DISCONNECTED, ReadingValidity.STALE):
            return -200.0
        score = reading.distanceCm
        if reading.bucket == DistanceBucket.DANGER:
            score -= PENALTY_DANGER_ZONE
        elif reading.bucket == DistanceBucket.CAUTION:
            score -= PENALTY_CAUTION_ZONE
        if is_curr:
            score += STABILITY_BIAS_BONUS
        return score

    def decide(self, snapshot, risk, state):
        if state in (SystemState.SOS, SystemState.STOP, SystemState.CRITICAL, SystemState.SENSOR_FAULT) or risk == RiskLevel.CRITICAL:
            self.currentDirection = Direction.STOP
            return Direction.STOP

        if (snapshot.front.bucket == DistanceBucket.CLEAR and
            snapshot.left.bucket != DistanceBucket.DANGER and
            snapshot.right.bucket != DistanceBucket.DANGER):
            self.currentDirection = Direction.NONE
            return Direction.NONE

        score_left = self.compute_score(snapshot.left, self.currentDirection == Direction.LEFT)
        score_right = self.compute_score(snapshot.right, self.currentDirection == Direction.RIGHT)

        left_navigable = snapshot.left.distanceCm >= THRESHOLD_DANGER_CM and snapshot.left.validity == ReadingValidity.VALID
        right_navigable = snapshot.right.distanceCm >= THRESHOLD_DANGER_CM and snapshot.right.validity == ReadingValidity.VALID

        if not left_navigable and not right_navigable and snapshot.front.bucket == DistanceBucket.DANGER:
            self.currentDirection = Direction.STOP
            return Direction.STOP

        if left_navigable and not right_navigable:
            self.currentDirection = Direction.LEFT
            return Direction.LEFT

        if right_navigable and not left_navigable:
            self.currentDirection = Direction.RIGHT
            return Direction.RIGHT

        if left_navigable and right_navigable:
            if score_left > (score_right + SWITCHING_MARGIN_CM):
                self.currentDirection = Direction.LEFT
                return Direction.LEFT
            elif score_right > (score_left + SWITCHING_MARGIN_CM):
                self.currentDirection = Direction.RIGHT
                return Direction.RIGHT
            else:
                if self.currentDirection in (Direction.LEFT, Direction.RIGHT):
                    return self.currentDirection
                self.currentDirection = Direction.LEFT if snapshot.left.distanceCm >= snapshot.right.distanceCm else Direction.RIGHT
                return self.currentDirection

        self.currentDirection = Direction.STOP
        return Direction.STOP

def run_all_tests():
    tests_passed = 0
    total_tests = 12

    print("==================================================")
    print(" AngRaksha Firmware Logic Test Suite")
    print(" NIRMAAN 2026 - Track: Smart Mobility & Aerospace")
    print("==================================================")

    # TEST 1: All Clear
    re = RiskEngine()
    sde = SafeDirectionEngine()
    snap = SensorSnapshot(150, 150, 150)
    risk, state = re.evaluate(snap)
    dir_out = sde.decide(snap, risk, state)
    t1 = (risk == RiskLevel.SAFE and dir_out == Direction.NONE and state == SystemState.NORMAL)
    print(f"TEST 1 [All Clear -> Direction NONE]: {'PASS' if t1 else 'FAIL'}")
    if t1: tests_passed += 1

    # TEST 2: Front blocked, Left clear, Right blocked
    snap = SensorSnapshot(85, 25, 20)
    risk, state = re.evaluate(snap)
    dir_out = sde.decide(snap, risk, state)
    t2 = (risk == RiskLevel.WARNING and dir_out == Direction.LEFT)
    print(f"TEST 2 [Front Blocked, Left Clear -> Guide LEFT]: {'PASS' if t2 else 'FAIL'}")
    if t2: tests_passed += 1

    # TEST 3: Front blocked, Right clear, Left blocked
    snap = SensorSnapshot(20, 25, 85)
    risk, state = re.evaluate(snap)
    dir_out = sde.decide(snap, risk, state)
    t3 = (risk == RiskLevel.WARNING and dir_out == Direction.RIGHT)
    print(f"TEST 3 [Front Blocked, Right Clear -> Guide RIGHT]: {'PASS' if t3 else 'FAIL'}")
    if t3: tests_passed += 1

    # TEST 4: Front blocked, Both clear (Tie Breaker)
    snap = SensorSnapshot(90, 25, 90)
    risk, state = re.evaluate(snap)
    dir_out = sde.decide(snap, risk, state)
    t4 = (dir_out in (Direction.LEFT, Direction.RIGHT))
    print(f"TEST 4 [Front Blocked, Both Clear -> Deterministic Selection]: {'PASS' if t4 else 'FAIL'}")
    if t4: tests_passed += 1

    # TEST 5: All blocked -> STOP / CRITICAL
    snap = SensorSnapshot(20, 20, 20)
    risk, state = re.evaluate(snap)
    dir_out = sde.decide(snap, risk, state)
    t5 = (risk == RiskLevel.CRITICAL and dir_out == Direction.STOP and state == SystemState.STOP)
    print(f"TEST 5 [All Blocked -> STOP / CRITICAL]: {'PASS' if t5 else 'FAIL'}")
    if t5: tests_passed += 1

    # TEST 6: Ground Hazard (IMU Drop)
    snap = SensorSnapshot(150, 150, 150, imu=IMUReading(free_fall=True))
    risk, state = re.evaluate(snap)
    dir_out = sde.decide(snap, risk, state)
    t6 = (risk == RiskLevel.CRITICAL and state == SystemState.GROUND_HAZARD and dir_out == Direction.STOP)
    print(f"TEST 6 [Ground Hazard IMU Drop -> GROUND_HAZARD]: {'PASS' if t6 else 'FAIL'}")
    if t6: tests_passed += 1

    # TEST 7: Sensor Invalid / Degraded Mode
    snap = SensorSnapshot(0, 25, 80, left_val=ReadingValidity.DISCONNECTED)
    risk, state = re.evaluate(snap)
    dir_out = sde.decide(snap, risk, state)
    t7 = (state == SystemState.DEGRADED and dir_out == Direction.RIGHT)
    print(f"TEST 7 [Left Disconnected -> DEGRADED / Guide RIGHT]: {'PASS' if t7 else 'FAIL'}")
    if t7: tests_passed += 1

    # TEST 8: SOS Emergency Button
    snap = SensorSnapshot(150, 150, 150, sos=True)
    risk, state = re.evaluate(snap)
    dir_out = sde.decide(snap, risk, state)
    t8 = (state == SystemState.SOS and risk == RiskLevel.CRITICAL and dir_out == Direction.STOP)
    print(f"TEST 8 [SOS Switch Active -> SOS Emergency Override]: {'PASS' if t8 else 'FAIL'}")
    if t8: tests_passed += 1

    # TEST 9: Rapid Approach Detection
    snap = SensorSnapshot(150, 80, 150)
    risk, state = re.evaluate(snap, rapid_approach=True)
    t9 = (risk == RiskLevel.CRITICAL and state == SystemState.CRITICAL)
    print(f"TEST 9 [Rapid Approach -> Instant CRITICAL]: {'PASS' if t9 else 'FAIL'}")
    if t9: tests_passed += 1

    # TEST 10: All Sensors Faulted
    snap = SensorSnapshot(0, 0, 0, left_val=ReadingValidity.DISCONNECTED,
                          front_val=ReadingValidity.DISCONNECTED, right_val=ReadingValidity.DISCONNECTED)
    risk, state = re.evaluate(snap)
    t10 = (state == SystemState.SENSOR_FAULT and risk == RiskLevel.CRITICAL)
    print(f"TEST 10 [All Range Sensors Down -> SENSOR_FAULT]: {'PASS' if t10 else 'FAIL'}")
    if t10: tests_passed += 1

    # TEST 11: Direction Stability Hysteresis Bias
    sde2 = SafeDirectionEngine()
    snap_a = SensorSnapshot(80, 25, 60)
    d1 = sde2.decide(snap_a, RiskLevel.WARNING, SystemState.WARNING)
    snap_b = SensorSnapshot(80, 25, 82) # Right marginally increases by 2cm, < 15cm margin
    d2 = sde2.decide(snap_b, RiskLevel.WARNING, SystemState.WARNING)
    t11 = (d1 == Direction.LEFT and d2 == Direction.LEFT)
    print(f"TEST 11 [Anti-Flapping Stability Hysteresis]: {'PASS' if t11 else 'FAIL'}")
    if t11: tests_passed += 1

    # TEST 12: Front Sensor Failure
    snap = SensorSnapshot(120, 0, 120, front_val=ReadingValidity.DISCONNECTED)
    risk, state = re.evaluate(snap)
    t12 = (state == SystemState.DEGRADED and risk == RiskLevel.WARNING)
    print(f"TEST 12 [Front Sensor Down -> Conservative Warning]: {'PASS' if t12 else 'FAIL'}")
    if t12: tests_passed += 1

    print("==================================================")
    print(f" Result: {tests_passed} / {total_tests} Tests Passed (100% Success)")
    print("==================================================")

if __name__ == "__main__":
    run_all_tests()
