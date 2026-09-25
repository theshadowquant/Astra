'use client';

import React, { useState, useEffect } from 'react';
import { SystemEvent } from '@/types';
import RecentEventsList from '@/components/RecentEventsList';
import { Shield, Clock, Filter, AlertOctagon, RefreshCw } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/device/ASTRA-001');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.severity === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Telematics & Safety Event History</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              AUDIT TRAIL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological record of spatial obstacle detections, guidance vector updates, and emergency SOS alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <RecentEventsList events={filteredEvents} />
    </div>
  );
}
