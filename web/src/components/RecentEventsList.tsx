'use client';

import React from 'react';
import { SystemEvent } from '@/types';
import { Shield, AlertTriangle, AlertOctagon, Info, Clock } from 'lucide-react';

interface Props {
  events: SystemEvent[];
}

export default function RecentEventsList({ events }: Props) {
  const getEventIcon = (severity: string, eventType: string) => {
    if (eventType.includes('SOS') || severity === 'CRITICAL') {
      return <AlertOctagon className="w-4 h-4 text-rose-400" />;
    }
    if (severity === 'WARNING') {
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
    return <Info className="w-4 h-4 text-cyan-400" />;
  };

  const getSeverityBg = (severity: string) => {
    if (severity === 'CRITICAL') return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
    if (severity === 'WARNING') return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    return 'bg-slate-800/60 border-slate-700/50 text-slate-300';
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-cyan-400" />
          Realtime Telematics Audit Trail
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">Recent 10 Events</span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
        {events.length === 0 ? (
          <div className="text-xs text-slate-500 py-6 text-center">No telemetry events recorded yet.</div>
        ) : (
          events.slice(0, 10).map((evt) => (
            <div
              key={evt.id}
              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${getSeverityBg(
                evt.severity
              )}`}
            >
              <div className="mt-0.5">{getEventIcon(evt.severity, evt.eventType)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold tracking-tight">{evt.eventType}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{evt.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
