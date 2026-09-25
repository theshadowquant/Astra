'use client';

import React, { useEffect, useRef } from 'react';
import { DeviceLocation, GPSStatus } from '@/types';
import { MapPin, AlertTriangle } from 'lucide-react';

interface Props {
  latitude: number;
  longitude: number;
  gpsStatus: GPSStatus;
  accuracyMeters?: number;
  trail?: DeviceLocation[];
  sosActive?: boolean;
}

export default function LiveMap({
  latitude,
  longitude,
  gpsStatus,
  accuracyMeters = 5.0,
  trail = [],
  sosActive = false,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    const container = mapContainerRef.current;

    import('leaflet').then((L) => {
      // Fix marker icon URLs in webpack/Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && container) {
        const map = L.map(container, {
          center: [latitude, longitude],
          zoom: 16,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Marker
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(`<b>AngRaksha Pedestrian</b><br>Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`).openPopup();

        // Accuracy Circle
        const circle = L.circle([latitude, longitude], {
          radius: accuracyMeters,
          color: sosActive ? '#ef4444' : '#38bdf8',
          fillColor: sosActive ? '#ef4444' : '#38bdf8',
          fillOpacity: 0.15,
        }).addTo(map);

        // Trail Polyline
        const trailPoints = trail.map((pt) => [pt.latitude, pt.longitude] as [number, number]);
        const polyline = L.polyline(trailPoints, {
          color: '#38bdf8',
          weight: 4,
          opacity: 0.7,
          dashArray: '4, 8',
        }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;
        accuracyCircleRef.current = circle;
        polylineRef.current = polyline;
      } else if (mapInstanceRef.current) {
        const map = mapInstanceRef.current;
        const marker = markerRef.current;
        const circle = accuracyCircleRef.current;
        const polyline = polylineRef.current;

        if (latitude !== 0 && longitude !== 0) {
          map.setView([latitude, longitude], map.getZoom(), { animate: true });
          marker.setLatLng([latitude, longitude]);
          marker.setPopupContent(
            `<b>AngRaksha Pedestrian</b><br>${sosActive ? '🚨 SOS EMERGENCY' : 'Normal Navigation'}<br>${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          );

          circle.setLatLng([latitude, longitude]);
          circle.setRadius(accuracyMeters);
          circle.setStyle({
            color: sosActive ? '#ef4444' : '#38bdf8',
            fillColor: sosActive ? '#ef4444' : '#38bdf8',
          });

          const trailPoints = trail.map((pt) => [pt.latitude, pt.longitude] as [number, number]);
          polyline.setLatLngs(trailPoints);
        }
      }
    });
  }, [latitude, longitude, accuracyMeters, trail, sosActive]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="p-3.5 border-b border-border flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Rescue Telemetry Map</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              gpsStatus === 'LOCKED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            GPS: {gpsStatus}
          </span>
        </div>
      </div>

      <div className="relative w-full h-[320px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />

        {gpsStatus === 'NO_FIX' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wide">Acquiring GPS Satellite Lock</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Antenna searching for satellite constellation. Local spatial guidance and haptics continue operating at full capacity.
            </p>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-900/40 border-t border-border flex items-center justify-between text-xs text-slate-400">
        <div>
          Coordinates: <span className="font-mono text-slate-200 font-semibold">{latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E</span>
        </div>
        <div>
          Accuracy: <span className="font-mono text-slate-200 font-semibold">&plusmn;{accuracyMeters.toFixed(1)}m</span>
        </div>
      </div>
    </div>
  );
}
