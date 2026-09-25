'use client';

import React, { useEffect, useRef } from 'react';
import { DeviceState } from '@/types';
import { AlertOctagon, PhoneCall, CheckCircle, MapPin, Battery, ShieldAlert, Volume2, VolumeX } from 'lucide-react';

interface Props {
  device: DeviceState;
  onAcknowledge: () => void;
  onReset: () => void;
}

export default function SOSAlertModal({ device, onAcknowledge, onReset }: Props) {
  const isSOS = device.emergency.sosActive;
  const isAcknowledged = device.emergency.acknowledged;
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<any>(null);

  // Play browser Web Audio API siren alarm without external sound files
  useEffect(() => {
    if (isSOS && !isAcknowledged) {
      const playBeep = () => {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContextClass();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') {
            ctx.resume();
          }

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);

          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } catch (err) {
          console.warn('Audio alarm playback blocked by browser policy until user interacts:', err);
        }
      };

      playBeep();
      intervalRef.current = setInterval(playBeep, 800);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSOS, isAcknowledged]);

  if (!isSOS) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border-2 border-red-500 bg-slate-950 p-6 shadow-2xl shadow-red-500/30 flex flex-col gap-5">
        {/* Header Title with Flashing Badge */}
        <div className="flex items-center gap-4 border-b border-red-500/30 pb-4">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500 flex items-center justify-center text-red-500 animate-pulse">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest uppercase bg-red-600 text-white px-2 py-0.5 rounded">
                CRITICAL SOS EMERGENCY
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {device.emergency.triggeredAt ? new Date(device.emergency.triggeredAt).toLocaleTimeString() : 'JUST NOW'}
              </span>
            </div>
            <h2 className="text-lg font-black text-white mt-1">
              Physical SOS Panic Triggered by {device.personName}
            </h2>
          </div>
        </div>

        {/* Location & Rescue Coordinates */}
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>Current GPS Coordinates</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              Accuracy: &plusmn;{device.location.accuracyM ? device.location.accuracyM.toFixed(1) : 4.2}m
            </span>
          </div>

          <div className="font-mono text-base font-black text-white bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center">
            {device.location.latitude.toFixed(6)}° N, {device.location.longitude.toFixed(6)}° E
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-emerald-400" />
              <span>Stick Battery: <b>{device.battery.percent}%</b> ({device.battery.voltage.toFixed(2)}V)</span>
            </div>
            <div className="text-slate-400 font-mono">
              Device: {device.deviceId}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${device.location.latitude},${device.location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition"
          >
            <MapPin className="w-4 h-4" />
            Open Rescue Coordinates
          </a>

          {!isAcknowledged ? (
            <button
              onClick={onAcknowledge}
              className="py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <VolumeX className="w-4 h-4" />
              Mute Alarm & Acknowledge
            </button>
          ) : (
            <button
              onClick={onReset}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Resolve Emergency
            </button>
          )}
        </div>

        <p className="text-[11px] text-center text-slate-400">
          * AngRaksha smart stick has latched emergency alarm. Requires caregiver verification.
        </p>
      </div>
    </div>
  );
}
