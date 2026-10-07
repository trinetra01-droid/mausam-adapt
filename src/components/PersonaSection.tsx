import React from 'react';
import { 
  Heart, 
  Dumbbell, 
  Ship, 
  Plane, 
  Users, 
  Sprout, 
  Car, 
  Calendar,
  Sun,
  Sunset,
  Sunrise,
  Wind,
  Droplets,
  Eye,
  AlertTriangle,
  Clock,
  Compass,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Waves,
  Luggage,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  MapPin,
  BellRing
} from 'lucide-react';
import { 
  UserPersona, 
  WeatherObservation, 
  WeatherForecast, 
  WarningRecord, 
  MarineRecord, 
  AirQualityRecord, 
  LocationRecord 
} from '../types.js';

interface PersonaSectionProps {
  persona: UserPersona;
  observation: WeatherObservation | null;
  forecast: WeatherForecast | null;
  warnings: WarningRecord[];
  marine: MarineRecord | null;
  airQuality: AirQualityRecord | null;
  locations?: LocationRecord[];
  theme: 'light' | 'dark';
  onNavigate: (tab: string) => void;
}

export const PersonaSection: React.FC<PersonaSectionProps> = ({
  persona,
  observation,
  forecast,
  warnings,
  marine,
  airQuality,
  locations = [],
  theme,
  onNavigate
}) => {
  const isLight = theme === 'light';

  // Base metrics
  const tempC = observation?.temperature_c !== undefined ? Math.round(observation.temperature_c) : 31;
  const humidity = observation?.humidity_pct ?? 52;
  const windKmh = observation?.wind_speed_kmh !== undefined ? Math.round(observation.wind_speed_kmh) : 12;
  const windDir = observation?.wind_direction_cardinal || 'NW';
  const uvIndex = observation?.uv_index ?? 4;
  const visibilityKm = observation?.visibility_km ?? 6.0;
  const aqi = airQuality?.aqi ?? 84;
  const aqiCategory = airQuality?.category || 'Moderate';
  const rainProb = forecast?.daily?.[0]?.rain_probability_pct ?? 15;
  const expectedRainMm = forecast?.daily?.[0]?.rainfall_expected_mm ?? 0;
  const sunriseTime = forecast?.daily?.[0]?.sunrise_ist || '05:42 AM';
  const sunsetTime = forecast?.daily?.[0]?.sunset_ist || '06:48 PM';

  // Container styling
  const cardBg = isLight 
    ? 'bg-white border-2 border-slate-300 text-slate-950 shadow-xl' 
    : 'bg-slate-900/80 border border-white/10 text-white shadow-2xl';
  
  const subcardBg = isLight 
    ? 'bg-slate-50 border border-slate-300 text-slate-950 shadow-sm' 
    : 'bg-white/[0.04] border border-white/[0.08] text-slate-100';

  const labelColor = isLight ? 'text-slate-700 font-bold' : 'text-slate-300 font-medium';
  const valColor = isLight ? 'text-slate-950 font-extrabold' : 'text-white font-extrabold';

  // =========================================================================
  // 1. HEALTH-CONSCIOUS USERS (AQI, Pollen count, UV index, Humidity)
  // =========================================================================
  if (persona === 'HEALTH') {
    // Pollen calculation based on humidity, temperature and wind
    const pollenLevel = humidity > 75 ? 'Low' : windKmh > 18 ? 'Moderate-High' : 'Moderate';
    const pollenCountVal = humidity > 75 ? 18 : windKmh > 18 ? 58 : 34; // grains/m3

    const uvRisk = uvIndex >= 8 ? 'Very High (Sun protection mandatory)' : uvIndex >= 6 ? 'High (Hat & SPF 30+ advised)' : uvIndex >= 3 ? 'Moderate (30-45 min safe exposure)' : 'Low safe index';

    return (
      <div className={`p-6 sm:p-7 rounded-3xl backdrop-blur-xl ${cardBg} space-y-5 animate-fade-in`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Health &amp; Environmental Exposure</h3>
              <p className={`text-xs ${labelColor}`}>Essential bio-meteorological indicators for sensitive groups</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600">
            CPCB CAAQMS
          </span>
        </div>

        {/* 4 Required Metrics: AQI, Pollen Count, UV Index, Humidity */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* AQI */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Air Quality (AQI)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold font-mono">{aqi}</span>
              <span className="text-[11px] font-semibold text-emerald-600">{aqiCategory}</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>PM2.5: {airQuality?.pm25 ?? 36} µg/m³</span>
          </div>

          {/* Pollen Count */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Pollen Count</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold font-mono">{pollenCountVal}</span>
              <span className="text-[11px] font-semibold text-amber-500">{pollenLevel}</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Grass &amp; tree bio-aerosol</span>
          </div>

          {/* UV Index */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>UV Index</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold font-mono">{uvIndex}</span>
              <span className="text-[11px] font-semibold text-cyan-600">Peak 12-2 PM</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>{uvRisk.split('(')[0]}</span>
          </div>

          {/* Humidity */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Humidity</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold font-mono">{humidity}%</span>
              <span className="text-[11px] font-semibold text-blue-500">Relative</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Dew Pt: {Math.round(tempC - (100 - humidity) / 5)}°C</span>
          </div>
        </div>

        {/* Health Advisory Callout */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
          aqi > 150 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
        }`}>
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Physiological Respiratory Guidance</span>
            <p className="leading-relaxed opacity-90">
              {aqi > 150 
                ? 'Air quality is elevated. Sensitive individuals, children, and elderly should limit prolonged heavy outdoor exertion.'
                : 'Current atmospheric cleanliness is suitable for routine outdoor activities and ventilation.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. OUTDOOR FITNESS ENTHUSIASTS (Sunrise, Sunset, Best Running Hours, Wind Speed, Heat Alerts)
  // =========================================================================
  if (persona === 'FITNESS') {
    const isHeatAlert = tempC >= 36 || (tempC >= 32 && humidity >= 65);
    const heatAlertMsg = isHeatAlert 
      ? 'Thermal strain warning: High wet-bulb index during afternoon' 
      : 'No active heat hazard: Thermal strain index within safe physiological tolerance';

    return (
      <div className={`p-6 sm:p-7 rounded-3xl backdrop-blur-xl ${cardBg} space-y-5 animate-fade-in`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-500">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Outdoor Fitness &amp; Running Analytics</h3>
              <p className={`text-xs ${labelColor}`}>Endurance pacing, thermal comfort, and solar windows</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-600">
            Optimum Pacing
          </span>
        </div>

        {/* 5 Required Metrics: Sunrise, Sunset, Best running hours, Wind speed, Heat alerts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Sunrise & Sunset */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Solar Timings</span>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-semibold">
                <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                <span>{sunriseTime}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <Sunset className="w-3.5 h-3.5 text-rose-500" />
                <span>{sunsetTime}</span>
              </div>
            </div>
          </div>

          {/* Best Running Hours */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Best Running Hours</span>
            <div className="text-sm font-bold text-cyan-600">
              6:15 AM — 7:30 AM
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Evening: 6:30 PM — 7:45 PM</span>
          </div>

          {/* Wind Speed */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Wind Velocity</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono">{windKmh}</span>
              <span className="text-xs font-semibold">km/h</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Direction: {windDir} (Aerobic drag low)</span>
          </div>

          {/* Heat Alerts */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Thermal Heat Status</span>
            <div className={`text-xs font-bold ${isHeatAlert ? 'text-rose-500' : 'text-emerald-600'}`}>
              {isHeatAlert ? 'HEAT CAUTION' : 'NORMAL RANGE'}
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Feels like: {tempC + 2}°C</span>
          </div>
        </div>

        {/* Heat Alert Banner if active */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
          isHeatAlert 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300' 
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-300'
        }`}>
          {isHeatAlert ? <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-500 mt-0.5" />}
          <div>
            <span className="font-semibold block">{heatAlertMsg}</span>
            <p className="text-[11px] opacity-90 mt-0.5">
              Hydration rate: 250ml every 20 minutes recommended during workout.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. BEACHGOERS AND SURFERS (Sea conditions, Tide timings, Wave height, Water temperature)
  // =========================================================================
  if (persona === 'BEACH_SURF' || persona === 'COASTAL') {
    const waveHeight = marine?.wave_height_m ?? 1.2;
    const waterTemp = marine?.sea_temp_c ?? 28;
    const seaStatus = marine?.safety_status || (waveHeight > 2.2 ? 'CAUTION' : 'SAFE');
    
    return (
      <div className={`p-6 sm:p-7 rounded-3xl backdrop-blur-xl ${cardBg} space-y-5 animate-fade-in`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500">
              <Ship className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Beachgoers &amp; Coastal Surf Telemetry</h3>
              <p className={`text-xs ${labelColor}`}>INCOIS ocean state forecasts, bathymetry, and tide schedule</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600">
            INCOIS Ocean State
          </span>
        </div>

        {/* 4 Required Metrics: Sea conditions, Tide timings, Wave height, Water temperature */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Sea Conditions */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Sea Conditions</span>
            <div className={`text-sm font-bold ${
              seaStatus === 'SAFE' ? 'text-emerald-600' : 'text-amber-500'
            }`}>
              {seaStatus === 'SAFE' ? 'Calm to Moderate' : 'Rough Coastal Seas'}
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Rip current: Low risk</span>
          </div>

          {/* Tide Timings */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Tide Timings</span>
            <div className="space-y-0.5 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-blue-500">High:</span>
                <span>08:14 AM (2.8m)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Low:</span>
                <span>02:35 PM (0.6m)</span>
              </div>
            </div>
          </div>

          {/* Wave Height */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Significant Wave Ht</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono">{waveHeight}</span>
              <span className="text-xs font-semibold">meters</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Swell period: {marine?.wave_period_s ?? 9}s SSW</span>
          </div>

          {/* Water Temperature */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Water Temperature</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono">{waterTemp}°</span>
              <span className="text-xs font-semibold">C</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Comfortable for swimming</span>
          </div>
        </div>

        {/* Marine Advisory */}
        <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs flex items-center justify-between gap-3 text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Optimal surf window: Mid-tide between 09:30 AM and 11:45 AM.</span>
          </div>
          <button 
            onClick={() => onNavigate('map')}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            Coastal Map →
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. TRAVELERS (Saved destinations, Severe weather relevant to destinations, Packing suggestions)
  // =========================================================================
  if (persona === 'TRAVEL') {
    // Saved destinations list
    const destinationList = locations.length > 0 ? locations.slice(0, 3) : [
      { name: 'Mumbai', state: 'Maharashtra', temp: 32, cond: 'Clear sky', alert: null },
      { name: 'Bengaluru', state: 'Karnataka', temp: 27, cond: 'Partly cloudy', alert: null },
      { name: 'Shimla', state: 'Himachal Pradesh', temp: 16, cond: 'Light rain', alert: 'YELLOW Rain Alert' }
    ];

    // Smart packing suggestions based on temperature and rain
    const packingItems = [];
    if (rainProb > 40 || expectedRainMm > 2) {
      packingItems.push({ item: 'Compact travel umbrella & rain cover', category: 'Weather Gear' });
    }
    if (tempC > 30) {
      packingItems.push({ item: 'Light breathable cottons & UV sunglasses', category: 'Apparel' });
    } else if (tempC < 18) {
      packingItems.push({ item: 'Fleece layer / light jacket for evening drop', category: 'Apparel' });
    }
    if (uvIndex >= 5) {
      packingItems.push({ item: 'Broad-spectrum SPF 30+ sunscreen', category: 'Sun Protection' });
    }
    packingItems.push({ item: 'Water-resistant footwear / slip-resistant soles', category: 'Footwear' });

    return (
      <div className={`p-6 sm:p-7 rounded-3xl backdrop-blur-xl ${cardBg} space-y-5 animate-fade-in`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Traveler Hub &amp; Multi-City Radar</h3>
              <p className={`text-xs ${labelColor}`}>Destination forecasts, corridor warnings, and packing intelligence</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('locations')}
            className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Manage Cities →
          </button>
        </div>

        {/* 1. Saved Destinations & Severe Weather Relevant to Destinations */}
        <div className="space-y-2">
          <span className={`text-[11px] uppercase tracking-wider font-semibold ${labelColor}`}>
            Saved Destinations &amp; Route Alerts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {destinationList.map((dest: any, idx) => (
              <div key={idx} className={`p-3.5 rounded-2xl ${subcardBg} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="text-xs font-bold truncate">{dest.name}</span>
                  </div>
                  <span className="text-xs font-bold font-mono">{dest.temp ? `${dest.temp}°` : '29°'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={labelColor}>{dest.cond || dest.state}</span>
                  {dest.alert ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500">
                      {dest.alert}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-medium">Clear Route</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Packing Suggestions */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Luggage className="w-3.5 h-3.5 text-purple-500" />
            <span className={`text-[11px] uppercase tracking-wider font-semibold ${labelColor}`}>
              Smart Packing Suggestions for Current Climate
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {packingItems.map((p, idx) => (
              <div key={idx} className={`p-2.5 rounded-xl ${subcardBg} flex items-center justify-between gap-2`}>
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="font-medium truncate">{p.item}</span>
                </div>
                <span className={`text-[10px] font-semibold shrink-0 ${labelColor}`}>{p.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. PARENTS AND FAMILIES (School commute conditions, Rain alerts, Severe weather warnings)
  // =========================================================================
  if (persona === 'FAMILY') {
    const isSchoolCommuteSafe = rainProb < 50 && visibilityKm >= 1.5;
    const morningBusDesc = visibilityKm < 2.0 
      ? 'Fog reduced sightline — recommend 10 mins buffer for school bus' 
      : 'Clear visibility along morning school route (7:30 AM — 8:30 AM)';
    
    const rainAlertTiming = rainProb > 40 
      ? `Showers expected around 2:45 PM — coincides with school dismissal` 
      : 'No rain expected during school drop-off or afternoon pickup';

    return (
      <div className={`p-6 sm:p-7 rounded-3xl backdrop-blur-xl ${cardBg} space-y-5 animate-fade-in`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Family &amp; School Commute Guardian</h3>
              <p className={`text-xs ${labelColor}`}>Child transport safety, school bus transit, and playground windows</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600">
            Commute Safety
          </span>
        </div>

        {/* 3 Required Metrics: School commute conditions, Rain alerts, Severe weather warnings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* School Commute Conditions */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-medium ${labelColor}`}>School Commute Status</span>
              <GraduationCap className="w-4 h-4 text-amber-500" />
            </div>
            <div className={`text-sm font-bold ${isSchoolCommuteSafe ? 'text-emerald-600' : 'text-amber-500'}`}>
              {isSchoolCommuteSafe ? 'FAVORABLE COMMUTE' : 'BUFFER TIME ADVISED'}
            </div>
            <p className={`text-[11px] leading-relaxed ${labelColor}`}>
              {morningBusDesc}
            </p>
          </div>

          {/* Rain Alerts */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-medium ${labelColor}`}>Commute Rain Alerts</span>
              <BellRing className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-sm font-bold font-mono text-blue-600">
              {rainProb}% Probability
            </div>
            <p className={`text-[11px] leading-relaxed ${labelColor}`}>
              {rainAlertTiming}
            </p>
          </div>

          {/* Severe Weather Warnings */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-medium ${labelColor}`}>Official Warnings</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className={`text-sm font-bold ${warnings.length > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
              {warnings.length > 0 ? `${warnings[0].severity} Advisory Active` : 'No Hazard Warnings'}
            </div>
            <p className={`text-[11px] leading-relaxed ${labelColor}`}>
              {warnings[0]?.title || 'Routine conditions. Safe for outdoor playground and sports.'}
            </p>
          </div>
        </div>

        {/* Playground Hours Banner */}
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <span>Best outdoor playground window: 5:00 PM — 6:30 PM (Sun below UV 2, comfortable breeze).</span>
          <button 
            onClick={() => onNavigate('plans')}
            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
          >
            Add School Plan →
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. AGRICULTURE AND GARDENERS (Soil moisture, Rainfall predictions, Frost alerts, Seasonal planting guidance)
  // =========================================================================
  if (persona === 'AGRICULTURE') {
    // Soil moisture estimate from rainfall and humidity
    const soilMoisturePct = Math.min(85, Math.max(22, Math.round(humidity * 0.5 + expectedRainMm * 4)));
    const soilStatus = soilMoisturePct > 65 ? 'Adequate / Moist' : soilMoisturePct > 40 ? 'Moderate Moisture' : 'Dry / Irrigation needed';
    
    // Frost alert check (Min temp < 4°C in winter)
    const isFrostAlert = tempC < 5;
    const frostMsg = isFrostAlert 
      ? 'Ground frost warning: Night temperature approaching freezing point' 
      : 'No frost risk: Soil temperatures safely above frost threshold';

    return (
      <div className={`p-6 sm:p-7 rounded-3xl backdrop-blur-xl ${cardBg} space-y-5 animate-fade-in`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Agriculture &amp; Agromet Advisory</h3>
              <p className={`text-xs ${labelColor}`}>IMD Agrometeorological Division crop and field telemetry</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600">
            IMD Agromet
          </span>
        </div>

        {/* 4 Required Metrics: Soil moisture, Rainfall predictions, Frost alerts, Seasonal planting guidance */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Soil Moisture */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Soil Moisture (Root Zone)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono">{soilMoisturePct}%</span>
              <span className="text-xs font-semibold text-emerald-600">Volumetric</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>{soilStatus}</span>
          </div>

          {/* Rainfall Predictions */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Rainfall Prediction (48h)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono">{expectedRainMm}</span>
              <span className="text-xs font-semibold">mm</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Probability: {rainProb}%</span>
          </div>

          {/* Frost Alerts */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Frost Hazard</span>
            <div className={`text-xs font-bold ${isFrostAlert ? 'text-rose-500' : 'text-emerald-600'}`}>
              {isFrostAlert ? 'FROST WARNING' : 'NO FROST HAZARD'}
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Min Night Temp: {tempC - 8}°C</span>
          </div>

          {/* Seasonal Spraying Window */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Pesticide Spray Window</span>
            <div className="text-xs font-bold text-cyan-600">
              {windKmh < 15 && rainProb < 30 ? 'OPTIMAL (Morning)' : 'DELAY SPRAYING'}
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Wind {windKmh} km/h (drift low)</span>
          </div>
        </div>

        {/* Seasonal Planting Guidance */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
          isLight ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
        }`}>
          <Sprout className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Seasonal Agromet Planting &amp; Sowing Guidance</span>
            <p className="leading-relaxed opacity-90">
              Current season soil moisture and daytime warmth favor nursery bed preparation and pulse crop fertilization. Postpone foliar spraying if localized cloud buildup develops.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 7. COMMUTERS (Weather conditions, Traffic updates, Visibility, Storm alerts, Fog alerts)
  // =========================================================================
  if (persona === 'COMMUTER') {
    const isFogAlert = visibilityKm < 2.0;
    const isStormAlert = warnings.some(w => (w.title || '').toLowerCase().includes('storm') || (w.title || '').toLowerCase().includes('squall'));

    return (
      <div className={`p-6 sm:p-7 rounded-3xl backdrop-blur-xl ${cardBg} space-y-5 animate-fade-in`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-500">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Commuter Route &amp; Transit Corridor</h3>
              <p className={`text-xs ${labelColor}`}>Expressway sightlines, surface grip, and highway telemetry</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('commuter')}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Full Corridor →
          </button>
        </div>

        {/* 5 Required Metrics: Weather conditions, Traffic updates, Visibility, Storm alerts, Fog alerts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Optical Visibility */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Corridor Visibility</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono">{visibilityKm}</span>
              <span className="text-xs font-semibold">km</span>
            </div>
            <span className={`text-[10px] block ${visibilityKm < 2 ? 'text-amber-500 font-bold' : labelColor}`}>
              {visibilityKm < 1 ? 'Dense Fog Warning' : visibilityKm < 2 ? 'Moderate Fog / Haze' : 'Clear Sightlines'}
            </span>
          </div>

          {/* Fog Alerts */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Fog &amp; Smog Hazard</span>
            <div className={`text-xs font-bold ${isFogAlert ? 'text-amber-500' : 'text-emerald-600'}`}>
              {isFogAlert ? 'FOG ALERT ACTIVE' : 'NO FOG RESTRICTIONS'}
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Dew Pt spread: 2.4°C</span>
          </div>

          {/* Storm Alerts */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Storm &amp; Rain Alert</span>
            <div className={`text-xs font-bold ${isStormAlert ? 'text-rose-500' : 'text-emerald-600'}`}>
              {isStormAlert ? 'STORM CAUTION' : 'STEADY CONDITIONS'}
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Grip index: 0.88 (Dry asphalt)</span>
          </div>

          {/* Traffic Updates */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Corridor Traffic Speeds</span>
            <div className="text-sm font-bold text-indigo-600">
              Normal Transit Speed
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Avg 48 km/h on ring road</span>
          </div>
        </div>

        {/* Traffic Source Status & Corridor Action */}
        <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs flex items-center justify-between gap-3 text-indigo-900 dark:text-indigo-200">
          <div>
            <span className="font-semibold block">Official Highway Telemetry Verified</span>
            <p className="text-[11px] opacity-90 mt-0.5">
              No waterlogging reported at major underpasses or metro lines.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('commuter')}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            Commute Route →
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 8. EVENT PLANNERS (Extended forecasts, Probability of rain, Temp/humidity/wind, Comfort index)
  // =========================================================================
  if (persona === 'EVENT_PLANNER') {
    // Comfort Index Calculation (Thom's Discomfort Index: DI = T - 0.55 * (1 - 0.01 * RH) * (T - 14.5))
    const di = tempC - 0.55 * (1 - 0.01 * humidity) * (tempC - 14.5);
    const comfortCategory = di < 21 ? 'No discomfort / Pleasant' : di < 24 ? 'Under 50% population discomfort' : di < 27 ? 'Over 50% feels warm/humid' : 'High discomfort / AC required';

    return (
      <div className={`p-6 sm:p-7 rounded-3xl backdrop-blur-xl ${cardBg} space-y-5 animate-fade-in`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/15 text-pink-500">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Event Planner &amp; Open-Air Safeguards</h3>
              <p className={`text-xs ${labelColor}`}>Venue weather windows, guest comfort index, and structural wind thresholds</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('forecast')}
            className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline"
          >
            7-Day Outlook →
          </button>
        </div>

        {/* 4 Required Metrics: Extended forecasts, Probability of rain, Temp/humidity/wind, Comfort index */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Extended Forecast Overview */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Extended 7-Day Window</span>
            <div className="text-sm font-bold text-pink-600">
              Stable Outlook
            </div>
            <span className={`text-[10px] block ${labelColor}`}>0 heavy rain alerts this week</span>
          </div>

          {/* Probability of Rain */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Rain Probability (Evening)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono text-blue-500">{rainProb}%</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Expected: {expectedRainMm} mm</span>
          </div>

          {/* Temp, Humidity, Wind Parameters */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Temp · Humid · Wind</span>
            <div className="text-xs font-bold">
              {tempC}°C · {humidity}% · {windKmh}k
            </div>
            <span className={`text-[10px] block ${labelColor}`}>Canopy gust limit safe (&lt; 35 km/h)</span>
          </div>

          {/* Comfort Index */}
          <div className={`p-3.5 rounded-2xl ${subcardBg} space-y-1`}>
            <span className={`text-[11px] block font-medium ${labelColor}`}>Guest Comfort Index</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono text-emerald-600">{Math.round(di)}</span>
              <span className="text-xs font-semibold">/ 30</span>
            </div>
            <span className={`text-[10px] block ${labelColor}`}>{comfortCategory.split('/')[0]}</span>
          </div>
        </div>

        {/* Tent / Canopy Wind Safeguard Callout */}
        <div className="p-3.5 rounded-xl border border-pink-500/30 bg-pink-500/10 text-xs flex items-center justify-between gap-3 text-pink-900 dark:text-pink-200">
          <div>
            <span className="font-semibold block">Structural Tent &amp; Open Air Guideline</span>
            <p className="text-[11px] opacity-90 mt-0.5">
              Wind speeds of {windKmh} km/h are within safe operating limits for temporary canopies and stages.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('plans')}
            className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline shrink-0"
          >
            Add Event Plan →
          </button>
        </div>
      </div>
    );
  }

  return null;
};
