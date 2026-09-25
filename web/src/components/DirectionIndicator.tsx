'use client';

import React from 'react';
import { DeviceState } from '@/types';
import { ArrowLeft, ArrowRight, ArrowUp, Octagon, AlertTriangle, Activity } from 'lucide-react';

interface Props {
  safety: DeviceState['safety'];
  sensors: DeviceState['sensors'];
}

export default function DirectionIndicator({ safety, sensors }: Props) {
  const getDirectionDetails = () => {
    switch (safety.direction) {
      case 'LEFT':
        return {
          title: 'GUIDE LEFT',
          subtitle: 'Front path obstructed • Clear left corridor detected',
          icon: ArrowLeft,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/30',
          haptic: 'Left Motor Pulsing (120ms ON / 180ms OFF)',
        };
      case 'RIGHT':
        return {
          title: 'GUIDE RIGHT',
          subtitle: 'Front path obstructed • Clear right corridor detected',
          icon: ArrowRight,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/30',
          haptic: 'Right Motor Pulsing (120ms ON / 180ms OFF)',
        };
      case 'STOP':
        return {
          title: 'CRITICAL STOP / HALT',
          subtitle: 'All forward & lateral paths blocked • Full impasse',
          icon: Octagon,
          color: 'text-rose-400',
          bg: 'bg-rose-500/15 border-rose-500/40 animate-pulse',
          haptic: 'Continuous Dual Motor Vibration + Stop Tone',
        };
      case 'FORWARD':
      case 'NONE':
      default:
        return {
          title: 'PATH CLEAR / FORWARD',
          subtitle: 'Forward corridor unobstructed • Idle state',
          icon: ArrowUp,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          haptic: 'Motors Standby (0% PWM - Zero Fatigue)',
        };
    }
  };

  const dir = getDirectionDetails();
  const Icon = dir.icon;

  return (
    <div className={`p-5 rounded-xl border ${dir.bg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${dir.bg} ${dir.color}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-400 tracking-wider uppercase">Active Guidance Vector</div>
          <div className={`text-2xl font-black tracking-tight ${dir.color}`}>{dir.title}</div>
          <div className="text-xs text-slate-300 mt-0.5">{dir.subtitle}</div>
        </div>
      </div>

      <div className="flex flex-col md:items-end gap-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Spatial Haptic Matrix:</span>
          <span className="font-semibold text-slate-200">{dir.haptic}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>IMU Ground State:</span>
          <span className={`font-semibold ${sensors.groundHazardLatched ? 'text-rose-400' : 'text-emerald-400'}`}>
            {sensors.groundHazardLatched ? '⚠️ POTHOLE/DROP DETECTED' : `NOMINAL (${sensors.accelMagnitudeG?.toFixed(2)}g)`}
          </span>
        </div>
      </div>
    </div>
  );
}
