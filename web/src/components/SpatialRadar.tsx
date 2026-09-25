'use client';

import React from 'react';
import { DeviceSensors } from '@/types';
import { Radar, Droplets, TrendingDown, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  sensors: DeviceSensors;
}

export default function SpatialRadar({ sensors }: Props) {
  const getZoneColor = (distCm: number, status: string) => {
    if (status !== 'VALID') return { border: 'border-slate-700', bg: 'bg-slate-900', text: 'text-slate-400', fill: 'bg-slate-600' };
    if (distCm <= 35) return { border: 'border-red-500/50', bg: 'bg-red-950/30', text: 'text-red-400', fill: 'bg-red-500' };
    if (distCm <= 100) return { border: 'border-amber-500/50', bg: 'bg-amber-950/30', text: 'text-amber-400', fill: 'bg-amber-500' };
    return { border: 'border-emerald-500/50', bg: 'bg-emerald-950/30', text: 'text-emerald-400', fill: 'bg-emerald-500' };
  };

  const zones = [
    { label: 'LEFT SECTOR', dist: sensors.left.distanceCm, status: sensors.left.status, pin: 'GPIO 5 / 18' },
    { label: 'FRONT / CENTER', dist: sensors.front.distanceCm, status: sensors.front.status, pin: 'GPIO 19 / 23' },
    { label: 'RIGHT SECTOR', dist: sensors.right.distanceCm, status: sensors.right.status, pin: 'GPIO 13 / 14' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between shadow-xl">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Three-Zone Ultrasonic Spatial Radar
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Envelope: ≤ 150 cm (42ms bound)
          </span>
        </div>

        {/* 3 Zone Cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {zones.map((z, idx) => {
            const colors = getZoneColor(z.dist, z.status);
            const distMeters = (z.dist / 100).toFixed(2);
            const percentWidth = Math.min(100, Math.max(5, (z.dist / 150) * 100));

            return (
              <div
                key={z.label}
                className={`rounded-lg border p-3 flex flex-col justify-between ${colors.border} ${colors.bg} transition-all duration-300`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>{z.label}</span>
                    <span
                      className={`text-[9px] px-1 rounded ${
                        z.status === 'VALID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {z.status}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 my-1">
                    <span className={`text-2xl font-black font-mono tracking-tight ${colors.text}`}>
                      {z.status === 'VALID' ? z.dist : '--'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">cm</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {z.status === 'VALID' ? `${distMeters} m` : 'Disconnected'}
                  </div>
                </div>

                {/* Range Bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.fill} transition-all duration-300`}
                      style={{ width: z.status === 'VALID' ? `${percentWidth}%` : '0%' }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                    <span>0cm</span>
                    <span>150cm</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auxiliary Safety Sensor Badges */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
        {/* Liquid Sensing */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg border ${
            sensors.waterDetected
              ? 'bg-red-950/40 border-red-500/40 text-red-400 animate-pulse'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Droplets className={`w-4 h-4 ${sensors.waterDetected ? 'text-red-400' : 'text-sky-400'}`} />
            <div>
              <div className="text-[11px] font-bold">Liquid / Water Electrode</div>
              <div className="text-[9px] text-slate-400">GPIO 34 ADC (Val: {sensors.waterAdcValue || 240})</div>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              sensors.waterDetected ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {sensors.waterDetected ? 'WATER DETECTED' : 'DRY / CLEAR'}
          </span>
        </div>

        {/* Stair / Drop Sensing */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg border ${
            sensors.dropStairDetected
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-400 animate-pulse'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingDown className={`w-4 h-4 ${sensors.dropStairDetected ? 'text-amber-400' : 'text-emerald-400'}`} />
            <div>
              <div className="text-[11px] font-bold">Stairs / Drop Descent</div>
              <div className="text-[9px] text-slate-400">MPU-6050 Freefall Drop</div>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              sensors.dropStairDetected ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {sensors.dropStairDetected ? 'DROP WARNING' : 'LEVEL'}
          </span>
        </div>
      </div>
    </div>
  );
}
