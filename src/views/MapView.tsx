import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  Radio, 
  ShieldAlert, 
  Eye, 
  Maximize2, 
  Layers, 
  MapPin, 
  X,
  ChevronRight,
  AlertTriangle,
  Flame,
  CloudRain,
  Zap,
  Wind,
  Waves,
  ExternalLink,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Search
} from 'lucide-react';
import { LocationRecord, WarningRecord, WarningSeverity } from '../types.js';
import { api } from '../services/api.js';
import { useTheme } from '../context/ThemeContext.js';

interface MapViewProps {
  location: LocationRecord;
  locations: LocationRecord[];
  warnings: WarningRecord[];
  onSelectLocation: (loc: LocationRecord) => void;
  initialMode?: 'map' | 'split' | 'bulletins';
}

// Official IMD Doppler Weather Radar (DWR) Stations Network Coordinates
const IMD_DWR_STATIONS = [
  { name: 'Delhi (Palam)', lat: 28.5665, lng: 77.1031, rangeKm: 250 },
  { name: 'Dehradun (Surkanda / Mukteshwar)', lat: 30.3165, lng: 78.0322, rangeKm: 250 },
  { name: 'Mumbai (Colaba)', lat: 18.8932, lng: 72.8122, rangeKm: 250 },
  { name: 'Kolkata (Alipore)', lat: 22.5333, lng: 88.3333, rangeKm: 250 },
  { name: 'Chennai (Port)', lat: 13.0827, lng: 80.2907, rangeKm: 250 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, rangeKm: 250 },
  { name: 'Bhubaneswar', lat: 20.2522, lng: 85.8197, rangeKm: 250 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673, rangeKm: 250 },
  { name: 'Visakhapatnam', lat: 17.6833, lng: 83.2833, rangeKm: 250 },
  { name: 'Srinagar', lat: 34.0837, lng: 74.7973, rangeKm: 150 },
  { name: 'Shimla', lat: 31.0975, lng: 77.2674, rangeKm: 150 },
  { name: 'Hyderabad', lat: 17.4531, lng: 78.4677, rangeKm: 250 },
  { name: 'Guwahati (Mohanbari)', lat: 26.1833, lng: 91.7500, rangeKm: 250 }
];

// Official District & Regional Centroids across India
// Completely avoids geographical misplacement (e.g. Dehradun placed in Moradabad)
const DISTRICT_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  dehradun: { lat: 30.3165, lng: 78.0322 },
  uttarakhand: { lat: 30.0668, lng: 79.0193 },
  haridwar: { lat: 29.9457, lng: 78.1642 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  mussoorie: { lat: 30.4598, lng: 78.0644 },
  nainital: { lat: 29.3919, lng: 79.4542 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  himachal: { lat: 31.1048, lng: 77.1734 },
  moradabad: { lat: 28.8351, lng: 78.7747 },
  rampur: { lat: 28.8154, lng: 79.0250 },
  bareilly: { lat: 28.3670, lng: 79.4304 },
  meerut: { lat: 28.9845, lng: 77.7064 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  noida: { lat: 28.5355, lng: 77.3910 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  jaisalmer: { lat: 26.9157, lng: 70.9083 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kamrup: { lat: 26.1445, lng: 91.7362 },
  assam: { lat: 26.1445, lng: 91.7362 },
  khordha: { lat: 20.1809, lng: 85.6214 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  ernakulam: { lat: 9.9816, lng: 76.2999 },
  kerala: { lat: 9.9816, lng: 76.2999 }
};

// Helper to pick icon & color for hazard types
function getHazardDetails(w: WarningRecord) {
  const type = (w.warning_type || '').toUpperCase();
  const text = (w.title + ' ' + w.message).toLowerCase();

  let icon = '⚠️';
  let badge = 'HAZARD';

  if (type.includes('LIGHTNING') || type.includes('THUNDERSTORM') || text.includes('thunderstorm') || text.includes('lightning')) {
    icon = '⚡';
    badge = 'THUNDERSTORM';
  } else if (type.includes('RAIN') || type.includes('FLOOD') || text.includes('rainfall') || text.includes('inundation')) {
    icon = '🌧️';
    badge = 'HEAVY RAIN';
  } else if (type.includes('SQUALL') || type.includes('WIND') || type.includes('GALE') || text.includes('squall') || text.includes('winds')) {
    icon = '💨';
    badge = 'SQUALL / GALE';
  } else if (type.includes('SWELL') || type.includes('MARINE') || type.includes('SURGE') || text.includes('sea') || text.includes('coastal')) {
    icon = '🌊';
    badge = 'MARINE SWELL';
  } else if (type.includes('HEAT') || type.includes('LOO') || text.includes('heatwave') || text.includes('discomfort')) {
    icon = '🌡️';
    badge = 'HEATWAVE';
  }

  const severityColor = 
    w.severity === 'RED' ? '#ef4444' :
    w.severity === 'ORANGE' ? '#f97316' :
    w.severity === 'YELLOW' ? '#eab308' : '#22c55e';

  const severityBg = 
    w.severity === 'RED' ? 'rgba(239, 68, 68, 0.2)' :
    w.severity === 'ORANGE' ? 'rgba(249, 115, 22, 0.2)' :
    w.severity === 'YELLOW' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)';

  return { icon, badge, severityColor, severityBg };
}

export const MapView: React.FC<MapViewProps> = ({
  location,
  locations,
  warnings: localWarnings,
  onSelectLocation,
  initialMode = 'map'
}) => {
  const { theme } = useTheme();
  const [activeTabMode, setActiveTabMode] = useState<'map' | 'split' | 'bulletins'>(
    initialMode === 'bulletins' ? 'split' : initialMode
  );
  const [bulletinScope, setBulletinScope] = useState<'LOCAL' | 'ALL'>('LOCAL');
  const [bulletinSearch, setBulletinSearch] = useState<string>('');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [istTimeStr, setIstTimeStr] = useState<string>('');

  // Live IST Clock for Map & Bulletins
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTimeStr(now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const baseLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const radarGroupRef = useRef<L.LayerGroup | null>(null);
  const warningsGroupRef = useRef<L.LayerGroup | null>(null);
  const rainGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Layer>>(new Map());

  const [nationalWarnings, setNationalWarnings] = useState<WarningRecord[]>([]);
  const [isLoadingWarnings, setIsLoadingWarnings] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'RED' | 'ORANGE' | 'YELLOW'>('ALL');
  
  const [mapStyle, setMapStyle] = useState<'street' | 'dark' | 'satellite'>('street');
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showWarnings, setShowWarnings] = useState<boolean>(true);
  const [showRainOverlay, setShowRainOverlay] = useState<boolean>(false);
  const [showLocationConnections, setShowLocationConnections] = useState<boolean>(true);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [activeWarningId, setActiveWarningId] = useState<string | null>(null);
  const [showMobileOptions, setShowMobileOptions] = useState<boolean>(false);
  const [showMobileProtocol, setShowMobileProtocol] = useState<boolean>(false);

  // Fetch National All-India Warnings on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingWarnings(true);
    api.getAllWarnings()
      .then((res) => {
        if (isMounted && res && res.length > 0) {
          setNationalWarnings(res);
        }
      })
      .catch((err) => {
        console.warn('National warnings fetch error, using local fallback:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingWarnings(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Merge local & national warnings (deduplicated by id)
  const allActiveWarnings = useMemo(() => {
    const mapById = new Map<string, WarningRecord>();
    nationalWarnings.forEach(w => mapById.set(w.id, w));
    localWarnings.forEach(w => mapById.set(w.id, w));
    return Array.from(mapById.values());
  }, [nationalWarnings, localWarnings]);

  // Filtered warnings according to severity pill
  const filteredWarnings = useMemo(() => {
    if (severityFilter === 'ALL') return allActiveWarnings;
    return allActiveWarnings.filter(w => w.severity === severityFilter);
  }, [allActiveWarnings, severityFilter]);

  // Warning severity summary counts
  const warningCounts = useMemo(() => {
    return {
      red: allActiveWarnings.filter(w => w.severity === 'RED').length,
      orange: allActiveWarnings.filter(w => w.severity === 'ORANGE').length,
      yellow: allActiveWarnings.filter(w => w.severity === 'YELLOW').length,
      total: allActiveWarnings.length
    };
  }, [allActiveWarnings]);

  // Check if current user location is inside an active warning
  const localWarningMatch = useMemo(() => {
    const locDist = (location.district || location.name).toLowerCase();
    const locState = (location.state || '').toLowerCase();
    return allActiveWarnings.find(w => {
      const wDist = (w.district || '').toLowerCase();
      const wState = (w.state || '').toLowerCase();
      const wArea = (w.affected_area || '').toLowerCase();
      return (
        wDist.includes(locDist) ||
        locDist.includes(wDist) ||
        (locState && wState && (wState.includes(locState) || locState.includes(wState))) ||
        wArea.includes(locDist)
      );
    });
  }, [location, allActiveWarnings]);

  // Filtered and searched bulletins list for dedicated Bulletins View
  const displayedBulletins = useMemo(() => {
    let list = bulletinScope === 'LOCAL'
      ? (localWarningMatch ? [localWarningMatch] : [])
      : allActiveWarnings;

    if (severityFilter !== 'ALL') {
      list = list.filter(w => w.severity === severityFilter);
    }

    if (bulletinSearch.trim()) {
      const q = bulletinSearch.toLowerCase().trim();
      list = list.filter(w => 
        (w.district || '').toLowerCase().includes(q) ||
        (w.state || '').toLowerCase().includes(q) ||
        (w.title || '').toLowerCase().includes(q) ||
        (w.message || '').toLowerCase().includes(q) ||
        (w.warning_type || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [bulletinScope, localWarningMatch, allActiveWarnings, severityFilter, bulletinSearch]);

  // Initialize Leaflet Map
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
      maxZoom: 21,
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
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO & OpenStreetMap contributors',
        maxNativeZoom: 19,
        maxZoom: 21
      }).addTo(baseGroup);
    } else if (mapStyle === 'street') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri & OpenStreetMap contributors',
        maxNativeZoom: 19,
        maxZoom: 21
      }).addTo(baseGroup);
    } else {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri, Maxar',
        maxNativeZoom: 19,
        maxZoom: 21
      }).addTo(baseGroup);
    }

    map.invalidateSize();
  }, [map, mapStyle]);

  // Rain Overlay Layer (with safe maxNativeZoom: 10 to prevent 404 tile errors on zoom)
  useEffect(() => {
    if (!map) return;
    if (rainGroupRef.current) {
      map.removeLayer(rainGroupRef.current);
    }

    if (showRainOverlay) {
      const rainGroup = L.layerGroup().addTo(map);
      rainGroupRef.current = rainGroup;

      // Precipitation Radar Overlay with maxNativeZoom: 10 so zooming in stretches tiles smoothly without 404 errors
      L.tileLayer('https://tile.rainviewer.com/v2/radar/nowcast_10m/256/{z}/{x}/{y}/2/1_1.png', {
        opacity: 0.65,
        maxNativeZoom: 10,
        maxZoom: 21,
        attribution: '&copy; RainViewer / IMD Doppler Reflectivity'
      }).addTo(rainGroup);
    }
  }, [map, showRainOverlay]);

  // Doppler Radar Stations Layer
  useEffect(() => {
    if (!map) return;
    if (radarGroupRef.current) {
      map.removeLayer(radarGroupRef.current);
    }

    if (showRadar) {
      const radarGroup = L.layerGroup().addTo(map);
      radarGroupRef.current = radarGroup;

      IMD_DWR_STATIONS.forEach((dwr) => {
        // 250km radar sweep zone
        L.circle([dwr.lat, dwr.lng], {
          radius: dwr.rangeKm * 1000,
          color: '#06b6d4',
          weight: 1.2,
          opacity: 0.5,
          fillColor: '#06b6d4',
          fillOpacity: 0.03,
          dashArray: '3, 3'
        }).addTo(radarGroup);

        const radarIcon = L.divIcon({
          className: 'custom-dwr-marker',
          html: `
            <div style="position: relative; width: 14px; height: 14px; transform: translate(-50%, -50%);">
              <span style="position: absolute; inset: 0; border-radius: 9999px; background: #06b6d4; opacity: 0.4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: absolute; inset: 2px; border-radius: 9999px; background: #0891b2; border: 1.5px solid #ffffff; box-shadow: 0 0 6px rgba(6, 182, 212, 0.8);"></span>
            </div>
          `,
          iconSize: [0, 0]
        });

        const marker = L.marker([dwr.lat, dwr.lng], { icon: radarIcon }).addTo(radarGroup);
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px; min-width: 170px;">
            <div style="font-weight: 700; color: #0891b2; font-size: 13px; margin-bottom: 2px;">
              📡 IMD Doppler Radar: ${dwr.name}
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.4;">
              Operational Scan: <strong>${dwr.rangeKm} km</strong> radial coverage.<br />
              Continuous reflectivity & velocity pulse for squall & cloudburst detection.
            </div>
          </div>
        `);
      });
    }
  }, [map, showRadar]);

  // Weather Warnings Layer (All-India Multi-Hazard Warning Overlay)
  useEffect(() => {
    if (!map) return;

    if (warningsGroupRef.current) {
      map.removeLayer(warningsGroupRef.current);
    }
    markersRef.current.clear();

    const layerGroup = L.layerGroup().addTo(map);
    warningsGroupRef.current = layerGroup;

    // 1. Draw Active Location Marker (User's Current City)
    const activeIcon = L.divIcon({
      className: 'route-marker-container',
      html: `
        <div style="position: relative; display: inline-flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto; z-index: 999;">
          <div style="
            background: #090d16;
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.7);
            border: 2px solid ${localWarningMatch ? '#ef4444' : '#06b6d4'};
            white-space: nowrap;
          ">
            <span>${localWarningMatch ? '🚨' : '📍'}</span>
            <span>${location.name.split('(')[0].trim()}</span>
            ${localWarningMatch ? `<span style="background: #ef4444; color: #fff; font-size: 9px; padding: 1px 4px; border-radius: 4px;">ALERT</span>` : ''}
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${localWarningMatch ? '#ef4444' : '#06b6d4'};"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
    L.marker([location.latitude, location.longitude], { icon: activeIcon }).addTo(layerGroup);

    // 1.5. Draw Saved User Locations & Location Connections Network
    if (showLocationConnections && locations && locations.length > 0) {
      locations.forEach((otherLoc) => {
        // Skip identical active location
        const isCurrent = (otherLoc.id === location.id) ||
          (Math.abs(otherLoc.latitude - location.latitude) < 0.005 &&
           Math.abs(otherLoc.longitude - location.longitude) < 0.005);

        if (!isCurrent && otherLoc.latitude && otherLoc.longitude) {
          const typeIcon = otherLoc.type === 'home' ? '🏠' :
                           otherLoc.type === 'work' ? '🏢' :
                           otherLoc.type === 'school' ? '🎒' :
                           otherLoc.type === 'delivery' ? '📦' :
                           otherLoc.type === 'beach' ? '🏖️' : '📍';

          const otherMarkerIcon = L.divIcon({
            className: 'saved-location-marker',
            html: `
              <div style="position: relative; display: inline-flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto; z-index: 950; cursor: pointer;">
                <div style="
                  background: #0f172a;
                  color: #e2e8f0;
                  padding: 3px 9px;
                  border-radius: 9999px;
                  font-size: 11px;
                  font-weight: 700;
                  display: inline-flex;
                  align-items: center;
                  gap: 5px;
                  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
                  border: 1.5px solid #38bdf8;
                  white-space: nowrap;
                ">
                  <span>${typeIcon}</span>
                  <span>${otherLoc.name.split('(')[0].trim()}</span>
                  <span style="font-size: 9px; opacity: 0.8; font-family: monospace;">${otherLoc.type || 'saved'}</span>
                </div>
                <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #38bdf8;"></div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });

          // Calculate approximate distance
          const dLat = otherLoc.latitude - location.latitude;
          const dLng = (otherLoc.longitude - location.longitude) * Math.cos((location.latitude * Math.PI) / 180);
          const distKm = Math.round(111 * Math.sqrt(dLat * dLat + dLng * dLng));

          const savedMarker = L.marker([otherLoc.latitude, otherLoc.longitude], { icon: otherMarkerIcon }).addTo(layerGroup);
          savedMarker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px; min-width: 200px;">
              <strong style="font-size: 13px;">${typeIcon} ${otherLoc.name}</strong><br/>
              <span style="color: #64748b; font-size: 11px;">${otherLoc.district || ''}, ${otherLoc.state || ''}</span>
              <div style="margin: 6px 0; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 11px;">
                <span>Corridor distance: <strong>${distKm} km</strong></span>
              </div>
              <button
                id="btn-switch-to-${otherLoc.id}"
                style="width: 100%; background: #0284c7; color: #fff; font-size: 11px; font-weight: 700; padding: 6px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
              >
                📍 Switch Active City to ${otherLoc.name}
              </button>
            </div>
          `);

          savedMarker.on('popupopen', () => {
            const btn = document.getElementById(`btn-switch-to-${otherLoc.id}`);
            if (btn) {
              btn.onclick = () => {
                onSelectLocation(otherLoc);
                map.closePopup();
              };
            }
          });

          // Draw Location Connection Line
          L.polyline(
            [[location.latitude, location.longitude], [otherLoc.latitude, otherLoc.longitude]],
            {
              color: '#38bdf8',
              weight: 2,
              dashArray: '5, 6',
              opacity: 0.85
            }
          ).addTo(layerGroup);

          // Midpoint distance badge
          const midLat = (location.latitude + otherLoc.latitude) / 2;
          const midLng = (location.longitude + otherLoc.longitude) / 2;
          L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: 'corridor-dist-badge',
              html: `
                <div style="transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.9); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.5); font-size: 9px; font-family: monospace; font-weight: 700; padding: 1px 6px; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); white-space: nowrap;">
                  ${distKm} km
                </div>
              `
            })
          }).addTo(layerGroup);
        }
      });
    }

    // 2. Draw Multi-Hazard Weather Warning Zones across India
    if (showWarnings && filteredWarnings.length > 0) {
      filteredWarnings.forEach((w) => {
        // High-precision coordinates resolution - NEVER put Dehradun or other districts in Moradabad
        let lat = w.latitude;
        let lng = w.longitude;

        const warningContext = `${w.district || ''} ${w.affected_area || ''} ${w.title || ''} ${w.state || ''}`.toLowerCase();

        // 1. Strict protection against Dehradun appearing in Moradabad
        if (warningContext.includes('dehradun')) {
          lat = 30.3165;
          lng = 78.0322;
        } else if (!lat || !lng || (Math.abs(lat) < 1 && Math.abs(lng) < 1)) {
          // Check known centroids
          let foundCentroid = false;
          for (const [key, coords] of Object.entries(DISTRICT_CENTROIDS)) {
            if (warningContext.includes(key)) {
              lat = coords.lat;
              lng = coords.lng;
              foundCentroid = true;
              break;
            }
          }

          if (!foundCentroid) {
            const st = IMD_DWR_STATIONS.find(s => warningContext.includes(s.name.toLowerCase().split('(')[0].trim()));
            if (st) {
              lat = st.lat;
              lng = st.lng;
            } else if (warningContext.includes((location.district || location.name).toLowerCase())) {
              lat = location.latitude;
              lng = location.longitude;
            } else {
              lat = 23.5937;
              lng = 78.9629;
            }
          }
        }

        const safeLat = (lat ?? location.latitude) || 28.5847;
        const safeLng = (lng ?? location.longitude) || 77.2066;

        const radiusMeters = (w.radius_km || 85) * 1000;
        const { icon, badge, severityColor, severityBg } = getHazardDetails(w);

        // Warning Hazard Spread Circle
        const warningZone = L.circle([safeLat, safeLng], {
          radius: radiusMeters,
          color: severityColor,
          weight: w.severity === 'RED' ? 2.5 : 1.8,
          opacity: 0.85,
          fillColor: severityColor,
          fillOpacity: w.severity === 'RED' ? 0.22 : w.severity === 'ORANGE' ? 0.18 : 0.13,
          dashArray: w.severity === 'RED' ? undefined : '5, 5'
        }).addTo(layerGroup);

        // Pulsing Warning Beacon Marker
        const warningPinIcon = L.divIcon({
          className: 'warning-pin-marker',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer;">
              <span style="
                position: absolute;
                width: 38px;
                height: 38px;
                border-radius: 9999px;
                background: ${severityColor};
                opacity: 0.35;
                animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></span>
              <div style="
                position: relative;
                background: ${w.severity === 'RED' ? '#7f1d1d' : w.severity === 'ORANGE' ? '#7c2d12' : '#713f12'};
                border: 2px solid ${severityColor};
                color: #ffffff;
                padding: 4px 8px;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.6);
                display: flex;
                align-items: center;
                gap: 5px;
                font-family: system-ui, -apple-system, sans-serif;
                white-space: nowrap;
              ">
                <span style="font-size: 14px;">${icon}</span>
                <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">${w.severity}</span>
              </div>
            </div>
          `,
          iconSize: [0, 0]
        });

        const warningMarker = L.marker([safeLat, safeLng], { icon: warningPinIcon }).addTo(layerGroup);
        markersRef.current.set(w.id, warningMarker);

        // Rich Official IMD Warning Popup
        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; color: #0f172a; min-width: 250px; max-width: 310px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <span style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: ${severityBg};
                color: ${severityColor};
                border: 1px solid ${severityColor};
                font-size: 10px;
                font-weight: 800;
                padding: 2px 7px;
                border-radius: 9999px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">
                <span>${icon}</span>
                <span>${w.severity} ALERT · ${badge}</span>
              </span>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">IMD LIVE</span>
            </div>

            <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
              ${w.title}
            </div>

            <div style="font-size: 11px; color: #475569; margin-bottom: 8px; line-height: 1.4;">
              ${w.message}
            </div>

            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px; font-size: 10px; color: #334155; margin-bottom: 8px; border: 1px solid #e2e8f0;">
              <div><strong>Affected Area:</strong> ${w.affected_area}</div>
              <div><strong>District:</strong> ${w.district}, ${w.state}</div>
              ${w.bulletin_no ? `<div><strong>Bulletin:</strong> ${w.bulletin_no}</div>` : ''}
              <div><strong>Valid Until:</strong> ${new Date(w.valid_until).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} IST</div>
            </div>

            <button 
              id="btn-select-city-${w.id}"
              style="
                width: 100%;
                background: #0f172a;
                color: #ffffff;
                font-size: 11px;
                font-weight: 600;
                padding: 6px 10px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
              "
            >
              📍 Switch Active City to ${w.district}
            </button>
          </div>
        `;

        warningMarker.bindPopup(popupContent);
        warningZone.bindPopup(popupContent);

        warningMarker.on('popupopen', () => {
          const btn = document.getElementById(`btn-select-city-${w.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectLocation({
                id: `loc-warn-${w.district.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: `${w.district}, ${w.state}`,
                district: w.district,
                state: w.state,
                country: 'India',
                latitude: safeLat,
                longitude: safeLng,
                timezone: 'Asia/Kolkata',
                type: 'destination'
              });
              map.closePopup();
            };
          }
        });
      });
    }

    map.invalidateSize();
  }, [map, location, locations, filteredWarnings, showWarnings, showLocationConnections, localWarningMatch]);

  // Jump to specific warning on click
  const handleFlyToWarning = (w: WarningRecord) => {
    if (!map) return;

    let lat = w.latitude;
    let lng = w.longitude;
    const warningContext = `${w.district || ''} ${w.affected_area || ''} ${w.title || ''} ${w.state || ''}`.toLowerCase();

    if (warningContext.includes('dehradun')) {
      lat = 30.3165;
      lng = 78.0322;
    } else if (!lat || !lng || (Math.abs(lat) < 1 && Math.abs(lng) < 1)) {
      for (const [key, coords] of Object.entries(DISTRICT_CENTROIDS)) {
        if (warningContext.includes(key)) {
          lat = coords.lat;
          lng = coords.lng;
          break;
        }
      }
      if (!lat || !lng) {
        lat = location.latitude;
        lng = location.longitude;
      }
    }

    if (activeTabMode === 'bulletins') {
      setActiveTabMode('map');
    }

    const targetLat = (lat ?? location.latitude) || 28.5847;
    const targetLng = (lng ?? location.longitude) || 77.2066;

    setTimeout(() => {
      if (!map) return;
      map.invalidateSize();
      map.flyTo([targetLat, targetLng], 8, { duration: 1.2 });
      setActiveWarningId(w.id);

      // Open popup after fly animation
      setTimeout(() => {
        const marker = markersRef.current.get(w.id);
        if (marker && (marker as any).openPopup) {
          (marker as any).openPopup();
        }
      }, 1300);
    }, 100);
  };

  // Recenter to active city
  const handleRecenter = () => {
    if (!map) return;
    map.flyTo([location.latitude, location.longitude], 7, { duration: 1 });
  };

  // Fit view to entire India to see all national warnings
  const handleFitIndia = () => {
    if (!map) return;
    map.flyTo([22.5, 82.5], 5, { duration: 1.2 });
  };

  // Automatically fit map bounds to encompass all active warning zones
  const handleFitAllWarnings = () => {
    if (!map || allActiveWarnings.length === 0) {
      handleFitIndia();
      return;
    }
    const points: L.LatLngExpression[] = allActiveWarnings
      .filter(w => w.latitude && w.longitude)
      .map(w => [w.latitude!, w.longitude!]);
    
    if (points.length === 0) {
      handleFitIndia();
      return;
    }

    // Include user city in bounding box
    points.push([location.latitude, location.longitude]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8, animate: true });
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[550px] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08] animate-fade-in flex flex-col">
      {/* 21. MAP IS THE DOMINANT VISUAL ELEMENT (Always visible - never hidden) */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full flex-1 block" 
      />

      {/* Floating Glass Top Banner: Multi-Hazard Live Status & Tab Switcher (Hidden in Bulletins mode to avoid clutter) */}
      {activeTabMode !== 'bulletins' && (
        <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-[1000] flex flex-col gap-1.5 pointer-events-none">
          {/* Desktop Full Header Banner */}
          <div className="hidden md:flex items-center justify-between gap-2.5">
            {/* Title & Warning Counter Badges */}
            {activeTabMode === 'map' && (
              <div className={`backdrop-blur-2xl border rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-2xl pointer-events-auto flex items-center gap-3 ${
                theme === 'light'
                  ? 'bg-white/90 border-slate-200/90 text-slate-900 shadow-md'
                  : 'bg-slate-950/90 border-white/10 text-white'
              }`}>
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-xs sm:text-sm tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      IMD Weather Map &amp; Official Alerts
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 font-bold hidden xs:inline">
                      OFFICIAL
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                    <span>National Alerts:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                      {warningCounts.red} Red
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-orange-500">{warningCounts.orange} Orange</span>
                    <span>·</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">{warningCounts.yellow} Yellow</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Map Action Controls & Mode Switcher */}
            <div className={`flex flex-wrap items-center gap-1.5 pointer-events-auto ${activeTabMode !== 'map' ? 'ml-auto' : ''}`}>
              {/* Unified Map & Bulletins Mode Switcher */}
              <div className={`flex items-center p-0.5 rounded-full border text-xs shadow-lg ${
                theme === 'light' ? 'bg-white/95 border-slate-300' : 'bg-slate-950/90 border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('map');
                    setTimeout(() => map?.invalidateSize(), 80);
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                    activeTabMode === 'map'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Map Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('split');
                    setTimeout(() => map?.invalidateSize(), 80);
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                    activeTabMode === 'split'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Split View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('bulletins');
                    setTimeout(() => map?.invalidateSize(), 80);
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                    (activeTabMode as string) === 'bulletins'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Bulletins ({allActiveWarnings.length})</span>
                </button>
              </div>

              {/* View All Warnings Button (Map mode only) */}
              {activeTabMode === 'map' && (
                <button
                  type="button"
                  onClick={handleFitAllWarnings}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
                  title="Show all warning zones on map"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show All Alerts ({allActiveWarnings.length})</span>
                </button>
              )}

              {/* Severity Filter Pills (Map mode only) */}
              {activeTabMode === 'map' && (
                <div className={`flex items-center p-1 rounded-full border text-xs shadow-lg ${
                  theme === 'light' ? 'bg-white/90 border-slate-300' : 'bg-slate-950/85 border-white/10'
                }`}>
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('ALL')}
                    className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer text-[11px] font-medium ${
                      severityFilter === 'ALL'
                        ? theme === 'light' ? 'bg-slate-900 text-white font-bold' : 'bg-white/[0.15] text-white'
                        : theme === 'light' ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({warningCounts.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('RED')}
                    className={`px-2 py-1 rounded-full transition-colors cursor-pointer text-[11px] font-medium flex items-center gap-1 ${
                      severityFilter === 'RED' ? 'bg-rose-500 text-white font-bold' : 'text-rose-500 hover:bg-rose-50'
                    }`}
                  >
                    🔴 {warningCounts.red}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('ORANGE')}
                    className={`px-2 py-1 rounded-full transition-colors cursor-pointer text-[11px] font-medium flex items-center gap-1 ${
                      severityFilter === 'ORANGE' ? 'bg-orange-500 text-white font-bold' : 'text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    🟠 {warningCounts.orange}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('YELLOW')}
                    className={`px-2 py-1 rounded-full transition-colors cursor-pointer text-[11px] font-medium flex items-center gap-1 ${
                      severityFilter === 'YELLOW' ? 'bg-yellow-500 text-slate-950 font-bold' : 'text-yellow-600 hover:bg-yellow-50'
                    }`}
                  >
                    🟡 {warningCounts.yellow}
                  </button>
                </div>
              )}

              {/* Warnings List Drawer Button (Map mode only) */}
              {activeTabMode === 'map' && (
                <button
                  type="button"
                  onClick={() => setShowDrawer(!showDrawer)}
                  className={`px-3 py-1.5 rounded-full backdrop-blur-xl border text-xs font-semibold shadow-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                    showDrawer
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950/85 text-amber-300 border-amber-500/30 hover:bg-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>List ({allActiveWarnings.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Sleek Top Bar (Single Row, Completely Uncongested) */}
          <div className="md:hidden flex items-center justify-between gap-1.5 p-2 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl pointer-events-auto">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-white block truncate">
                  Map &amp; Alerts
                </span>
                <div className="flex items-center gap-1 text-[10px] text-slate-300">
                  <span className="font-bold text-rose-400">{warningCounts.red}R</span>
                  <span>·</span>
                  <span className="font-bold text-orange-400">{warningCounts.orange}O</span>
                  <span>·</span>
                  <span className="font-bold text-yellow-400">{warningCounts.yellow}Y</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center p-0.5 rounded-xl border border-white/10 bg-slate-900 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('map');
                    setTimeout(() => map?.invalidateSize(), 80);
                  }}
                  className={`px-2 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-all ${
                    activeTabMode === 'map' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'
                  }`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('split');
                    setTimeout(() => map?.invalidateSize(), 80);
                  }}
                  className={`px-2 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-all ${
                    activeTabMode === 'split' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'
                  }`}
                >
                  Split
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileOptions(true)}
                className="px-2.5 py-1 rounded-xl bg-cyan-500 text-slate-950 text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-md"
                title="Open Map Options & Overlays"
              >
                <Layers className="w-3 h-3" />
                <span>Layers</span>
              </button>
            </div>
          </div>

          {/* Dynamic Warning Notification Strip (Map mode only) */}
          {activeTabMode === 'map' && (
            <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* Mobile Filter Badges */}
              <div className="md:hidden flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSeverityFilter('ALL')}
                  className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                    severityFilter === 'ALL' ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-950/90 text-slate-300 border-white/10'
                  }`}
                >
                  All ({warningCounts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter(severityFilter === 'RED' ? 'ALL' : 'RED')}
                  className={`px-1.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                    severityFilter === 'RED' ? 'bg-rose-500 text-white border-rose-400' : 'bg-slate-950/90 text-rose-400 border-rose-500/30'
                  }`}
                >
                  🔴 {warningCounts.red}
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter(severityFilter === 'ORANGE' ? 'ALL' : 'ORANGE')}
                  className={`px-1.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                    severityFilter === 'ORANGE' ? 'bg-orange-500 text-white border-orange-400' : 'bg-slate-950/90 text-orange-400 border-orange-500/30'
                  }`}
                >
                  🟠 {warningCounts.orange}
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter(severityFilter === 'YELLOW' ? 'ALL' : 'YELLOW')}
                  className={`px-1.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                    severityFilter === 'YELLOW' ? 'bg-yellow-500 text-slate-950 border-yellow-400' : 'bg-slate-950/90 text-yellow-400 border-yellow-500/30'
                  }`}
                >
                  🟡 {warningCounts.yellow}
                </button>
              </div>

              {/* Active City Status Banner */}
              {localWarningMatch ? (
                <div 
                  onClick={() => handleFlyToWarning(localWarningMatch)}
                  className="shrink-0 px-2.5 py-1 rounded-xl bg-rose-950/90 hover:bg-rose-900/90 border border-rose-500/40 text-rose-200 text-xs font-medium backdrop-blur-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all animate-pulse"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span className="text-[11px] truncate max-w-[200px]">🚨 {location.name.split('(')[0]}: <strong>{localWarningMatch.title}</strong></span>
                  <span className="text-[10px] text-rose-300 underline font-semibold ml-0.5">Inspect →</span>
                </div>
              ) : (
                <div className="shrink-0 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-white/10 text-slate-300 text-[11px] backdrop-blur-xl shadow-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{location.name.split('(')[0]}: <strong className="text-emerald-400">Green</strong></span>
                </div>
              )}

              {/* Quick Warning Ticker Pills: Click to jump directly to any active hazard on the map */}
              {allActiveWarnings.slice(0, 5).map((w) => {
                const { icon, severityColor } = getHazardDetails(w);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleFlyToWarning(w)}
                    className="shrink-0 px-2 py-1 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-white/10 hover:border-cyan-400/50 text-slate-200 text-[11px] backdrop-blur-xl shadow-md flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>{icon}</span>
                    <span className="font-semibold text-white">{w.district}</span>
                    <span 
                      style={{ color: severityColor }}
                      className="text-[9px] font-bold uppercase"
                    >
                      {w.severity}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Layer & Style Controls (Right Side - Only on Desktop in Map mode) */}
      {activeTabMode === 'map' && (
        <div className="absolute top-20 right-4 z-[1000] hidden md:flex flex-col items-end gap-2 pointer-events-auto">
          {/* Layer Toggles */}
          <div className="flex flex-col p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 text-xs shadow-xl gap-1">
            <button
              type="button"
              onClick={() => setShowWarnings(!showWarnings)}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 text-[11px] ${
                showWarnings ? 'bg-amber-950/80 text-amber-200 font-semibold border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Weather Warnings Overlay"
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Warnings</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${showWarnings ? 'bg-amber-400' : 'bg-slate-600'}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowRadar(!showRadar)}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 text-[11px] ${
                showRadar ? 'bg-cyan-950/80 text-cyan-200 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Doppler Weather Radar Stations"
            >
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Radar DWR</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${showRadar ? 'bg-cyan-400' : 'bg-slate-600'}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowRainOverlay(!showRainOverlay)}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 text-[11px] ${
                showRainOverlay ? 'bg-blue-950/80 text-blue-200 font-semibold border border-blue-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Live Rain Radar Overlay"
            >
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                <span>Rain Echoes</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${showRainOverlay ? 'bg-blue-400' : 'bg-slate-600'}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowLocationConnections(!showLocationConnections)}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 text-[11px] ${
                showLocationConnections ? 'bg-cyan-950/80 text-cyan-200 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Saved Location Connections & Corridors"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Location Hubs</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${showLocationConnections ? 'bg-cyan-400' : 'bg-slate-600'}`} />
            </button>
          </div>

          {/* Map Style Pills */}
          <div className="flex items-center p-1 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/10 text-[11px] shadow-lg">
            <button
              type="button"
              onClick={() => setMapStyle('street')}
              className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                mapStyle === 'street' ? 'bg-white/[0.15] text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('dark')}
              className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                mapStyle === 'dark' ? 'bg-white/[0.15] text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-white/[0.15] text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* View Navigation Shortcuts */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFitIndia}
              className="px-2.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/10 text-xs text-slate-300 hover:text-white shadow-lg cursor-pointer flex items-center gap-1.5 font-medium"
              title="Fit India Overview"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fit India</span>
            </button>
            <button
              type="button"
              onClick={handleRecenter}
              className="px-2.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/10 text-xs text-slate-300 hover:text-white shadow-lg cursor-pointer flex items-center gap-1.5 font-medium"
              title="Recenter to active city"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>My City</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Left IMD Color Code Legend (Only in Map mode on Desktop) */}
      {activeTabMode === 'map' && (
        <>
          <div className="absolute bottom-4 left-4 z-[1000] hidden md:block bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 text-xs text-slate-300 shadow-2xl max-w-[280px] pointer-events-auto">
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/[0.08]">
              <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                IMD Warning Color Protocol
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">MoES</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <div>
                  <span className="font-bold text-rose-400">RED:</span>
                  <span className="text-slate-400 ml-1">Take Action</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                <div>
                  <span className="font-bold text-orange-400">ORANGE:</span>
                  <span className="text-slate-400 ml-1">Be Prepared</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                <div>
                  <span className="font-bold text-yellow-300">YELLOW:</span>
                  <span className="text-slate-400 ml-1">Be Updated</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-400">GREEN:</span>
                  <span className="text-slate-400 ml-1">No Warning</span>
                </div>
              </div>
            </div>
            {localWarningMatch ? (
              <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-amber-300">
                <span className="truncate">Active in {location.name.split('(')[0]}:</span>
                <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {localWarningMatch.severity}
                </span>
              </div>
            ) : (
              <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center gap-1.5 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{location.name.split('(')[0]} is under Green (Normal).</span>
              </div>
            )}
          </div>

          {/* Mobile Floating Protocol Trigger */}
          <button
            type="button"
            onClick={() => setShowMobileProtocol(true)}
            className="md:hidden absolute bottom-4 left-3 z-[1000] px-3 py-1.5 rounded-full bg-slate-950/95 border border-white/15 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-xl shadow-lg cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Protocol</span>
          </button>
        </>
      )}

      {/* Slide-in Live Warnings Feed Drawer / Side Panel */}
      {showDrawer && activeTabMode === 'map' && (
        <div className="absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 z-[1050] shadow-2xl flex flex-col animate-fade-in">
          {/* Drawer Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Live Warnings Registry</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {filteredWarnings.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDrawer(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredWarnings.map((w) => {
              const { icon, badge, severityColor, severityBg } = getHazardDetails(w);
              const isSelected = activeWarningId === w.id;

              return (
                <div
                  key={w.id}
                  onClick={() => handleFlyToWarning(w)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white/[0.1] border-cyan-400/80 shadow-lg' 
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span 
                      style={{ background: severityBg, color: severityColor, borderColor: severityColor }}
                      className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border flex items-center gap-1"
                    >
                      <span>{icon}</span>
                      <span>{w.severity} ALERT · {badge}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {w.district}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">
                    {w.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {w.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/[0.04]">
                    <span>{w.state}</span>
                    <span className="text-cyan-400 font-semibold flex items-center gap-0.5">
                      <span>Fly to zone</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredWarnings.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                No active warnings matching this filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Split View Sidebar Panel (Both Map and Bulletins are visible simultaneously) */}
      {activeTabMode === 'split' && (
        <div className={`absolute top-14 sm:top-14 bottom-3 left-3 w-80 sm:w-96 max-w-[calc(100vw-24px)] z-[950] backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-fade-in ${
          theme === 'light' ? 'bg-white/95 border-slate-300 text-slate-900 shadow-xl' : 'bg-slate-950/95 border-white/10 text-white shadow-2xl'
        }`}>
          {/* Header */}
          <div className={`p-3 border-b flex items-center justify-between shrink-0 ${
            theme === 'light' ? 'border-slate-200 bg-slate-50/90' : 'border-white/[0.06] bg-slate-900/80'
          }`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                IMD Bulletins &amp; Alerts
              </div>
              <div className={`text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                {((bulletinScope === 'LOCAL' ? (localWarningMatch ? [localWarningMatch] : []) : filteredWarnings)).length} warnings · Tap to view zone
              </div>
            </div>

            {/* Scope Toggle */}
            <div className={`flex items-center p-0.5 rounded-full border text-[10px] font-bold ${
              theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => setBulletinScope('LOCAL')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  bulletinScope === 'LOCAL'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Local
              </button>
              <button
                type="button"
                onClick={() => setBulletinScope('ALL')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  bulletinScope === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                India ({allActiveWarnings.length})
              </button>
            </div>
          </div>

          {/* Severity filter pills inside split panel */}
          <div className={`p-2 border-b flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 ${
            theme === 'light' ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-slate-950/40'
          }`}>
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                severityFilter === 'ALL' ? 'bg-cyan-500 text-slate-950' : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({warningCounts.total})
            </button>
            <button
              onClick={() => setSeverityFilter('RED')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                severityFilter === 'RED' ? 'bg-rose-500 text-white' : 'text-rose-500 hover:bg-rose-50'
              }`}
            >
              🔴 {warningCounts.red}
            </button>
            <button
              onClick={() => setSeverityFilter('ORANGE')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                severityFilter === 'ORANGE' ? 'bg-orange-500 text-white' : 'text-orange-500 hover:bg-orange-50'
              }`}
            >
              🟠 {warningCounts.orange}
            </button>
            <button
              onClick={() => setSeverityFilter('YELLOW')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                severityFilter === 'YELLOW' ? 'bg-yellow-500 text-slate-950' : 'text-yellow-600 hover:bg-yellow-50'
              }`}
            >
              🟡 {warningCounts.yellow}
            </button>
          </div>

          {/* List of cards */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
            {((bulletinScope === 'LOCAL' ? (localWarningMatch ? [localWarningMatch] : []) : filteredWarnings)).map((w, idx) => {
              const isCritical = w.severity === 'RED';
              const isCaution = w.severity === 'ORANGE' || w.severity === 'YELLOW';
              const { icon, badge } = getHazardDetails(w);
              const isSelected = activeWarningId === w.id;

              return (
                <div
                  key={w.id || idx}
                  onClick={() => handleFlyToWarning(w)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg bg-cyan-500/10'
                      : theme === 'light'
                      ? isCritical
                        ? 'bg-rose-50 border-rose-300 hover:bg-rose-100/70'
                        : isCaution
                        ? 'bg-amber-50 border-amber-300 hover:bg-amber-100/70'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                      : isCritical
                      ? 'bg-rose-950/40 border-rose-500/40 hover:bg-rose-950/60'
                      : isCaution
                      ? 'bg-amber-950/30 border-amber-500/30 hover:bg-amber-950/50'
                      : 'bg-slate-900/70 hover:bg-slate-900 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 ${
                      isCritical ? 'bg-rose-500 text-white' : w.severity === 'ORANGE' ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-slate-950'
                    }`}>
                      <span>{icon}</span>
                      <span>{w.severity} · {badge}</span>
                    </span>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-0.5 shrink-0">
                      <span>Fly to zone</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  <h4 className={`text-xs font-bold leading-snug ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                    {w.title}
                  </h4>

                  <p className={`text-[11px] line-clamp-2 mt-1 leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {w.message}
                  </p>

                  <div className={`text-[10px] mt-2 pt-1.5 border-t flex items-center justify-between ${
                    theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-white/[0.06] text-slate-400'
                  }`}>
                    <span className="font-semibold text-cyan-700 dark:text-cyan-300">{w.district || w.affected_area}</span>
                    <span>Valid {new Date(w.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Official IMD Bulletins View - Dedicated, Spacious, Uncongested View */}
      {activeTabMode === 'bulletins' && (
        <div className={`absolute inset-0 z-[1100] flex flex-col pointer-events-auto animate-fade-in ${
          theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-white'
        }`}>
          {/* Bulletins Master Header */}
          <div className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            theme === 'light' ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base sm:text-lg font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Official IMD Weather Bulletins &amp; Advisories
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                    MoES GOVERNMENT FEED
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Direct severe hazard bulletins from India Meteorological Department · Valid for {location.name.split('(')[0]} and National Network
                </p>
              </div>
            </div>

            {/* Right Controls: Mode switcher, Live IST Clock, Return to Map */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Live IST Clock */}
              {istTimeStr && (
                <div 
                  title={`Indian Standard Time (IST, UTC+05:30)`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border shadow-xs ${
                    theme === 'light'
                      ? 'bg-slate-100 border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <Clock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <span>{istTimeStr}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-sans uppercase ${
                    theme === 'light' ? 'bg-slate-900 text-white' : 'bg-cyan-400 text-slate-950'
                  }`}>
                    IST
                  </span>
                </div>
              )}

              {/* Mode Switcher */}
              <div className={`flex items-center p-0.5 rounded-full border text-xs shadow-xs ${
                theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('map');
                    setTimeout(() => map?.invalidateSize(), 80);
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                    theme === 'light' ? 'text-slate-700 hover:text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Map Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('split');
                    setTimeout(() => map?.invalidateSize(), 80);
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                    theme === 'light' ? 'text-slate-700 hover:text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Split View</span>
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full font-bold text-xs bg-cyan-500 text-slate-950 shadow-sm flex items-center gap-1.5 cursor-default"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Bulletins ({allActiveWarnings.length})</span>
                </button>
              </div>

              {/* Close & Return to Map button */}
              <button
                type="button"
                onClick={() => {
                  setActiveTabMode('map');
                  setTimeout(() => map?.invalidateSize(), 80);
                }}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  theme === 'light'
                    ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-900'
                    : 'border-white/10 bg-white/[0.06] hover:bg-white/[0.12] text-white'
                }`}
                title="Return to full interactive map"
              >
                <span>← Back to Map</span>
              </button>
            </div>
          </div>

          {/* Bulletins Subheader: Scope Switcher, Severity Filters, Search */}
          <div className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            theme === 'light' ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-900/40 border-white/[0.06]'
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              {/* Scope Switcher */}
              <div className={`flex items-center p-0.5 rounded-full border text-xs font-semibold ${
                theme === 'light' ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-950 border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => setBulletinScope('LOCAL')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer text-xs font-bold ${
                    bulletinScope === 'LOCAL'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {location.name.split('(')[0].trim()} ({localWarningMatch ? 1 : 0})
                </button>
                <button
                  type="button"
                  onClick={() => setBulletinScope('ALL')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer text-xs font-bold ${
                    bulletinScope === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All India ({allActiveWarnings.length})
                </button>
              </div>

              {/* Severity Pills */}
              <div className={`flex items-center p-0.5 rounded-full border text-xs ${
                theme === 'light' ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-950 border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('ALL')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer text-[11px] font-bold ${
                    severityFilter === 'ALL'
                      ? theme === 'light' ? 'bg-slate-900 text-white' : 'bg-white/[0.15] text-white'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({warningCounts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('RED')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer text-[11px] font-bold flex items-center gap-1 ${
                    severityFilter === 'RED' ? 'bg-rose-500 text-white' : 'text-rose-500 hover:bg-rose-50'
                  }`}
                >
                  🔴 {warningCounts.red} Red
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('ORANGE')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer text-[11px] font-bold flex items-center gap-1 ${
                    severityFilter === 'ORANGE' ? 'bg-orange-500 text-white' : 'text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  🟠 {warningCounts.orange} Orange
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('YELLOW')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer text-[11px] font-bold flex items-center gap-1 ${
                    severityFilter === 'YELLOW' ? 'bg-yellow-500 text-slate-950' : 'text-yellow-600 hover:bg-yellow-50'
                  }`}
                >
                  🟡 {warningCounts.yellow} Yellow
                </button>
              </div>
            </div>

            {/* Search Input within Bulletins */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={bulletinSearch}
                onChange={(e) => setBulletinSearch(e.target.value)}
                placeholder="Search bulletins (e.g. Dehradun, Thunderstorm)..."
                className={`w-full pl-8 pr-7 py-1.5 rounded-full text-xs transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  theme === 'light'
                    ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border border-white/10 text-white placeholder-slate-500'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              {bulletinSearch && (
                <button
                  type="button"
                  onClick={() => setBulletinSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Spacious Bulletins Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {displayedBulletins.length === 0 ? (
              <div className="py-20 text-center space-y-4 max-w-md mx-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  No active bulletins matching your filter.
                </h3>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Atmospheric conditions are normal in this selection. Clear search filters or switch to "All India" to view all active hazard warnings.
                </p>
                {(bulletinSearch || severityFilter !== 'ALL' || bulletinScope === 'LOCAL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setBulletinSearch('');
                      setSeverityFilter('ALL');
                      setBulletinScope('ALL');
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedBulletins.map((alert, idx) => {
                  const isCritical = alert.severity === 'RED';
                  const isCaution = alert.severity === 'ORANGE' || alert.severity === 'YELLOW';
                  const isExpanded = expandedAlertId === (alert.id || String(idx));
                  const { icon, badge } = getHazardDetails(alert);

                  return (
                    <div
                      key={alert.id || idx}
                      className={`p-5 rounded-2xl border transition-all shadow-sm flex flex-col justify-between ${
                        theme === 'light'
                          ? isCritical
                            ? 'bg-white border-rose-300 hover:border-rose-400 ring-1 ring-rose-200/50'
                            : isCaution
                            ? 'bg-white border-amber-300 hover:border-amber-400 ring-1 ring-amber-200/50'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                          : isCritical
                          ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-500/70 shadow-lg'
                          : isCaution
                          ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-500/70 shadow-lg'
                          : 'bg-slate-900/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 shadow-xs ${
                              isCritical
                                ? 'bg-rose-500 text-white border-rose-600'
                                : alert.severity === 'ORANGE'
                                ? 'bg-orange-500 text-white border-orange-600'
                                : 'bg-yellow-400 text-slate-950 border-yellow-500'
                            }`}>
                              <span>{icon}</span>
                              <span>{alert.severity} ALERT · {badge}</span>
                            </span>
                            {alert.bulletin_no && (
                              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                                {alert.bulletin_no}
                              </span>
                            )}
                          </div>

                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            theme === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-white/[0.06] text-cyan-300'
                          }`}>
                            📍 {alert.district || alert.affected_area} {alert.state ? `(${alert.state})` : ''}
                          </span>
                        </div>

                        {/* Bulletin Title */}
                        <h3 className={`text-base sm:text-lg font-bold leading-snug ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {alert.title}
                        </h3>

                        {/* Bulletin Body Message */}
                        <p className={`text-xs sm:text-sm leading-relaxed ${
                          theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                        }`}>
                          {alert.message}
                        </p>
                      </div>

                      {/* Card Footer: Timestamps, Details toggle, Locate on Map */}
                      <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {alert.valid_until && (
                            <span>
                              Valid until: <strong className="text-slate-700 dark:text-slate-300">
                                {new Date(alert.valid_until).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
                              </strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedAlertId(isExpanded ? null : (alert.id || String(idx)))}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                              theme === 'light'
                                ? 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                                : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300'
                            }`}
                          >
                            <span>{isExpanded ? 'Less' : 'Details'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFlyToWarning(alert)}
                            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                            title="Fly to warning zone on map"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Locate on Map</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Technical Details & Precautionary Advice */}
                      {isExpanded && (
                        <div className={`mt-3 pt-3 border-t text-xs space-y-2 animate-fade-in ${
                          theme === 'light' ? 'border-slate-200 text-slate-700 bg-slate-50 p-3 rounded-xl' : 'border-white/10 text-slate-300 bg-black/20 p-3 rounded-xl'
                        }`}>
                          {alert.warning_type && (
                            <div>
                              <strong className="text-slate-900 dark:text-white">Classification: </strong>
                              <span>{alert.warning_type}</span>
                            </div>
                          )}
                          {alert.affected_area && (
                            <div>
                              <strong className="text-slate-900 dark:text-white">Affected Geography: </strong>
                              <span>{alert.affected_area}</span>
                            </div>
                          )}
                          <div>
                            <strong className="text-slate-900 dark:text-white">Authority: </strong>
                            <span>India Meteorological Department · Government of India MoES National Disaster Early Warning System</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Map Options & Layers Sheet */}
      {showMobileOptions && (
        <div className="md:hidden fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in pointer-events-auto">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowMobileOptions(false)} 
          />
          <div className="relative z-10 bg-slate-950 border-t border-white/15 rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-white">Map Layers &amp; Controls</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileOptions(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Overlays */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Overlays
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setShowWarnings(!showWarnings)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showWarnings ? 'bg-amber-950/60 border-amber-500/40 text-amber-200' : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Official Warnings (IMD)</span>
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${showWarnings ? 'bg-amber-400' : 'bg-slate-600'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowRadar(!showRadar)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showRadar ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200' : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>Doppler Radar Network (DWR)</span>
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${showRadar ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowRainOverlay(!showRainOverlay)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showRainOverlay ? 'bg-blue-950/60 border-blue-500/40 text-blue-200' : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <CloudRain className="w-4 h-4 text-blue-400" />
                    <span>Rain Radar Echoes Layer</span>
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${showRainOverlay ? 'bg-blue-400' : 'bg-slate-600'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowLocationConnections(!showLocationConnections)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showLocationConnections ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200' : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>Location Hubs & Corridors</span>
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${showLocationConnections ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                </button>
              </div>
            </div>

            {/* Map Styles */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Basemap Cartography
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMapStyle('street')}
                  className={`p-2.5 rounded-xl border font-bold cursor-pointer transition-all text-center ${
                    mapStyle === 'street' ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 border-white/10 text-slate-300'
                  }`}
                >
                  Street
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('dark')}
                  className={`p-2.5 rounded-xl border font-bold cursor-pointer transition-all text-center ${
                    mapStyle === 'dark' ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 border-white/10 text-slate-300'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('satellite')}
                  className={`p-2.5 rounded-xl border font-bold cursor-pointer transition-all text-center ${
                    mapStyle === 'satellite' ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 border-white/10 text-slate-300'
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Map Actions
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    handleFitIndia();
                    setShowMobileOptions(false);
                  }}
                  className="p-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Fit India</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRecenter();
                    setShowMobileOptions(false);
                  }}
                  className="p-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>My City</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleFitAllWarnings();
                  setShowMobileOptions(false);
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show All Alerts ({allActiveWarnings.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile IMD Protocol Modal */}
      {showMobileProtocol && (
        <div className="md:hidden fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in pointer-events-auto">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowMobileProtocol(false)} 
          />
          <div className="relative z-10 bg-slate-950 border-t border-white/15 rounded-t-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-white">IMD Warning Color Protocol</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileProtocol(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30">
                <div className="flex items-center gap-1.5 mb-1 font-bold text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>RED</span>
                </div>
                <div className="font-bold text-white text-[11px]">Take Action</div>
                <p className="text-[10px] text-slate-300 mt-1">Severe atmospheric hazard. Suspend travel &amp; outdoor plans.</p>
              </div>

              <div className="p-3 rounded-2xl bg-orange-950/40 border border-orange-500/30">
                <div className="flex items-center gap-1.5 mb-1 font-bold text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>ORANGE</span>
                </div>
                <div className="font-bold text-white text-[11px]">Be Prepared</div>
                <p className="text-[10px] text-slate-300 mt-1">Severe weather likely. Keep contingencies ready.</p>
              </div>

              <div className="p-3 rounded-2xl bg-yellow-950/40 border border-yellow-500/30">
                <div className="flex items-center gap-1.5 mb-1 font-bold text-yellow-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span>YELLOW</span>
                </div>
                <div className="font-bold text-white text-[11px]">Be Updated</div>
                <p className="text-[10px] text-slate-300 mt-1">Changing weather. Check local nowcasts regularly.</p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="flex items-center gap-1.5 mb-1 font-bold text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>GREEN</span>
                </div>
                <div className="font-bold text-white text-[11px]">No Warning</div>
                <p className="text-[10px] text-slate-300 mt-1">Normal meteorological conditions prevailing.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-center">
              <span className="text-[10px] text-slate-400">Official Ministry of Earth Sciences Standard</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
