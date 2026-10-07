import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Compass, 
  Radio, 
  Layers, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Info,
  Maximize2,
  ChevronDown,
  ChevronUp,
  CloudRain,
  X,
  Check,
  Activity
} from 'lucide-react';
import { 
  LocationRecord, 
  PlanRecord, 
  RainAroundYouReport, 
  RadarFrame, 
  PrecipitationCell 
} from '../types.js';
import { PlanConflictAnalysis } from '../services/rainSpatialAnalysis.js';

interface RainAroundYouViewProps {
  location: LocationRecord;
  report: RainAroundYouReport | null;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  onBack: () => void;
  onChallengePlan?: (plan: PlanRecord) => void;
  planConflict?: PlanConflictAnalysis;
}

export const RainAroundYouView: React.FC<RainAroundYouViewProps> = ({
  location,
  report,
  isLoading = false,
  theme = 'light',
  onBack,
  onChallengePlan,
  planConflict
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showRings, setShowRings] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showTowns, setShowTowns] = useState<boolean>(true);
  const [showLayersMenu, setShowLayersMenu] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  // Default to collapsed on mobile (<768px) to prevent screen congestion
  const [isDrawerExpanded, setIsDrawerExpanded] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  });

  const isLight = theme === 'light';
  const frames = report?.frames || [];
  const activeFrame: RadarFrame | undefined = frames[activeFrameIndex] || frames[frames.length - 1];

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const userLat = location.latitude || 28.5847;
    const userLng = location.longitude || 77.2066;

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 6,
      maxZoom: 16
    }).setView([userLat, userLng], 10);

    // High performance Esri Canvas Light & Dark gray base (zero watermark, no API key required)
    const baseTileUrl = isLight
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    // High definition reference labels layer: displays all cities, towns, roads, and boundaries clearly
    const refTileUrl = isLight
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';

    L.tileLayer(baseTileUrl, { 
      maxZoom: 19,
      attribution: 'Esri, HERE, Garmin, USGS'
    }).addTo(map);

    L.tileLayer(refTileUrl, {
      maxZoom: 19,
      opacity: 0.95
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location.latitude, location.longitude, isLight]);

  // Update Map Layers when activeFrame, toggles, or report updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const userLat = location.latitude || 28.5847;
    const userLng = location.longitude || 77.2066;

    // 1. Concentric Distance Range Rings (10 km, 25 km, 50 km)
    if (showRings) {
      const ringDistances = [10, 25, 50];
      ringDistances.forEach((km) => {
        const ring = L.circle([userLat, userLng], {
          radius: km * 1000,
          color: isLight ? '#0284c7' : '#38bdf8',
          weight: km === 50 ? 1.5 : 1,
          dashArray: km === 25 ? '4, 4' : undefined,
          fillColor: 'transparent',
          fillOpacity: 0
        });

        // Add small distance badge on the north rim of each circle
        const northLat = userLat + (km / 111);
        const labelMarker = L.marker([northLat, userLng], {
          icon: L.divIcon({
            className: 'distance-ring-label',
            html: `<div style="transform: translate(-50%, -50%); background: ${isLight ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)'}; color: ${isLight ? '#0369a1' : '#38bdf8'}; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 9999px; border: 1px solid ${isLight ? '#bae6fd' : '#0369a1'}; white-space: nowrap;">${km} km</div>`
          })
        });

        group.addLayer(ring);
        group.addLayer(labelMarker);
      });
    }

    // 2. Active Precipitation Cells Layer
    if (activeFrame && activeFrame.cells) {
      activeFrame.cells.forEach((cell) => {
        const isIntense = cell.intensityDbz >= 50;
        const isHeavy = cell.intensityDbz >= 40 && cell.intensityDbz < 50;
        const isModerate = cell.intensityDbz >= 30 && cell.intensityDbz < 40;

        // Clean Doppler Reflectivity Palette - Crisp, translucent, no murky dark blue blobs
        const cellColor = isIntense ? '#ef4444' : isHeavy ? '#f97316' : isModerate ? '#10b981' : '#38bdf8';

        // Outer cloud reflectivity boundary (translucent radar plume)
        const outerCircle = L.circle([cell.latitude, cell.longitude], {
          radius: cell.radiusKm * 1000,
          color: cellColor,
          weight: 1.2,
          opacity: 0.8,
          fillColor: cellColor,
          fillOpacity: 0.16,
          dashArray: '4, 4'
        });

        // Intermediate precipitation gradient
        const midCircle = L.circle([cell.latitude, cell.longitude], {
          radius: cell.radiusKm * 600,
          color: cellColor,
          weight: 1,
          opacity: 0.85,
          fillColor: cellColor,
          fillOpacity: 0.22
        });

        // Concentrated core
        const coreCircle = L.circle([cell.latitude, cell.longitude], {
          radius: cell.radiusKm * 280,
          color: cellColor,
          weight: 1.5,
          opacity: 0.95,
          fillColor: cellColor,
          fillOpacity: 0.38
        });

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px; line-height: 1.4;">
            <div style="font-weight: 800; color: ${cellColor}; text-transform: uppercase;">
              ${cell.category} PRECIPITATION
            </div>
            <div style="margin-top: 4px;">
              <strong>Reflectivity:</strong> ${cell.intensityDbz} dBZ
            </div>
            <div>
              <strong>Precipitation Rate:</strong> ${cell.rainRateMmPerHour} mm/hr
            </div>
            <div>
              <strong>Distance from you:</strong> ${Math.round(cell.distanceFromUserKm)} km (${cell.bearingCardinal})
            </div>
            ${cell.overlappingTown ? `<div style="margin-top: 4px; color: #0284c7; font-weight: 700;">Over: ${cell.overlappingTown}</div>` : ''}
          </div>
        `;
        outerCircle.bindPopup(popupContent);
        midCircle.bindPopup(popupContent);
        coreCircle.bindPopup(popupContent);

        group.addLayer(outerCircle);
        group.addLayer(midCircle);
        group.addLayer(coreCircle);

        // Center Reflectivity Badge
        const centerBadge = L.marker([cell.latitude, cell.longitude], {
          icon: L.divIcon({
            className: 'radar-cell-center-badge',
            html: `
              <div style="transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); color: ${cellColor}; border: 1px solid ${cellColor}; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); white-space: nowrap; pointer-events: none;">
                ${cell.intensityDbz} dBZ
              </div>
            `
          })
        });
        group.addLayer(centerBadge);

        // Movement vector line for each cell
        if (showVectors && report?.movement) {
          const vectorDeg = report.movement.directionDeg;
          const rad = (vectorDeg * Math.PI) / 180;
          const offsetLat = Math.cos(rad) * (cell.radiusKm / 111) * 1.5;
          const offsetLng = (Math.sin(rad) * (cell.radiusKm / 111) * 1.5) / Math.cos((cell.latitude * Math.PI) / 180);

          const endLat = cell.latitude + offsetLat;
          const endLng = cell.longitude + offsetLng;

          const vectorLine = L.polyline([[cell.latitude, cell.longitude], [endLat, endLng]], {
            color: '#38bdf8',
            weight: 2,
            dashArray: '3, 3'
          });
          group.addLayer(vectorLine);
        }
      });
    }

    // 3. Surrounding Cities, Towns & Regional Landmarks (Mention Cities in Map)
    if (showTowns) {
      // Gather cities from report or local fallback
      const citiesList = report?.surroundingCities && report.surroundingCities.length > 0
        ? report.surroundingCities
        : [
            { name: 'Rampur', district: 'Rampur', state: 'UP', latitude: 28.8154, longitude: 79.0250, distanceKm: 25.1, bearingCardinal: 'E', hasRain: false },
            { name: 'Sambhal', district: 'Sambhal', state: 'UP', latitude: 28.5841, longitude: 78.5663, distanceKm: 34.2, bearingCardinal: 'SW', hasRain: false },
            { name: 'Amroha', district: 'Amroha', state: 'UP', latitude: 28.9044, longitude: 78.4684, distanceKm: 28.6, bearingCardinal: 'W', hasRain: false },
            { name: 'Chandausi', district: 'Sambhal', state: 'UP', latitude: 28.4500, longitude: 78.7800, distanceKm: 42.5, bearingCardinal: 'S', hasRain: false },
            { name: 'Kashipur', district: 'Udham Singh Nagar', state: 'UK', latitude: 29.2100, longitude: 78.9600, distanceKm: 45.3, bearingCardinal: 'N', hasRain: false },
            { name: 'Thakurdwara', district: 'Moradabad', state: 'UP', latitude: 29.1900, longitude: 78.8600, distanceKm: 40.1, bearingCardinal: 'NW', hasRain: false },
            { name: 'Bilaspur', district: 'Rampur', state: 'UP', latitude: 28.8800, longitude: 79.2600, distanceKm: 46.8, bearingCardinal: 'NE', hasRain: false },
            { name: 'Dhampur', district: 'Bijnor', state: 'UP', latitude: 29.3100, longitude: 78.5100, distanceKm: 52.3, bearingCardinal: 'NW', hasRain: false }
          ];

      citiesList.forEach((city) => {
        // Skip user's exact current location (< 3 km) since center pin covers it
        if (city.distanceKm < 3) return;

        const hasRain = Boolean(
          city.hasRain || 
          (report?.nearbyAffectedAreas && report.nearbyAffectedAreas.some(a => a.name.toLowerCase() === city.name.toLowerCase()))
        );

        const badgeBg = hasRain 
          ? (isLight ? '#e0f2fe' : '#082f49')
          : (isLight ? '#ffffff' : '#0f172a');
        const badgeColor = hasRain 
          ? '#0284c7' 
          : (isLight ? '#0f172a' : '#f8fafc');
        const borderColor = hasRain 
          ? '#38bdf8' 
          : (isLight ? '#cbd5e1' : '#334155');

        const marker = L.marker([city.latitude, city.longitude], {
          icon: L.divIcon({
            className: 'city-landmark-badge',
            html: `
              <div style="transform: translate(-50%, -50%); background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; padding: 2.5px 8px; border-radius: 9999px; border: 1.5px solid ${borderColor}; box-shadow: 0 4px 10px -1px rgba(0,0,0,0.18); white-space: nowrap; display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: ${hasRain ? '#0284c7' : '#94a3b8'};"></span>
                <span>${city.name}</span>
                <span style="font-size: 9px; opacity: 0.75; font-family: monospace;">${Math.round(city.distanceKm)}km ${city.bearingCardinal}</span>
              </div>
            `
          })
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px; min-width: 155px;">
            <strong style="font-size: 13px;">${city.name}</strong><br/>
            <span style="color: #64748b; font-size: 11px;">${city.district}, ${city.state}</span>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 11px;">
              <span>Distance from you: <strong>${Math.round(city.distanceKm)} km</strong> (${city.bearingCardinal})</span><br/>
              <span>Precipitation: <strong style="color: ${hasRain ? '#0284c7' : '#10b981'};">${hasRain ? '🌧️ Rain Cell Detected' : '☀️ Clear Skies'}</strong></span>
            </div>
          </div>
        `);
        group.addLayer(marker);

        // Corridor connection line from user location to surrounding city
        const cityConn = L.polyline([[userLat, userLng], [city.latitude, city.longitude]], {
          color: hasRain ? '#38bdf8' : (isLight ? '#94a3b8' : '#475569'),
          weight: 1.2,
          dashArray: '3, 4',
          opacity: 0.55
        });
        group.addLayer(cityConn);
      });
    }

    // 4. User Current Location Pin (Center with pulse effect & Prominent City Name Badge)
    const userCityName = location.name.split('(')[0].trim();
    const userMarker = L.marker([userLat, userLng], {
      icon: L.divIcon({
        className: 'user-pin-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); pointer-events: auto;">
            <div style="background: ${isLight ? '#0284c7' : '#38bdf8'}; color: ${isLight ? '#ffffff' : '#0f172a'}; font-size: 11px; font-weight: 800; padding: 2.5px 9px; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); white-space: nowrap; margin-bottom: 3px; display: flex; align-items: center; gap: 4px; border: 1.5px solid #ffffff;">
              <span>📍 ${userCityName}</span>
              <span style="font-size: 9px; opacity: 0.9; font-weight: 600;">(You)</span>
            </div>
            <div style="position: relative; width: 22px; height: 22px;">
              <div style="position: absolute; inset: 0; background: rgba(56, 189, 248, 0.45); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; inset: 3px; background: #0284c7; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
            </div>
          </div>
        `
      })
    });
    userMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; font-weight: bold; padding: 4px;">
        📍 ${location.name} (Your Current Location)
      </div>
    `);
    group.addLayer(userMarker);

    // 5. Radar Station Pin (if within map bounds)
    if (report?.radarStation && report.radarStation.operationalStatus !== 'OFFLINE') {
      const stLat = report.radarStation.latitude;
      const stLng = report.radarStation.longitude;
      const stationMarker = L.marker([stLat, stLng], {
        icon: L.divIcon({
          className: 'radar-station-marker',
          html: `<div style="transform: translate(-50%, -50%); background: ${isLight ? '#0f172a' : '#1e293b'}; color: #38bdf8; font-size: 10px; font-family: monospace; font-weight: 700; padding: 2px 6px; border-radius: 6px; border: 1px solid #38bdf8; white-space: nowrap;">
            📡 ${report.radarStation.code}
          </div>`
        })
      });
      stationMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong>IMD Doppler Weather Radar</strong><br/>
          <span>Station: ${report.radarStation.name}</span><br/>
          <span>Frequency: ${report.radarStation.frequencyBand}</span><br/>
          <span>Distance: ${Math.round(report.radarStation.distanceKm)} km from you</span>
        </div>
      `);
      group.addLayer(stationMarker);
    }
  }, [activeFrame, showRings, showVectors, showTowns, location, report, isLight]);

  // Animation Playback Controller (Sequencing Previous vs Current Frames)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev === 0 ? 1 : 0));
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Recenter map on user location
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([location.latitude, location.longitude], 10, { animate: true });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.25rem)] md:h-[calc(100vh-5.5rem)] max-w-7xl mx-auto w-full gap-2 sm:gap-3 animate-fade-in">
      {/* 1. MINIMAL, STREAMLINED TOP HEADER (Reduced Clutter, Uncongested) */}
      <div className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border backdrop-blur-xl flex items-center justify-between gap-2 shadow-sm shrink-0 transition-colors ${
        isLight ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-900/90 border-white/10 text-white shadow-black/30'
      }`}>
        {/* Left: Back + Title + Location badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight truncate">
              <span className="sm:hidden">Rain Radar</span>
              <span className="hidden sm:inline">Rain Around You</span>
            </h1>
            <span className={`text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg truncate ${
              isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
            }`}>
              {location.name.split('(')[0].trim()}
            </span>
          </div>
        </div>

        {/* Center / Right: Status Badge & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border ${
            report?.status === 'RAIN_OVER_YOU'
              ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
              : report?.status === 'RAIN_APPROACHING'
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
              : report?.status === 'RAIN_MOVING_AWAY'
              ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/30'
              : report?.status === 'RAIN_NEARBY'
              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30'
              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              report?.status === 'RAIN_OVER_YOU' ? 'bg-cyan-500 animate-ping' :
              report?.status === 'RAIN_APPROACHING' ? 'bg-amber-500 animate-pulse' :
              'bg-emerald-500'
            }`} />
            <span className="truncate max-w-[85px] sm:max-w-none">
              {report?.statusHeadline ? report.statusHeadline.split(':')[0] : 'Monitoring'}
            </span>
          </div>

          {/* Timestamp on Desktop */}
          <div className={`hidden md:flex px-2 py-0.5 rounded-lg border text-[11px] font-mono items-center gap-1.5 ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800/80 border-white/10 text-slate-300'
          }`}>
            <Radio className="w-3 h-3 text-cyan-500 shrink-0" />
            <span>IMD Radar</span>
            <span>·</span>
            <span className="font-bold text-cyan-500">
              {report?.provenance?.updatedAtIST ? report.provenance.updatedAtIST.replace('IST', '').trim() : 'Live'}
            </span>
          </div>

          {/* Mobile Details Drawer Button */}
          <button
            type="button"
            onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
            className={`lg:hidden px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
              isDrawerExpanded 
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm' 
                : isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-cyan-500" />
            <span>Intel</span>
          </button>
        </div>
      </div>

      {/* 2. BALANCED GRID: EXPANSIVE RADAR MAP (Dominates Space) + SPATIAL SIDEBAR (Desktop) */}
      <div className="grid grid-cols-12 gap-2.5 sm:gap-4 flex-1 min-h-0 relative">
        {/* PRIMARY MAP CANVAS (Dominant visual space on both mobile & desktop) */}
        <div className={`col-span-12 lg:col-span-8 xl:col-span-9 h-full flex flex-col min-h-0 relative rounded-2xl sm:rounded-3xl overflow-hidden border shadow-xl transition-all ${
          isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-white/10'
        }`}>
          {/* Leaflet Map Canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Minimal Floating Controls (Top Left of Map) */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 pointer-events-auto">
            {/* Recenter Button */}
            <button
              type="button"
              onClick={handleRecenter}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border backdrop-blur-md shadow-md transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                isLight ? 'bg-white/95 border-slate-300 text-slate-800 hover:bg-white' : 'bg-slate-900/95 border-white/15 text-white hover:bg-slate-800'
              }`}
              title="Recenter on your location"
            >
              <Compass className="w-4 h-4 text-cyan-500 shrink-0" />
              <span className="hidden sm:inline">Center</span>
            </button>

            {/* Desktop Quick Map Overlays Pill Group */}
            <div className={`hidden sm:flex items-center p-0.5 rounded-xl border backdrop-blur-md shadow-md text-xs ${
              isLight ? 'bg-white/95 border-slate-300' : 'bg-slate-900/95 border-white/15'
            }`}>
              <button
                type="button"
                onClick={() => setShowRings(!showRings)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                  showRings 
                    ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle 10, 25, 50 km surveillance rings"
              >
                Rings
              </button>
              <button
                type="button"
                onClick={() => setShowVectors(!showVectors)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                  showVectors 
                    ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle precipitation cell movement vectors"
              >
                Vectors
              </button>
              <button
                type="button"
                onClick={() => setShowTowns(!showTowns)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                  showTowns 
                    ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle overlapping towns markers"
              >
                Towns
              </button>
            </div>

            {/* Mobile Layers Dropdown (Uncongested compact trigger) */}
            <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setShowLayersMenu(!showLayersMenu);
                  setShowLegend(false);
                }}
                className={`p-2 rounded-xl border backdrop-blur-md shadow-md text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  showLayersMenu
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-900/95 border-white/15 text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-cyan-500" />
                <span className="text-[11px]">Layers</span>
              </button>

              {showLayersMenu && (
                <div className={`absolute top-full left-0 mt-1.5 w-40 rounded-xl border p-1.5 shadow-xl backdrop-blur-xl z-30 text-xs space-y-1 ${
                  isLight ? 'bg-white/95 border-slate-300 text-slate-900' : 'bg-slate-900/95 border-white/15 text-slate-100'
                }`}>
                  <button
                    type="button"
                    onClick={() => setShowRings(!showRings)}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left hover:bg-cyan-500/10 cursor-pointer"
                  >
                    <span>Range Rings</span>
                    {showRings && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVectors(!showVectors)}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left hover:bg-cyan-500/10 cursor-pointer"
                  >
                    <span>Cell Vectors</span>
                    {showVectors && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTowns(!showTowns)}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left hover:bg-cyan-500/10 cursor-pointer"
                  >
                    <span>Nearby Towns</span>
                    {showTowns && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top-Right Reflectivity Legend: Full on Desktop, Compact on Mobile */}
          <div className="absolute top-3 right-3 z-10 pointer-events-auto">
            {/* Desktop Full Legend */}
            <div className={`hidden sm:flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-md text-[10px] font-mono ${
              isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-900/90 border-white/15 text-slate-300'
            }`}>
              <span className="font-sans font-bold text-[10px] text-slate-400">Reflectivity:</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block" />
                <span>Light</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />
                <span>Mod</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" />
                <span>Heavy</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" />
                <span>Intense</span>
              </span>
            </div>

            {/* Mobile Compact Legend Pill */}
            <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setShowLegend(!showLegend);
                  setShowLayersMenu(false);
                }}
                className={`px-2.5 py-2 rounded-xl border backdrop-blur-md shadow-md text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  showLegend
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-900/95 border-white/15 text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 shrink-0" />
                <span className="text-[11px] font-mono">dBZ</span>
              </button>

              {showLegend && (
                <div className={`absolute top-full right-0 mt-1.5 w-44 rounded-xl border p-2 shadow-xl backdrop-blur-xl z-30 text-[11px] space-y-1.5 ${
                  isLight ? 'bg-white/95 border-slate-300 text-slate-900' : 'bg-slate-900/95 border-white/15 text-slate-100'
                }`}>
                  <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1">Radar Reflectivity</div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-400" /> Light</span>
                    <span className="font-mono text-[10px] text-slate-400">20-30 dBZ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Moderate</span>
                    <span className="font-mono text-[10px] text-slate-400">30-40 dBZ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Heavy</span>
                    <span className="font-mono text-[10px] text-slate-400">40-50 dBZ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500" /> Intense</span>
                    <span className="font-mono text-[10px] text-slate-400">&gt;50 dBZ</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Floating Quick-Status Pill (Above Scrubber) */}
          {report && (
            <div className="lg:hidden absolute bottom-14 left-3 right-3 z-10 flex justify-center pointer-events-none">
              <button
                type="button"
                onClick={() => setIsDrawerExpanded(true)}
                className="pointer-events-auto px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-[11px] text-cyan-300 shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-slate-900 transition-all"
              >
                <CloudRain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[200px]">
                  {report.rainExtentKm ? `Active rain ~${report.rainExtentKm}km` : 'Surveillance clear'}
                  {report.movement ? ` · ${report.movement.directionCardinal}` : ''}
                </span>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider ml-1">Details ▾</span>
              </button>
            </div>
          )}

          {/* Floating Timeline Scrubber (Docked at Bottom Center of Map) */}
          {frames.length > 1 && (
            <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-10 max-w-sm sm:max-w-md w-auto pointer-events-auto">
              <div className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-2 text-xs ${
                isLight ? 'bg-white/95 border-slate-300 text-slate-900' : 'bg-slate-900/95 border-white/15 text-white'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer font-bold shrink-0 ${
                      isPlaying ? 'bg-cyan-500 text-slate-950 shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                    title={isPlaying ? 'Pause animation' : 'Play recent radar animation'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-extrabold text-[11px] truncate">
                        {activeFrame?.frameLabel === 'PREVIOUS_OBSERVATION' ? 'Previous (-15m)' : 'Current (Live)'}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 shrink-0">
                        {activeFrame?.formattedTimeIST}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => { setIsPlaying(false); setActiveFrameIndex(0); }}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                      activeFrameIndex === 0
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    -15m
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsPlaying(false); setActiveFrameIndex(1); }}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                      activeFrameIndex === 1
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    Live
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SPATIAL TELEMETRY SIDEBAR (Dedicated Grid Space on Desktop) */}
        <div className={`hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col h-full overflow-y-auto rounded-2xl sm:rounded-3xl border shadow-xl p-4 space-y-3.5 transition-all ${
          isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-900/90 border-white/10 text-white'
        }`}>
          {/* Section Title & Status Summary */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
              <span>Spatial Radar Intel</span>
              <span className="text-cyan-500 font-mono">50 km Range</span>
            </div>
            <h3 className="text-base font-bold tracking-tight">
              {report?.statusHeadline || 'Precipitation Surveillance'}
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {report?.statusDetail}
            </p>
          </div>

          {/* Key Metrics 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2.5 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/[0.08]'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Active Extent
              </span>
              <strong className="text-sm font-extrabold block mt-0.5">
                {report?.rainExtentKm ? `~${report.rainExtentKm} km` : 'None detected'}
              </strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">around you</span>
            </div>

            <div className={`p-2.5 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/[0.08]'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Radar Movement
              </span>
              <strong className="text-sm font-extrabold block mt-0.5">
                {report?.movement?.directionCardinal || 'Stationary'}
              </strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {report?.movement ? `~${report.movement.speedKmh} km/h` : 'No cell shift'}
              </span>
            </div>

            <div className={`p-2.5 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/[0.08]'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Proximity
              </span>
              <strong className="text-sm font-extrabold block mt-0.5">
                {report?.isRainOverUser ? 'Overhead' : report?.nearestCellDistanceKm ? `${report.nearestCellDistanceKm} km` : 'Clear'}
              </strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {report?.nearestCellBearing ? `${report.nearestCellBearing} bearing` : 'within 60 km'}
              </span>
            </div>

            <div className={`p-2.5 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/[0.08]'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Reflectivity
              </span>
              <strong className="text-sm font-extrabold block mt-0.5">
                {report?.maxIntensityDbz ? `${report.maxIntensityDbz} dBZ` : '0 dBZ'}
              </strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {report?.maxRainRateMmPerHour ? `${report.maxRainRateMmPerHour} mm/hr rate` : 'Clear skies'}
              </span>
            </div>
          </div>

          {/* Surrounding Cities & Settlements */}
          <div className="space-y-2 pt-1 border-t border-inherit">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold text-slate-400">
              <span>Surrounding Cities (50 km)</span>
              <span className="font-mono text-[10px] text-cyan-500">
                {(report?.surroundingCities?.length || 7)} hubs
              </span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {(report?.surroundingCities && report.surroundingCities.length > 0
                ? report.surroundingCities
                : [
                    { name: 'Rampur', district: 'Rampur', state: 'UP', distanceKm: 25.1, bearingCardinal: 'E', hasRain: false },
                    { name: 'Sambhal', district: 'Sambhal', state: 'UP', distanceKm: 34.2, bearingCardinal: 'SW', hasRain: false },
                    { name: 'Amroha', district: 'Amroha', state: 'UP', distanceKm: 28.6, bearingCardinal: 'W', hasRain: false },
                    { name: 'Chandausi', district: 'Sambhal', state: 'UP', distanceKm: 42.5, bearingCardinal: 'S', hasRain: false },
                    { name: 'Kashipur', district: 'Udham Singh Nagar', state: 'UK', distanceKm: 45.3, bearingCardinal: 'N', hasRain: false },
                    { name: 'Thakurdwara', district: 'Moradabad', state: 'UP', distanceKm: 40.1, bearingCardinal: 'NW', hasRain: false },
                    { name: 'Bilaspur', district: 'Rampur', state: 'UP', distanceKm: 46.8, bearingCardinal: 'NE', hasRain: false }
                  ]
              ).map((city, idx) => (
                <div 
                  key={idx}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    city.hasRain 
                      ? (isLight ? 'bg-cyan-50 border-cyan-300 text-cyan-950' : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200')
                      : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-white/[0.06]')
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${city.hasRain ? 'text-cyan-500 animate-pulse' : 'text-slate-400'}`} />
                    <span className="font-bold truncate">{city.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate hidden sm:inline">({city.district})</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                    <span className="text-slate-400">{Math.round(city.distanceKm)}km {city.bearingCardinal}</span>
                    {city.hasRain ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">Rain</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full text-emerald-600 dark:text-emerald-400 font-medium">Clear</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Surveillance Station & Provenance Details */}
          <div className={`p-3 rounded-2xl border text-[11px] space-y-1 mt-auto ${
            isLight ? 'bg-slate-50/70 border-slate-200 text-slate-600' : 'bg-slate-950/40 border-white/[0.06] text-slate-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold">Radar Station:</span>
              <span className="font-mono text-slate-900 dark:text-white">{report?.radarStation.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">Radar Band:</span>
              <span className="font-mono">{report?.radarStation.frequencyBand}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">Distance:</span>
              <span className="font-mono">~{Math.round(report?.radarStation.distanceKm || 0)} km from user</span>
            </div>
          </div>

          {/* Plan Conflict Personalization Card (if any) */}
          {planConflict && planConflict.hasConflict && planConflict.impactedPlan && (
            <div className={`p-3 rounded-2xl border space-y-2 text-xs ${
              isLight ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{planConflict.message}</span>
              </div>
              {onChallengePlan && (
                <button
                  type="button"
                  onClick={() => onChallengePlan(planConflict.impactedPlan!)}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow text-center"
                >
                  Challenge this plan
                </button>
              )}
            </div>
          )}
        </div>

        {/* MOBILE SLIDE-UP INTEL DRAWER (Screen sizes < lg, uncongested map overlay) */}
        {isDrawerExpanded && (
          <div className="lg:hidden absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in pointer-events-auto">
            <div className="fixed inset-0" onClick={() => setIsDrawerExpanded(false)} />
            <div className={`relative z-10 rounded-t-3xl border-t p-5 max-h-[75vh] overflow-y-auto space-y-4 shadow-2xl ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-white/15 text-white'
            }`}>
              {/* Drawer Top Handle & Close */}
              <div className="flex items-center justify-between pb-2 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Spatial Intelligence</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerExpanded(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 cursor-pointer text-xs font-bold flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>

              {/* Status headline */}
              <div>
                <h4 className="font-bold text-sm">{report?.statusHeadline}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{report?.statusDetail}</p>
              </div>

              {/* 2x2 Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-white/10'}`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Active Extent</span>
                  <strong className="text-sm block mt-0.5">{report?.rainExtentKm ? `~${report.rainExtentKm} km` : 'None'}</strong>
                </div>
                <div className={`p-2.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-white/10'}`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Radar Movement</span>
                  <strong className="text-sm block mt-0.5">{report?.movement?.directionCardinal || 'Stationary'}</strong>
                </div>
                <div className={`p-2.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-white/10'}`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Proximity</span>
                  <strong className="text-sm block mt-0.5">{report?.isRainOverUser ? 'Overhead' : report?.nearestCellDistanceKm ? `${report.nearestCellDistanceKm} km` : 'Clear'}</strong>
                </div>
                <div className={`p-2.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-white/10'}`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Max Reflectivity</span>
                  <strong className="text-sm block mt-0.5">{report?.maxIntensityDbz ? `${report.maxIntensityDbz} dBZ` : '0 dBZ'}</strong>
                </div>
              </div>

              {/* Surrounding Cities & Towns */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Surrounding Cities & Towns (50 km)</span>
                <div className="flex flex-wrap gap-1.5">
                  {(report?.surroundingCities && report.surroundingCities.length > 0
                    ? report.surroundingCities
                    : [
                        { name: 'Rampur', distanceKm: 25.1, bearingCardinal: 'E', hasRain: false },
                        { name: 'Sambhal', distanceKm: 34.2, bearingCardinal: 'SW', hasRain: false },
                        { name: 'Amroha', distanceKm: 28.6, bearingCardinal: 'W', hasRain: false },
                        { name: 'Chandausi', distanceKm: 42.5, bearingCardinal: 'S', hasRain: false },
                        { name: 'Kashipur', distanceKm: 45.3, bearingCardinal: 'N', hasRain: false },
                        { name: 'Thakurdwara', distanceKm: 40.1, bearingCardinal: 'NW', hasRain: false },
                        { name: 'Bilaspur', distanceKm: 46.8, bearingCardinal: 'NE', hasRain: false }
                      ]
                  ).map((city, idx) => (
                    <span key={idx} className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                      city.hasRain 
                        ? (isLight ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-bold' : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200 font-bold')
                        : (isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-slate-200')
                    }`}>
                      <MapPin className={`w-3 h-3 ${city.hasRain ? 'text-cyan-500 animate-pulse' : 'text-slate-400'}`} />
                      <strong>{city.name}</strong>
                      <span className="opacity-75 font-mono text-[10px]">({Math.round(city.distanceKm)}km {city.bearingCardinal})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Surveillance Station & Provenance Details */}
              <div className={`p-3 rounded-2xl border text-[11px] space-y-1 ${
                isLight ? 'bg-slate-50/70 border-slate-200 text-slate-600' : 'bg-slate-900/60 border-white/10 text-slate-400'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold">Radar Station:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{report?.radarStation.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">Radar Band:</span>
                  <span className="font-mono">{report?.radarStation.frequencyBand}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">Distance:</span>
                  <span className="font-mono">~{Math.round(report?.radarStation.distanceKm || 0)} km</span>
                </div>
              </div>

              {/* Plan conflict */}
              {planConflict && planConflict.hasConflict && planConflict.impactedPlan && (
                <div className={`p-3 rounded-2xl border text-xs space-y-2 ${
                  isLight ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{planConflict.message}</span>
                  </div>
                  {onChallengePlan && (
                    <button
                      type="button"
                      onClick={() => onChallengePlan(planConflict.impactedPlan!)}
                      className="w-full py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl"
                    >
                      Challenge this plan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
