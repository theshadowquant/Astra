'use client';

import React, { useState, useEffect } from 'react';
import { DeviceState, SystemEvent, DeviceLocation } from '@/types';
import SpatialRadar from '@/components/SpatialRadar';
import DirectionIndicator from '@/components/DirectionIndicator';
import LiveMap from '@/components/LiveMap';
import SOSAlertModal from '@/components/SOSAlertModal';
import DeviceStatusCard from '@/components/DeviceStatusCard';
import SensorHealthMatrix from '@/components/SensorHealthMatrix';
import RecentEventsList from '@/components/RecentEventsList';
import { Shield, Radio, Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [trail, setTrail] = useState<DeviceLocation[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchDeviceData = async () => {
    try {
      const res = await fetch('/api/device/ASTRA-001');
      if (res.ok) {
        const data = await res.json();
        setDevice(data.device);
        setTrail(data.trail || []);
        setEvents(data.events || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to fetch live telemetry', err);
    }
  };

  useEffect(() => {
    fetchDeviceData();
    const interval = setInterval(() => {
      if (isPolling) {
        fetchDeviceData();
      }
    }, 200); // 5 Hz Realtime Poll

    return () => clearInterval(interval);
  }, [isPolling]);

  const handleAcknowledgeSOS = async () => {
    await fetch('/api/device/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: 'ASTRA-001', action: 'ACKNOWLEDGE' }),
    });
    fetchDeviceData();
  };

  const handleResetSOS = async () => {
    await fetch('/api/device/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: 'ASTRA-001', action: 'RESET' }),
    });
    fetchDeviceData();
  };

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Connecting to AngRaksha Realtime Telemetry Bus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SOS Alert Modal */}
      <SOSAlertModal
        active={device.sos.active}
        deviceId={device.deviceId}
        latitude={device.gps.latitude || 12.9716}
        longitude={device.gps.longitude || 77.5946}
        batteryPercent={device.batteryPercent}
        triggeredAt={device.sos.triggeredAt}
        acknowledged={device.sos.acknowledged}
        onAcknowledge={handleAcknowledgeSOS}
        onReset={handleResetSOS}
      />

      {/* Top Banner & Fast Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Guardian Safety Dashboard</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Pedestrian: <b className="text-slate-200">Rajesh K.</b> • Device ID: <span className="font-mono text-cyan-400 font-semibold">{device.deviceId}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/simulator"
            className="px-3.5 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            Open Demo Simulator Console
          </Link>
          <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
            Updated: {lastUpdated}
          </div>
        </div>
      </div>

      {/* Primary Guidance & Vector Bar */}
      <DirectionIndicator safety={device.safety} sensors={device.sensors} />

      {/* Main Grid: Spatial Radar & Device Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Spatial Ultrasonic Matrix */}
          <SpatialRadar sensors={device.sensors} />

          {/* Live Location Map */}
          <LiveMap
            latitude={device.gps.latitude || 12.9716}
            longitude={device.gps.longitude || 77.5946}
            gpsStatus={device.gps.status}
            accuracyMeters={device.gps.accuracyMeters}
            trail={trail}
            sosActive={device.sos.active}
          />
        </div>

        {/* Right Sidebar: Telemetry, Hardware & Audit Log */}
        <div className="space-y-6">
          <DeviceStatusCard device={device} />
          <SensorHealthMatrix sensors={device.sensors} gps={device.gps} />
          <RecentEventsList events={events} />
        </div>
      </div>
    </div>
  );
}
