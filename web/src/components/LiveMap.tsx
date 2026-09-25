'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DeviceLocation, GPSStatus, TelemetrySource, GeofenceConfig } from '@/types';
import { MapPin, AlertTriangle, Navigation, Crosshair, ZoomIn, ZoomOut, ShieldCheck } from 'lucide-react';

interface Props {
  latitude: number;
  longitude: number;
  gpsStatus: GPSStatus;
  accuracyMeters?: number;
  speedKmh?: number;
  headingDeg?: number;
  trail?: DeviceLocation[];
  sosActive?: boolean;
  source?: TelemetrySource;
  geofence?: GeofenceConfig;
  heightClass?: string;
  onSyncBrowserGPS?: (lat: number, lng: number) => void;
}

export default function LiveMap({
  latitude,
  longitude,
  gpsStatus,
  accuracyMeters = 4.2,
  speedKmh = 1.2,
  headingDeg = 88,
  trail = [],
  sosActive = false,
  source = 'DEVICE_LIVE',
  geofence,
  heightClass = 'h-[440px]',
  onSyncBrowserGPS,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const geofenceCircleRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locating, setLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    const container = mapContainerRef.current;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted) return;

      if (!mapInstanceRef.current && container) {
        const initialLat = latitude && latitude !== 0 ? latitude : 12.9716;
        const initialLng = longitude && longitude !== 0 ? longitude : 77.5946;

        const map = L.map(container, {
          center: [initialLat, initialLng],
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
        });

        // Dark-styled OSM Carto / OSM Tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Geofence Safe Zone Circle
        if (geofence && geofence.enabled) {
          const gCircle = L.circle([geofence.centerLat, geofence.centerLng], {
            radius: geofence.radiusMeters,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.08,
            dashArray: '6, 8',
            weight: 2,
          }).addTo(map);
          gCircle.bindTooltip(`<b>Safe Zone</b>: ${geofence.name} (${geofence.radiusMeters}m)`, { permanent: false });
          geofenceCircleRef.current = gCircle;
        }

        // Custom Pulsing Pedestrian Avatar Marker
        const pulseIcon = L.divIcon({
          className: 'custom-pulse-marker',
          html: `<div class="pulse-ring ${sosActive ? 'sos' : ''}"></div><div class="pulse-dot ${sosActive ? 'sos' : ''}"></div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([initialLat, initialLng], { icon: pulseIcon }).addTo(map);
        marker.bindPopup(
          `<div class="p-1 font-sans text-xs">
            <b class="text-sky-600 font-bold">AngRaksha Pedestrian</b><br/>
            <span class="text-slate-600">Location: ${initialLat.toFixed(5)}, ${initialLng.toFixed(5)}</span><br/>
            <span class="text-slate-600">Speed: ${speedKmh.toFixed(1)} km/h | Acc: ±${accuracyMeters.toFixed(1)}m</span>
          </div>`
        );

        // Accuracy Circle
        const circle = L.circle([initialLat, initialLng], {
          radius: accuracyMeters,
          color: sosActive ? '#ef4444' : '#38bdf8',
          fillColor: sosActive ? '#ef4444' : '#38bdf8',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(map);

        // Trail Polyline
        const trailPoints = trail.map((pt) => [pt.latitude, pt.longitude] as [number, number]);
        const polyline = L.polyline(trailPoints, {
          color: '#38bdf8',
          weight: 3.5,
          opacity: 0.75,
          dashArray: '4, 8',
        }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;
        accuracyCircleRef.current = circle;
        polylineRef.current = polyline;

        setMapLoaded(true);

        // Handle dynamic layout resizing
        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Map Position, Marker, and Geofence
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !latitude || !longitude || latitude === 0 || longitude === 0) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      const circle = accuracyCircleRef.current;
      const polyline = polylineRef.current;

      map.setView([latitude, longitude], map.getZoom(), { animate: true });

      if (marker) {
        marker.setLatLng([latitude, longitude]);
        const pulseIcon = L.divIcon({
          className: 'custom-pulse-marker',
          html: `<div class="pulse-ring ${sosActive ? 'sos' : ''}"></div><div class="pulse-dot ${sosActive ? 'sos' : ''}"></div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });
        marker.setIcon(pulseIcon);
        marker.setPopupContent(
          `<div class="p-1 font-sans text-xs">
            <b class="${sosActive ? 'text-red-600' : 'text-sky-600'} font-bold">
              ${sosActive ? '🚨 CRITICAL SOS EMERGENCY' : 'AngRaksha Pedestrian'}
            </b><br/>
            <span class="text-slate-600">Coord: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</span><br/>
            <span class="text-slate-600">Speed: ${speedKmh.toFixed(1)} km/h | Acc: ±${accuracyMeters.toFixed(1)}m</span>
          </div>`
        );
      }

      if (circle) {
        circle.setLatLng([latitude, longitude]);
        circle.setRadius(accuracyMeters);
        circle.setStyle({
          color: sosActive ? '#ef4444' : '#38bdf8',
          fillColor: sosActive ? '#ef4444' : '#38bdf8',
        });
      }

      if (polyline) {
        const trailPoints = trail.map((pt) => [pt.latitude, pt.longitude] as [number, number]);
        polyline.setLatLngs(trailPoints);
      }

      map.invalidateSize();
    });
  }, [latitude, longitude, accuracyMeters, speedKmh, headingDeg, trail, sosActive, mapLoaded]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && latitude !== 0 && longitude !== 0) {
      mapInstanceRef.current.setView([latitude, longitude], 17, { animate: true });
      mapInstanceRef.current.invalidateSize();
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleSyncBrowserGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        if (onSyncBrowserGPS) {
          onSyncBrowserGPS(pos.coords.latitude, pos.coords.longitude);
        }
      },
      (err) => {
        setLocating(false);
        alert(`Failed to get device location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col shadow-xl">
      {/* Map Header Controls */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Real-Time Guardian Safety Map
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              source === 'DEVICE_LIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : source === 'SIMULATED'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
            }`}
          >
            {source === 'DEVICE_LIVE' ? '● LIVE DEVICE GPS' : `● SOURCE: ${source}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSyncBrowserGPS && (
            <button
              onClick={handleSyncBrowserGPS}
              disabled={locating}
              className="text-[11px] font-semibold px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 transition"
              title="Sync map to current phone/laptop GPS coordinates"
            >
              <Crosshair className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Acquiring...' : 'Sync Browser GPS'}
            </button>
          )}

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              gpsStatus === 'LOCKED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : gpsStatus === 'SEARCHING'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
            }`}
          >
            GPS: {gpsStatus}
          </span>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className={`relative w-full ${heightClass} bg-slate-950`}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Map Zoom / Recenter Buttons */}
        <div className="absolute right-3 bottom-3 z-[400] flex flex-col gap-1.5 shadow-lg">
          <button
            onClick={handleRecenter}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg backdrop-blur-sm transition"
            title="Recenter Pedestrian"
          >
            <Navigation className="w-4 h-4 text-sky-400" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg backdrop-blur-sm transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg backdrop-blur-sm transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Searching Overlay */}
        {gpsStatus === 'NO_FIX' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wide">Acquiring GPS Satellite Lock</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              HW-248 antenna searching for constellation. Local spatial guidance, ultrasonic sensors, and haptics operate independently on-device.
            </p>
          </div>
        )}
      </div>

      {/* Telemetry Footer Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            Coordinates: <span className="font-mono text-slate-200 font-semibold">{latitude ? latitude.toFixed(5) : '12.97160'}° N, {longitude ? longitude.toFixed(5) : '77.59460'}° E</span>
          </div>
          <div>
            Accuracy: <span className="font-mono text-slate-200 font-semibold">&plusmn;{accuracyMeters.toFixed(1)}m</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div>
            Speed: <span className="font-mono text-slate-200 font-semibold">{speedKmh.toFixed(1)} km/h</span>
          </div>
          <div>
            Heading: <span className="font-mono text-slate-200 font-semibold">{headingDeg.toFixed(0)}°</span>
          </div>
          {geofence && (
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">{geofence.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
