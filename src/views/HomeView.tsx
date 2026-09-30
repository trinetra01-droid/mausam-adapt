import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldAlert, 
  Sun, 
  CloudRain, 
  Wind, 
  Eye, 
  Droplets,
  Gauge,
  Sunrise,
  Sunset,
  Sparkles,
  Compass,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  LocationRecord, 
  WeatherObservation, 
  WeatherForecast, 
  WarningRecord, 
  MarineRecord, 
  AirQualityRecord, 
  UserPersona, 
  PlanRecord 
} from '../types.js';
import { AnimatedWeatherIcon } from '../components/AnimatedWeatherIcon.js';

interface HomeViewProps {
  location: LocationRecord;
  observation: WeatherObservation | null;
  forecast: WeatherForecast | null;
  warnings: WarningRecord[];
  marine: MarineRecord | null;
  airQuality: AirQualityRecord | null;
  plans: PlanRecord[];
  activePersonas: UserPersona[];
  isLoading: boolean;
  onNavigate: (tab: string) => void;
  onSelectHour?: (hour: number) => void;
  selectedHour?: number;
  theme?: 'light' | 'dark';
  isDay?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  location,
  observation,
  forecast,
  warnings,
  marine,
  airQuality,
  plans,
  activePersonas,
  isLoading,
  onNavigate,
  onSelectHour,
  selectedHour,
  theme = 'light',
  isDay = true
}) => {
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);

  // Time-based greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  // Read saved user name or default to warm personal name
  let userName = '';
  try {
    const savedProf = localStorage.getItem('trinetra_commuter_profile');
    if (savedProf) {
      const parsed = JSON.parse(savedProf);
      if (parsed.userName) userName = parsed.userName;
    }
  } catch (_) {}

  // Check for critical warnings / System Override
  const criticalWarning = warnings.find(w => w.severity === 'RED');
  const activeWarning = criticalWarning || warnings[0];

  // Derive weather stats
  const tempC = observation?.temperature_c !== undefined ? Math.round(observation.temperature_c) : 31;
  const feelsLikeC = observation?.feels_like_c !== undefined ? Math.round(observation.feels_like_c) : tempC + 2;
  const condition = observation?.condition_text || 'Clear sky';
  const humidity = observation?.humidity_pct ?? 52;
  const windKmh = observation?.wind_speed_kmh !== undefined ? Math.round(observation.wind_speed_kmh) : 12;
  const windDir = observation?.wind_direction_cardinal || 'NW';
  const uvIndex = observation?.uv_index ?? 4;
  const aqiValue = airQuality?.aqi ?? 82;
  const aqiCategory = airQuality?.category || 'Moderate';
  const visibilityKm = observation?.visibility_km ?? 6.0;

  // Derive today's personalized decision based on persona, active warnings, and meteorological safety
  const getDecision = () => {
    // 1. TOP PRIORITY: Official Meteorological Alerts (IMD / INCOIS Safety Warnings)
    const severeWarning = warnings.find(w => w.is_active && (w.severity === 'RED' || w.severity === 'ORANGE')) || warnings.find(w => w.is_active);
    
    if (severeWarning && severeWarning.is_active) {
      const wTitle = (severeWarning.title || '').toLowerCase();
      const wType = (severeWarning.warning_type || '').toLowerCase();
      const wMsg = (severeWarning.message || '').toLowerCase();
      
      const isRainOrWindAlert = 
        wTitle.includes('rain') || wTitle.includes('squall') || wTitle.includes('wind') || wTitle.includes('cyclone') || wTitle.includes('flood') ||
        wType.includes('rain') || wType.includes('wind') || wType.includes('squall') ||
        wMsg.includes('rain') || wMsg.includes('squall') || wMsg.includes('gust');

      const isThunderstormAlert = 
        wTitle.includes('thunder') || wTitle.includes('lightning') ||
        wType.includes('thunder') || wMsg.includes('lightning') || wMsg.includes('thunder');

      const isHeatAlert =
        wTitle.includes('heat') || wType.includes('heat') || wMsg.includes('heatwave');

      if (isThunderstormAlert) {
        return {
          title: 'Lightning hazard: Outdoor running suspended.',
          bestWindow: 'Indoor workout only',
          status: 'CAUTION',
          severity: severeWarning.severity,
          why: [
            `Official IMD ${severeWarning.severity} Alert: ${severeWarning.title}`,
            'Direct lightning strike danger in open fields, parks, and roads',
            'Sudden downpours and erratic convective wind downdrafts'
          ],
          alternative: 'Wait until severe convective storm cells pass'
        };
      }

      if (isRainOrWindAlert) {
        const windSnippet = wMsg.includes('kmph') || wMsg.includes('km/h') 
          ? 'Squally winds reaching 45–65 km/h create acute flying debris and slip hazards'
          : 'Squally weather with strong wind gusts and intense precipitation';

        return {
          title: 'Heavy rain & squall alert: Evening run not recommended.',
          bestWindow: 'Shift to indoor treadmill / cross-training',
          status: 'CAUTION',
          severity: severeWarning.severity,
          why: [
            `Official IMD ${severeWarning.severity} Alert: ${severeWarning.title}`,
            windSnippet,
            'Waterlogging, low shoe grip, and reduced sightlines make outdoor running hazardous'
          ],
          alternative: 'Indoor gym session or postpone outdoor run to next dry window'
        };
      }

      if (isHeatAlert) {
        return {
          title: 'Severe heatwave advisory: Avoid outdoor running.',
          bestWindow: 'Dawn 5:15 AM — 6:15 AM only',
          status: 'CAUTION',
          severity: severeWarning.severity,
          why: [
            `Official IMD ${severeWarning.severity} Heat Alert: ${severeWarning.title}`,
            'Dangerous wet-bulb temperature elevates risk of heat stroke and dehydration',
            'Surface radiant heat persists well past dusk'
          ],
          alternative: 'Indoor air-conditioned running or early morning cool down'
        };
      }

      // Any other official warning
      return {
        title: `Official weather advisory: ${severeWarning.title}`,
        bestWindow: 'Indoor activities advised',
        status: 'CAUTION',
        severity: severeWarning.severity,
        why: [
          `Active ${severeWarning.provider} ${severeWarning.severity} warning for ${severeWarning.affected_area || location.name}`,
          severeWarning.message ? severeWarning.message.slice(0, 120) + '...' : 'Adverse weather expected',
          'Outdoor endurance activities should be suspended until advisory clears'
        ],
        alternative: 'Indoor workout recommended'
      };
    }

    // 2. Active Rain / Thunderstorm in Current Observation
    const condLower = condition.toLowerCase();
    const isRainingNow = (observation?.rainfall_mm ?? 0) > 0.5 || condLower.includes('rain') || condLower.includes('drizzle') || condLower.includes('shower');
    const isThunderNow = condLower.includes('thunder') || condLower.includes('lightning');

    if (isThunderNow) {
      return {
        title: 'Active thunderstorm: Stay sheltered indoors.',
        bestWindow: 'Indoor workout',
        status: 'CAUTION',
        severity: 'ORANGE',
        why: [
          'Convective lightning activity detected in the vicinity',
          'Heavy downpours reduce visibility and roadway grip',
          'Gusty surface winds exceed safe running thresholds'
        ],
        alternative: 'Postpone until storm activity clears completely'
      };
    }

    if (isRainingNow) {
      return {
        title: 'Precipitation active: Wet surfaces and reduced traction.',
        bestWindow: 'Shift to covered or indoor training',
        status: 'CAUTION',
        severity: 'YELLOW',
        why: [
          `Current rainfall intensity: ${observation?.rainfall_mm ?? 1.5} mm/hr`,
          'Slippery asphalt and standing water increase injury risk',
          'Cold rain and wind induce rapid chill during cool-down'
        ],
        alternative: 'Indoor treadmill or wait for dry pavement tomorrow morning'
      };
    }

    // 3. High Forecast Rain Probability or Precipitation Expected Today
    const todayForecast = forecast?.daily?.[0];
    const rainProb = todayForecast?.rain_probability_pct ?? 0;
    const rainExpectedMm = todayForecast?.rainfall_expected_mm ?? 0;

    // Check hourly forecast during running hours (17:00 to 20:00)
    let eveningRainProb = rainProb;
    if (forecast?.hourly && forecast.hourly.length > 0) {
      const eveningHours = forecast.hourly.filter((h: any) => {
        const hr = h.hour ?? (h.time ? parseInt(h.time, 10) : NaN);
        return hr >= 17 && hr <= 20;
      });
      if (eveningHours.length > 0) {
        eveningRainProb = Math.max(...eveningHours.map((h: any) => h.pop ?? h.rain_probability_pct ?? 0));
      }
    }

    if (rainProb >= 50 || rainExpectedMm >= 5 || eveningRainProb >= 50) {
      return {
        title: 'High rain probability this evening: Running conditions compromised.',
        bestWindow: 'Morning dry spell (if dry) or indoor treadmill',
        status: 'CAUTION',
        severity: 'YELLOW',
        why: [
          `Evening rain probability estimated at ${eveningRainProb}% (${rainExpectedMm} mm expected)`,
          'Scattered showers likely to hit during evening workout hours',
          'Wet road surfaces and reduced visibility'
        ],
        alternative: 'Indoor workout or verify hourly radar before heading out'
      };
    }

    // 4. Extreme Heat Index
    if (feelsLikeC >= 38 || tempC >= 38) {
      return {
        title: 'Thermal caution for outdoor workouts.',
        bestWindow: '5:45 AM — 7:00 AM (Early Morning)',
        status: 'CAUTION',
        severity: 'YELLOW',
        why: [
          `Heat index feels like ${feelsLikeC}°C (${tempC}°C actual) with ${humidity}% humidity`,
          'Elevated thermal stress: High risk of heat exhaustion and severe dehydration',
          'Peak UV index of ' + uvIndex + ' during midday'
        ],
        alternative: 'Early morning dawn session tomorrow or air-conditioned gym'
      };
    }

    // 5. Severe / Poor Air Quality
    if (aqiValue > 200) {
      return {
        title: 'Poor air quality: Unhealthy for aerobic running.',
        bestWindow: 'Indoor workout in filtered air',
        status: 'CAUTION',
        severity: 'ORANGE',
        why: [
          `AQI ${aqiValue} (${aqiCategory}) poses significant lung and respiratory strain`,
          'Heavy aerobic breathing significantly increases deep PM2.5 particle uptake',
          'Prolonged outdoor exertion not recommended for cardio fitness'
        ],
        alternative: 'Indoor treadmill in filtered air'
      };
    }

    // 6. High Winds
    if (windKmh > 35) {
      return {
        title: 'Strong winds advisory: Challenging outdoor running.',
        bestWindow: 'Early morning when winds subside',
        status: 'CAUTION',
        severity: 'YELLOW',
        why: [
          `Surface winds gusting at ${windKmh} km/h from ${windDir}`,
          'Airborne dust and debris along road corridors',
          'Increased resistance and instability on open paths'
        ],
        alternative: 'Indoor cross-training or sheltered park routes'
      };
    }

    // 7. Dense Fog / Poor Visibility
    if (visibilityKm < 1.8) {
      return {
        title: 'Low visibility alert for morning commute and running.',
        bestWindow: 'After 9:30 AM once fog lifts',
        status: 'CAUTION',
        severity: 'YELLOW',
        why: [
          `Surface sightlines reduced to ${visibilityKm} km (< 2 km threshold)`,
          'Vehicular traffic sight distance compromised on pedestrian lanes',
          'Moisture saturation and cold particulate trapping'
        ],
        alternative: 'Opt for well-lit, traffic-free tracks or delay until clear'
      };
    }

    // 8. OPTIMAL / FAVORABLE RUNNING CONDITIONS
    const windDesc = windKmh < 15 ? `Gentle breeze ${windKmh} km/h` : `Moderate breeze ${windKmh} km/h`;
    const rainDesc = rainProb > 0 ? `Low rain probability (${rainProb}%)` : 'Minimal rain risk (< 10%)';

    return {
      title: 'Good conditions for your evening run.',
      bestWindow: '6:30 PM — 7:45 PM',
      status: 'OPTIMAL',
      severity: 'GREEN',
      why: [
        rainDesc,
        `Comfortable temperature cooldown from ${tempC}°C`,
        `${windDesc} ${windDir}`,
        `Air quality index ${aqiValue} (${aqiCategory})`
      ],
      alternative: '6:45 AM tomorrow morning'
    };
  };

  const decision = getDecision();

  // Upcoming plans sample
  const upcomingPlans = plans.slice(0, 3);

  // Hourly slots from forecast
  const hourlyData = forecast?.hourly && forecast.hourly.length > 0 
    ? forecast.hourly.slice(0, 8)
    : [
        { time: '6 PM', temp: 31, condition: 'Clear', pop: 5 },
        { time: '7 PM', temp: 30, condition: 'Clear', pop: 5 },
        { time: '8 PM', temp: 29, condition: 'Clear', pop: 10 },
        { time: '9 PM', temp: 28, condition: 'Clear', pop: 10 },
        { time: '10 PM', temp: 27, condition: 'Clear', pop: 15 },
        { time: '11 PM', temp: 26, condition: 'Clear', pop: 15 },
        { time: '12 AM', temp: 25, condition: 'Clear', pop: 10 }
      ];

  // =========================================================================
  // 13. SYSTEM OVERRIDE (Only when official life/property danger is active)
  // =========================================================================
  if (criticalWarning) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-8 animate-fade-in">
        <div className="p-8 bg-rose-950/60 border border-rose-500/40 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 text-rose-400">
            <ShieldAlert className="w-7 h-7 shrink-0 animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase">
              SYSTEM OVERRIDE · OFFICIAL EMERGENCY
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              DO NOT PLAN OUTDOOR ACTIVITIES
            </h1>
            <p className="text-lg text-rose-200/90 font-medium">
              {criticalWarning.title || 'Severe Meteorological Hazard Warning'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-rose-900/60 text-sm">
            <div>
              <span className="text-xs text-rose-300/70 block">Affected Area</span>
              <strong className="text-white text-base">{location.name}</strong>
            </div>
            <div>
              <span className="text-xs text-rose-300/70 block">Source</span>
              <strong className="text-white text-base">India Meteorological Dept (IMD)</strong>
            </div>
            <div>
              <span className="text-xs text-rose-300/70 block">Valid Until</span>
              <strong className="text-white text-base">
                {criticalWarning.valid_until ? new Date(criticalWarning.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Next Advisory'}
              </strong>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {criticalWarning.message || 'Severe atmospheric conditions detected. Immediate risk to outdoor safety. Seek indoor shelter and suspend ground transit.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('alerts')}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg"
            >
              View Official Alert Details
            </button>
            <button
              onClick={() => onNavigate('plans')}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              Check My Impacted Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // NORMAL HOMEPAGE (Premium, Minimal, Calm, Weather-First, Decision-First)
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-fade-in">
      
      {/* 7. HOMEPAGE HERO - Large Atmospheric Weather Hero (Direct page background, generous breathing room) */}
      <section className="relative pt-2 sm:pt-6 pb-2">
        {/* Subtle greeting */}
        <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          {greeting}{userName ? `, ${userName}` : ''}.
        </p>

        {/* 16px between greeting and location */}
        <div className="mt-4">
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight leading-tight ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            {location.name.split('(')[0].trim()}
          </h2>
          <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            {location.state}
          </p>
        </div>

        {/* 20-28px between location and temperature */}
        <div className="mt-6 sm:mt-7">
          {/* Temperature: 56-72px font size with animated weather icon on right */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className={`text-6xl sm:text-7xl font-extrabold tracking-tighter leading-none ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              {tempC}°
            </div>
            <AnimatedWeatherIcon
              condition={condition}
              isDay={isDay}
              size={64}
              className="shrink-0 drop-shadow-md"
            />
          </div>

          {/* 4-8px between temperature and condition */}
          <div className="mt-2">
            <div className={`text-xl sm:text-2xl font-semibold ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-100'
            }`}>
              {condition}
            </div>
            {/* 4px between condition and feels-like */}
            <div className={`text-sm font-normal mt-1 ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Feels like {feelsLikeC}°
            </div>
          </div>
        </div>

        {/* 28-36px between feels-like and metrics */}
        <div className={`mt-8 pt-5 border-t ${
          theme === 'light' ? 'border-slate-200' : 'border-white/[0.06]'
        }`}>
          {/* Mobile Clean Two-Row Layout */}
          <div className={`sm:hidden space-y-2 text-xs ${
            theme === 'light' ? 'text-slate-700' : 'text-slate-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Humidity </span>
                <span className={`font-semibold ml-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{humidity}%</span>
              </div>
              <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
              <div>
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Wind </span>
                <span className={`font-semibold ml-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{windKmh} km/h {windDir}</span>
              </div>
              <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
              <div>
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>UV </span>
                <span className={`font-semibold ml-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{uvIndex}</span>
              </div>
            </div>
            <div className="pt-0.5 flex items-center gap-2">
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Air Quality</span>
              <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{aqiValue}</span>
              <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
              <span className="text-emerald-600 font-semibold">{aqiCategory}</span>
            </div>
          </div>

          {/* Desktop Single Horizontal Strip */}
          <div className={`hidden sm:flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${
            theme === 'light' ? 'text-slate-700' : 'text-slate-300'
          }`}>
            <div>
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Humidity </span>
              <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{humidity}%</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
            <div>
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Wind </span>
              <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{windKmh} km/h {windDir}</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
            <div>
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>UV </span>
              <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{uvIndex}</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
            <div>
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Air Quality </span>
              <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{aqiValue} · {aqiCategory}</span>
            </div>
          </div>
        </div>

        {/* 20-24px between metrics and source */}
        <div className={`mt-5 text-xs flex items-center gap-1.5 ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <span>Updated recently ·</span>
          <button
            type="button"
            onClick={() => setShowSourceModal(true)}
            className="text-cyan-600 hover:text-cyan-700 underline underline-offset-2 font-medium cursor-pointer transition-colors"
          >
            IMD
          </button>
        </div>
      </section>

      {/* 12. ACTIVE OFFICIAL WARNING (Promoted right under hero if present) */}
      {activeWarning && (
        <section className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-xs tracking-wide uppercase">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Official Weather Alert</span>
            </div>
            <span className="text-xs text-amber-300/80">
              Valid until {activeWarning.valid_until ? new Date(activeWarning.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'evening'}
            </span>
          </div>
          <h3 className="text-base font-bold text-white">
            {activeWarning.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeWarning.message || 'Outdoor plans may be affected. Please observe safety advisories.'}
          </p>
          <div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-amber-300 hover:text-amber-200 font-medium inline-flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
            >
              <span>View official alert</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* 8. PERSONALIZED DECISION - Visual Centerpiece */}
      <section className="mt-10 sm:mt-12 space-y-3">
        <div className={`text-[11px] uppercase tracking-wider font-semibold ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          YOUR WEATHER TODAY
        </div>

        <div className={`p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-5 sm:space-y-6 transition-all ${
          decision.status === 'CAUTION'
            ? (theme === 'light'
                ? 'bg-amber-50/70 border-2 border-amber-400/70 text-slate-900 shadow-md'
                : 'bg-amber-950/30 border border-amber-500/40 text-slate-100 shadow-xl')
            : (theme === 'light' 
                ? 'bg-white/85 border border-slate-200 text-slate-900 shadow-md' 
                : 'bg-slate-900/60 border border-white/[0.08] text-white')
        }`}>
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {decision.status === 'CAUTION' ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                theme === 'light' 
                  ? 'bg-amber-200/80 text-amber-900 border border-amber-400/80' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Weather Caution</span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                theme === 'light' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Optimal Conditions</span>
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug ${
              decision.status === 'CAUTION'
                ? (theme === 'light' ? 'text-amber-950' : 'text-amber-100')
                : (theme === 'light' ? 'text-slate-900' : 'text-white')
            }`}>
              {decision.title}
            </h3>
            <div className="flex flex-wrap items-baseline gap-2 pt-1">
              <span className={`text-xs font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                {decision.status === 'CAUTION' ? 'Recommended window' : 'Best window'}
              </span>
              <span className={`text-lg sm:text-xl font-bold ${
                decision.status === 'CAUTION'
                  ? (theme === 'light' ? 'text-amber-800' : 'text-amber-300')
                  : (theme === 'light' ? 'text-cyan-700' : 'text-cyan-400')
              }`}>
                {decision.bestWindow}
              </span>
            </div>
          </div>

          {/* Why? Unboxed Plain-English Bulletins */}
          <div className="space-y-2">
            <span className={`text-xs font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Why?</span>
            <ul className={`space-y-1.5 text-xs sm:text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              {decision.why.map((reason, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    decision.status === 'CAUTION'
                      ? (theme === 'light' ? 'bg-amber-600' : 'bg-amber-400')
                      : (theme === 'light' ? 'bg-cyan-600' : 'bg-cyan-400')
                  }`} />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button: Challenge this plan */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('plans')}
              className={`w-full sm:w-auto px-5 py-3 sm:py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2 ${
                decision.status === 'CAUTION'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
              }`}
            >
              <span>{decision.status === 'CAUTION' ? 'Adjust affected plans' : 'Challenge this plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate('commuter')}
              className={`w-full sm:w-auto text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 py-1 ${
                theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Check commute corridor →</span>
            </button>
          </div>
        </div>
      </section>

      {/* 10. HOURLY FORECAST - Clean Horizontal Timeline (No heavy borders around every hour) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`text-[11px] uppercase tracking-wider font-semibold ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Hourly Outlook
          </div>
          <button
            onClick={() => onNavigate('forecast')}
            className={`text-xs font-medium cursor-pointer ${
              theme === 'light' ? 'text-cyan-700 hover:text-cyan-800' : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            7-day forecast →
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-2 px-2">
          {hourlyData.map((h: any, idx: number) => {
            const timeLabel = h.time || `${(idx + 6) % 12 || 12} ${(idx + 6) >= 12 ? 'PM' : 'AM'}`;
            const tVal = h.temp ?? h.temperature_c ?? 30;
            const cond = h.condition || h.condition_text || 'Clear';
            const isSelected = selectedHour === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectHour && onSelectHour(idx)}
                className={`flex-1 min-w-[76px] py-4 px-3 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-2 ${
                  isSelected
                    ? theme === 'light'
                      ? 'bg-white text-slate-900 shadow-md border border-slate-300'
                      : 'bg-white/[0.08] text-white backdrop-blur-md shadow-lg border border-white/10'
                    : theme === 'light'
                      ? 'text-slate-700 hover:bg-white/60 border border-transparent'
                      : 'text-slate-300 hover:bg-white/[0.03]'
                }`}
              >
                <span className={`text-xs font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{timeLabel}</span>
                <div className="flex items-center gap-1 justify-center">
                  <span className={`text-base font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{Math.round(tVal)}°</span>
                  <AnimatedWeatherIcon condition={cond} size={20} className="shrink-0" />
                </div>
                <span className={`text-[11px] truncate max-w-[70px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{cond}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 11. MY PLANS - 2 to 3 Compact Human Rows */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`text-[11px] uppercase tracking-wider font-semibold ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            My Plans
          </div>
          <button
            onClick={() => onNavigate('plans')}
            className={`text-xs font-medium cursor-pointer ${
              theme === 'light' ? 'text-cyan-700 hover:text-cyan-800' : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            View all plans →
          </button>
        </div>

        {upcomingPlans.length > 0 ? (
          <div className={`divide-y border-y ${
            theme === 'light' 
              ? 'divide-slate-200 border-slate-200' 
              : 'divide-white/[0.05] border-white/[0.06]'
          }`}>
            {upcomingPlans.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => onNavigate('plans')}
                className={`py-3.5 flex items-center justify-between gap-4 group cursor-pointer px-2 rounded-xl transition-colors ${
                  theme === 'light' ? 'hover:bg-slate-100/70' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base">
                    {plan.activity === 'RUNNING' ? '🏃' : plan.activity === 'CYCLING' ? '🚴' : plan.activity === 'OUTDOOR_EVENT' ? '🎉' : '📅'}
                  </span>
                  <div className="truncate">
                    <span className={`text-sm font-semibold transition-colors truncate block ${
                      theme === 'light' 
                        ? 'text-slate-900 group-hover:text-cyan-700' 
                        : 'text-white group-hover:text-cyan-400'
                    }`}>
                      {plan.title}
                    </span>
                    <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {plan.start_time || '6:30 PM'} · {plan.planned_date || 'Today'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold ${
                    plan.has_conflict ? 'text-amber-500' : 'text-emerald-600'
                  }`}>
                    {plan.has_conflict ? 'CAUTION' : 'GOOD CONDITIONS'}
                  </span>
                  <ArrowRight className={`w-4 h-4 transition-colors ${
                    theme === 'light' ? 'text-slate-400 group-hover:text-slate-900' : 'text-slate-500 group-hover:text-white'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-6 rounded-2xl text-center space-y-2 border ${
            theme === 'light' 
              ? 'bg-white/80 border-slate-200 text-slate-800 shadow-sm' 
              : 'bg-white/[0.02] border-white/[0.04]'
          }`}>
            <p className={`text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>No scheduled activities for today.</p>
            <button
              onClick={() => onNavigate('plans')}
              className={`text-xs font-medium cursor-pointer inline-flex items-center gap-1 ${
                theme === 'light' ? 'text-cyan-700 hover:text-cyan-800' : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              <span>+ Add a plan to monitor weather risks</span>
            </button>
          </div>
        )}
      </section>

      {/* 14. PROGRESSIVE DISCLOSURE - Deep Meteorological Details (Collapsed by default) */}
      <section className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
          className={`w-full py-3 px-4 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer border ${
            theme === 'light' 
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200 bg-white/60' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border-white/[0.05]'
          }`}
        >
          <span>Meteorological details &amp; sensor diagnostics</span>
          {showAdvancedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvancedDetails && (
          <div className={`mt-4 p-6 rounded-2xl backdrop-blur-xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs animate-fade-in ${
            theme === 'light' 
              ? 'bg-white/90 border border-slate-200 text-slate-800 shadow-md' 
              : 'bg-slate-900/40 border border-white/[0.06] text-white'
          }`}>
            <div>
              <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Atmospheric Pressure</span>
              <strong className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {observation?.pressure_hpa ? Math.round(observation.pressure_hpa) : 1012} hPa
              </strong>
              <span className={`text-[10px] block mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Barometric normal</span>
            </div>

            <div>
              <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Dew Point</span>
              <strong className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {Math.round(tempC - (100 - humidity) / 5)}°C
              </strong>
              <span className={`text-[10px] block mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Moisture index</span>
            </div>

            <div>
              <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Optical Visibility</span>
              <strong className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {visibilityKm} km
              </strong>
              <span className={`text-[10px] block mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>IMD transmissometer</span>
            </div>

            <div>
              <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Wind Gusts</span>
              <strong className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {Math.round(windKmh * 1.35)} km/h
              </strong>
              <span className={`text-[10px] block mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Peak surface shear</span>
            </div>

            {marine && (
              <div className={`col-span-2 sm:col-span-4 pt-3 border-t flex items-center justify-between ${
                theme === 'light' ? 'border-slate-200' : 'border-white/[0.05]'
              }`}>
                <div>
                  <span className={`text-xs block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>INCOIS Coastal Observation</span>
                  <span className={`text-xs font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Wave height: {marine.wave_height_m}m · Status: {marine.safety_status}</span>
                </div>
                <button onClick={() => onNavigate('map')} className={`text-xs hover:underline ${
                  theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'
                }`}>
                  Marine map →
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Institutional Source Verification Modal / Bottom Sheet */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowSourceModal(false)}
          />
          <div className="relative z-10 w-full sm:max-w-md bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 pb-safe">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Verified Meteorological Sources
                </h3>
                <p className="text-xs text-slate-400">
                  Official Indian government observational telemetry
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSourceModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-1">
                <div className="text-cyan-400 font-semibold text-xs">India Meteorological Department (IMD)</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Ministry of Earth Sciences (MoES), Government of India. Real-time surface synoptic stations, Doppler weather radar reflectivity, and NWF ensemble forecast guidance.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-1">
                <div className="text-emerald-400 font-semibold text-xs">Central Pollution Control Board (CPCB)</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Continuous Ambient Air Quality Monitoring Stations (CAAQMS) providing verified sub-index values for PM2.5, PM10, NO2, and CO.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-1">
                <div className="text-blue-400 font-semibold text-xs">INCOIS &amp; ISRO (MOSDAC)</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Ocean state forecasts, coastal wave heights, and INSAT-3D/3DR geostationary meteorological satellite imaging products.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSourceModal(false)}
              className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
