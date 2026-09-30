import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Radio, 
  ShieldAlert, 
  Eye, 
  Maximize2, 
  Layers, 
  MapPin, 
  X,
  ChevronRight
} from 'lucide-react';
import { LocationRecord, WarningRecord } from '../types.js';

interface MapViewProps {
  location: LocationRecord;
  locations: LocationRecord[];
  warnings: WarningRecord[];
  onSelectLocation: (loc: LocationRecord) => void;
}

// Official IMD Doppler Weather Radar (DWR) Stations Network Coordinates
const IMD_DWR_STATIONS = [
  { name: 'Delhi (Palam)', lat: 28.5665, lng: 77.1031, rangeKm: 250 },
  { name: 'Mumbai (Colaba)', lat: 18.8932, lng: 72.8122, rangeKm: 250 },
  { name: 'Kolkata (Alipore)', lat: 22.5333, lng: 88.3333, rangeKm: 250 },
  { name: 'Chennai (Port)', lat: 13.0827, lng: 80.2907, rangeKm: 250 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, rangeKm: 250 },
  { name: 'Bhubaneswar', lat: 20.2522, lng: 85.8197, rangeKm: 250 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673, rangeKm: 250 },
  { name: 'Visakhapatnam', lat: 17.6833, lng: 83.2833, rangeKm: 250 },
  { name: 'Srinagar', lat: 34.0837, lng: 74.7973, rangeKm: 150 },
  { name: 'Shimla', lat: 31.0975, lng: 77.2674, rangeKm: 150 },
  { name: 'Hyderabad', lat: 17.4531, lng: 78.4677, rangeKm: 250 }
];

export const MapView: React.FC<MapViewProps> = ({
  location,
  locations,
  warnings,
  onSelectLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const baseLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<'street' | 'dark' | 'satellite'>('street');
  const [showRadar, setShowRadar] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    const mapInstance = L.map(container, {
      center: [location.latitude || 28.5847, location.longitude || 77.2066],
      zoom: 6,
      minZoom: 4,
      maxZoom: 14,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

    setMap(mapInstance);

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.invalidateSize();
    });
    resizeObserver.observe(container);

    const timer = setTimeout(() => {
      mapInstance.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  // Update Base Tiles
  useEffect(() => {
    if (!map) return;

    if (baseLayersGroupRef.current) {
      map.removeLayer(baseLayersGroupRef.current);
    }
    const baseGroup = L.layerGroup().addTo(map);
    baseLayersGroupRef.current = baseGroup;

    if (mapStyle === 'dark') {
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        className: 'map-tiles-dark',
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(baseGroup);
    } else if (mapStyle === 'street') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri & OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(baseGroup);
    } else {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri, Maxar',
        maxZoom: 19
      }).addTo(baseGroup);
    }

    map.invalidateSize();
  }, [map, mapStyle]);

  // Overlays
  useEffect(() => {
    if (!map) return;

    map.panTo([location.latitude, location.longitude], { animate: true });

    if (overlayGroupRef.current) {
      map.removeLayer(overlayGroupRef.current);
    }
    const layerGroup = L.layerGroup().addTo(map);
    overlayGroupRef.current = layerGroup;

    // Radar circles
    if (showRadar) {
      IMD_DWR_STATIONS.forEach((dwr) => {
        L.circle([dwr.lat, dwr.lng], {
          radius: dwr.rangeKm * 1000,
          color: '#06b6d4',
          weight: 1.5,
          opacity: 0.6,
          fillColor: '#06b6d4',
          fillOpacity: 0.04
        }).addTo(layerGroup);

        const radarMarker = L.circleMarker([dwr.lat, dwr.lng], {
          radius: 5,
          color: '#06b6d4',
          fillColor: '#ffffff',
          fillOpacity: 0.9,
          weight: 2
        });
        radarMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #020617; padding: 2px;">
            <strong>Radar: ${dwr.name}</strong>
            <p style="margin: 2px 0 0; font-size: 11px; color: #475569;">IMD Doppler 250km Scan Radius</p>
          </div>
        `);
        layerGroup.addLayer(radarMarker);
      });
    }

    // Active Location marker
    const activeIcon = L.divIcon({
      className: 'route-marker-container',
      html: `
        <div style="position: relative; display: inline-flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
          <div style="
            background: #020617;
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);
            border: 2px solid #06b6d4;
            white-space: nowrap;
          ">
            <span>📍</span>
            <span>${location.name.split('(')[0].trim()}</span>
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #06b6d4;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
    layerGroup.addLayer(L.marker([location.latitude, location.longitude], { icon: activeIcon }));

    // Warnings
    if (showWarnings && warnings.length > 0) {
      warnings.forEach((w) => {
        const lat = location.latitude + 0.1;
        const lng = location.longitude + 0.1;
        const color = w.severity === 'RED' ? '#f43f5e' : '#f59e0b';

        const warningZone = L.circle([lat, lng], {
          radius: 80000,
          color,
          weight: 1.5,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: 0.15,
          dashArray: '4, 4'
        }).addTo(layerGroup);

        warningZone.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #020617; padding: 2px;">
            <strong style="color: ${color};">${w.severity}: ${w.title}</strong>
            <p style="margin: 3px 0 0; font-size: 11px;">${w.message}</p>
          </div>
        `);
      });
    }

    map.invalidateSize();
  }, [map, location, warnings, showRadar, showWarnings]);

  const handleRecenter = () => {
    if (!map) return;
    map.setView([location.latitude, location.longitude], 6);
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08] animate-fade-in">
      {/* 21. MAP IS THE DOMINANT VISUAL ELEMENT */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Glass Top Controls */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto z-[1000] flex flex-wrap items-center gap-2">
        {/* Style selector */}
        <div className="flex items-center p-1 rounded-full bg-slate-950/80 backdrop-blur-xl border border-white/10 text-xs shadow-lg">
          <button
            type="button"
            onClick={() => setMapStyle('street')}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              mapStyle === 'street' ? 'bg-white/[0.12] text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Street
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('dark')}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              mapStyle === 'dark' ? 'bg-white/[0.12] text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              mapStyle === 'satellite' ? 'bg-white/[0.12] text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center p-1 rounded-full bg-slate-950/80 backdrop-blur-xl border border-white/10 text-xs shadow-lg gap-1">
          <button
            type="button"
            onClick={() => setShowRadar(!showRadar)}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
              showRadar ? 'bg-cyan-950/80 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Radar</span>
          </button>
          <button
            type="button"
            onClick={() => setShowWarnings(!showWarnings)}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
              showWarnings ? 'bg-amber-950/80 text-amber-300 font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Warnings</span>
          </button>
        </div>

        {/* Recenter */}
        <button
          type="button"
          onClick={handleRecenter}
          className="p-2 rounded-full bg-slate-950/80 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white shadow-lg cursor-pointer"
          title="Recenter"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Bottom Left Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-2xl p-3 text-xs text-slate-300 shadow-xl max-w-xs">
        <div className="font-semibold text-white mb-1">
          {location.name.split('(')[0].trim()}
        </div>
        <div className="text-[11px] text-slate-400">
          IMD Doppler Radar 250km rings · {mapStyle === 'satellite' ? 'Esri Satellite' : 'Esri World Streets'}
        </div>
      </div>
    </div>
  );
};
