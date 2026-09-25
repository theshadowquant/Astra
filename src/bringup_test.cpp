/*
 * ============================================================
 * ANGRAKSHA - ESP32 HARDWARE BRING-UP FIRMWARE
 * Team Astra | NIRMAAN 2026
 *
 * PURPOSE:
 *   Verify physical wiring before deploying full production
 *   firmware.
 *
 * HARDWARE:
 *   ESP32 DevKit V1 / ESP32-WROOM-32
 *   3x HC-SR04
 *   MPU6050
 *   HW-248 / NEO-6M GPS
 *   3x vibration motors through NPN drivers
 *   5V active buzzer through driver
 *   SOS push button
 *
 * ============================================================
 *
 * PIN MAP
 *
 * LEFT HC-SR04:
 *   TRIG = GPIO13
 *   ECHO = GPIO34 (Input-only pin, 1k/2k divider to 3.3V)
 *
 * FRONT HC-SR04:
 *   TRIG = GPIO25
 *   ECHO = GPIO35 (Input-only pin, 1k/2k divider to 3.3V)
 *
 * RIGHT HC-SR04:
 *   TRIG = GPIO26
 *   ECHO = GPIO36 (Input-only pin, 1k/2k divider to 3.3V)
 *
 * MPU6050:
 *   SDA = GPIO21
 *   SCL = GPIO22
 *
 * HAPTIC:
 *   LEFT   = GPIO18
 *   CENTER = GPIO19
 *   RIGHT  = GPIO23
 *
 * BUZZER:
 *   GPIO27
 *
 * SOS:
 *   GPIO33 (INPUT_PULLUP)
 *
 * GPS (HW-248 / NEO-6M):
 *   ESP32 RX = GPIO16
 *   ESP32 TX = GPIO17
 *
 * ============================================================
 *
 * IMPORTANT:
 * HC-SR04 ECHO MUST COME THROUGH:
 *
 *   HC ECHO -> 1k -> GPIO junction -> 2k -> GND
 *
 * Never connect HC-SR04 ECHO directly to ESP32 GPIO.
 *
 * ============================================================
 */

#include <Arduino.h>
#include <Wire.h>

// ============================================================
// PIN CONFIGURATION
// ============================================================

// ---------- LEFT HC-SR04 ----------
static const uint8_t PIN_LEFT_TRIG  = 13;
static const uint8_t PIN_LEFT_ECHO  = 34;

// ---------- FRONT HC-SR04 ----------
static const uint8_t PIN_FRONT_TRIG = 25;
static const uint8_t PIN_FRONT_ECHO = 35;

// ---------- RIGHT HC-SR04 ----------
static const uint8_t PIN_RIGHT_TRIG = 26;
static const uint8_t PIN_RIGHT_ECHO = 36;

// ---------- MPU6050 ----------
static const uint8_t PIN_I2C_SDA = 21;
static const uint8_t PIN_I2C_SCL = 22;

// ---------- HAPTIC MOTORS ----------
static const uint8_t PIN_MOTOR_LEFT   = 18;
static const uint8_t PIN_MOTOR_CENTER = 19;
static const uint8_t PIN_MOTOR_RIGHT  = 23;

// ---------- BUZZER ----------
static const uint8_t PIN_BUZZER = 27;

// ---------- SOS ----------
static const uint8_t PIN_SOS = 33;

// ---------- GPS ----------
static const uint8_t PIN_GPS_RX = 16;
static const uint8_t PIN_GPS_TX = 17;

// ============================================================
// GPS UART
// ============================================================

HardwareSerial GPS(2);

static const uint32_t GPS_BAUD = 9600;

// ============================================================
// MPU6050
// ============================================================

static const uint8_t MPU6050_ADDR = 0x68;

bool mpu6050Present = false;

// MPU6050 registers
static const uint8_t MPU_PWR_MGMT_1 = 0x6B;
static const uint8_t MPU_ACCEL_XOUT_H = 0x3B;

// ============================================================
// ULTRASONIC SETTINGS
// ============================================================

static const uint32_t HCSR04_TIMEOUT_US = 9000;

// Maximum useful distance for this prototype.
static const float MAX_DISTANCE_CM = 150.0f;

// Minimum valid HC-SR04 distance.
static const float MIN_DISTANCE_CM = 2.0f;

// ============================================================
// HAZARD THRESHOLDS
// ============================================================

static const float CLEAR_DISTANCE_CM = 100.0f;
static const float WARNING_DISTANCE_CM = 60.0f;
static const float DANGER_DISTANCE_CM = 35.0f;
static const float CRITICAL_DISTANCE_CM = 25.0f;

// ============================================================
// SENSOR DATA
// ============================================================

struct DistanceReading
{
    float cm;
    bool valid;
    bool timeout;
};

DistanceReading leftDistance;
DistanceReading frontDistance;
DistanceReading rightDistance;

// ============================================================
// IMU DATA
// ============================================================

struct IMUData
{
    int16_t ax;
    int16_t ay;
    int16_t az;

    int16_t gx;
    int16_t gy;
    int16_t gz;

    float accelMagnitudeG;
};

IMUData imu;

// ============================================================
// SYSTEM STATE
// ============================================================

enum SystemState
{
    STATE_ALL_CLEAR,
    STATE_GUIDE_LEFT,
    STATE_GUIDE_RIGHT,
    STATE_WARNING,
    STATE_STOP,
    STATE_GROUND_HAZARD,
    STATE_SOS,
    STATE_SENSOR_FAULT
};

SystemState currentState = STATE_ALL_CLEAR;

// ============================================================
// TIMERS
// ============================================================

unsigned long lastSensorCycle = 0;
unsigned long lastPrint = 0;
unsigned long lastHapticUpdate = 0;
unsigned long lastGPSPrint = 0;

static const unsigned long SENSOR_INTERVAL_MS = 100;
static const unsigned long PRINT_INTERVAL_MS = 500;

// ============================================================
// SOS
// ============================================================

bool sosActive = false;
bool lastSOSState = HIGH;

// ============================================================
// MPU6050 LOW-LEVEL FUNCTIONS
// ============================================================

bool mpuWriteByte(uint8_t reg, uint8_t value)
{
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(reg);
    Wire.write(value);
    return Wire.endTransmission() == 0;
}

bool mpuReadBytes(uint8_t reg, uint8_t *buffer, uint8_t length)
{
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(reg);

    if (Wire.endTransmission(false) != 0)
    {
        return false;
    }

    uint8_t received = Wire.requestFrom(
        (uint8_t)MPU6050_ADDR,
        (uint8_t)length,
        (uint8_t)1
    );

    if (received != length)
    {
        return false;
    }

    for (uint8_t i = 0; i < length; i++)
    {
        buffer[i] = Wire.read();
    }

    return true;
}

bool detectMPU6050()
{
    Wire.beginTransmission(MPU6050_ADDR);
    return Wire.endTransmission() == 0;
}

bool initMPU6050()
{
    if (!detectMPU6050())
    {
        return false;
    }

    // Wake MPU6050
    if (!mpuWriteByte(MPU_PWR_MGMT_1, 0x00))
    {
        return false;
    }

    delay(100);
    return true;
}

bool readMPU6050()
{
    uint8_t data[14];

    if (!mpuReadBytes(MPU_ACCEL_XOUT_H, data, 14))
    {
        return false;
    }

    imu.ax = (int16_t)((data[0] << 8) | data[1]);
    imu.ay = (int16_t)((data[2] << 8) | data[3]);
    imu.az = (int16_t)((data[4] << 8) | data[5]);

    imu.gx = (int16_t)((data[8] << 8) | data[9]);
    imu.gy = (int16_t)((data[10] << 8) | data[11]);
    imu.gz = (int16_t)((data[12] << 8) | data[13]);

    float axG = imu.ax / 16384.0f;
    float ayG = imu.ay / 16384.0f;
    float azG = imu.az / 16384.0f;

    imu.accelMagnitudeG =
        sqrt(
            axG * axG +
            ayG * ayG +
            azG * azG
        );

    return true;
}

// ============================================================
// HC-SR04
// ============================================================

DistanceReading readUltrasonic(
    uint8_t trigPin,
    uint8_t echoPin
)
{
    DistanceReading reading;

    reading.cm = 0.0f;
    reading.valid = false;
    reading.timeout = false;

    // Ensure trigger LOW
    digitalWrite(trigPin, LOW);
    delayMicroseconds(3);

    // 10us trigger pulse
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    // Measure echo pulse
    unsigned long duration =
        pulseIn(
            echoPin,
            HIGH,
            HCSR04_TIMEOUT_US
        );

    if (duration == 0)
    {
        reading.timeout = true;
        return reading;
    }

    // Speed of sound:
    // distance = duration / 58.0
    float distance = duration / 58.0f;

    if (
        distance >= MIN_DISTANCE_CM &&
        distance <= MAX_DISTANCE_CM
    )
    {
        reading.cm = distance;
        reading.valid = true;
    }

    return reading;
}

// ============================================================
// SENSOR FRAME
// ============================================================

void readAllDistanceSensors()
{
    // Sequential operation to prevent acoustic crosstalk
    leftDistance =
        readUltrasonic(
            PIN_LEFT_TRIG,
            PIN_LEFT_ECHO
        );

    delay(5);

    frontDistance =
        readUltrasonic(
            PIN_FRONT_TRIG,
            PIN_FRONT_ECHO
        );

    delay(5);

    rightDistance =
        readUltrasonic(
            PIN_RIGHT_TRIG,
            PIN_RIGHT_ECHO
        );
}

// ============================================================
// DISTANCE HELPERS
// ============================================================

float effectiveDistance(
    const DistanceReading &reading
)
{
    if (!reading.valid)
    {
        return MAX_DISTANCE_CM;
    }

    return reading.cm;
}

bool isBlocked(
    const DistanceReading &reading
)
{
    if (!reading.valid)
    {
        return false;
    }

    return reading.cm <= DANGER_DISTANCE_CM;
}

bool isWarning(
    const DistanceReading &reading
)
{
    if (!reading.valid)
    {
        return false;
    }

    return reading.cm <= WARNING_DISTANCE_CM;
}

// ============================================================
// HAPTIC CONTROL
// ============================================================

void allMotorsOff()
{
    digitalWrite(PIN_MOTOR_LEFT, LOW);
    digitalWrite(PIN_MOTOR_CENTER, LOW);
    digitalWrite(PIN_MOTOR_RIGHT, LOW);
}

void motorLeft()
{
    digitalWrite(PIN_MOTOR_LEFT, HIGH);
    digitalWrite(PIN_MOTOR_CENTER, LOW);
    digitalWrite(PIN_MOTOR_RIGHT, LOW);
}

void motorCenter()
{
    digitalWrite(PIN_MOTOR_LEFT, LOW);
    digitalWrite(PIN_MOTOR_CENTER, HIGH);
    digitalWrite(PIN_MOTOR_RIGHT, LOW);
}

void motorRight()
{
    digitalWrite(PIN_MOTOR_LEFT, LOW);
    digitalWrite(PIN_MOTOR_CENTER, LOW);
    digitalWrite(PIN_MOTOR_RIGHT, HIGH);
}

void motorStopPattern()
{
    digitalWrite(PIN_MOTOR_LEFT, HIGH);
    digitalWrite(PIN_MOTOR_CENTER, HIGH);
    digitalWrite(PIN_MOTOR_RIGHT, HIGH);
}

// ============================================================
// BUZZER
// ============================================================

void buzzerOff()
{
    digitalWrite(PIN_BUZZER, LOW);
}

void buzzerOn()
{
    digitalWrite(PIN_BUZZER, HIGH);
}

// ============================================================
// SOS
// ============================================================

void updateSOS()
{
    bool buttonState = digitalRead(PIN_SOS);

    // Active LOW
    if (buttonState == LOW)
    {
        sosActive = true;
    }
}

// ============================================================
// HAPTIC STATE MACHINE
// ============================================================

void determineState()
{
    // HIGHEST PRIORITY: SOS
    if (sosActive)
    {
        currentState = STATE_SOS;
        return;
    }

    // SENSOR FAILURE
    bool allFailed =
        !leftDistance.valid &&
        !frontDistance.valid &&
        !rightDistance.valid;

    if (allFailed)
    {
        currentState = STATE_SENSOR_FAULT;
        return;
    }

    // FRONT CRITICAL
    if (isBlocked(frontDistance))
    {
        bool leftBlocked = isBlocked(leftDistance);
        bool rightBlocked = isBlocked(rightDistance);

        // Everything blocked
        if (leftBlocked && rightBlocked)
        {
            currentState = STATE_STOP;
            return;
        }

        // Left available
        if (!leftBlocked && rightBlocked)
        {
            currentState = STATE_GUIDE_LEFT;
            return;
        }

        // Right available
        if (leftBlocked && !rightBlocked)
        {
            currentState = STATE_GUIDE_RIGHT;
            return;
        }

        // Both sides available -> select larger clearance
        float leftClear = effectiveDistance(leftDistance);
        float rightClear = effectiveDistance(rightDistance);

        if (leftClear >= rightClear)
        {
            currentState = STATE_GUIDE_LEFT;
        }
        else
        {
            currentState = STATE_GUIDE_RIGHT;
        }

        return;
    }

    // FRONT WARNING
    if (isWarning(frontDistance))
    {
        currentState = STATE_WARNING;
        return;
    }

    // CLEAR
    currentState = STATE_ALL_CLEAR;
}

// ============================================================
// APPLY HAPTIC OUTPUT
// ============================================================

void applyOutputs()
{
    unsigned long now = millis();

    switch (currentState)
    {
        case STATE_ALL_CLEAR:
            allMotorsOff();
            buzzerOff();
            break;

        case STATE_GUIDE_LEFT:
            buzzerOff();
            if ((now / 180) % 2 == 0)
            {
                motorLeft();
            }
            else
            {
                allMotorsOff();
            }
            break;

        case STATE_GUIDE_RIGHT:
            buzzerOff();
            if ((now / 180) % 2 == 0)
            {
                motorRight();
            }
            else
            {
                allMotorsOff();
            }
            break;

        case STATE_WARNING:
            if ((now / 250) % 2 == 0)
            {
                motorCenter();
            }
            else
            {
                allMotorsOff();
            }

            if ((now / 500) % 2 == 0)
            {
                buzzerOn();
            }
            else
            {
                buzzerOff();
            }
            break;

        case STATE_STOP:
            motorStopPattern();
            buzzerOn();
            break;

        case STATE_GROUND_HAZARD:
            motorStopPattern();
            buzzerOn();
            break;

        case STATE_SOS:
            motorStopPattern();
            if ((now / 200) % 2 == 0)
            {
                buzzerOn();
            }
            else
            {
                buzzerOff();
            }
            break;

        case STATE_SENSOR_FAULT:
            allMotorsOff();
            if ((now / 1000) % 2 == 0)
            {
                buzzerOn();
            }
            else
            {
                buzzerOff();
            }
            break;
    }
}

// ============================================================
// GROUND HAZARD CHECK
// ============================================================

bool detectGroundHazard()
{
    if (!mpu6050Present)
    {
        return false;
    }

    if (imu.accelMagnitudeG < 0.35f)
    {
        return true;
    }

    return false;
}

// ============================================================
// GPS
// ============================================================

void readGPS()
{
    while (GPS.available())
    {
        char c = GPS.read();
        Serial.write(c);
    }
}

// ============================================================
// SERIAL STATE NAME
// ============================================================

const char* stateName(SystemState state)
{
    switch (state)
    {
        case STATE_ALL_CLEAR: return "ALL_CLEAR";
        case STATE_GUIDE_LEFT: return "GUIDE_LEFT";
        case STATE_GUIDE_RIGHT: return "GUIDE_RIGHT";
        case STATE_WARNING: return "WARNING";
        case STATE_STOP: return "STOP";
        case STATE_GROUND_HAZARD: return "GROUND_HAZARD";
        case STATE_SOS: return "SOS";
        case STATE_SENSOR_FAULT: return "SENSOR_FAULT";
        default: return "UNKNOWN";
    }
}

// ============================================================
// SERIAL DIAGNOSTICS
// ============================================================

void printSensorData()
{
    Serial.println();
    Serial.println("================================================");
    Serial.println("ANGRAKSHA SENSOR FRAME");

    // LEFT
    Serial.print("LEFT   : ");
    if (leftDistance.valid)
    {
        Serial.print(leftDistance.cm, 1);
        Serial.println(" cm");
    }
    else
    {
        Serial.println("TIMEOUT / INVALID");
    }

    // FRONT
    Serial.print("FRONT  : ");
    if (frontDistance.valid)
    {
        Serial.print(frontDistance.cm, 1);
        Serial.println(" cm");
    }
    else
    {
        Serial.println("TIMEOUT / INVALID");
    }

    // RIGHT
    Serial.print("RIGHT  : ");
    if (rightDistance.valid)
    {
        Serial.print(rightDistance.cm, 1);
        Serial.println(" cm");
    }
    else
    {
        Serial.println("TIMEOUT / INVALID");
    }

    // IMU
    Serial.print("IMU    : ");
    if (mpu6050Present)
    {
        Serial.print(imu.accelMagnitudeG, 2);
        Serial.println(" g");
    }
    else
    {
        Serial.println("NOT DETECTED");
    }

    // SOS
    Serial.print("SOS    : ");
    if (sosActive)
    {
        Serial.println("ACTIVE");
    }
    else
    {
        Serial.println("READY");
    }

    // STATE
    Serial.print("STATE  : ");
    Serial.println(stateName(currentState));

    Serial.println("================================================");
}

// ============================================================
// STARTUP TEST
// ============================================================

void startupOutputTest()
{
    Serial.println();
    Serial.println("ANGRAKSHA OUTPUT TEST");
    Serial.println("Motors OFF");

    allMotorsOff();
    buzzerOff();
}

// ============================================================
// SETUP
// ============================================================

void setup()
{
    // SERIAL MONITOR
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println();
    Serial.println("############################################");
    Serial.println("      ANGRAKSHA ESP32 BRING-UP");
    Serial.println("      TEAM ASTRA | NIRMAAN 2026");
    Serial.println("############################################");
    Serial.println();

    // ULTRASONIC GPIO
    pinMode(PIN_LEFT_TRIG, OUTPUT);
    pinMode(PIN_LEFT_ECHO, INPUT);

    pinMode(PIN_FRONT_TRIG, OUTPUT);
    pinMode(PIN_FRONT_ECHO, INPUT);

    pinMode(PIN_RIGHT_TRIG, OUTPUT);
    pinMode(PIN_RIGHT_ECHO, INPUT);

    digitalWrite(PIN_LEFT_TRIG, LOW);
    digitalWrite(PIN_FRONT_TRIG, LOW);
    digitalWrite(PIN_RIGHT_TRIG, LOW);

    // MOTORS
    pinMode(PIN_MOTOR_LEFT, OUTPUT);
    pinMode(PIN_MOTOR_CENTER, OUTPUT);
    pinMode(PIN_MOTOR_RIGHT, OUTPUT);

    allMotorsOff();

    // BUZZER
    pinMode(PIN_BUZZER, OUTPUT);
    buzzerOff();

    // SOS
    pinMode(PIN_SOS, INPUT_PULLUP);

    // I2C
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    Wire.setClock(400000);

    // MPU6050
    mpu6050Present = initMPU6050();
    if (mpu6050Present)
    {
        Serial.println("[OK] MPU6050 detected at 0x68");
    }
    else
    {
        Serial.println("[WARN] MPU6050 NOT detected");
    }

    // GPS UART
    GPS.begin(GPS_BAUD, SERIAL_8N1, PIN_GPS_RX, PIN_GPS_TX);
    Serial.println("[OK] GPS UART2 initialized");
    Serial.println("      RX = GPIO16");
    Serial.println("      TX = GPIO17");

    // OUTPUTS
    startupOutputTest();

    Serial.println();
    Serial.println("[READY] AngRaksha hardware test firmware running.");
    Serial.println("Open Serial Monitor at 115200 baud.");
    Serial.println();
}

// ============================================================
// MAIN LOOP
// ============================================================

void loop()
{
    unsigned long now = millis();

    // SOS
    updateSOS();

    // SENSOR FRAME
    if (now - lastSensorCycle >= SENSOR_INTERVAL_MS)
    {
        lastSensorCycle = now;

        readAllDistanceSensors();

        if (mpu6050Present)
        {
            if (!readMPU6050())
            {
                mpu6050Present = false;
                Serial.println("[WARN] MPU6050 read failure");
            }
        }

        if (detectGroundHazard())
        {
            if (!sosActive)
            {
                currentState = STATE_GROUND_HAZARD;
            }
        }
        else
        {
            if (!sosActive)
            {
                determineState();
            }
        }
    }

    // OUTPUT CONTROL
    if (now - lastHapticUpdate >= 20)
    {
        lastHapticUpdate = now;
        applyOutputs();
    }

    // SERIAL TELEMETRY
    if (now - lastPrint >= PRINT_INTERVAL_MS)
    {
        lastPrint = now;
        printSensorData();
    }

    // GPS
    readGPS();
}
