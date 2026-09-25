'use client';

import React from 'react';
import { DeviceState } from '@/types';
import { ShieldAlert, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  sensors: DeviceState['sensors'];
}

export default function SpatialRadar({ sensors }: Props) {
  const renderZone = (
    label: string,
    distCm: number | undefined,
    status: string,
    colorClass: string
  ) => {
    const isTimeout = status === 'TIMEOUT';
    const isFault = status === 'FAULT' || status === 'STALE';
    const val = distCm ?? 150;

    let barColor = 'bg-emerald-500';
    let textColor = 'text-emerald-400';
    let borderColor = 'border-emerald-500/30';
    let statusBg = 'bg-emerald-500/10';

    if (isFault) {
      barColor = 'bg-slate-600';
      textColor = 'text-slate-400';
      borderColor = 'border-slate-700';
      statusBg = 'bg-slate-800';
    } else if (val < 35) {
      barColor = 'bg-rose-500';
      textColor = 'text-rose-400';
      borderColor = 'border-rose-500/40';
      statusBg = 'bg-rose-500/10';
    } else if (val < 60) {
      barColor = 'bg-amber-500';
      textColor = 'text-amber-400';
      borderColor = 'border-amber-500/40';
      statusBg = 'bg-amber-500/10';
    }

    const pct = Math.min(100, Math.max(0, (val / 150) * 100));

    return (
      <div className={`p-4 rounded-xl bg-card border ${borderColor} flex flex-col justify-between`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{label}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBg} ${textColor} border ${borderColor}`}>
            {status}
          </span>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black tracking-tight ${textColor}`}>
              {isFault ? 'FAULT' : isTimeout ? '>150' : Math.round(val)}
            </span>
            {!isFault && !isTimeout && <span className="text-sm font-semibold text-slate-500">cm</span>}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {val < 35 ? 'Hazard in Braking Envelope' : val < 60 ? 'Approaching Obstacle' : 'Corridor Clear'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden mt-3 border border-slate-700/50">
          <div
            className={`h-full ${barColor} transition-all duration-300 rounded-full`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          Spatial Ultrasonic Radar (150cm Envelope)
        </h3>
        <span className="text-xs text-slate-400 font-mono">Sequential Scan Bounded &le;42ms</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {renderZone('Left Zone (GPIO 5/18)', sensors.leftDistanceCm, sensors.leftStatus, 'left')}
        {renderZone('Center Front (GPIO 19/23)', sensors.frontDistanceCm, sensors.frontStatus, 'front')}
        {renderZone('Right Zone (GPIO 13/14)', sensors.rightDistanceCm, sensors.rightStatus, 'right')}
      </div>
    </div>
  );
}
