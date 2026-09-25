'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LiveMap from '@/components/LiveMap';
import SOSAlertModal from '@/components/SOSAlertModal';
import { DeviceState, DeviceLocation } from '@/types';
import { supabase } from '@/lib/supabase';
import { MapPin, Activity, Wifi, WifiOff } from 'lucide-react';

export default function LiveLocationPage() {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [trail, setTrail] = useState<DeviceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'live' | 'error'>('connecting');

  // Initial data load
  const loadInitialData = async () => {
    try {
      const res = await fetch('/api/device/ASTRA-001');
      if (res.ok) {
        const data = await res.json();
        setDevice(data.device);
        setTrail(data.trail || []);
      }
    } catch (err) {
      console.error('[LiveLocation] Initial fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Supabase Realtime — device_state push (replaces polling)
    const channel = supabase
      .channel('live-location:device_state')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_state',
          filter: 'device_id=eq.ASTRA-001',
        },
        (payload) => {
          const newRow = payload.new as { payload: DeviceState };
          if (newRow?.payload) {
            const state = newRow.payload as DeviceState;

            const ageMs = Date.now() - new Date(state.connectivity?.lastSeen || 0).getTime();
            if (ageMs > 30000) state.status = 'OFFLINE';
            else if (ageMs > 8000) state.status = 'STALE';
            else state.status = 'ONLINE';

            setDevice(state);
            setRealtimeStatus('live');

            // Append to trail if GPS locked
            if (
              (state.location.fix === 'LOCKED' || state.location.fix === 'SIMULATED') &&
              state.location.latitude !== 0
            ) {
              setTrail((prev) => {
                const pt: DeviceLocation = {
                  latitude: state.location.latitude,
                  longitude: state.location.longitude,
                  accuracyMeters: state.location.accuracyM,
                  speedKmh: state.location.speedKmh,
                  headingDeg: state.location.headingDeg,
                  timestamp: state.timestamp,
                  source: state.source,
                };
                return [...prev, pt].slice(-100);
              });
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('live');
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('error');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSyncBrowserGPS = async (lat: number, lng: number) => {
    try {
      await fetch('/api/device/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'ASTRA-001',
          source: 'BROWSER_GPS',
          location: { latitude: lat, longitude: lng, accuracyM: 4.2, speedKmh: 1.2, headingDeg: 88, fix: 'LOCKED' },
        }),
      });
      // Realtime pushes the update back automatically
    } catch (err) {
      console.error('[LiveLocation] Browser GPS sync failed:', err);
    }
  };

  if (loading && !device) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 text-sky-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Acquiring Supabase Realtime GPS Stream...</p>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-400" />
              <h1 className="text-base font-black uppercase text-white tracking-wide">
                Live Precision Location & Safe Zone Geofence
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Realtime GPS tracking for{' '}
              <span className="text-white font-semibold">{device.personName}</span> (HW-248 NEO-6M)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Realtime status */}
            <div
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                realtimeStatus === 'live'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : realtimeStatus === 'error'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {realtimeStatus === 'live' ? (
                <Wifi className="w-3 h-3 animate-pulse" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {realtimeStatus === 'live' ? 'REALTIME LIVE' : realtimeStatus === 'error' ? 'RT ERROR' : 'CONNECTING'}
            </div>

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

        {/* Full-Height Map */}
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

        {/* Coordinates Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Latitude</div>
            <div className="text-base font-black font-mono text-white mt-1">
              {device.location.latitude.toFixed(6)}° N
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Longitude</div>
            <div className="text-base font-black font-mono text-white mt-1">
              {device.location.longitude.toFixed(6)}° E
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Walking Velocity</div>
            <div className="text-base font-black font-mono text-sky-400 mt-1">
              {device.location.speedKmh ? device.location.speedKmh.toFixed(1) : '0.0'} km/h
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Safe Zone Radius</div>
            <div className="text-base font-black font-mono text-emerald-400 mt-1">
              {device.geofence.config?.radiusMeters || 500} m
            </div>
          </div>
        </div>
      </main>

      <SOSAlertModal device={device} onAcknowledge={() => {}} onReset={() => {}} />
    </div>
  );
}
