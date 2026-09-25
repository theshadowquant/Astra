'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { DeviceState, SystemEvent } from '@/types';
import { History, AlertOctagon, AlertTriangle, Info, Filter, Droplets, TrendingDown, Compass } from 'lucide-react';

export default function EventsPage() {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/device/ASTRA-001/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
      const devRes = await fetch('/api/device/ASTRA-001');
      if (devRes.ok) {
        const d = await devRes.json();
        setDevice(d.device);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const timer = setInterval(fetchEvents, 2000);
    return () => clearInterval(timer);
  }, []);

  const filtered = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.severity === filter;
  });

  const getEventBadge = (type: string, severity: string) => {
    if (type.includes('SOS') || severity === 'CRITICAL') {
      return { bg: 'bg-red-500/10 text-red-400 border-red-500/30', icon: AlertOctagon };
    }
    if (type.includes('WATER')) {
      return { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30', icon: Droplets };
    }
    if (type.includes('DROP') || type.includes('STAIR')) {
      return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: TrendingDown };
    }
    if (type.includes('GEOFENCE')) {
      return { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Compass };
    }
    if (severity === 'WARNING') {
      return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: AlertTriangle };
    }
    return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Info };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        status={device?.status}
        source={device?.source}
        personName={device?.personName}
        deviceId={device?.deviceId}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-sky-400" />
              <h1 className="text-base font-black uppercase text-white tracking-wide">
                Safety & Telematics Event Audit Log
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive telemetry transitions and hazard triggers for <span className="text-white font-semibold">{device?.personName || 'Rajesh K.'}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  filter === f
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Event Audit Log Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Showing {filtered.length} Recorded Incidents
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No events matched the selected filter criteria.
              </div>
            ) : (
              filtered.map((evt) => {
                const theme = getEventBadge(evt.eventType, evt.severity);
                const Icon = theme.icon;

                return (
                  <div
                    key={evt.id}
                    className="p-4 hover:bg-slate-950/40 transition flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border ${theme.bg} mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {evt.description}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span className="font-mono">{new Date(evt.timestamp).toLocaleString()}</span>
                          <span className="font-mono text-slate-500">• Event: {evt.eventType}</span>
                          {evt.latitude && evt.longitude && (
                            <span className="text-sky-400 font-mono">
                              • GPS: {evt.latitude.toFixed(4)}°, {evt.longitude.toFixed(4)}°
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${theme.bg}`}>
                      {evt.severity}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
