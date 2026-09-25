'use client';

import React, { useState } from 'react';
import { Radio, Play, AlertOctagon, ArrowLeft, ArrowRight, Octagon, AlertTriangle, Cpu, Satellite, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function SimulatorPage() {
  const [activeMode, setActiveMode] = useState<string>('NORMAL');
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const triggerScenario = async (mode: string) => {
    setLoading(true);
    setActiveMode(mode);
    try {
      const res = await fetch('/api/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, deviceId: 'ASTRA-001' }),
      });
      const data = await res.json();
      setLastResponse(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    {
      id: 'NORMAL',
      title: '1. Path Clear (Nominal)',
      desc: 'All sensors > 100cm. Motors idle (0% PWM). Direction: FORWARD.',
      icon: Play,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
    {
      id: 'OBSTACLE_FRONT_LEFT_CLEAR',
      title: '2. Front Blocked -> Guide LEFT',
      desc: 'Front = 25cm, Left = 85cm, Right = 20cm. Left Motor pulses rhythmically.',
      icon: ArrowLeft,
      color: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    },
    {
      id: 'OBSTACLE_FRONT_RIGHT_CLEAR',
      title: '3. Front Blocked -> Guide RIGHT',
      desc: 'Front = 25cm, Left = 20cm, Right = 85cm. Right Motor pulses rhythmically.',
      icon: ArrowRight,
      color: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    },
    {
      id: 'ALL_BLOCKED',
      title: '4. Dead End (Full Impasse)',
      desc: 'All zones < 25cm. Dual continuous vibration + 200ms acoustic stop tone.',
      icon: Octagon,
      color: 'bg-rose-600 hover:bg-rose-500 text-white',
    },
    {
      id: 'GROUND_HAZARD',
      title: '5. Ground Hazard / Pothole Drop',
      desc: 'IMU free-fall (|a| < 0.35g) or tilt > 45°. Center motor short-short-long pattern.',
      icon: AlertTriangle,
      color: 'bg-amber-600 hover:bg-amber-500 text-white',
    },
    {
      id: 'SOS_TRIGGER',
      title: '6. Hardware SOS Emergency',
      desc: 'Tactile button pressed. Continuous siren buzzer + 3-motor max emergency burst.',
      icon: AlertOctagon,
      color: 'bg-red-700 hover:bg-red-600 text-white animate-pulse',
    },
    {
      id: 'GPS_LOST',
      title: '7. GPS Satellite Loss (Indoor)',
      desc: 'GPS signal lost. Map shows NO_FIX overlay; spatial navigation continues normally.',
      icon: Satellite,
      color: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    },
    {
      id: 'SENSOR_FAULT',
      title: '8. Range Sensor Disconnect',
      desc: 'All ultrasonic sensors disconnected. Transitions to SENSOR_FAULT + audio beeps.',
      icon: Cpu,
      color: 'bg-purple-700 hover:bg-purple-600 text-white',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Hackathon Interactive Simulator Console</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              DEMO MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inject realistic telematics payloads into the live pipeline to demonstrate real-time guardian telematics to judges.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          View Live Dashboard &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((s) => {
          const Icon = s.icon;
          const isActive = activeMode === s.id;
          return (
            <button
              key={s.id}
              onClick={() => triggerScenario(s.id)}
              disabled={loading}
              className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'border-cyan-400 bg-card shadow-lg shadow-cyan-950/50 scale-[1.02]'
                  : 'border-border bg-card hover:bg-card-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isActive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    ACTIVE
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white leading-snug">{s.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] font-semibold text-cyan-400">
                Click to Trigger Scenario &rarr;
              </div>
            </button>
          );
        })}
      </div>

      {lastResponse && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-slate-300">Injected Telemetry Payload</span>
            <span className="font-mono text-emerald-400">HTTP 200 OK</span>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
            {JSON.stringify(lastResponse.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
