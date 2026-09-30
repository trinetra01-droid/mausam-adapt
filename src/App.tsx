import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext.js';
import { TopNav } from './components/TopNav.js';
import { MobileBottomNav } from './components/MobileBottomNav.js';
import { WeatherAtmosphere } from './components/WeatherAtmosphere.js';
import { HomeView } from './views/HomeView.js';
import { ForecastView } from './views/ForecastView.js';
import { PlansView } from './views/PlansView.js';
import { AlertsView } from './views/AlertsView.js';
import { MapView } from './views/MapView.js';
import { LocationsView } from './views/LocationsView.js';
import { ExploreView } from './views/ExploreView.js';
import { CommuterView } from './views/CommuterView.js';
import { ProfileView } from './views/ProfileView.js';
import { AdminView } from './views/AdminView.js';
import { 
  LocationRecord, 
  WeatherObservation, 
  WeatherForecast, 
  WarningRecord, 
  MarineRecord, 
  AirQualityRecord, 
  UserPersona, 
  PlanRecord 
} from './types.js';
import { api } from './services/api.js';
import { WifiOff, Radio } from 'lucide-react';

const DEFAULT_LOCATION: LocationRecord = {
  id: 'loc-delhi',
  name: 'New Delhi (Safdarjung)',
  latitude: 28.5847,
  longitude: 77.2066,
  district: 'New Delhi',
  state: 'Delhi',
  country: 'India',
  timezone: 'Asia/Kolkata',
  type: 'home'
};

/**
 * Calculates high-precision astronomical solar sunrise and sunset parameters
 * for any geographic coordinate (latitude & longitude) on a given date.
 * Returns decimal hours in UTC (0-24).
 */
function calculateSolarTimes(lat: number, lng: number, date: Date = new Date()) {
  try {
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;
    const b = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);
    // Equation of Time in minutes
    const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    // Solar declination in radians
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180)) * (Math.PI / 180);
    const latRad = lat * (Math.PI / 180);
    // Zenith angle for sunrise/sunset (90.833° accounting for atmospheric refraction and sun disc)
    const zenithRad = 90.833 * (Math.PI / 180);
    const cosH = (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(declination)) / (Math.cos(latRad) * Math.cos(declination));
    const clampedCosH = Math.max(-1, Math.min(1, cosH));
    const hourAngleHours = (Math.acos(clampedCosH) * (180 / Math.PI)) / 15;

    // Solar noon in UTC hours
    const solarNoonUTC = 12 - (lng / 15) - (eot / 60);
    const sunriseUTC = (solarNoonUTC - hourAngleHours + 24) % 24;
    const sunsetUTC = (solarNoonUTC + hourAngleHours + 24) % 24;

    return { sunriseUTC, sunsetUTC, hourAngleHours };
  } catch (_) {
    return { sunriseUTC: 0.75, sunsetUTC: 12.75, hourAngleHours: 6.0 };
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [locations, setLocations] = useState<LocationRecord[]>([DEFAULT_LOCATION]);
  const [selectedLocation, setSelectedLocation] = useState<LocationRecord>(DEFAULT_LOCATION);
  const [observation, setObservation] = useState<WeatherObservation | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [warnings, setWarnings] = useState<WarningRecord[]>([]);
  const [marine, setMarine] = useState<MarineRecord | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityRecord | null>(null);
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [activePersonas, setActivePersonas] = useState<UserPersona[]>(['FITNESS', 'COMMUTER']);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [selectedHour, setSelectedHour] = useState<number | undefined>(undefined);

  // Natural Day/Night determination based on accurate solar sunrise/sunset parameters for the current location
  const isDay = useMemo(() => {
    const now = new Date();
    const lat = selectedLocation?.latitude ?? 28.5847;
    const lng = selectedLocation?.longitude ?? 77.2066;

    // 1. Calculate astronomical solar sunrise and sunset parameters for current location
    const solarTimes = calculateSolarTimes(lat, lng, now);

    // 2. Parse daily forecast sunrise and sunset if available
    let forecastSunriseHour: number | null = null;
    let forecastSunsetHour: number | null = null;

    if (forecast?.daily && forecast.daily.length > 0) {
      const d0 = forecast.daily[0];
      const parseTimeStr = (tStr?: string) => {
        if (!tStr) return NaN;
        const match = tStr.match(/(\d+):(\d+)(?:\s*(am|pm))?/i);
        if (!match) return NaN;
        let hour = parseInt(match[1], 10);
        const min = parseInt(match[2], 10);
        const meridiem = match[3]?.toLowerCase();
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        return hour + min / 60;
      };

      const sRise = parseTimeStr(d0.sunrise_ist);
      const sSet = parseTimeStr(d0.sunset_ist);
      if (!isNaN(sRise) && !isNaN(sSet) && sRise < sSet) {
        forecastSunriseHour = sRise;
        forecastSunsetHour = sSet;
      }
    }

    // 3. Current hour in the station's official timezone (Indian Standard Time Asia/Kolkata: UTC+5:30)
    let stationHour = 14.5;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedLocation?.timezone || 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      }).formatToParts(now);
      const hStr = parts.find(p => p.type === 'hour')?.value || '14';
      const mStr = parts.find(p => p.type === 'minute')?.value || '0';
      const sStr = parts.find(p => p.type === 'second')?.value || '0';
      let h = parseInt(hStr, 10);
      if (h === 24) h = 0;
      stationHour = h + parseInt(mStr, 10) / 60 + parseInt(sStr, 10) / 3600;
    } catch (_) {
      const utcHours = now.getUTCHours() + (now.getUTCMinutes() / 60);
      stationHour = (utcHours + 5.5) % 24;
    }

    // 4. Station local sunrise & sunset (defaults to astronomical solar calculation or forecast parameters)
    const localSunriseHour = forecastSunriseHour !== null ? forecastSunriseHour : ((solarTimes.sunriseUTC + 5.5) % 24);
    const localSunsetHour = forecastSunsetHour !== null ? forecastSunsetHour : ((solarTimes.sunsetUTC + 5.5) % 24);

    // 5. If user explicitly clicked an hour in the hourly forecast, reflect that hour
    if (selectedHour !== undefined) {
      return selectedHour >= localSunriseHour && selectedHour < localSunsetHour;
    }

    // 6. User's local browser hour
    const localBrowserHour = now.getHours() + (now.getMinutes() / 60);

    // 7. Check whether current UTC time falls between sunrise and sunset UTC for this coordinate
    const utcHour = now.getUTCHours() + (now.getUTCMinutes() / 60);
    const isSolarDay = solarTimes.sunriseUTC < solarTimes.sunsetUTC
      ? (utcHour >= solarTimes.sunriseUTC && utcHour < solarTimes.sunsetUTC)
      : (utcHour >= solarTimes.sunriseUTC || utcHour < solarTimes.sunsetUTC);

    // 8. Station local time falls between local sunrise and sunset
    const isStationDay = localSunriseHour < localSunsetHour
      ? (stationHour >= localSunriseHour && stationHour < localSunsetHour)
      : (stationHour >= localSunriseHour || stationHour < localSunsetHour);

    // 9. User browser local daytime check
    const isBrowserDay = localBrowserHour >= 5.75 && localBrowserHour < 18.75;

    // Daylight is active if location is in daylight or user's local daylight environment is active
    return isStationDay || isSolarDay || isBrowserDay;
  }, [selectedHour, forecast, selectedLocation]);

  // Clean, day-appropriate observation condition text that removes night strings during daylight
  const sanitizedObservation = useMemo(() => {
    if (!observation) return null;
    let cond = observation.condition_text || 'Clear Sky';
    if (isDay) {
      cond = cond.replace(/\bnight\b/gi, 'Sky').replace(/\s+/g, ' ').trim();
      if (cond.toLowerCase() === 'clear') cond = 'Clear Sky';
    }
    return {
      ...observation,
      condition_text: cond
    };
  }, [observation, isDay]);



  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to Live SSE meteorological stream
  useEffect(() => {
    const unsubscribe = api.onEvent((event) => {
      if (event.type === 'WEATHER_UPDATE' || event.type === 'WARNING_ALERT') {
        refreshAllData(selectedLocation);
      }
    });
    return unsubscribe;
  }, [selectedLocation]);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const locs = await api.getLocations();
      if (locs && locs.length > 0) {
        setLocations(locs);
        setSelectedLocation(locs[0]);
        await refreshAllData(locs[0]);
      } else {
        await refreshAllData(DEFAULT_LOCATION);
      }
    } catch (e) {
      console.warn('Initial load fallback:', e);
      await refreshAllData(DEFAULT_LOCATION);
    }
  };

  const refreshAllData = async (loc: LocationRecord = selectedLocation) => {
    setIsRefreshing(true);
    try {
      const [obs, fc, warns, marRes, aqiRes, userPlans] = await Promise.all([
        api.getCurrentWeather(loc.latitude, loc.longitude, loc.district, loc.state).catch(() => null),
        api.getForecast(loc.latitude, loc.longitude, loc.district, loc.state).catch(() => null),
        api.getWarnings(loc.district, loc.state).catch(() => []),
        api.getMarine(loc.latitude, loc.longitude, loc.name, loc.state).catch(() => ({ available: false, data: undefined })),
        api.getAirQuality(loc.latitude, loc.longitude, loc.district, loc.state).catch(() => ({ available: false, data: undefined })),
        api.getPlans().catch(() => [])
      ]);

      if (obs) setObservation(obs);
      if (fc) setForecast(fc);
      setWarnings(warns || []);
      setMarine(marRes?.available && marRes.data ? marRes.data : null);
      setAirQuality(aqiRes?.available && aqiRes.data ? aqiRes.data : null);
      setPlans(userPlans || []);
    } catch (err) {
      console.error('Data refresh error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSelectLocation = (loc: LocationRecord) => {
    setSelectedLocation(loc);
    setSelectedHour(undefined);
    refreshAllData(loc);
  };

  const handleRefreshLocations = async () => {
    try {
      const locs = await api.getLocations();
      if (locs && locs.length > 0) {
        setLocations(locs);
      }
    } catch (e) {}
  };

  const handleRefreshPlans = async () => {
    try {
      const p = await api.getPlans();
      setPlans(p || []);
    } catch (e) {}
  };

  return (
    <ThemeProvider isDay={isDay}>
      <AppShell
        isDay={isDay}
        selectedLocation={selectedLocation}
        locations={locations}
        sanitizedObservation={sanitizedObservation}
        forecast={forecast}
        warnings={warnings}
        marine={marine}
        airQuality={airQuality}
        plans={plans}
        activePersonas={activePersonas}
        setActivePersonas={setActivePersonas}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        isOnline={isOnline}
        selectedHour={selectedHour}
        setSelectedHour={setSelectedHour}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        refreshAllData={refreshAllData}
        handleSelectLocation={handleSelectLocation}
        handleRefreshLocations={handleRefreshLocations}
        handleRefreshPlans={handleRefreshPlans}
      />
    </ThemeProvider>
  );
}

interface AppShellProps {
  isDay: boolean;
  selectedLocation: LocationRecord;
  locations: LocationRecord[];
  sanitizedObservation: WeatherObservation | null;
  forecast: WeatherForecast | null;
  warnings: WarningRecord[];
  marine: MarineRecord | null;
  airQuality: AirQualityRecord | null;
  plans: PlanRecord[];
  activePersonas: UserPersona[];
  setActivePersonas: React.Dispatch<React.SetStateAction<UserPersona[]>>;
  isLoading: boolean;
  isRefreshing: boolean;
  isOnline: boolean;
  selectedHour: number | undefined;
  setSelectedHour: (h: number | undefined) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  refreshAllData: (loc: LocationRecord) => Promise<void>;
  handleSelectLocation: (loc: LocationRecord) => void;
  handleRefreshLocations: () => Promise<void>;
  handleRefreshPlans: () => Promise<void>;
}

function AppShell({
  isDay,
  selectedLocation,
  locations,
  sanitizedObservation,
  forecast,
  warnings,
  marine,
  airQuality,
  plans,
  activePersonas,
  setActivePersonas,
  isLoading,
  isRefreshing,
  isOnline,
  selectedHour,
  setSelectedHour,
  currentTab,
  setCurrentTab,
  refreshAllData,
  handleSelectLocation,
  handleRefreshLocations,
  handleRefreshPlans
}: AppShellProps) {
  const { theme } = useTheme();
  const criticalWarning = warnings.find(w => w.severity === 'RED');

  return (
    <div 
      data-theme={theme}
      className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-500 ${
        theme === 'light' ? 'bg-[#f0f9ff] text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Dynamic Cinematic Atmospheric Weather Layer */}
      <WeatherAtmosphere
        condition={sanitizedObservation?.condition_text}
        isDay={isDay}
        temperature={sanitizedObservation?.temperature_c}
        windSpeed={sanitizedObservation?.wind_speed_kmh}
        rainIntensity={sanitizedObservation?.rainfall_mm}
        visibility={sanitizedObservation?.visibility_km}
        warningSeverity={criticalWarning ? 'RED' : warnings[0]?.severity}
        hazardType={criticalWarning?.warning_type || warnings[0]?.warning_type}
        theme={theme}
        intensity={
          criticalWarning ? 'focused' :
          currentTab === 'home' ? 'high' :
          currentTab === 'forecast' ? 'subtle' :
          currentTab === 'plans' ? 'very-subtle' :
          currentTab === 'alerts' ? 'minimal' : 'subtle'
        }
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Offline Status Bar if Network Disconnected */}
        {!isOnline && (
          <div className="bg-amber-950 text-amber-200 border-b border-amber-800 px-4 py-2 text-xs font-mono flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>OFFLINE MODE · Serving verified cached IMD & MoES observations from local storage</span>
          </div>
        )}

        {/* Top Bar Contract Navigation */}
        <TopNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          selectedLocation={selectedLocation}
          locations={locations}
          onSelectLocation={handleSelectLocation}
          activePersonas={activePersonas}
          isOnline={isOnline}
          onRefresh={() => refreshAllData(selectedLocation)}
          isRefreshing={isRefreshing}
          theme={theme}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28 md:pb-8">
        {currentTab === 'home' && (
          <HomeView
            location={selectedLocation}
            observation={sanitizedObservation}
            forecast={forecast}
            warnings={warnings}
            marine={marine}
            airQuality={airQuality}
            plans={plans}
            activePersonas={activePersonas}
            isLoading={isLoading}
            onNavigate={setCurrentTab}
            selectedHour={selectedHour}
            onSelectHour={setSelectedHour}
            theme={theme}
            isDay={isDay}
          />
        )}

        {currentTab === 'commuter' && (
          <CommuterView
            location={selectedLocation}
            observation={sanitizedObservation}
            forecast={forecast}
            warnings={warnings}
            airQuality={airQuality}
            isLoading={isLoading}
            onNavigate={setCurrentTab}
            theme={theme}
          />
        )}

        {currentTab === 'forecast' && (
          <ForecastView
            location={selectedLocation}
            forecast={forecast}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'plans' && (
          <PlansView
            location={selectedLocation}
            plans={plans}
            warnings={warnings}
            onRefreshPlans={handleRefreshPlans}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsView
            location={selectedLocation}
            warnings={warnings}
            isLoading={isLoading}
            onRefresh={() => refreshAllData(selectedLocation)}
          />
        )}

        {currentTab === 'map' && (
          <MapView
            location={selectedLocation}
            locations={locations}
            warnings={warnings}
            onSelectLocation={handleSelectLocation}
          />
        )}

        {currentTab === 'locations' && (
          <LocationsView
            locations={locations}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            onRefreshLocations={handleRefreshLocations}
          />
        )}

        {currentTab === 'explore' && (
          <ExploreView />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            locations={locations}
            activePersonas={activePersonas}
            onUpdatePersonas={setActivePersonas}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView />
        )}
      </main>

      {/* Quiet Non-Ornamental Footer */}
      <footer className={`border-t py-6 mb-16 md:mb-0 text-xs transition-colors ${
        theme === 'light'
          ? 'border-slate-200 bg-white/80 text-slate-500'
          : 'border-slate-900 bg-slate-950 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>MAUSAM ADAPT</span>
            <span>·</span>
            <span>From Weather Data to Weather-Smart Decisions</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <span>Primary Meteorological Source: IMD (MoES)</span>
            <span>·</span>
            <span>Marine: INCOIS</span>
            <span>·</span>
            <span>Air Quality: CPCB</span>
            <span>·</span>
            <span>Satellites: MOSDAC / ISRO</span>
          </div>
        </div>
      </footer>

      {/* Fixed Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasActiveAlert={warnings.length > 0}
      />
      </div>
    </div>
  );
}
