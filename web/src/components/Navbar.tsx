'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Activity,
  MapPin,
  Route,
  History,
  Cpu,
  Sliders,
  Radio,
} from 'lucide-react';
import { ConnectionStatus, TelemetrySource } from '@/types';

interface Props {
  status?: ConnectionStatus;
  source?: TelemetrySource;
  personName?: string;
  deviceId?: string;
}

export default function Navbar({
  status = 'ONLINE',
  source = 'DEVICE_LIVE',
  personName = 'Rajesh K.',
  deviceId = 'ASTRA-001',
}: Props) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Activity },
    { name: 'Live Location', href: '/live-location', icon: MapPin },
    { name: 'Day Route', href: '/day-route', icon: Route },
    { name: 'Event History', href: '/events', icon: History },
    { name: 'Device Health', href: `/devices/${deviceId}`, icon: Cpu },
    { name: 'Demo Simulator', href: '/simulator', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Person Info */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wider text-white">ANGRAKSHA</span>
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  GUARDIAN
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Pedestrian: <span className="text-slate-200 font-medium">{personName}</span> ({deviceId})
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Live Connectivity Status Badges */}
        <div className="flex items-center gap-2.5">
          {/* Source Indicator */}
          <span
            className={`hidden sm:inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              source === 'DEVICE_LIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {source === 'DEVICE_LIVE' ? 'LIVE DEVICE TELEMETRY' : 'SIMULATED TELEMETRY'}
          </span>

          {/* Connection Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
              status === 'ONLINE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : status === 'STALE'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            <Radio className={`w-3 h-3 ${status === 'ONLINE' ? 'animate-pulse' : ''}`} />
            <span>{status}</span>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-slate-900 bg-slate-950">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap flex items-center gap-1 ${
                isActive ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3 h-3" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
