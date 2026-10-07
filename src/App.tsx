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
import { AuthView } from './views/AuthView.js';
import { AdminView } from './views/AdminView.js';
import { RainAroundYouView } from './views/RainAroundYouView.js';
import { 
  LocationRecord, 
  WeatherObservation, 
  WeatherForecast, 
  WarningRecord, 
  MarineRecord, 
  AirQualityRecord, 
  UserPersona, 
  PlanRecord,
  RainAroundYouReport 
} from './types.js';
import { api } from './services/api.js';
import { WifiOff, Radio } from 'lucide-react';

const DEFAULT_LOCATION: LocationRecord = {
  id: 'loc-moradabad',
  name: 'Moradabad',
  latitude: 28.8351,
  longitude: 78.7747,
  district: 'Moradabad',
  state: 'Uttar Pradesh',
  country: 'India',
  timezone: 'Asia/Kolkata',
  type: 'home',
  is_auto_detected: true
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
  const [selectedLocation, setSelectedLocation] = useState<LocationRecord>(() => {
    try {
      const cached = localStorage.getItem('mausam_detected_location');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.name && parsed.latitude && parsed.longitude) {
          if (!parsed.name.toLowerCase().includes('khatauli') && parsed.name.toLowerCase() !== 'rampur') {
            return parsed;
          }
        }
      }
    } catch (_) {}
    return DEFAULT_LOCATION;
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [observation, setObservation] = useState<WeatherObservation | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [warnings, setWarnings] = useState<WarningRecord[]>([]);
  const [marine, setMarine] = useState<MarineRecord | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityRecord | null>(null);
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [activePersonas, setActivePersonas] = useState<UserPersona[]>(['FITNESS', 'COMMUTER']);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rainRadarReport, setRainRadarReport] = useState<RainAroundYouReport | null>(null);
  const [isLoadingRadar, setIsLoadingRadar] = useState<boolean>(false);
  
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

  // Automatic Location Detection: automatically detect and select user's city without asking or selecting
  const autoDetectAndSelectLocation = async (userExplicitClick: boolean = false) => {
    setIsDetectingLocation(true);

    const applyDetectedLocation = async (detectedLoc: LocationRecord) => {
      let finalLoc = detectedLoc;
      if (
        (finalLoc.name && finalLoc.name.toLowerCase().includes('khatauli')) ||
        (finalLoc.district && finalLoc.district.toLowerCase().includes('khatauli'))
      ) {
        finalLoc = DEFAULT_LOCATION;
      }
      finalLoc.is_auto_detected = true;
      setSelectedLocation(finalLoc);
      setLocations((prev) => {
        const filtered = prev.filter(l => !l.name.toLowerCase().includes('khatauli'));
        const exists = filtered.some(l => l.name === finalLoc.name || (Math.abs(l.latitude - finalLoc.latitude) < 0.05 && Math.abs(l.longitude - finalLoc.longitude) < 0.05));
        return exists ? filtered : [finalLoc, ...filtered];
      });
      try {
        localStorage.setItem('mausam_detected_location', JSON.stringify(finalLoc));
      } catch (_) {}
      await refreshAllData(finalLoc);
      setIsDetectingLocation(false);
    };

    // Fast multi-channel IP Geolocation (Zero prompt, Instant)
    const resolveIpLocation = async (): Promise<LocationRecord | null> => {
      // 1. Try server-side proxy
      try {
        const detected = await api.detectLocation();
        if (detected && detected.name) {
          if (detected.name.toLowerCase().includes('khatauli')) return DEFAULT_LOCATION;
          return detected;
        }
      } catch (_) {}

      // 2. Direct client fetch to ipwho.is with 1.8s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const res = await fetch('https://ipwho.is/', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const ipData = await res.json();
          // STRICT: Reject any data outside India (e.g. Kentucky, New York, US data centers)
          const isCountryIn = ipData.country_code === 'IN' || (ipData.country && ipData.country.toLowerCase() === 'india');
          const isWithinIndiaGeo = typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number' &&
            ipData.latitude >= 6.0 && ipData.latitude <= 38.0 && ipData.longitude >= 66.0 && ipData.longitude <= 99.0;

          if (!isCountryIn || !isWithinIndiaGeo) {
            return DEFAULT_LOCATION;
          }

          if (ipData && (ipData.city?.toLowerCase().includes('khatauli') || ipData.region?.toLowerCase().includes('khatauli'))) {
            return DEFAULT_LOCATION;
          }
          if (ipData && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
            const detected = await api.detectLocation(ipData.latitude, ipData.longitude);
            if (detected) {
              if (detected.name.toLowerCase().includes('khatauli')) return DEFAULT_LOCATION;
              return detected;
            }
          }
        }
      } catch (_) {}

      // 3. Fallback client fetch to freeipapi
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const ipData = await res.json();
          const isCountryIn = ipData.countryCode === 'IN' || ipData.country_code === 'IN' || (ipData.countryName && ipData.countryName.toLowerCase() === 'india');
          const isWithinIndiaGeo = typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number' &&
            ipData.latitude >= 6.0 && ipData.latitude <= 38.0 && ipData.longitude >= 66.0 && ipData.longitude <= 99.0;

          if (!isCountryIn || !isWithinIndiaGeo) {
            return DEFAULT_LOCATION;
          }

          if (ipData && (ipData.cityName?.toLowerCase().includes('khatauli') || ipData.regionName?.toLowerCase().includes('khatauli'))) {
            return DEFAULT_LOCATION;
          }
          if (ipData && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
            const detected = await api.detectLocation(ipData.latitude, ipData.longitude);
            if (detected) {
              if (detected.name.toLowerCase().includes('khatauli')) return DEFAULT_LOCATION;
              return detected;
            }
          }
        }
      } catch (_) {}

      return DEFAULT_LOCATION;
    };

    // If user clicked the button explicitly, allow browser GPS dialog if needed
    if (userExplicitClick && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            if (latitude < 6.0 || latitude > 38.0 || longitude < 66.0 || longitude > 99.0) {
              await applyDetectedLocation(DEFAULT_LOCATION);
              return;
            }
            const detected = await api.detectLocation(latitude, longitude);
            if (detected) {
              await applyDetectedLocation(detected);
              return;
            }
          } catch (_) {}
          const ipLoc = await resolveIpLocation();
          if (ipLoc) await applyDetectedLocation(ipLoc);
          else setIsDetectingLocation(false);
        },
        async () => {
          const ipLoc = await resolveIpLocation();
          if (ipLoc) await applyDetectedLocation(ipLoc);
          else setIsDetectingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 2500, maximumAge: 300000 }
      );
      return;
    }

    // Default automatic mode: zero prompts, pure non-blocking IP resolution
    const ipLoc = await resolveIpLocation();
    if (ipLoc) {
      await applyDetectedLocation(ipLoc);
    } else {
      setIsDetectingLocation(false);
    }
  };

  // Initial load: seamlessly auto-select user's city without asking or manual selection
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // 1. Fetch saved locations from database if any
    try {
      const locs = await api.getLocations();
      if (locs && locs.length > 0) {
        setLocations(locs);
      }
    } catch (e) {
      console.warn('Initial load locations warning:', e);
    }

    // 2. If we already have a cached auto-detected location, immediately populate UI
    const cached = localStorage.getItem('mausam_detected_location');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.name && parsed.latitude && parsed.longitude && !parsed.name.toLowerCase().includes('khatauli')) {
          setSelectedLocation(parsed);
          await refreshAllData(parsed);
          return;
        }
      } catch (_) {}
    }

    // 3. Automatically detect user's current city itself silently without asking or selecting
    await autoDetectAndSelectLocation(false);

    // Fallback if auto-detect could not resolve IP
    if (!localStorage.getItem('mausam_detected_location')) {
      await refreshAllData(selectedLocation);
    }

    // 4. Load authenticated user profile if token is present
    const token = api.getToken();
    if (token) {
      try {
        const profile = await api.getProfile();
        if (profile) {
          setCurrentUser(profile);
          if (profile.personas && profile.personas.length > 0) {
            setActivePersonas(profile.personas);
          }
        }
      } catch (err) {
        console.warn('Failed to load user session:', err);
        api.setToken(null);
      }
    }
  };

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    if (user?.personas && user.personas.length > 0) {
      setActivePersonas(user.personas);
    }
    setCurrentTab('home');
  };

  const handleSignOut = () => {
    api.setToken(null);
    setCurrentUser(null);
    setCurrentTab('home');
  };

  const refreshAllData = async (loc: LocationRecord = selectedLocation) => {
    setIsRefreshing(true);
    setIsLoadingRadar(true);
    try {
      const [obs, fc, warns, marRes, aqiRes, userPlans, radarRes] = await Promise.all([
        api.getCurrentWeather(loc.latitude, loc.longitude, loc.district, loc.state).catch(() => null),
        api.getForecast(loc.latitude, loc.longitude, loc.district, loc.state).catch(() => null),
        api.getWarnings(loc.district, loc.state).catch(() => []),
        api.getMarine(loc.latitude, loc.longitude, loc.name, loc.state).catch(() => ({ available: false, data: undefined })),
        api.getAirQuality(loc.latitude, loc.longitude, loc.district, loc.state).catch(() => ({ available: false, data: undefined })),
        api.getPlans().catch(() => []),
        api.getRainAroundYou(loc.latitude, loc.longitude, loc.district, loc.state).catch(() => null)
      ]);

      if (obs) setObservation(obs);
      if (fc) setForecast(fc);
      setWarnings(warns || []);
      setMarine(marRes?.available && marRes.data ? marRes.data : null);
      setAirQuality(aqiRes?.available && aqiRes.data ? aqiRes.data : null);
      setPlans(userPlans || []);
      setRainRadarReport(radarRes);
    } catch (err) {
      console.error('Data refresh error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingRadar(false);
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
        rainRadarReport={rainRadarReport}
        isLoadingRadar={isLoadingRadar}
        selectedHour={selectedHour}
        setSelectedHour={setSelectedHour}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        refreshAllData={refreshAllData}
        handleSelectLocation={handleSelectLocation}
        handleRefreshLocations={handleRefreshLocations}
        handleRefreshPlans={handleRefreshPlans}
        autoDetectAndSelectLocation={autoDetectAndSelectLocation}
        isDetectingLocation={isDetectingLocation}
        currentUser={currentUser}
        handleAuthSuccess={handleAuthSuccess}
        handleSignOut={handleSignOut}
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
  rainRadarReport: RainAroundYouReport | null;
  isLoadingRadar: boolean;
  selectedHour: number | undefined;
  setSelectedHour: (h: number | undefined) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  refreshAllData: (loc: LocationRecord) => Promise<void>;
  handleSelectLocation: (loc: LocationRecord) => void;
  handleRefreshLocations: () => Promise<void>;
  handleRefreshPlans: () => Promise<void>;
  autoDetectAndSelectLocation: () => Promise<void>;
  isDetectingLocation: boolean;
  currentUser: any;
  handleAuthSuccess: (user: any) => void;
  handleSignOut: () => void;
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
  rainRadarReport,
  isLoadingRadar,
  selectedHour,
  setSelectedHour,
  currentTab,
  setCurrentTab,
  refreshAllData,
  handleSelectLocation,
  handleRefreshLocations,
  handleRefreshPlans,
  autoDetectAndSelectLocation,
  isDetectingLocation,
  currentUser,
  handleAuthSuccess,
  handleSignOut
}: AppShellProps) {
  const { theme } = useTheme();
  const criticalWarning = warnings.find(w => w.severity === 'RED');

  return (
    <div 
      className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-[#edf2f7] text-slate-900'
          : 'bg-slate-950 text-slate-100'
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
          criticalWarning ? 'high' :
          currentTab === 'home' ? 'high' :
          currentTab === 'forecast' ? 'subtle' :
          currentTab === 'plans' ? 'subtle' :
          currentTab === 'alerts' ? 'high' : 'subtle'
        }
      />

      <div className={`relative z-10 flex flex-col min-h-screen ${!isOnline ? 'pt-22 sm:pt-24' : 'pt-14 sm:pt-16'}`}>
        {/* Offline Status Bar if Network Disconnected */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-950 text-amber-200 border-b border-amber-800 px-4 py-1.5 text-xs font-mono flex items-center justify-center gap-2 shadow-sm">
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
          onAutoDetect={autoDetectAndSelectLocation}
          isDetectingLocation={isDetectingLocation}
          currentUser={currentUser}
          theme={theme}
        />

        {/* Main Content Area */}
        <main className={`flex-1 max-w-7xl w-full mx-auto ${
          currentTab === 'rain-map' || currentTab === 'map'
            ? 'p-2 sm:p-4 lg:px-6 lg:py-4 pb-20 md:pb-6'
            : 'px-5 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28 md:pb-8'
        }`}>
        {(currentTab === 'auth' || currentTab === 'login' || currentTab === 'signup') && (
          <AuthView
            initialMode={currentTab === 'signup' ? 'signup' : 'login'}
            onAuthSuccess={handleAuthSuccess}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'home' && (
          <HomeView
            location={selectedLocation}
            locations={locations}
            observation={sanitizedObservation}
            forecast={forecast}
            warnings={warnings}
            marine={marine}
            airQuality={airQuality}
            plans={plans}
            activePersonas={activePersonas}
            onUpdatePersonas={setActivePersonas}
            isLoading={isLoading}
            onNavigate={setCurrentTab}
            selectedHour={selectedHour}
            onSelectHour={setSelectedHour}
            theme={theme}
            isDay={isDay}
            rainRadarReport={rainRadarReport}
            isLoadingRadar={isLoadingRadar}
            onOpenRainMap={() => setCurrentTab('rain-map')}
          />
        )}

        {(currentTab === 'rain-map' || currentTab === 'rain-around-you') && (
          <RainAroundYouView
            location={selectedLocation}
            report={rainRadarReport}
            isLoading={isLoadingRadar}
            theme={theme}
            onBack={() => setCurrentTab('home')}
            onChallengePlan={() => setCurrentTab('plans')}
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

        {(currentTab === 'map' || currentTab === 'alerts') && (
          <MapView
            location={selectedLocation}
            locations={locations}
            warnings={warnings}
            onSelectLocation={handleSelectLocation}
            initialMode={currentTab === 'alerts' ? 'split' : 'map'}
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
            currentUser={currentUser}
            onNavigate={setCurrentTab}
            onSignOut={handleSignOut}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView />
        )}
      </main>

      {/* Quiet Non-Ornamental Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mb-16 md:mb-0 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">MAUSAM ADAPT</span>
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
        currentUser={currentUser}
      />
      </div>
    </div>
  );
}
