'use client';

import React from 'react';
import { SystemEvent } from '@/types';
import { History, AlertOctagon, AlertTriangle, Info, MapPin, Droplets, TrendingDown, Compass, Radio } from 'lucide-react';

interface Props {
  events: SystemEvent[];
  maxItems?: number;
  onSelectEvent?: (event: SystemEvent) => void;
}

export default function RecentEventsList({ events = [], maxItems = 8, onSelectEvent }: Props) {
  const displayEvents = events.slice(0, maxItems);

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
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Real-Time Safety & Telematics Event Trail
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            {events.length} Events Logged
          </span>
        </div>

        {displayEvents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No critical events recorded yet today.
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {displayEvents.map((evt) => {
              const theme = getEventBadge(evt.eventType, evt.severity);
              const Icon = theme.icon;

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent && onSelectEvent(evt)}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-start justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-md border ${theme.bg} mt-0.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 leading-snug">
                        {evt.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        {evt.latitude && evt.longitude && (
                          <span className="text-slate-400">
                            • {evt.latitude.toFixed(4)}°, {evt.longitude.toFixed(4)}°
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${theme.bg}`}>
                    {evt.severity}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Persistent audit trail stored in state memory</span>
        <span className="text-sky-400 font-semibold">Live stream active</span>
      </div>
    </div>
  );
}
