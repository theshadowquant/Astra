'use client';

import React from 'react';
import { DeviceState } from '@/types';
import { Battery, BatteryCharging, BatteryWarning, Radio, Compass, Shield, User, Clock, HardDrive } from 'lucide-react';

interface Props {
  device: DeviceState;
}

export default function DeviceStatusCard({ device }: Props) {
  const isOnline = device.status === 'ONLINE';
  const isStale = device.status === 'STALE';
  const isLowBattery = device.battery.percent < 20;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Protected Pedestrian & Device Status
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400">
            {device.deviceId}
          </span>
        </div>

        {/* Person Hero Block */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              RK
            </div>
            <div>
              <div className="font-bold text-sm text-white">{device.personName}</div>
              <div className="text-[11px] text-slate-400">AngRaksha Smart Cane Carrier</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Guardian State</div>
            <div
              className={`text-xs font-bold ${
                device.emergency.sosActive
                  ? 'text-red-400 animate-pulse'
                  : device.navigation.risk === 'CLEAR'
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {device.emergency.sosActive ? '🚨 SOS PANIC ACTIVE' : device.navigation.risk === 'CLEAR' ? 'SECURE / NORMAL' : 'HAZARD CAUTION'}
            </div>
          </div>
        </div>

        {/* 4 Telematics Indicators */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Battery */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                {isLowBattery ? (
                  <BatteryWarning className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                )}
                Battery
              </span>
              <span className="font-mono text-slate-300">{device.battery.voltage.toFixed(2)}V</span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className={`text-xl font-black font-mono ${isLowBattery ? 'text-red-400' : 'text-white'}`}>
                {device.battery.percent}%
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Li-ion (3.7V)</span>
            </div>
            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${isLowBattery ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${device.battery.percent}%` }}
              />
            </div>
          </div>

          {/* GPS Fix */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                HW-248 GPS
              </span>
              <span className="text-[9px] px-1 rounded bg-sky-500/20 text-sky-400 font-bold">
                {device.location.fix}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-white mt-1">
              {device.location.latitude.toFixed(4)}°, {device.location.longitude.toFixed(4)}°
            </div>
            <div className="text-[10px] text-slate-400">
              Accuracy: &plusmn;{device.location.accuracyM ? device.location.accuracyM.toFixed(1) : 4.2}m
            </div>
          </div>

          {/* Geofence */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                Safe Zone
              </span>
              <span
                className={`text-[9px] px-1 rounded font-bold ${
                  device.geofence.status === 'INSIDE'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {device.geofence.status}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-200 mt-1">
              Radius: {device.geofence.config?.radiusMeters || 500}m
            </div>
            <div className="text-[10px] text-slate-400">
              {device.geofence.status === 'INSIDE' ? 'Within Home Perimeter' : 'Beyond Safe Zone!'}
            </div>
          </div>

          {/* Last Heartbeat */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Heartbeat
              </span>
              <span
                className={`text-[9px] px-1 rounded font-bold ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {device.status}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-white mt-1">
              {device.connectivity.heartbeatAgeSec}s ago
            </div>
            <div className="text-[10px] text-slate-400">
              Control: {device.connectivity.controlLatencyMs.toFixed(1)}ms
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 mt-4 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Hardware: ESP32 DevKit V1</span>
        <span className="text-emerald-400 font-semibold">● 24h Telemetry Sync</span>
      </div>
    </div>
  );
}
