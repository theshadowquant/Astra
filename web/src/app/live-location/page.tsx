'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LiveMap from '@/components/LiveMap';
import SOSAlertModal from '@/components/SOSAlertModal';
import { DeviceState, DeviceLocation } from '@/types';
import { MapPin, Navigation, Compass, Radio, Activity, ShieldCheck, Crosshair, ArrowUpRight } from 'lucide-react';

export default function LiveLocationPage() {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [trail, setTrail] = useState<DeviceLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/device/ASTRA-001');
      if (res.ok) {
        const data = await res.json();
        setDevice(data.device);
        setTrail(data.trail || []);
      }
    } catch (err) {
      console.error('Failed to fetch location state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const timer = setInterval(fetchState, 1000);
    return () => clearInterval(timer);
  }, []);

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
        <p className="text-sm font-semibold">Acquiring Pedestrian GPS Stream...</p>
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-5">
        {/* Header Telematics Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-400" />
              <h1 className="text-base font-black uppercase text-white tracking-wide">
                Live Precision Location & Safe Zone Geofence
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous GPS Tracking for <span className="text-white font-semibold">{device.personName}</span> (HW-248 NEO-6M Receiver)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                device.geofence.status === 'INSIDE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              {device.geofence.status === 'INSIDE' ? '✓ INSIDE SAFE ZONE' : '⚠️ BEYOND SAFE ZONE'}
            </span>
          </div>
        </div>

        {/* Full-Height Responsive Map */}
        <div className="flex-1 min-h-[520px]">
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
            heightClass="h-[520px]"
            onSyncBrowserGPS={handleSyncBrowserGPS}
          />
        </div>

        {/* Detailed 4-Metric Coordinates Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Latitude</div>
            <div className="text-base font-black font-mono text-white mt-1">
              {device.location.latitude.toFixed(6)}° N
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Longitude</div>
            <div className="text-base font-black font-mono text-white mt-1">
              {device.location.longitude.toFixed(6)}° E
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Walking Velocity</div>
            <div className="text-base font-black font-mono text-sky-400 mt-1">
              {device.location.speedKmh ? device.location.speedKmh.toFixed(1) : '1.2'} km/h
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Safe Zone Radius</div>
            <div className="text-base font-black font-mono text-emerald-400 mt-1">
              {device.geofence.config?.radiusMeters || 500} meters
            </div>
          </div>
        </div>
      </main>

      <SOSAlertModal
        device={device}
        onAcknowledge={() => {}}
        onReset={() => {}}
      />
    </div>
  );
}
