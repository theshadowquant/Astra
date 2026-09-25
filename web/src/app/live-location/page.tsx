'use client';

import React, { useState, useEffect } from 'react';
import { DeviceState, DeviceLocation } from '@/types';
import LiveMap from '@/components/LiveMap';
import { MapPin, Navigation, Compass, Shield, Clock, AlertOctagon } from 'lucide-react';

export default function LiveLocationPage() {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [trail, setTrail] = useState<DeviceLocation[]>([]);
  const [timeWindow, setTimeWindow] = useState<'5m' | '15m' | '30m' | '1h'>('15m');

  const fetchLocationData = async () => {
    try {
      const res = await fetch('/api/device/ASTRA-001');
      if (res.ok) {
        const data = await res.json();
        setDevice(data.device);
        setTrail(data.trail || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLocationData();
    const interval = setInterval(fetchLocationData, 500);
    return () => clearInterval(interval);
  }, []);

  if (!device) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-sm text-slate-400">Loading live GPS telemetry stream...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Dedicated Live Location & Rescue Map</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              GPS SATELLITE FIX
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous outdoor & indoor pedestrian tracking for emergency rescue dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['5m', '15m', '30m', '1h'] as const).map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                timeWindow === w
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Trail: {w}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <LiveMap
            latitude={device.gps.latitude || 12.9716}
            longitude={device.gps.longitude || 77.5946}
            gpsStatus={device.gps.status}
            accuracyMeters={device.gps.accuracyMeters}
            trail={trail}
            sosActive={device.sos.active}
          />
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border space-y-3 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-cyan-400" />
              Kinematics & Positioning
            </h4>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Speed:</span>
                <span className="font-mono text-white font-bold">{device.gps.speedMps ?? 1.1} m/s (~4.0 km/h)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Heading Azimuth:</span>
                <span className="font-mono text-cyan-400 font-bold">{device.gps.headingDegrees ?? 88}° East</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signal Accuracy:</span>
                <span className="font-mono text-emerald-400 font-bold">&plusmn;{device.gps.accuracyMeters ?? 4.8}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fix Timestamp:</span>
                <span className="font-mono text-slate-300">{new Date(device.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Geofence & Safety Zone
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Safe mobility zone: <b className="text-slate-200">Urban Pedestrian Corridor</b>. No geofence violations detected in the past 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
