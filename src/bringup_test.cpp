#include <Arduino.h>

// ==================== PIN DEFINITIONS ====================
// Ultrasonic Sensor 1 (Center / Front)
#define TRIG_PIN_CENTER   19
#define ECHO_PIN_CENTER   23

// Ultrasonic Sensor 2 (Left)
#define TRIG_PIN_LEFT     5
#define ECHO_PIN_LEFT     18

// Ultrasonic Sensor 3 (Right)
#define TRIG_PIN_RIGHT    13
#define ECHO_PIN_RIGHT    14

// Actuators
#define BUZZER_PIN        4    // Active 5V Piezo Buzzer
#define MOTOR_LEFT_PIN    25   // Left Vibration Motor
#define MOTOR_RIGHT_PIN   27   // Right Vibration Motor

// Water / Liquid Sensing Electrode
// Connect one wire/probe to 3.3V, and the other wire to GPIO 34 with a 10k pulldown to GND
// OR connect one probe to GND and GPIO 34 with internal pullup
#define WATER_SENSOR_PIN  34   // ADC pin (Input only on ESP32)

// ==================== THRESHOLDS ====================
#define WATER_THRESHOLD   1500 // ADC value threshold for liquid conduction (0 - 4095)
#define MAX_DISTANCE_CM   200  // Maximum detection range (2 meters)

// Helper function to read HC-SR04 in centimeters (clean & direct)
float readDistance(uint8_t trigPin, uint8_t echoPin) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    
    // 25ms timeout (~400cm max envelope)
    unsigned long duration = pulseIn(echoPin, HIGH, 25000);
    if (duration == 0) return 400.0f; // No echo / clear
    
    return (float)duration * 0.0343f / 2.0f;
}

void setup() {
    Serial.begin(115200);
    delay(500);

    // Ultrasonic Pin Modes
    pinMode(TRIG_PIN_CENTER, OUTPUT);
    pinMode(ECHO_PIN_CENTER, INPUT);
    pinMode(TRIG_PIN_LEFT, OUTPUT);
    pinMode(ECHO_PIN_LEFT, INPUT);
    pinMode(TRIG_PIN_RIGHT, OUTPUT);
    pinMode(ECHO_PIN_RIGHT, INPUT);

    // Actuator Pin Modes
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(MOTOR_LEFT_PIN, OUTPUT);
    pinMode(MOTOR_RIGHT_PIN, OUTPUT);

    // Liquid Electrode (GPIO 34 is analog input)
    pinMode(WATER_SENSOR_PIN, INPUT);

    // Initial safe states
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(MOTOR_LEFT_PIN, LOW);
    digitalWrite(MOTOR_RIGHT_PIN, LOW);

    Serial.println("=========================================");
    Serial.println("  AngRaksha Assistive Device Online!     ");
    Serial.println("=========================================");
}

void loop() {
    // ----------------- 1. LIQUID / WATER DETECTION -----------------
    int waterVal = analogRead(WATER_SENSOR_PIN);
    bool liquidDetected = (waterVal > WATER_THRESHOLD);

    if (liquidDetected) {
        Serial.printf("[ALERT] Liquid / Pothole Water Detected! (ADC: %d)\n", waterVal);
        // Continuous loud beep alarm for water
        digitalWrite(BUZZER_PIN, HIGH);
        digitalWrite(MOTOR_LEFT_PIN, HIGH);
        digitalWrite(MOTOR_RIGHT_PIN, HIGH);
        delay(150);
        digitalWrite(BUZZER_PIN, LOW);
        delay(100);
        return; // Prioritize safety warning
    }

    // ----------------- 2. DISTANCE MEASUREMENTS -----------------
    float distFront = readDistance(TRIG_PIN_CENTER, ECHO_PIN_CENTER);
    delay(10); // Small guard time to prevent sound echo bounce
    float distLeft  = readDistance(TRIG_PIN_LEFT, ECHO_PIN_LEFT);
    delay(10);
    float distRight = readDistance(TRIG_PIN_RIGHT, ECHO_PIN_RIGHT);

    // Find the closest detected obstacle
    float minDistance = distFront;
    if (distLeft < minDistance) minDistance = distLeft;
    if (distRight < minDistance) minDistance = distRight;

    // Convert to Meters
    float distanceMeters = minDistance / 100.0f;

    // ----------------- 3. SPEAK / PRINT DISTANCE -----------------
    Serial.print("Obstacle Distance: ");
    if (minDistance >= MAX_DISTANCE_CM) {
        Serial.println("Clear (> 2.0 m)");
        digitalWrite(BUZZER_PIN, LOW);
        digitalWrite(MOTOR_LEFT_PIN, LOW);
        digitalWrite(MOTOR_RIGHT_PIN, LOW);
        delay(100);
    } else {
        Serial.printf("%.2f Meters (%.0f cm) | Front: %.0f cm, Left: %.0f cm, Right: %.0f cm\n", 
                      distanceMeters, minDistance, distFront, distLeft, distRight);

        // Directional Vibration Assist
        if (distLeft < 50.0f) {
            digitalWrite(MOTOR_LEFT_PIN, HIGH);
        } else {
            digitalWrite(MOTOR_LEFT_PIN, LOW);
        }

        if (distRight < 50.0f) {
            digitalWrite(MOTOR_RIGHT_PIN, HIGH);
        } else {
            digitalWrite(MOTOR_RIGHT_PIN, LOW);
        }

        // ----------------- 4. PROXIMITY BEEPING -----------------
        // Closer obstacle = shorter delay between beeps
        if (minDistance <= 25.0f) {
            // Imminent stop: Solid tone
            digitalWrite(BUZZER_PIN, HIGH);
            delay(100);
            digitalWrite(BUZZER_PIN, LOW);
            delay(30);
        } else if (minDistance <= 60.0f) {
            // Very close: Fast beeps
            digitalWrite(BUZZER_PIN, HIGH);
            delay(50);
            digitalWrite(BUZZER_PIN, LOW);
            delay(70);
        } else if (minDistance <= 120.0f) {
            // Approaching: Medium pace beeps
            digitalWrite(BUZZER_PIN, HIGH);
            delay(60);
            digitalWrite(BUZZER_PIN, LOW);
            delay(180);
        } else {
            // Far warning: Slow beeps
            digitalWrite(BUZZER_PIN, HIGH);
            delay(80);
            digitalWrite(BUZZER_PIN, LOW);
            delay(400);
        }
    }
}