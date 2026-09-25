-- ============================================================
-- ANGRAKSHA GUARDIAN — SUPABASE DATABASE SCHEMA
-- Team Astra | NIRMAAN 2026
--
-- RUN THIS ENTIRE SCRIPT IN:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- TABLE 1: device_state
-- One row per device. Upserted on every telemetry POST.
-- Realtime enabled — broadcasts to all subscribed dashboards.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_state (
  device_id   TEXT PRIMARY KEY,
  person_name TEXT NOT NULL DEFAULT 'Rajesh K.',
  payload     JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- TABLE 2: location_trail
-- Time-series GPS breadcrumb trail. One row per telemetry
-- cycle (when location changes). Max last-100 per device.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_trail (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   TEXT NOT NULL REFERENCES device_state(device_id) ON DELETE CASCADE,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  accuracy_m  DOUBLE PRECISION DEFAULT 4.2,
  speed_kmh   DOUBLE PRECISION DEFAULT 0,
  heading_deg DOUBLE PRECISION DEFAULT 0,
  source      TEXT DEFAULT 'DEVICE_LIVE',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trail_device_recent
  ON location_trail (device_id, recorded_at DESC);

-- ──────────────────────────────────────────────────────────
-- TABLE 3: system_events
-- Safety, geofence, SOS, hazard event log.
-- Realtime enabled — INSERT broadcasts to dashboard event feed.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_events (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  description TEXT NOT NULL,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  source      TEXT DEFAULT 'DEVICE_LIVE',
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_device_recent
  ON system_events (device_id, created_at DESC);

-- ──────────────────────────────────────────────────────────
-- TABLE 4: sos_events
-- SOS activations with full audit trail.
-- Realtime enabled — INSERT broadcasts critical alarm modal.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_events (
  id              TEXT PRIMARY KEY,
  device_id       TEXT NOT NULL,
  triggered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude        DOUBLE PRECISION NOT NULL DEFAULT 12.9716,
  longitude       DOUBLE PRECISION NOT NULL DEFAULT 77.5946,
  battery_percent INTEGER DEFAULT 100,
  status          TEXT DEFAULT 'ACTIVE',
  source          TEXT DEFAULT 'DEVICE_LIVE',
  acknowledged_at TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ
);

-- ──────────────────────────────────────────────────────────
-- SEED: Default ASTRA-001 device row
-- Dashboard shows "OFFLINE" until real hardware connects.
-- ──────────────────────────────────────────────────────────
INSERT INTO device_state (device_id, person_name, payload, updated_at)
VALUES (
  'ASTRA-001',
  'Rajesh K.',
  '{
    "deviceId": "ASTRA-001",
    "personName": "Rajesh K.",
    "status": "OFFLINE",
    "source": "DEVICE_LIVE",
    "timestamp": "2026-01-01T00:00:00Z",
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "fix": "NO_FIX",
      "accuracyM": 4.2,
      "speedKmh": 0,
      "headingDeg": 0,
      "updatedAt": "2026-01-01T00:00:00Z",
      "source": "DEVICE_LIVE"
    },
    "battery": { "percent": 100, "voltage": 3.9, "status": "HEALTHY" },
    "sensors": {
      "left":  { "distanceCm": 400, "status": "VALID" },
      "front": { "distanceCm": 400, "status": "VALID" },
      "right": { "distanceCm": 400, "status": "VALID" },
      "waterDetected": false, "waterAdcValue": 0,
      "dropStairDetected": false, "imuStatus": "OK",
      "accelMagnitudeG": 1.0, "pitchDeg": 0
    },
    "navigation": {
      "guidance": "FORWARD", "risk": "CLEAR",
      "state": "ALL_CLEAR",
      "description": "Awaiting live device telemetry..."
    },
    "emergency": { "sosActive": false },
    "geofence": {
      "status": "INSIDE",
      "distanceToCenterM": 0,
      "config": {
        "id": "GEO-001",
        "name": "Home & Neighbourhood Safe Zone",
        "centerLat": 12.9716, "centerLng": 77.5946,
        "radiusMeters": 500, "enabled": true
      }
    },
    "health": {
      "esp32": "HEALTHY", "gps": "HEALTHY", "mpu6050": "HEALTHY",
      "leftUltrasonic": "HEALTHY", "frontUltrasonic": "HEALTHY",
      "rightUltrasonic": "HEALTHY", "waterSensor": "HEALTHY",
      "haptics": "HEALTHY", "buzzer": "HEALTHY",
      "sosButton": "HEALTHY", "battery": "HEALTHY"
    },
    "connectivity": {
      "lastSeen": "2026-01-01T00:00:00Z",
      "controlLatencyMs": 3.2, "scanDurationMs": 27.4,
      "scanBoundMs": 42, "heartbeatAgeSec": 0
    }
  }',
  NOW()
)
ON CONFLICT (device_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- REALTIME: Enable publication for live push to dashboards.
-- This broadcasts INSERT/UPDATE/DELETE on these tables to
-- all Supabase Realtime WebSocket subscribers.
-- ──────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE device_state;
ALTER PUBLICATION supabase_realtime ADD TABLE system_events;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_events;

-- ──────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (optional but recommended for production)
-- For the hackathon, we allow all reads via anon key.
-- ──────────────────────────────────────────────────────────
ALTER TABLE device_state   ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events     ENABLE ROW LEVEL SECURITY;

-- Allow anon (dashboard) to SELECT (read-only)
CREATE POLICY "Public read device_state"
  ON device_state FOR SELECT USING (true);

CREATE POLICY "Public read location_trail"
  ON location_trail FOR SELECT USING (true);

CREATE POLICY "Public read system_events"
  ON system_events FOR SELECT USING (true);

CREATE POLICY "Public read sos_events"
  ON sos_events FOR SELECT USING (true);

-- Service role (API backend) has full access — bypasses RLS
-- (service_role key always bypasses RLS automatically in Supabase)
