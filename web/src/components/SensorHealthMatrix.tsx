'use client';

import React from 'react';
import { DeviceState } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle, Cpu, Radio, Activity } from 'lucide-react';

interface Props {
  sensors: DeviceState['sensors'];
  gps: DeviceState['gps'];
}

export default function SensorHealthMatrix({ sensors, gps }: Props) {
  const getStatusIcon = (status: string) => {
    if (status === 'VALID' || status === 'OK' || status === 'LOCKED') {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
    if (status === 'TIMEOUT' || status === 'SIMULATED') {
      return <Activity className="w-3.5 h-3.5 text-cyan-400" />;
    }
    return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
  };

  const getStatusBg = (status: string) => {
    if (status === 'VALID' || status === 'OK' || status === 'LOCKED') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (status === 'TIMEOUT' || status === 'SIMULATED') {
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  const items = [
    { name: 'Left Ultrasonic', pin: 'GPIO 5 / 18', status: sensors.leftStatus },
    { name: 'Front Ultrasonic', pin: 'GPIO 19 / 23', status: sensors.frontStatus },
    { name: 'Right Ultrasonic', pin: 'GPIO 13 / 14', status: sensors.rightStatus },
    { name: 'MPU6050 IMU', pin: 'I2C 0x68 (400kHz)', status: sensors.imuStatus },
    { name: 'GPS Satellite Link', pin: 'UART2 (16 / 17)', status: gps.status },
    { name: 'Spatial Haptics', pin: '3x NPN Drivers', status: 'OK' },
  ];

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Hardware & Sensor Subsystem Matrix
        </h4>
        <span className="text-[10px] text-slate-400">All Nodes Monitored</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {items.map((item, idx) => (
          <div key={idx} className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">{item.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{item.pin}</div>
            </div>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${getStatusBg(item.status)}`}>
              {getStatusIcon(item.status)}
              {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
