# AngRaksha — Web Platform Architecture & Telematics Infrastructure

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  
**Problem Statement:** Directional Hazard Detection and Intuitive Spatial Haptic Guidance for Visually Impaired Pedestrians  

---

## 1. System Architecture & Zero-Cloud Decoupling Principle

```
                    ┌────────────────────────────────────────────────────────┐
                    │               AngRaksha Cane Prototype                │
                    │   (ESP32 + 3x HC-SR04 + MPU6050 + 3x Haptic Motors)    │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                                 [ Hardware Telematics Bus ]
                                                │
                ┌───────────────────────────────┴───────────────────────────────┐
                ▼                                                               ▼
  [ Local Non-Blocking Pipeline ]                                [ Connectivity & Web Subsystem ]
  - Ultrasonic Ping Scheduler                                    - Hardware UART GPS Link (NEO-6M / HW-248)
  - Hazard Classifier (Hysteresis)                               - ESP32 Local SoftAP ("AngRaksha-Guardian")
  - Risk Severity Engine                                         - HTTP/JSON Telematics Dispatch
  - Safe Direction Scoring                                                      │
  - Spatial 3-Motor Pulse Matrix                                                ▼
  - High-Decibel Buzzer Alert                                     [ Guardian Web Platform (Next.js) ]
                │                                                - Realtime Spatial Radar Visualizer
                │                                                - Interactive Leaflet.js Live Rescue Map
                ▼                                                - Instant Full-Screen SOS Emergency Alert
      [ 100% Offline Autonomy ]                                  - Hackathon Interactive Scenario Simulator
   (Zero Network/Cloud Dependency)                               - Telematics Audit Trail & Device Profiling
```

> [!IMPORTANT]
> **Safety Invariance Rule**: The local embedded hazard-detection and spatial haptic guidance pipeline NEVER waits for or depends on internet connectivity, GPS satellite locks, or server responses. If network connection fails, local pedestrian guidance continues uninterrupted.

---

## 2. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (App Router) / React 18** | High-performance server-rendered UI + client-side dynamic polling |
| **Language & Types** | **TypeScript 5.7** | Strict type safety ensuring telemetry payload invariance |
| **Styling & Theme** | **Tailwind CSS (Dark Mode)** | High-contrast accessible design system with emergency alert keyframes |
| **Mapping Engine** | **Leaflet.js + OpenStreetMap** | Smooth client-side rendering with location trails and zero vendor lock-in |
| **Icons & Visuals** | **Lucide React** | Clean, accessible vector icons for spatial directions and hardware nodes |
| **Embedded SoftAP** | **ESP32 Core WebServer** | Zero-configuration standalone deployment at `http://192.168.4.1` |

---

## 3. Web Pages & Application Structure

- `/dashboard`: Primary Guardian Dashboard with live spatial radar gauges, active directional vector indicator, embedded Leaflet map, and hardware status cards.
- `/live-location`: Dedicated full-screen rescue map with historical movement breadcrumb trails (5m, 15m, 30m, 1h), kinematic velocity, and heading azimuth.
- `/simulator`: Interactive Hackathon Simulator Console with 8 pre-programmed mobility scenarios allowing live demonstration of obstacle avoidance, dead ends, pothole drops, and SOS events.
- `/devices/[deviceId]`: Hardware telemetry and pinout inspector showing real-time registers, battery voltage, and firmware version.
- `/events`: Real-time system audit log with severity filtering (`CRITICAL`, `WARNING`, `INFO`).
