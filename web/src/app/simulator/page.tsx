'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  TrendingDown,
  AlertOctagon,
  Radio,
  WifiOff,
  Crosshair,
  Footprints,
  Compass,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Octagon,
} from 'lucide-react';
import Link from 'next/link';

export default function SimulatorPage() {
  const [activeScenario, setActiveScenario] = useState<string>('SCENARIO_1');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastInjected, setLastInjected] = useState<string>('None (Normal Telemetry Stream)');

  const scenarios = [
    {
      id: 'SCENARIO_1',
      title: '1. Path Clear (Forward Walking)',
      desc: 'All 3 ultrasonic sectors clear (>100cm). Guideline: PROCEED FORWARD.',
      icon: ArrowUp,
      color: 'emerald',
      payload: {
        sensors: {
          left: { distanceCm: 142, status: 'VALID' },
          front: { distanceCm: 150, status: 'VALID' },
          right: { distanceCm: 138, status: 'VALID' },
          waterDetected: false,
          dropStairDetected: false,
        },
        emergency: { sosActive: false },
      },
    },
    {
      id: 'SCENARIO_2',
      title: '2. Front Blocked → Guide LEFT',
      desc: 'Front obstacle at 25cm. Left corridor available (95cm), Right blocked (20cm).',
      icon: ArrowLeft,
      color: 'sky',
      payload: {
        sensors: {
          left: { distanceCm: 95, status: 'VALID' },
          front: { distanceCm: 25, status: 'VALID' },
          right: { distanceCm: 20, status: 'VALID' },
          waterDetected: false,
          dropStairDetected: false,
        },
        emergency: { sosActive: false },
      },
    },
    {
      id: 'SCENARIO_3',
      title: '3. Front Blocked → Guide RIGHT',
      desc: 'Front obstacle at 25cm. Right corridor available (95cm), Left blocked (20cm).',
      icon: ArrowRight,
      color: 'sky',
      payload: {
        sensors: {
          left: { distanceCm: 20, status: 'VALID' },
          front: { distanceCm: 25, status: 'VALID' },
          right: { distanceCm: 95, status: 'VALID' },
          waterDetected: false,
          dropStairDetected: false,
        },
        emergency: { sosActive: false },
      },
    },
    {
      id: 'SCENARIO_4',
      title: '4. Dead End / Total Impasse (STOP)',
      desc: 'All forward pathways blocked (<30cm). Continuous buzzer & all vibration motors fire.',
      icon: Octagon,
      color: 'red',
      payload: {
        sensors: {
          left: { distanceCm: 22, status: 'VALID' },
          front: { distanceCm: 18, status: 'VALID' },
          right: { distanceCm: 20, status: 'VALID' },
          waterDetected: false,
          dropStairDetected: false,
        },
        emergency: { sosActive: false },
      },
    },
    {
      id: 'SCENARIO_5',
      title: '5. Water Puddle Detected (Electrode ADC)',
      desc: 'GPIO 34 ADC cathode senses water conductance. Mandates immediate stop & alarm.',
      icon: Droplets,
      color: 'sky',
      payload: {
        sensors: {
          left: { distanceCm: 120, status: 'VALID' },
          front: { distanceCm: 130, status: 'VALID' },
          right: { distanceCm: 125, status: 'VALID' },
          waterDetected: true,
          waterAdcValue: 2450,
          dropStairDetected: false,
        },
        emergency: { sosActive: false },
      },
    },
    {
      id: 'SCENARIO_6',
      title: '6. Stair / Drop Descent Hazard',
      desc: 'MPU-6050 accelerometer detects freefall (<0.35g) for down-stairs step warning.',
      icon: TrendingDown,
      color: 'amber',
      payload: {
        sensors: {
          left: { distanceCm: 130, status: 'VALID' },
          front: { distanceCm: 140, status: 'VALID' },
          right: { distanceCm: 135, status: 'VALID' },
          waterDetected: false,
          dropStairDetected: true,
          imu: { status: 'OK', accelG: 0.28, pitchDeg: 12.0 },
        },
        emergency: { sosActive: false },
      },
    },
    {
      id: 'SCENARIO_7',
      title: '7. Hardware SOS Panic Button Trigger',
      desc: 'Physical switch (GPIO 15) latched. Broadcasts full-screen critical alarm & GPS rescue link.',
      icon: AlertOctagon,
      color: 'red',
      payload: {
        sensors: {
          left: { distanceCm: 140, status: 'VALID' },
          front: { distanceCm: 140, status: 'VALID' },
          right: { distanceCm: 140, status: 'VALID' },
          waterDetected: false,
          dropStairDetected: false,
        },
        emergency: { sosActive: true },
      },
    },
    {
      id: 'SCENARIO_8',
      title: '8. Geofence Boundary Breach Alert',
      desc: 'Pedestrian steps beyond 500m home perimeter. Emits caregiver warning.',
      icon: Compass,
      color: 'purple',
      payload: {
        location: {
          latitude: 12.9785,
          longitude: 77.6012,
          accuracyM: 5.0,
          speedKmh: 1.4,
          headingDeg: 95,
          fix: 'LOCKED',
        },
        emergency: { sosActive: false },
      },
    },
  ];

  const injectScenario = async (scenario: typeof scenarios[0]) => {
    setLoading(true);
    setActiveScenario(scenario.id);
    try {
      const payload = {
        deviceId: 'ASTRA-001',
        source: 'SIMULATED',
        ...scenario.payload,
      };

      await fetch('/api/device/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setLastInjected(`Injected ${scenario.title} at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error('Failed to inject scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        status="ONLINE"
        source="SIMULATED"
        personName="Rajesh K."
        deviceId="ASTRA-001"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Simulator Banner */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.2 rounded">
                  DEMO / TEST ENVIRONMENT
                </span>
                <span className="text-xs text-amber-400 font-semibold">Hackathon Judge Pitch Controller</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Inject real-world telematics scenarios into the canonical state engine to demonstrate live radar, guidance vectors, water detection, and rescue alarms.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition whitespace-nowrap"
          >
            View Live Dashboard →
          </Link>
        </div>

        {/* 8 Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((s) => {
            const Icon = s.icon;
            const isSelected = activeScenario === s.id;

            return (
              <div
                key={s.id}
                onClick={() => injectScenario(s)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-sky-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">{s.title}</h3>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500 text-white">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-mono">1-Click Telemetry Inject</span>
                  <span className="text-sky-400 font-semibold flex items-center gap-1 group">
                    Trigger Scenario →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Injected Status Feed */}
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Current State: <b className="text-white">{lastInjected}</b></span>
          <span className="text-emerald-400 font-semibold">● Canonical Telemetry Bus Synchronized</span>
        </div>
      </main>
    </div>
  );
}
