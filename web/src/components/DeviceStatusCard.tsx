'use client';

import React from 'react';
import { DeviceState } from '@/types';
import { Battery, BatteryCharging, Radio, Wifi, Zap, Clock, ShieldCheck } from 'lucide-react';

interface Props {
  device: DeviceState;
}

export default function DeviceStatusCard({ device }: Props) {
  const getBatteryColor = (pct?: number) => {
    if (!pct) return 'text-slate-400';
    if (pct < 20) return 'text-rose-400';
    if (pct < 40) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Device Identity</span>
          <h4 className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
            {device.deviceId}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">v1.0.0</span>
          </h4>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          ONLINE
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Battery className={`w-3.5 h-3.5 ${getBatteryColor(device.batteryPercent)}`} />
            <span>Battery Level</span>
          </div>
          <div className="text-lg font-black text-white mt-1">
            {device.batteryPercent ?? '--'}%
            <span className="text-[10px] font-normal text-slate-400 ml-1">({device.batteryVoltage ?? 3.9}V)</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Loop Latency</span>
          </div>
          <div className="text-lg font-black text-cyan-400 mt-1">
            {device.connectivity.latencyMs ?? 25}
            <span className="text-[10px] font-normal text-slate-400 ml-1">ms</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex justify-between">
          <span>Configured Scan Bound:</span>
          <span className="font-mono text-slate-200 font-bold">&le; 42.0 ms</span>
        </div>
        <div className="flex justify-between">
          <span>Measured Hardware Cycle:</span>
          <span className="font-mono text-cyan-400 font-bold">{device.connectivity.actualScanMs ?? 26.5} ms</span>
        </div>
        <div className="flex justify-between">
          <span>Last Heartbeat:</span>
          <span className="font-mono text-slate-300">Just now</span>
        </div>
      </div>
    </div>
  );
}
