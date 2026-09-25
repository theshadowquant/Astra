'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SensorHealthMatrix from '@/components/SensorHealthMatrix';
import { HARDWARE_CONFIG } from '@/lib/hardwareConfig';
import { DeviceState } from '@/types';
import { Cpu, CheckCircle2, Shield, Activity, HardDrive, Terminal } from 'lucide-react';

interface Props {
  params: { deviceId: string };
}

export default function DeviceHealthPage({ params }: Props) {
  const deviceId = params.deviceId || 'ASTRA-001';
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`/api/device/${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          setDevice(data.device);
        }
      } catch (err) {
        console.error('Failed to load device health:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const timer = setInterval(fetchHealth, 1500);
    return () => clearInterval(timer);
  }, [deviceId]);

  if (loading && !device) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 text-sky-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Running Hardware Subsystem Inspector...</p>
      </div>
    );
  }

  if (!device) return null;

  const pinRows = Object.values(HARDWARE_CONFIG.pins);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        status={device.status}
        source={device.source}
        personName={device.personName}
        deviceId={device.deviceId}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Device Health Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              <h1 className="text-base font-black uppercase text-white tracking-wide">
                Hardware Health & Canonical GPIO Inspector
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Firmware V{HARDWARE_CONFIG.system.firmwareVersion} • MCU: {HARDWARE_CONFIG.system.mcu}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Uptime: 100% Operational
            </span>
          </div>
        </div>

        {/* Latency & Subsystems Matrix */}
        <SensorHealthMatrix device={device} />

        {/* Canonical Hardware Pin Assignments Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Canonical ESP32 Physical Pin Register (Hardware Configuration)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Pin</th>
                  <th className="p-3">Label</th>
                  <th className="p-3">Subsystem Function</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Electrical Spec</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {pinRows.map((p) => (
                  <tr key={p.label} className="hover:bg-slate-950/40 transition">
                    <td className="p-3 font-bold text-sky-400">GPIO {p.pin}</td>
                    <td className="p-3 text-white font-semibold">{p.label}</td>
                    <td className="p-3 text-slate-300 font-sans">{p.function}</td>
                    <td className="p-3 text-slate-400">{p.type}</td>
                    <td className="p-3 text-slate-400 font-sans">{p.electricalSpec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
