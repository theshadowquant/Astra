# AngRaksha — Supabase Database & Realtime Setup

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  

---

## 1. Database Schema SQL

Run this SQL script in your Supabase SQL Editor to provision the persistent tables and realtime replication channels:

```sql
-- Enable PostGIS extension for spatial queries (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Devices Table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'ONLINE',
    battery_percent INT DEFAULT 100,
    battery_voltage NUMERIC(4, 2) DEFAULT 4.2,
    firmware_version VARCHAR(32) DEFAULT '1.0.0',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Device Locations History
CREATE TABLE device_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) REFERENCES devices(device_id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy NUMERIC(5, 2),
    speed NUMERIC(5, 2),
    heading NUMERIC(5, 2),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Telemetry Log
CREATE TABLE telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) REFERENCES devices(device_id) ON DELETE CASCADE,
    left_distance INT,
    front_distance INT,
    right_distance INT,
    risk_level VARCHAR(32),
    direction VARCHAR(32),
    system_state VARCHAR(32),
    accel_g NUMERIC(5, 2),
    pitch_deg NUMERIC(5, 2),
    ground_hazard BOOLEAN DEFAULT FALSE,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Emergency SOS Events
CREATE TABLE sos_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) REFERENCES devices(device_id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(32) DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE devices, device_locations, telemetry_logs, sos_events;

-- Create Indexes for High-Throughput Queries
CREATE INDEX idx_locations_device_time ON device_locations (device_id, recorded_at DESC);
CREATE INDEX idx_telemetry_device_time ON telemetry_logs (device_id, recorded_at DESC);
CREATE INDEX idx_sos_status ON sos_events (status);
```

---

## 2. Environment Configuration

Create `.env.local` in `web/`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```
