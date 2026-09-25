'use client';

import React from 'react';
import { AlertOctagon, PhoneCall, MapPin, CheckCircle, BellRing } from 'lucide-react';

interface Props {
  active: boolean;
  deviceId: string;
  latitude: number;
  longitude: number;
  batteryPercent?: number;
  triggeredAt?: string;
  acknowledged?: boolean;
  onAcknowledge: () => void;
  onReset: () => void;
}

export default function SOSAlertModal({
  active,
  deviceId,
  latitude,
  longitude,
  batteryPercent = 85,
  triggeredAt,
  acknowledged = false,
  onAcknowledge,
  onReset,
}: Props) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border-2 border-rose-500 rounded-2xl p-6 shadow-2xl shadow-rose-900/40 relative overflow-hidden animate-shake">
        {/* Top Danger Header */}
        <div className="flex items-center gap-3 text-rose-400 mb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center animate-pulse">
            <AlertOctagon className="w-7 h-7 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white uppercase">🚨 Critical SOS Broadcast Active</h2>
            <p className="text-xs text-rose-300">Hardware panic switch engaged by pedestrian</p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Device Target:</span>
            <span className="font-bold text-white">{deviceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Time Triggered:</span>
            <span className="font-mono text-slate-200">{triggeredAt ? new Date(triggeredAt).toLocaleTimeString() : 'Just Now'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Battery Level:</span>
            <span className="font-bold text-emerald-400">{batteryPercent}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Rescue Coordinates:</span>
            <span className="font-mono font-bold text-cyan-400">{latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          {!acknowledged ? (
            <button
              onClick={onAcknowledge}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-600/30"
            >
              <BellRing className="w-4 h-4" />
              Acknowledge & Dispatch Help
            </button>
          ) : (
            <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Alert Acknowledged by Guardian
            </div>
          )}

          <button
            onClick={onReset}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Clear / Reset
          </button>
        </div>
      </div>
    </div>
  );
}
