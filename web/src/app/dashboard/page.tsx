'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DeviceStatusCard from '@/components/DeviceStatusCard';
import DirectionIndicator from '@/components/DirectionIndicator';
import SpatialRadar from '@/components/SpatialRadar';
import RecentEventsList from '@/components/RecentEventsList';
import SOSAlertModal from '@/components/SOSAlertModal';
import LiveMap from '@/components/LiveMap';
import { DeviceState, SystemEvent, DeviceLocation } from '@/types';
import { ShieldCheck, MapPin, Activity, Sliders, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [trail, setTrail] = useState<DeviceLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll device state every 1s
  const fetchState = async () => {
    try {
      const res = await fetch('/api/device/ASTRA-001');
      if (res.ok) {
        const data = await res.json();
        setDevice(data.device);
        setEvents(data.events || []);
        setTrail(data.trail || []);
      }
    } catch (err) {
      console.error('Failed to fetch live device state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const timer = setInterval(fetchState, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAcknowledgeSOS = async () => {
    try {
      await fetch('/api/device/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'ASTRA-001', action: 'ACKNOWLEDGE' }),
      });
      fetchState();
    } catch (err) {
      console.error('Failed to acknowledge SOS:', err);
    }
  };

  const handleResetSOS = async () => {
    try {
      await fetch('/api/device/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'ASTRA-001', action: 'RESET' }),
      });
      fetchState();
    } catch (err) {
      console.error('Failed to reset SOS:', err);
    }
  };

  const handleSyncBrowserGPS = async (lat: number, lng: number) => {
    try {
      await fetch('/api/device/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'ASTRA-001',
          source: 'BROWSER_GPS',
          location: {
            latitude: lat,
            longitude: lng,
            accuracyM: 4.2,
            speedKmh: 1.2,
            headingDeg: 88,
            fix: 'LOCKED',
          },
        }),
      });
      fetchState();
    } catch (err) {
      console.error('Failed to sync browser GPS:', err);
    }
  };

  if (loading && !device) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 text-sky-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Connecting to AngRaksha Telematics Stream...</p>
      </div>
    );
  }

  if (!device) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        status={device.status}
        source={device.source}
        personName={device.personName}
        deviceId={device.deviceId}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-white uppercase tracking-wider">
                ANGRAKSHA GUARDIAN SAFETY CONSOLE
              </h1>
              <p className="text-xs text-slate-400">
                Caregiver Monitoring Console for <span className="text-white font-semibold">{device.personName}</span> • Walking Stick ID <span className="font-mono text-sky-400 font-bold">{device.deviceId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/simulator"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              Demo Simulator Bar
            </Link>
          </div>
        </div>

        {/* 2-Column Primary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Spatial Direction & Radar */}
          <div className="space-y-6">
            <DirectionIndicator device={device} />
            <SpatialRadar sensors={device.sensors} />
          </div>

          {/* Right Column: Live Rescue Map & Status */}
          <div className="space-y-6">
            <LiveMap
              latitude={device.location.latitude}
              longitude={device.location.longitude}
              gpsStatus={device.location.fix}
              accuracyMeters={device.location.accuracyM}
              speedKmh={device.location.speedKmh}
              headingDeg={device.location.headingDeg}
              trail={trail}
              sosActive={device.emergency.sosActive}
              source={device.source}
              geofence={device.geofence.config}
              heightClass="h-[340px]"
              onSyncBrowserGPS={handleSyncBrowserGPS}
            />
            <DeviceStatusCard device={device} />
          </div>
        </div>

        {/* Bottom Section: Recent Safety Events */}
        <RecentEventsList events={events} maxItems={6} />
      </main>

      {/* Critical SOS Emergency Modal */}
      <SOSAlertModal
        device={device}
        onAcknowledge={handleAcknowledgeSOS}
        onReset={handleResetSOS}
      />
    </div>
  );
}
