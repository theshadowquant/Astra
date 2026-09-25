'use client';

import React from 'react';
import { GuidanceDirection, RiskLevel, SystemOperationalState, DeviceState } from '@/types';
import {
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Octagon,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Droplets,
  TrendingDown,
  Radio,
  WifiOff,
  Compass,
} from 'lucide-react';

interface Props {
  device: DeviceState;
}

export default function DirectionIndicator({ device }: Props) {
  const { guidance, risk, state, description } = device.navigation;
  const isSOS = device.emergency.sosActive;
  const isWater = device.sensors.waterDetected;
  const isDrop = device.sensors.dropStairDetected;
  const isOffline = device.status === 'OFFLINE';

  const getGuidanceTheme = () => {
    if (isSOS) return { bg: 'bg-red-950/40 border-red-500', text: 'text-red-400', icon: Octagon, title: 'CRITICAL SOS ACTIVE', vector: 'STOP / HELP' };
    if (isOffline) return { bg: 'bg-slate-900 border-slate-700', text: 'text-slate-400', icon: WifiOff, title: 'DEVICE OFFLINE', vector: 'NO LINK' };
    if (guidance === 'STOP' || state === 'STOP' || state === 'WATER_HAZARD' || state === 'GROUND_HAZARD') {
      return { bg: 'bg-red-950/40 border-red-500', text: 'text-red-400', icon: Octagon, title: 'CRITICAL STOP MANDATE', vector: 'STOP IMMEDIATELY' };
    }
    if (guidance === 'LEFT') {
      return { bg: 'bg-sky-950/40 border-sky-500', text: 'text-sky-400', icon: ArrowLeft, title: 'STEER LEFT CORRIDOR', vector: '← GUIDE LEFT' };
    }
    if (guidance === 'RIGHT') {
      return { bg: 'bg-sky-950/40 border-sky-500', text: 'text-sky-400', icon: ArrowRight, title: 'STEER RIGHT CORRIDOR', vector: 'GUIDE RIGHT →' };
    }
    return { bg: 'bg-emerald-950/40 border-emerald-500', text: 'text-emerald-400', icon: ArrowUp, title: 'FORWARD PATHWAY CLEAR', vector: '↑ PROCEED FORWARD' };
  };

  const theme = getGuidanceTheme();
  const Icon = theme.icon;

  const hazards = [
    { label: 'Obstacle Proximity', status: device.sensors.front.distanceCm < 35 ? 'CRITICAL' : device.sensors.front.distanceCm < 60 ? 'WARNING' : 'NORMAL', icon: AlertTriangle },
    { label: 'Water / Puddle Electrode', status: isWater ? 'CRITICAL' : 'NORMAL', icon: Droplets },
    { label: 'Stairs / Drop Descent', status: isDrop ? 'CRITICAL' : 'NORMAL', icon: TrendingDown },
    { label: 'Hardware SOS Switch', status: isSOS ? 'CRITICAL' : 'NORMAL', icon: AlertOctagon },
    { label: 'Safe Zone Geofence', status: device.geofence.status === 'OUTSIDE' ? 'CRITICAL' : device.geofence.status === 'APPROACHING' ? 'WARNING' : 'NORMAL', icon: Compass },
    { label: 'GPS Satellite Fix', status: device.location.fix === 'LOCKED' ? 'NORMAL' : 'WARNING', icon: Radio },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between shadow-xl">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Active Spatial Guidance & Live Hazard Assessment
            </h3>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              risk === 'CLEAR'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : risk === 'CAUTION'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            RISK: {risk}
          </span>
        </div>

        {/* Primary Guidance Direction Hero Card */}
        <div className={`rounded-xl border p-4 flex items-center justify-between ${theme.bg} mb-4 transition-all duration-300`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shadow-inner ${theme.text}`}>
              <Icon className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Current Stick Guidance Vector
              </div>
              <div className={`text-xl font-black tracking-tight ${theme.text}`}>
                {theme.vector}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                {description || 'Autonomous on-device guidance engine active.'}
              </p>
            </div>
          </div>
        </div>

        {/* 6-Category Live Hazard Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {hazards.map((h) => {
            const HIcon = h.icon;
            const isCrit = h.status === 'CRITICAL';
            const isWarn = h.status === 'WARNING';

            return (
              <div
                key={h.label}
                className={`p-2.5 rounded-lg border flex items-center justify-between transition ${
                  isCrit
                    ? 'bg-red-950/40 border-red-500/50 text-red-400 animate-pulse'
                    : isWarn
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HIcon className={`w-3.5 h-3.5 ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-semibold">{h.label}</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isCrit ? 'bg-red-500 text-white' : isWarn ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {h.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 mt-4 text-[10px] text-slate-400 flex items-center justify-between">
        <span>* Informational Caregiver Telemetry — Smart stick autonomously executes local haptic motor/buzzer decisions</span>
        <span className="font-mono text-slate-400">Firmware V1.0.0</span>
      </div>
    </div>
  );
}
