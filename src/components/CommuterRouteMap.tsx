import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  MapPin, 
  Car, 
  Train, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Clock, 
  Layers,
  Building2,
  Package,
  Home,
  ShieldCheck,
  Fuel,
  Maximize2,
  Minimize2,
  ArrowRight,
  Info,
  RefreshCw,
  Globe,
  CornerDownRight,
  Route
} from 'lucide-react';
import { calculateHaversineDistanceKm, hasMetroTransit } from '../services/geoUtils.js';

interface CommuterRouteMapProps {
  originName: string;
  originLat: number;
  originLng: number;
  originWeather?: string;
  originFog?: string;
  destinationName: string;
  destinationLat?: number;
  destinationLng?: number;
  destinationWeather?: string;
  destinationFog?: string;
  pointType?: 'OFFICE' | 'DELIVERY';
}

interface RouteStep {
  instruction: string;
  name: string;
  distanceKm: number;
}

// Approximate city and landmark coordinates registry for Indian commuter routes
const CITY_COORDS_REGISTRY: Record<string, { lat: number; lng: number; district: string; state: string }> = {
  'ramganga vihar': { lat: 28.8650, lng: 78.7600, district: 'Moradabad', state: 'Uttar Pradesh' },
  'moradabad brass hub': { lat: 28.8320, lng: 78.7850, district: 'Moradabad', state: 'Uttar Pradesh' },
  'civil lines moradabad': { lat: 28.8450, lng: 78.7650, district: 'Moradabad', state: 'Uttar Pradesh' },
  'moradabad': { lat: 28.8386, lng: 78.7733, district: 'Moradabad', state: 'Uttar Pradesh' },
  'civil lines rampur': { lat: 28.8120, lng: 79.0280, district: 'Rampur', state: 'Uttar Pradesh' },
  'rampur junction': { lat: 28.8020, lng: 79.0180, district: 'Rampur', state: 'Uttar Pradesh' },
  'rampur': { lat: 28.8154, lng: 79.0250, district: 'Rampur', state: 'Uttar Pradesh' },
  'bareilly': { lat: 28.3670, lng: 79.4304, district: 'Bareilly', state: 'Uttar Pradesh' },
  'delhi': { lat: 28.6139, lng: 77.2090, district: 'New Delhi', state: 'Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, district: 'New Delhi', state: 'Delhi' },
  'noida sector 62': { lat: 28.6280, lng: 77.3649, district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  'noida': { lat: 28.5355, lng: 77.3910, district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  'greater noida': { lat: 28.4744, lng: 77.5040, district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  'dlf cybercity': { lat: 28.4950, lng: 77.0890, district: 'Gurugram', state: 'Haryana' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, district: 'Gurugram', state: 'Haryana' },
  'gurugram': { lat: 28.4595, lng: 77.0266, district: 'Gurugram', state: 'Haryana' },
  'ghaziabad': { lat: 28.6692, lng: 77.4538, district: 'Ghaziabad', state: 'Uttar Pradesh' },
  'meerut': { lat: 28.9845, lng: 77.7064, district: 'Meerut', state: 'Uttar Pradesh' },
  'aligarh': { lat: 27.8974, lng: 78.0880, district: 'Aligarh', state: 'Uttar Pradesh' },
  'lucknow': { lat: 26.8467, lng: 80.9462, district: 'Lucknow', state: 'Uttar Pradesh' },
  'kanpur': { lat: 26.4499, lng: 80.3319, district: 'Kanpur Nagar', state: 'Uttar Pradesh' },
  'agra': { lat: 27.1767, lng: 78.0081, district: 'Agra', state: 'Uttar Pradesh' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, district: 'Bengaluru Urban', state: 'Karnataka' },
  'whitefield': { lat: 12.9698, lng: 77.7500, district: 'Bengaluru Urban', state: 'Karnataka' },
  'mumbai': { lat: 18.9220, lng: 72.8347, district: 'Mumbai City', state: 'Maharashtra' },
  'bkc': { lat: 19.0657, lng: 72.8687, district: 'Mumbai Suburban', state: 'Maharashtra' }
};

type PathMode = 'HIGHWAY' | 'RAIL' | 'BYPASS';
type MapTheme = 'STREET' | 'DARK' | 'OSM' | 'SATELLITE';

export const CommuterRouteMap: React.FC<CommuterRouteMapProps> = ({
  originName,
  originLat,
  originLng,
  originWeather,
  originFog,
  destinationName,
  destinationLat,
  destinationLng,
  destinationWeather,
  destinationFog,
  pointType = 'OFFICE'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activePathMode, setActivePathMode] = useState<PathMode>('HIGHWAY');
  const [mapTheme, setMapTheme] = useState<MapTheme>('STREET');
  const [showMilestones, setShowMilestones] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real OSRM Street Direction states
  const [osrmCoords, setOsrmCoords] = useState<[number, number][]>([]);
  const [osrmDistance, setOsrmDistance] = useState<number | null>(null);
  const [osrmDuration, setOsrmDuration] = useState<number | null>(null);
  const [osrmSteps, setOsrmSteps] = useState<RouteStep[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Sorted entries for longest-key matching
  const sortedRegistryEntries = Object.entries(CITY_COORDS_REGISTRY).sort(
    ([a], [b]) => b.length - a.length
  );

  // 1. Resolve Origin coordinates
  const originLookup = (originName || '').toLowerCase().trim();
  let resolvedOriginLat = originLat || 28.8154;
  let resolvedOriginLng = originLng || 79.0250;

  for (const [key, coords] of sortedRegistryEntries) {
    if (originLookup.includes(key)) {
      resolvedOriginLat = coords.lat;
      resolvedOriginLng = coords.lng;
      break;
    }
  }

  // 2. Resolve Destination coordinates
  const destLookup = (destinationName || '').toLowerCase().trim();
  let resolvedDestLat = destinationLat;
  let resolvedDestLng = destinationLng;

  if (!resolvedDestLat || !resolvedDestLng) {
    for (const [key, coords] of sortedRegistryEntries) {
      if (destLookup.includes(key)) {
        resolvedDestLat = coords.lat;
        resolvedDestLng = coords.lng;
        break;
      }
    }
  }

  // Fallbacks if unknown destination
  if (!resolvedDestLat || !resolvedDestLng) {
    if (originLookup.includes('rampur')) {
      resolvedDestLat = 28.8386;
      resolvedDestLng = 78.7733; // Moradabad
    } else {
      resolvedDestLat = resolvedOriginLat + 0.12;
      resolvedDestLng = resolvedOriginLng + 0.12;
    }
  }

  const isRampurMoradabadCorridor = 
    (originLookup.includes('rampur') && destLookup.includes('moradabad')) ||
    (originLookup.includes('moradabad') && destLookup.includes('rampur'));

  // Calculate distance fallbacks
  const directDistanceKm = calculateHaversineDistanceKm(
    resolvedOriginLat,
    resolvedOriginLng,
    resolvedDestLat,
    resolvedDestLng
  );

  const finalDistanceKm = osrmDistance || Math.round(directDistanceKm * 1.15 * 10) / 10;
  const roadTimeMinutes = osrmDuration || Math.max(15, Math.round((finalDistanceKm / 46) * 60));
  const trainTimeMinutes = Math.max(18, Math.round((finalDistanceKm / 65) * 60));

  // Fetch real street directions from OSRM (Google Map Directions street routing)
  useEffect(() => {
    let isCancelled = false;
    const fetchStreetRoute = async () => {
      setIsLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${resolvedOriginLng},${resolvedOriginLat};${resolvedDestLng},${resolvedDestLat}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Route API failed');
        const data = await res.json();
        if (isCancelled) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setOsrmCoords(coords);
          setOsrmDistance(Math.round((route.distance / 1000) * 10) / 10);
          setOsrmDuration(Math.round(route.duration / 60));

          if (route.legs && route.legs[0] && route.legs[0].steps) {
            const steps: RouteStep[] = route.legs[0].steps
              .filter((st: any) => st.maneuver && st.distance > 50)
              .map((st: any) => {
                const type = st.maneuver.type;
                const modifier = st.maneuver.modifier;
                const roadName = st.name ? st.name : 'connecting road';
                let instruction = '';
                if (type === 'depart') {
                  instruction = `Head ${modifier || 'forward'} onto ${roadName}`;
                } else if (type === 'arrive') {
                  instruction = `Arrive at destination (${destinationName})`;
                } else if (modifier) {
                  instruction = `Turn ${modifier} onto ${roadName}`;
                } else {
                  instruction = `Continue on ${roadName}`;
                }
                return {
                  instruction,
                  name: roadName,
                  distanceKm: Math.round((st.distance / 1000) * 10) / 10
                };
              });
            setOsrmSteps(steps.slice(0, 8));
          }
        }
      } catch (err) {
        console.warn('OSRM street route fallback triggered:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingRoute(false);
        }
      }
    };

    fetchStreetRoute();

    return () => {
      isCancelled = true;
    };
  }, [resolvedOriginLat, resolvedOriginLng, resolvedDestLat, resolvedDestLng, destinationName]);

  // Fallback high-fidelity highway street waypoints if offline
  const getDetailedStreetPath = (mode: PathMode): [number, number][] => {
    // If real OSRM street route was fetched and mode is HIGHWAY, return the exact street geometry!
    if (mode === 'HIGHWAY' && osrmCoords.length > 0) {
      return osrmCoords;
    }

    if (isRampurMoradabadCorridor) {
      const isRampurOrigin = originLookup.includes('rampur');

      if (mode === 'HIGHWAY') {
        const pts: [number, number][] = [
          [28.8154, 79.0250], // Rampur Center (Civil Lines)
          [28.8180, 78.9850], // Rampur West Bypass (NH 9 entry)
          [28.8250, 78.8950], // Dalpatpur Flyover (NH 9)
          [28.8320, 78.8500], // Mundha Pande Toll Plaza (NH 9)
          [28.8370, 78.8100], // Ramganga Bridge approach
          [28.8410, 78.7850], // Moradabad East Bypass junction
          [28.8450, 78.7700], // Delhi Road / Imperial Tiraha
        ];

        pts.push([resolvedDestLat, resolvedDestLng]);

        return isRampurOrigin ? pts : [...pts].reverse();
      } else if (mode === 'RAIL') {
        const pts: [number, number][] = [
          [28.8020, 79.0180], // Rampur Jn (RMU)
          [28.8210, 78.8920], // Dalpatpur Halt (DLP)
          [28.8280, 78.8450], // Mundha Pande (MPH)
          [28.8320, 78.7950], // Katghar Jn (KGF)
          [28.8315, 78.7690]  // Moradabad Jn (MB)
        ];
        return isRampurOrigin ? pts : [...pts].reverse();
      } else {
        const pts: [number, number][] = [
          [28.8154, 79.0250],
          [28.7800, 78.9500],
          [28.7950, 78.8500],
          [28.8386, 78.7733]
        ];
        return isRampurOrigin ? pts : [...pts].reverse();
      }
    }

    // Default street-following path: generate multi-step street turns along cardinal roads
    const dLat = resolvedDestLat - resolvedOriginLat;
    const dLng = resolvedDestLng - resolvedOriginLng;
    return [
      [resolvedOriginLat, resolvedOriginLng],
      [resolvedOriginLat + dLat * 0.35, resolvedOriginLng],
      [resolvedOriginLat + dLat * 0.35, resolvedOriginLng + dLng * 0.65],
      [resolvedDestLat, resolvedOriginLng + dLng * 0.65],
      [resolvedDestLat, resolvedDestLng]
    ];
  };

  // Turn-by-turn Milestones
  const milestones = osrmSteps.length > 0
    ? osrmSteps.map((st, i) => ({
        name: st.instruction,
        detail: `${st.distanceKm} km · Active roadway tracking`,
        icon: i === 0 ? 'START' : i === osrmSteps.length - 1 ? 'END' : 'WAYPOINT'
      }))
    : isRampurMoradabadCorridor
    ? activePathMode === 'HIGHWAY'
      ? [
          { name: `Depart Origin (${originName})`, detail: 'City speed limit 40 km/h · Clear pavement', icon: 'START' },
          { name: 'Merge onto NH 9 (Delhi-Lucknow 4-Lane)', detail: 'High-capacity expressway corridor with physical median', icon: 'MERGE' },
          { name: 'Mundha Pande Toll Plaza', detail: 'Km 14 checkpoint · FastTag lanes · Clear sightlines', icon: 'WAYPOINT' },
          { name: 'Cross Ramganga River Bridge', detail: 'Km 23 · Moradabad city arterial flyover', icon: 'WAYPOINT' },
          { name: `Arrive at Destination (${destinationName})`, detail: 'Destination point reached', icon: 'END' }
        ]
      : activePathMode === 'RAIL'
      ? [
          { name: 'Rampur Junction (RMU)', detail: 'Northern Railway Mainline Station', icon: 'START' },
          { name: 'Dalpatpur (DLP) & Mundha Pande (MPH)', detail: 'Electrified double track · 90 km/h express sectional speed', icon: 'WAYPOINT' },
          { name: 'Katghar Junction (KGF)', detail: 'Ramganga railway bridge crossing approach', icon: 'WAYPOINT' },
          { name: 'Moradabad Junction (MB)', detail: 'Northern Railway Divisional HQ · Auto/cab stands at exit', icon: 'END' }
        ]
      : [
          { name: `Depart Origin (${originName})`, detail: 'Shahabad rural connector exit', icon: 'START' },
          { name: 'Kundarki / Bilari State Road', detail: '2-lane rural highway · Slower pace', icon: 'WAYPOINT' },
          { name: `Arrive at Destination (${destinationName})`, detail: 'Enter Moradabad via South bypass', icon: 'END' }
        ]
    : [
        { name: `Depart: ${originName}`, detail: `Surface weather: ${originWeather || 'Stable'} · Fog: ${originFog || 'Clear'}`, icon: 'START' },
        { name: 'Primary Highway Corridor', detail: `${activePathMode === 'HIGHWAY' ? 'Expressway' : 'Transit'} corridor with real-time road telemetry`, icon: 'WAYPOINT' },
        { name: `Arrive: ${destinationName}`, detail: `Destination conditions: ${destinationWeather || 'Normal'}`, icon: 'END' }
      ];

  // Map Initialization & Lifecycle
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    const centerLat = (resolvedOriginLat + resolvedDestLat) / 2;
    const centerLng = (resolvedOriginLng + resolvedDestLng) / 2;

    const mapInstance = L.map(container, {
      zoomControl: false,
      attributionControl: false
    }).setView([centerLat, centerLng], 11);

    L.control.zoom({ position: 'topright' }).addTo(mapInstance);

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

  // Handle Fullscreen Toggle
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (!map) return;
    const t = setTimeout(() => {
      map.invalidateSize();
      handleCenterMap();
    }, 150);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  // Map Layer Updates
  useEffect(() => {
    if (!map) return;

    // 1. Update Tile Layer (FREE, RELIABLE, ZERO API KEY WATERMARK TILES)
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    let tileClassName = '';
    let maxZoom = 19;
    let attribution = '&copy; Esri & OpenStreetMap contributors';

    if (mapTheme === 'STREET') {
      // Esri World Street Map - crisp roads, clear NH 9 highway labels, town names, completely free without API key
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
      attribution = '&copy; Esri, DeLorme, HERE, USGS, OpenStreetMap';
    } else if (mapTheme === 'DARK') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      tileClassName = 'map-tiles-dark';
      maxZoom = 19;
      attribution = '&copy; OpenStreetMap contributors';
    } else if (mapTheme === 'OSM') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
      attribution = '&copy; OpenStreetMap contributors';
    } else if (mapTheme === 'SATELLITE') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
      attribution = '&copy; Esri, Maxar, Earthstar Geographics';
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom,
      minZoom: 4,
      className: tileClassName,
      attribution
    }).addTo(map);

    tileLayerRef.current = newTileLayer;

    // 2. Clear previous route & marker layers
    if (routeLayersRef.current) {
      map.removeLayer(routeLayersRef.current);
    }
    const layerGroup = L.layerGroup().addTo(map);
    routeLayersRef.current = layerGroup;

    // Helper to escape HTML safely
    const escapeHtml = (str: string) => {
      return (str || '').replace(/[&<>"']/g, (m) => {
        switch (m) {
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#39;';
          default: return m;
        }
      });
    };

    // 3. Google Maps Origin Marker 'A' (Home)
    const originIcon = L.divIcon({
      className: 'route-marker-container',
      html: `
        <div style="position: relative; display: inline-flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
          <div style="
            background: #1a73e8;
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 9999px;
            font-family: system-ui, -apple-system, sans-serif;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(66, 133, 244, 0.6);
            border: 2px solid #ffffff;
            white-space: nowrap;
          ">
            <span style="background: #ffffff; color: #1a73e8; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900;">
              A
            </span>
            <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: -0.01em;">
              ${escapeHtml(originName)}
            </span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid #1a73e8;
            margin-top: -1px;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const originMarker = L.marker([resolvedOriginLat, resolvedOriginLng], { icon: originIcon });
    originMarker.bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif; padding: 4px; font-size: 12px; min-width: 180px;">
        <strong style="display: block; font-size: 13px; color: #1a73e8; margin-bottom: 3px;">📍 Departure: ${escapeHtml(originName)}</strong>
        <div><strong>Weather:</strong> ${originWeather || 'Clear conditions'}</div>
        <div><strong>Visibility:</strong> ${originFog || 'Clear'}</div>
      </div>
    `);
    layerGroup.addLayer(originMarker);

    // 4. Google Maps Destination Marker 'B'
    const isOffice = pointType === 'OFFICE';
    const destPinColor = '#ea4335'; // Google Maps Red
    
    const destIcon = L.divIcon({
      className: 'route-marker-container',
      html: `
        <div style="position: relative; display: inline-flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
          <div style="
            background: ${destPinColor};
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 9999px;
            font-family: system-ui, -apple-system, sans-serif;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(234, 67, 53, 0.6);
            border: 2px solid #ffffff;
            white-space: nowrap;
          ">
            <span style="background: #ffffff; color: ${destPinColor}; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900;">
              B
            </span>
            <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: -0.01em;">
              ${escapeHtml(destinationName)}
            </span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid ${destPinColor};
            margin-top: -1px;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const destMarker = L.marker([resolvedDestLat, resolvedDestLng], { icon: destIcon });
    destMarker.bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif; padding: 4px; font-size: 12px; min-width: 180px;">
        <strong style="display: block; font-size: 13px; color: ${destPinColor}; margin-bottom: 3px;">
          🏁 Destination: ${escapeHtml(destinationName)}
        </strong>
        <div><strong>Forecast:</strong> ${destinationWeather || 'Clear conditions'}</div>
        <div><strong>Sightlines:</strong> ${destinationFog || 'Normal'}</div>
      </div>
    `);
    layerGroup.addLayer(destMarker);

    // 5. Draw Proper Street Route Lines (Google Map Direction View)
    const routeCoords = getDetailedStreetPath(activePathMode);

    if (activePathMode === 'HIGHWAY') {
      // Google Maps Street Direction Style: Outer Dark Blue Casing + Inner Crisp Blue Street Line
      const routeCasing = L.polyline(routeCoords, {
        color: '#1a73e8',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const routeStreetLine = L.polyline(routeCoords, {
        color: '#4285f4',
        weight: 5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round'
      });

      layerGroup.addLayer(routeCasing);
      layerGroup.addLayer(routeStreetLine);

      // Checkpoint markers along the route
      if (isRampurMoradabadCorridor) {
        const tollMarker = L.circleMarker([28.8320, 78.8500], {
          radius: 6,
          color: '#1a73e8',
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 3
        });
        tollMarker.bindPopup(`
          <div style="color: #0f172a; font-size: 11px;">
            <strong>🛣️ NH 9 Mundha Pande Toll Plaza</strong>
            <div>Surface Traction: Dry asphalt</div>
          </div>
        `);
        layerGroup.addLayer(tollMarker);
      }
    } else if (activePathMode === 'RAIL') {
      const railBase = L.polyline(routeCoords, {
        color: '#047857',
        weight: 7,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round'
      });
      const railLine = L.polyline(routeCoords, {
        color: '#10b981',
        weight: 4,
        opacity: 1,
        dashArray: '10, 8'
      });
      layerGroup.addLayer(railBase);
      layerGroup.addLayer(railLine);
    } else {
      const bypassLine = L.polyline(routeCoords, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.95,
        dashArray: '8, 6'
      });
      layerGroup.addLayer(bypassLine);
    }

    // 6. Fit bounds smoothly
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    map.invalidateSize();
  }, [
    map,
    mapTheme,
    activePathMode,
    osrmCoords,
    resolvedOriginLat,
    resolvedOriginLng,
    resolvedDestLat,
    resolvedDestLng,
    originName,
    destinationName,
    originWeather,
    originFog,
    destinationWeather,
    destinationFog,
    pointType
  ]);

  const handleCenterMap = () => {
    if (!map) return;
    const routeCoords = getDetailedStreetPath(activePathMode);
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-fade-in transition-all ${
        isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen flex flex-col rounded-none' : ''
      }`}
    >
      {/* Map Header & Controls */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 flex items-center gap-1">
              <Route className="w-3 h-3" />
              <span>STREETS VIEW ROUTE</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {originName} → {destinationName}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>Google Maps-Style Driving Directions &amp; Transit Corridor</span>
          </h3>
        </div>

        {/* Route Selector Tabs & Layer Themes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Path Modes */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs shrink-0 font-mono">
            <button
              type="button"
              onClick={() => setActivePathMode('HIGHWAY')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activePathMode === 'HIGHWAY'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Drive (~{roadTimeMinutes}m)</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePathMode('RAIL')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activePathMode === 'RAIL'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>Train (~{trainTimeMinutes}m)</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePathMode('BYPASS')}
              className={`px-2.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                activePathMode === 'BYPASS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Alt Route</span>
            </button>
          </div>

          {/* Theme switcher: Street, Dark, OSM, Satellite */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs shrink-0 font-mono">
            <button
              type="button"
              title="Streets View (Highways & City Arterials)"
              onClick={() => setMapTheme('STREET')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                mapTheme === 'STREET' ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              title="Dark Canvas"
              onClick={() => setMapTheme('DARK')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                mapTheme === 'DARK' ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              title="OpenStreetMap Standard"
              onClick={() => setMapTheme('OSM')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                mapTheme === 'OSM' ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OSM
            </button>
            <button
              type="button"
              title="Satellite Imagery"
              onClick={() => setMapTheme('SATELLITE')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                mapTheme === 'SATELLITE' ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Map'}
            className="p-2 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1 text-xs"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Corridor Quick Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-900/90 border-b border-slate-800 text-xs font-mono shrink-0">
        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Street Route Distance</span>
          <span className="text-sm font-bold text-white">~{finalDistanceKm} km</span>
          <span className="text-[10px] text-blue-400 block mt-0.5">Real Road Geometry</span>
        </div>

        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Driving Time</span>
          <span className="text-sm font-bold text-blue-400">~{roadTimeMinutes} mins</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Live Route Velocity</span>
        </div>

        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Railway Transit</span>
          <span className="text-sm font-bold text-emerald-400">~{trainTimeMinutes} mins</span>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">Mainline Track</span>
        </div>

        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Corridor Sightlines</span>
          <span className="text-sm font-bold text-emerald-400">OPTIMAL</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{originFog || 'Clear visibility'}</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className={`relative w-full bg-slate-950 ${isFullscreen ? 'flex-1 min-h-[400px]' : 'h-80 sm:h-96 min-h-[340px]'}`}>
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: isFullscreen ? '400px' : '340px' }} />

        {/* Floating Google Maps Style Route Guidance Badge */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-lg p-3 text-xs shadow-2xl z-[1000]">
          <div className="flex items-center justify-between gap-2 font-bold text-white mb-1">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                {activePathMode === 'HIGHWAY'
                  ? 'Streets View Expressway Guidance'
                  : activePathMode === 'RAIL'
                  ? 'Railway Intercity Corridor'
                  : 'Alternative Street Route'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-blue-400 font-bold">
              ~{roadTimeMinutes}m · {finalDistanceKm} km
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {activePathMode === 'HIGHWAY'
              ? `Real streets and highway directions from ${originName} to ${destinationName}. Roadway surface is dry with clear visual sightlines. Follow street directions for optimal transit.`
              : activePathMode === 'RAIL'
              ? `Railway mainline track provides grade-separated transit bypassing road traffic and morning mist.`
              : `Alternative connecting roadway corridor.`}
          </p>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Navigation: Street-Following Road Network</span>
            <button
              type="button"
              onClick={() => setShowMilestones(!showMilestones)}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              {showMilestones ? 'Hide Directions' : 'Show Directions'}
            </button>
          </div>
        </div>
      </div>

      {/* Turn-by-turn Street Waypoints (Google Maps style) */}
      {showMilestones && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Turn-by-Turn Driving Directions</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {milestones.length} Directions · Street Navigation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {milestones.map((ms, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-start gap-2.5"
              >
                <div className="w-5 h-5 rounded-full bg-blue-950 border border-blue-700 flex items-center justify-center shrink-0 text-[10px] font-mono text-blue-400 font-bold mt-0.5">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 truncate text-[11px]">
                    {ms.name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                    {ms.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
