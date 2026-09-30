import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Car, 
  Train, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Compass, 
  ArrowRight, 
  Layers, 
  Building2, 
  Package, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Edit2, 
  Check,
  Search
} from 'lucide-react';
import { 
  LocationRecord, 
  WeatherObservation, 
  WeatherForecast, 
  WarningRecord, 
  AirQualityRecord, 
  CommuterProfile 
} from '../types.js';
import { CommuterRouteMap } from '../components/CommuterRouteMap.js';
import { hasMetroTransit } from '../services/geoUtils.js';
import { AnimatedWeatherIcon } from '../components/AnimatedWeatherIcon.js';

interface CommuterViewProps {
  location: LocationRecord;
  observation: WeatherObservation | null;
  forecast: WeatherForecast | null;
  warnings: WarningRecord[];
  airQuality: AirQualityRecord | null;
  isLoading: boolean;
  onNavigate: (tab: string) => void;
  theme?: 'light' | 'dark';
}

export const CommuterView: React.FC<CommuterViewProps> = ({
  location,
  observation,
  forecast,
  warnings,
  airQuality,
  isLoading,
  onNavigate,
  theme = 'dark'
}) => {
  const defaultHome = location.name.split('(')[0].trim() || 'New Delhi';

  // Load saved commuter profile from localStorage (without example commute pre-population)
  const [profile, setProfile] = useState<CommuterProfile>(() => {
    try {
      const saved = localStorage.getItem('mausam_adapt_commuter_profile') || localStorage.getItem('trinetra_commuter_profile');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      homeLocationName: defaultHome,
      officeLocationName: '',
      workplaceType: 'CORPORATE_OFFICE',
      primaryMode: 'CAR_CAB',
      secondaryMode: 'TRAIN',
      morningDepartureTime: '08:00',
      eveningReturnTime: '17:30',
      hasAsthmaOrDustAllergy: false,
      routeHazards: []
    };
  });

  const [homeInput, setHomeInput] = useState(profile.homeLocationName || defaultHome);
  const [destInput, setDestInput] = useState(profile.officeLocationName || '');
  const [isEditingRoute, setIsEditingRoute] = useState(!profile.officeLocationName);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync profile changes to localStorage
  const handleSaveRoute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!homeInput.trim() || !destInput.trim()) return;
    const next = { ...profile, homeLocationName: homeInput, officeLocationName: destInput };
    setProfile(next);
    localStorage.setItem('mausam_adapt_commuter_profile', JSON.stringify(next));
    setIsEditingRoute(false);
  };

  // Weather variables
  const tempC = observation?.temperature_c ? Math.round(observation.temperature_c) : 30;
  const visibilityKm = observation?.visibility_km ?? 6.0;
  const condition = observation?.condition_text || 'Clear sky';

  // Metro availability
  const hasMetro = hasMetroTransit(homeInput) || (destInput && hasMetroTransit(destInput));

  // Derived departure window
  const bestDeparture = profile.morningDepartureTime || '8:00 AM';

  // Derive coordinates for map
  const getCoordinates = (name: string, fallbackLat: number, fallbackLng: number) => {
    const n = (name || '').toLowerCase();
    if (n.includes('rampur')) return { lat: 28.8154, lng: 79.0250 };
    if (n.includes('moradabad')) return { lat: 28.8386, lng: 78.7733 };
    if (n.includes('delhi')) return { lat: 28.6139, lng: 77.2090 };
    if (n.includes('noida')) return { lat: 28.5355, lng: 77.3910 };
    if (n.includes('gurgaon') || n.includes('gurugram')) return { lat: 28.4595, lng: 77.0266 };
    if (n.includes('bareilly')) return { lat: 28.3670, lng: 79.4304 };
    if (n.includes('lucknow')) return { lat: 26.8467, lng: 80.9462 };
    return { lat: fallbackLat, lng: fallbackLng };
  };

  const originCoords = getCoordinates(homeInput, location.latitude || 28.8154, location.longitude || 79.0250);
  const destCoords = getCoordinates(destInput, originCoords.lat + 0.08, originCoords.lng + 0.08);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* 19. COMMUTE HEADER: Home -> Destination (Clean, Editable) */}
      <section className={`pt-4 border-b pb-6 ${
        theme === 'light' ? 'border-slate-200' : 'border-white/[0.06]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Commute Corridor
            </div>
            {!isEditingRoute && destInput ? (
              <div className="flex items-center gap-3">
                <span className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {homeInput}
                </span>
                <span className="text-slate-500 font-light text-lg">→</span>
                <span className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {destInput}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingRoute(true)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    theme === 'light' ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                  title="Edit origin and destination"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveRoute} className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="text"
                  value={homeInput}
                  onChange={(e) => setHomeInput(e.target.value)}
                  placeholder="Origin city"
                  className={`rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 ${
                    theme === 'light' 
                      ? 'bg-white border border-slate-300 text-slate-900 shadow-sm' 
                      : 'bg-slate-950 border border-white/10 text-white shadow-inner'
                  }`}
                />
                <span className="text-slate-500">→</span>
                <input
                  type="text"
                  value={destInput}
                  onChange={(e) => setDestInput(e.target.value)}
                  placeholder="Enter destination, workplace, or city..."
                  className={`rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 w-56 sm:w-64 ${
                    theme === 'light' 
                      ? 'bg-white border border-slate-300 text-slate-900 shadow-sm' 
                      : 'bg-slate-950 border border-white/10 text-white shadow-inner'
                  }`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Save Route
                </button>
              </form>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-xl sm:text-2xl font-extrabold ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>{tempC}°</span>
              <AnimatedWeatherIcon condition={condition} size={36} className="shrink-0" />
            </div>
            <div className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Sightlines: {visibilityKm} km · {condition}
            </div>
          </div>
        </div>
      </section>

      {/* TODAY'S COMMUTE: Best departure & Expected conditions */}
      <section className={`p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-6 ${
        theme === 'light' 
          ? 'bg-white/85 border border-slate-200 text-slate-900' 
          : 'bg-slate-900/60 border border-white/[0.08] text-white'
      }`}>
        <div>
          <div className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Today's Commute
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className={`text-sm font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Best departure</span>
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'
            }`}>
              {bestDeparture}
            </span>
          </div>
        </div>

        {/* Expected conditions: clean unboxed bullet strip */}
        <div>
          <span className={`text-xs font-medium block mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Expected conditions</span>
          <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm ${
            theme === 'light' ? 'text-slate-700' : 'text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Clear visibility ({visibilityKm} km)</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Dry roads, optimal braking grip</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Low weather disruption</span>
            </div>
          </div>
        </div>
      </section>

      {/* RECOMMENDED OPTION & ALTERNATIVES */}
      <section className="space-y-4">
        <div className={`text-[11px] uppercase tracking-wider font-semibold ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Recommended Option
        </div>

        {/* Primary Recommended Option Card */}
        <div className={`p-5 rounded-2xl flex items-center justify-between gap-4 ${
          theme === 'light' 
            ? 'bg-white/85 border border-slate-200 shadow-sm' 
            : 'bg-white/[0.03] border border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              theme === 'light' 
                ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
                : 'bg-cyan-950/80 text-cyan-400 border-cyan-800/40'
            }`}>
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Car / Road</div>
              <div className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>NH 9 4-Lane Expressway · ~35 min</div>
            </div>
          </div>

          <span className="text-xs font-semibold text-emerald-600">
            Good conditions
          </span>
        </div>

        {/* ALTERNATIVES */}
        <div className="space-y-2 pt-2">
          <span className={`text-xs font-medium block ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Alternatives</span>
          
          <div className={`divide-y border-y ${
            theme === 'light' 
              ? 'divide-slate-200 border-slate-200' 
              : 'divide-white/[0.04] border-white/[0.05]'
          }`}>
            <div className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Train className="w-4 h-4 text-emerald-600" />
                <span className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>Northern Railway Intercity / MEMU</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>~25 min</span>
                <span className="text-emerald-600 font-semibold">Weather-immune</span>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>🚶 / 🚴</span>
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Walking / Cycle</span>
              </div>
              <span className="text-slate-400">Not recommended for 35km intercity span</span>
            </div>

            {!hasMetro && (
              <div className={`py-2.5 text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Note: Urban Metro rail is not operational in Rampur or Moradabad. Use NH 9 or Northern Railway.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ROUTE: Clean Dominant Map */}
      <section className="space-y-4">
        <div className={`text-[11px] uppercase tracking-wider font-semibold ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Route Map
        </div>

        {destInput ? (
          <CommuterRouteMap
            originName={homeInput}
            originLat={originCoords.lat}
            originLng={originCoords.lng}
            originWeather={`${tempC}°C · ${condition}`}
            originFog={visibilityKm > 3 ? 'Clear sightlines' : 'Reduced visibility'}
            destinationName={destInput}
            destinationLat={destCoords.lat}
            destinationLng={destCoords.lng}
            pointType="OFFICE"
          />
        ) : (
          <div className={`p-8 text-center text-xs rounded-3xl space-y-3 ${
            theme === 'light' 
              ? 'bg-white/80 border border-slate-200 text-slate-700 shadow-sm' 
              : 'border border-white/[0.05] bg-white/[0.01] text-slate-400'
          }`}>
            <p className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No commute destination configured yet.</p>
            <p className={`max-w-md mx-auto ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Enter your workplace, university, or travel destination above to see Google Maps-style street driving directions, railway transit options, and real-time weather sightlines.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-500'}>Quick destinations:</span>
              {['New Delhi', 'Noida', 'Gurugram', 'Bareilly', 'Lucknow'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setDestInput(city);
                    const next = { ...profile, homeLocationName: homeInput, officeLocationName: city };
                    setProfile(next);
                    localStorage.setItem('mausam_adapt_commuter_profile', JSON.stringify(next));
                    setIsEditingRoute(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/5'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ADVANCED: Progressive Disclosure Trays */}
      <section className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-full py-3 px-4 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer border ${
            theme === 'light' 
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200 bg-white/60' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border-white/[0.05]'
          }`}
        >
          <span>Advanced route telemetry &amp; transit breakdown</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className={`mt-4 p-6 rounded-2xl backdrop-blur-xl space-y-4 text-xs animate-fade-in ${
            theme === 'light' 
              ? 'bg-white/90 border border-slate-200 text-slate-800 shadow-md' 
              : 'bg-slate-900/40 border border-white/[0.06] text-white'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Fog Radar Classification</span>
                <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>CAT-0 / Unrestricted Visibility</span>
                <p className={`text-[11px] mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Sightlines exceed 4000m along NH 9 corridor.</p>
              </div>

              <div>
                <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Mundha Pande Toll Plaza</span>
                <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Free Flow / Dry Asphalt</span>
                <p className={`text-[11px] mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Normal vehicle throughput without weather delay.</p>
              </div>

              <div>
                <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Pesticide Spray / Construction</span>
                <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Safe for Crane Operations</span>
                <p className={`text-[11px] mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Wind shear below 15 km/h threshold.</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
