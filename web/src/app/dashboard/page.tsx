'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import DeviceStatusCard from '@/components/DeviceStatusCard';
import DirectionIndicator from '@/components/DirectionIndicator';
import SpatialRadar from '@/components/SpatialRadar';
import RecentEventsList from '@/components/RecentEventsList';
import SOSAlertModal from '@/components/SOSAlertModal';
import LiveMap from '@/components/LiveMap';
import { DeviceState, SystemEvent, DeviceLocation } from '@/types';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, MapPin, Activity, Sliders, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [trail, setTrail] = useState<DeviceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'live' | 'error'>('connecting');

  // ─── Initial data load ───────────────────────────────────────
  const loadInitialData = async () => {
    try {
      const res = await fetch('/api/device/ASTRA-001');
      if (res.ok) {
        const data = await res.json();
        setDevice(data.device);
        setEvents(data.events || []);
        setTrail(data.trail || []);
      }
    } catch (err) {
      console.error('[Dashboard] Initial fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Supabase Realtime Subscription ──────────────────────────
  useEffect(() => {
    loadInitialData();

    // Channel 1: device_state — broadcasts on every telemetry POST
    // This replaces the 1s polling setInterval entirely
    const deviceChannel = supabase
      .channel('guardian:device_state')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_state',
          filter: 'device_id=eq.ASTRA-001',
        },
        (payload) => {
          const newRow = payload.new as { payload: DeviceState; updated_at: string };
          if (newRow?.payload) {
            const state = newRow.payload as DeviceState;

            // Evaluate freshness
            const ageMs = Date.now() - new Date(state.connectivity?.lastSeen || 0).getTime();
            if (ageMs > 30000) state.status = 'OFFLINE';
            else if (ageMs > 8000) state.status = 'STALE';
            else state.status = 'ONLINE';
            state.connectivity.heartbeatAgeSec = Math.floor(ageMs / 1000);

            setDevice(state);
            setRealtimeStatus('live');

            // Append new location to trail if GPS locked
            if (state.location.fix === 'LOCKED' || state.location.fix === 'SIMULATED') {
              const newPoint: DeviceLocation = {
                latitude: state.location.latitude,
                longitude: state.location.longitude,
                accuracyMeters: state.location.accuracyM,
                speedKmh: state.location.speedKmh,
                headingDeg: state.location.headingDeg,
                timestamp: state.timestamp,
                source: state.source,
              };
              setTrail((prev) => {
                const updated = [...prev, newPoint];
                return updated.slice(-100); // Keep last 100 points
              });
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('live');
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('error');
      });

    // Channel 2: system_events — new safety events pushed in real-time
    const eventsChannel = supabase
      .channel('guardian:system_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events',
          filter: 'device_id=eq.ASTRA-001',
        },
        (payload) => {
          const r = payload.new as any;
          const evt: SystemEvent = {
            id: r.id,
            deviceId: r.device_id,
            eventType: r.event_type,
            severity: r.severity,
            description: r.description,
            timestamp: r.created_at,
            latitude: r.latitude,
            longitude: r.longitude,
            source: r.source,
            acknowledged: r.acknowledged,
          };
          setEvents((prev) => [evt, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deviceChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  // ─── SOS handlers ─────────────────────────────────────────────
  const handleAcknowledgeSOS = async () => {
    try {
      await fetch('/api/device/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'ASTRA-001', action: 'ACKNOWLEDGE' }),
      });
      // State update comes via Realtime — no need to refetch
    } catch (err) {
      console.error('[Dashboard] SOS acknowledge failed:', err);
    }
  };

  const handleResetSOS = async () => {
    try {
      await fetch('/api/device/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'ASTRA-001', action: 'RESET' }),
      });
    } catch (err) {
      console.error('[Dashboard] SOS reset failed:', err);
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
          location: { latitude: lat, longitude: lng, accuracyM: 4.2, speedKmh: 1.2, headingDeg: 88, fix: 'LOCKED' },
        }),
      });
      // Realtime will push the update automatically
    } catch (err) {
      console.error('[Dashboard] Browser GPS sync failed:', err);
    }
  };

  // ─── Loading state ────────────────────────────────────────────
  if (loading && !device) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 text-sky-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Connecting to Supabase Realtime Stream...</p>
        <p className="text-xs text-slate-500 mt-1">Establishing WebSocket channel to guardian feed</p>
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
                Monitoring <span className="text-white font-semibold">{device.personName}</span> •{' '}
                Device <span className="font-mono text-sky-400 font-bold">{device.deviceId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Supabase Realtime status indicator */}
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
              {realtimeStatus === 'live'
                ? 'SUPABASE REALTIME ●'
                : realtimeStatus === 'error'
                ? 'REALTIME ERROR'
                : 'CONNECTING...'}
            </div>

            <Link
              href="/simulator"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              Demo Simulator
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
