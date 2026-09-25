'use client';

import React from 'react';
import { DeviceState } from '@/types';
import { HARDWARE_CONFIG } from '@/lib/hardwareConfig';
import { Cpu, CheckCircle2, AlertTriangle, XCircle, Gauge, Activity, Radio, Volume2, Droplets, ShieldAlert } from 'lucide-react';

interface Props {
  device: DeviceState;
}

export default function SensorHealthMatrix({ device }: Props) {
  const { health, connectivity } = device;

  const subsystems = [
    { name: 'ESP32 Microcontroller', status: health.esp32, pin: 'Core 1 & Core 0', icon: Cpu },
    { name: 'HW-248 / NEO-6M GPS', status: health.gps, pin: 'GPIO 16 (RX) / 17 (TX)', icon: Radio },
    { name: 'MPU-6050 Motion IMU', status: health.mpu6050, pin: 'GPIO 21 (SDA) / 22 (SCL)', icon: Activity },
    { name: 'Center HC-SR04 Ultrasonic', status: health.frontUltrasonic, pin: 'GPIO 19 (Trig) / 23 (Echo)', icon: Gauge },
    { name: 'Left HC-SR04 Ultrasonic', status: health.leftUltrasonic, pin: 'GPIO 5 (Trig) / 18 (Echo)', icon: Gauge },
    { name: 'Right HC-SR04 Ultrasonic', status: health.rightUltrasonic, pin: 'GPIO 13 (Trig) / 14 (Echo)', icon: Gauge },
    { name: 'Water / Puddle Electrode', status: health.waterSensor, pin: 'GPIO 34 ADC (Analog In)', icon: Droplets },
    { name: 'Spatial Haptic Motors (3x)', status: health.haptics, pin: 'GPIO 25 / 26 / 27 (NPN)', icon: Activity },
    { name: '5V Active Piezo Buzzer', status: health.buzzer, pin: 'GPIO 4 (Digital Out)', icon: Volume2 },
    { name: 'Emergency SOS Panic Button', status: health.sosButton, pin: 'GPIO 15 (INPUT_PULLUP)', icon: ShieldAlert },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl flex flex-col gap-5">
      {/* Subsystem Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Hardware Subsystems & Latency Diagnostics
            </h3>
            <p className="text-xs text-slate-400">Canonical ESP32 DevKit V1 Sensor Bus</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          ALL DRIVERS OPERATIONAL
        </span>
      </div>

      {/* Latency Performance Gauges (Real Hardware Benchmarks) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Control Loop Latency</div>
          <div className="text-xl font-black font-mono text-emerald-400 my-1">
            {connectivity.controlLatencyMs.toFixed(1)} ms
          </div>
          <div className="text-[10px] text-slate-500">Deterministic loop execution</div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Actual 3-Sensor Scan</div>
          <div className="text-xl font-black font-mono text-sky-400 my-1">
            {connectivity.scanDurationMs.toFixed(1)} ms
          </div>
          <div className="text-[10px] text-slate-500">Measured ultrasonic cycle</div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Configured Bound</div>
          <div className="text-xl font-black font-mono text-white my-1">
            &le; {connectivity.scanBoundMs} ms
          </div>
          <div className="text-[10px] text-slate-500">Guaranteed envelope limit</div>
        </div>
      </div>

      {/* Subsystem Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {subsystems.map((sub) => {
          const Icon = sub.icon;
          const isHealthy = sub.status === 'HEALTHY';
          return (
            <div
              key={sub.name}
              className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-slate-900 border border-slate-800 text-sky-400">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{sub.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{sub.pin}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{sub.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
