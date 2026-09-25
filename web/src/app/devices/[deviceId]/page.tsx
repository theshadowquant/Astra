'use client';

import React, { useState, useEffect } from 'react';
import { DeviceState, SystemEvent } from '@/types';
import DeviceStatusCard from '@/components/DeviceStatusCard';
import SensorHealthMatrix from '@/components/SensorHealthMatrix';
import RecentEventsList from '@/components/RecentEventsList';
import { Cpu, Shield, ArrowLeft, RefreshCw, Zap, Radio, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function DeviceDetailPage({ params }: { params: { deviceId: string } }) {
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);

  const fetchDevice = async () => {
    try {
      const res = await fetch(`/api/device/${params.deviceId}`);
      if (res.ok) {
        const data = await res.json();
        setDevice(data.device);
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDevice();
    const interval = setInterval(fetchDevice, 1000);
    return () => clearInterval(interval);
  }, [params.deviceId]);

  if (!device) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-sm text-slate-400">Querying device registry for {params.deviceId}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Device Diagnostics: {device.deviceId}</h1>
            <p className="text-xs text-slate-400">Hardware profiling, firmware telematics & peripheral status</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 font-bold px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            FIRMWARE v1.0.0
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DeviceStatusCard device={device} />
        <SensorHealthMatrix sensors={device.sensors} gps={device.gps} />
      </div>

      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Hardware Pinout & Configuration Registers
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Ultrasonic Array:</span>
            <div className="font-mono text-white font-bold mt-1">3x HC-SR04</div>
            <div className="text-[10px] text-slate-500">Left (5/18), Front (19/23), Right (13/14)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">IMU Sensor Bus:</span>
            <div className="font-mono text-emerald-400 font-bold mt-1">MPU-6050 (400kHz)</div>
            <div className="text-[10px] text-slate-500">SDA: 21, SCL: 22</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Spatial Haptic Drivers:</span>
            <div className="font-mono text-cyan-400 font-bold mt-1">3x NPN Stages</div>
            <div className="text-[10px] text-slate-500">GPIO 25, 26, 27 (Digital Pulse / LEDC)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Audio / SOS Alerts:</span>
            <div className="font-mono text-amber-400 font-bold mt-1">Buzzer (4) + SOS (15)</div>
            <div className="text-[10px] text-slate-500">Debounced Hardware ISR</div>
          </div>
        </div>
      </div>

      <RecentEventsList events={events} />
    </div>
  );
}
