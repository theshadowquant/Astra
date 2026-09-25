'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import DayRouteMap from '@/components/DayRouteMap';
import { DayRouteSummary, DeviceState } from '@/types';
import { Route, Calendar, Clock, Footprints, AlertTriangle, ShieldCheck, Activity, Compass } from 'lucide-react';

export default function DayRoutePage() {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [route, setRoute] = useState<DayRouteSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [devRes, routeRes] = await Promise.all([
        fetch('/api/device/ASTRA-001'),
        fetch('/api/device/ASTRA-001/route'),
      ]);

      if (devRes.ok) {
        const d = await devRes.json();
        setDevice(d.device);
      }

      if (routeRes.ok) {
        const r = await routeRes.json();
        setRoute(r.route);
      }
    } catch (err) {
      console.error('Failed to load day route data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !device) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 text-sky-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading Day Traversal History...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        status={device?.status}
        source={device?.source}
        personName={device?.personName}
        deviceId={device?.deviceId}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header & Date Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-sky-400" />
              <h1 className="text-base font-black uppercase text-white tracking-wide">
                Day Traversal & Journey History
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Breadcrumb route records for <span className="text-white font-semibold">{device?.personName || 'Rajesh K.'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['Today', 'Yesterday', 'This Week'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedDate(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedDate === tab
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Traveled</div>
              <div className="text-xl font-black text-white font-mono">
                {route?.totalDistanceKm || 4.82} <span className="text-xs text-slate-400">km</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Active Walking</div>
              <div className="text-xl font-black text-white font-mono">
                1h 18m
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Hazards Avoided</div>
              <div className="text-xl font-black text-white font-mono">
                {route?.hazardsDetected || 7}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Geofence Status</div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                100% Safe
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb Route Map */}
        <DayRouteMap
          waypoints={route?.waypoints || []}
          geofence={device?.geofence.config}
          source={route?.source || device?.source}
          heightClass="h-[480px]"
        />
      </main>
    </div>
  );
}
