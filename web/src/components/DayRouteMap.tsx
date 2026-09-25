'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DeviceLocation, GeofenceConfig, TelemetrySource } from '@/types';
import { Route, MapPin, Navigation, ZoomIn, ZoomOut, Flag, CheckCircle2 } from 'lucide-react';

interface Props {
  waypoints: DeviceLocation[];
  geofence?: GeofenceConfig;
  source?: TelemetrySource;
  heightClass?: string;
}

export default function DayRouteMap({
  waypoints = [],
  geofence,
  source = 'DEVICE_LIVE',
  heightClass = 'h-[500px]',
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    const container = mapContainerRef.current;
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted) return;

      if (!mapInstanceRef.current && container) {
        const centerLat = waypoints.length > 0 ? waypoints[waypoints.length - 1].latitude : 12.9716;
        const centerLng = waypoints.length > 0 ? waypoints[waypoints.length - 1].longitude : 77.5946;

        const map = L.map(container, {
          center: [centerLat, centerLng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: 'abc',
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Geofence Circle
        if (geofence && geofence.enabled) {
          L.circle([geofence.centerLat, geofence.centerLng], {
            radius: geofence.radiusMeters,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.08,
            dashArray: '6, 8',
            weight: 2,
          }).addTo(map);
        }

        // Draw Breadcrumb Day Polyline
        const points = waypoints.map((pt) => [pt.latitude, pt.longitude] as [number, number]);
        if (points.length > 0) {
          const polyline = L.polyline(points, {
            color: '#0284c7',
            weight: 4.5,
            opacity: 0.9,
          }).addTo(map);

          // Start Waypoint
          if (points.length > 1) {
            const startIcon = L.divIcon({
              className: 'custom-start-marker',
              html: `<div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] border-2 border-white shadow-md">S</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });
            L.marker(points[0], { icon: startIcon }).addTo(map).bindPopup('<b>Day Journey Origin</b>');
          }

          // Current / End Waypoint
          const currentIcon = L.divIcon({
            className: 'custom-pulse-marker',
            html: `<div class="pulse-ring"></div><div class="pulse-dot"></div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });
          L.marker(points[points.length - 1], { icon: currentIcon }).addTo(map).bindPopup('<b>Current Location</b>');

          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        }

        mapInstanceRef.current = map;
        setMapLoaded(true);

        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [waypoints]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col shadow-xl">
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Day Traversal Breadcrumb Route
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              source === 'DEVICE_LIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {source === 'DEVICE_LIVE' ? '● PERSISTED ROUTE' : '● SIMULATED ROUTE'}
          </span>
        </div>

        <div className="text-xs text-slate-400">
          Total Waypoints: <span className="font-semibold text-white">{waypoints.length}</span>
        </div>
      </div>

      <div className={`relative w-full ${heightClass} bg-slate-950`}>
        <div ref={mapContainerRef} className="w-full h-full" />

        <div className="absolute right-3 bottom-3 z-[400] flex flex-col gap-1.5 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg backdrop-blur-sm transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg backdrop-blur-sm transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
