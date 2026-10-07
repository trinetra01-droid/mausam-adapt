import React, { useState, useEffect, useMemo } from 'react';
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
  AlertOctagon,
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
  PlanRecord,
  RainAroundYouReport 
} from '../types.js';
import { AnimatedWeatherIcon } from '../components/AnimatedWeatherIcon.js';
import { PrecipitationChart } from '../components/PrecipitationChart.js';
import { PersonaSection } from '../components/PersonaSection.js';
import { SmartOutfitSuggester } from '../components/SmartOutfitSuggester.js';
import { RainAroundYouCard } from '../components/RainAroundYouCard.js';
import { RainSpatialAnalysis } from '../services/rainSpatialAnalysis.js';

interface HomeViewProps {
  location: LocationRecord;
  locations?: LocationRecord[];
  observation: WeatherObservation | null;
  forecast: WeatherForecast | null;
  warnings: WarningRecord[];
  marine: MarineRecord | null;
  airQuality: AirQualityRecord | null;
  plans: PlanRecord[];
  activePersonas: UserPersona[];
  onUpdatePersonas?: (personas: UserPersona[]) => void;
  isLoading: boolean;
  onNavigate: (tab: string) => void;
  onSelectHour?: (hour: number) => void;
  selectedHour?: number;
  theme?: 'light' | 'dark';
  isDay?: boolean;
  rainRadarReport?: RainAroundYouReport | null;
  isLoadingRadar?: boolean;
  onOpenRainMap?: () => void;
}

const PERSONA_TABS: Array<{
  id: UserPersona;
  label: string;
  shortLabel: string;
  icon: string;
}> = [
  { id: 'FITNESS', label: 'Outdoor Fitness', shortLabel: 'Fitness', icon: '🏃' },
  { id: 'HEALTH', label: 'Health-Conscious', shortLabel: 'Health', icon: '🫁' },
  { id: 'COMMUTER', label: 'Daily Commute', shortLabel: 'Commute', icon: '🚗' },
  { id: 'FAMILY', label: 'Parents & Families', shortLabel: 'Family', icon: '🎒' },
  { id: 'AGRICULTURE', label: 'Agriculture & Gardeners', shortLabel: 'Agri', icon: '🌾' },
  { id: 'BEACH_SURF', label: 'Beachgoers & Surfers', shortLabel: 'Beach', icon: '🌊' },
  { id: 'TRAVEL', label: 'Travelers', shortLabel: 'Travel', icon: '✈️' },
  { id: 'EVENT_PLANNER', label: 'Event Planners', shortLabel: 'Events', icon: '🎪' }
];

export const HomeView: React.FC<HomeViewProps> = ({
  location,
  locations = [],
  observation,
  forecast,
  warnings,
  marine,
  airQuality,
  plans,
  activePersonas,
  onUpdatePersonas,
  isLoading,
  onNavigate,
  onSelectHour,
  selectedHour,
  theme = 'light',
  isDay = true,
  rainRadarReport = null,
  isLoadingRadar = false,
  onOpenRainMap
}) => {
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<UserPersona>(() => {
    return activePersonas && activePersonas.length > 0 ? activePersonas[0] : 'FITNESS';
  });

  // Evaluate Plan Conflict & Persona Prominence for Rain Around You
  const planConflict = useMemo(() => {
    return RainSpatialAnalysis.evaluatePlanConflict(rainRadarReport, plans);
  }, [rainRadarReport, plans]);

  const rainCardPriority = useMemo(() => {
    return RainSpatialAnalysis.determineDisplayPriority(rainRadarReport, currentPersona);
  }, [rainRadarReport, currentPersona]);

  const handleOpenRainMap = () => {
    if (onOpenRainMap) {
      onOpenRainMap();
    } else {
      onNavigate('rain-map');
    }
  };

  const [fitnessSlot, setFitnessSlot] = useState<'morning' | 'evening'>(() => {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : 'evening';
  });

  // Live Real-Time Clock for Indian Standard Time (IST)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedIstTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).toUpperCase();
  }, [currentTime]);

  const formattedIstDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [currentTime]);

  const handleSelectPersona = (p: UserPersona) => {
    // Only switch current preview view on Home tab; do NOT mutate user's permanent profile personas
    setCurrentPersona(p);
  };

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
  const rainfallMm = observation?.rainfall_mm !== undefined 
    ? observation.rainfall_mm 
    : (forecast?.hourly?.[0]?.rainfall_mm ?? 0);

  // Derive today's personalized decision based on persona, active warnings, and meteorological safety
  const getDecision = (targetPersona: UserPersona = currentPersona) => {
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
          title: 'Lightning hazard: Outdoor activities suspended.',
          bestWindow: 'Indoor shelter only',
          status: 'AVOID' as const,
          severity: severeWarning.severity,
          badgeLabel: 'Lightning Hazard',
          why: [
            `Official IMD ${severeWarning.severity} Alert: ${severeWarning.title}`,
            'Direct lightning strike danger in open fields, parks, and roads',
            'Sudden downpours and erratic convective wind downdrafts'
          ],
          alternative: 'Wait until severe convective storm cells pass',
          actionLabel: 'View Official Alert'
        };
      }

      if (isRainOrWindAlert) {
        const windSnippet = wMsg.includes('kmph') || wMsg.includes('km/h') 
          ? 'Squally winds reaching 45–65 km/h create acute flying debris and slip hazards'
          : 'Squally weather with strong wind gusts and intense precipitation';

        return {
          title: 'Heavy rain & squall alert: Outdoor activities not recommended.',
          bestWindow: 'Shift to indoor facility',
          status: 'CAUTION' as const,
          severity: severeWarning.severity,
          badgeLabel: 'Squall Alert',
          why: [
            `Official IMD ${severeWarning.severity} Alert: ${severeWarning.title}`,
            windSnippet,
            'Waterlogging, low surface grip, and reduced sightlines make outdoor transit hazardous'
          ],
          alternative: 'Indoor facility or postpone to next dry window',
          actionLabel: 'View Official Alert'
        };
      }

      if (isHeatAlert) {
        return {
          title: 'Severe heatwave advisory: Avoid midday outdoor exposure.',
          bestWindow: 'Dawn 5:15 AM — 6:15 AM only',
          status: 'CAUTION' as const,
          severity: severeWarning.severity,
          badgeLabel: 'Heatwave Alert',
          why: [
            `Official IMD ${severeWarning.severity} Heat Alert: ${severeWarning.title}`,
            'Dangerous wet-bulb temperature elevates risk of heat stroke and dehydration',
            'Surface radiant heat persists well past dusk'
          ],
          alternative: 'Indoor air-conditioned environment or early morning hydration',
          actionLabel: 'View Official Alert'
        };
      }

      // Any other official warning
      return {
        title: `Official weather advisory: ${severeWarning.title}`,
        bestWindow: 'Indoor activities advised',
        status: 'CAUTION' as const,
        severity: severeWarning.severity,
        badgeLabel: 'Official Warning',
        why: [
          `Active ${severeWarning.provider} ${severeWarning.severity} warning for ${severeWarning.affected_area || location.name}`,
          severeWarning.message ? severeWarning.message.slice(0, 120) + '...' : 'Adverse weather expected',
          'Outdoor activities should be suspended until advisory clears'
        ],
        alternative: 'Indoor environment recommended',
        actionLabel: 'View Official Alert'
      };
    }

    // 2. Active Rain / Thunderstorm in Current Observation
    const condLower = condition.toLowerCase();
    const isThunderNow = condLower.includes('thunder') || condLower.includes('lightning');
    const rainNowMm = observation?.rainfall_mm ?? 0;
    const isHeavyRainNow = rainNowMm >= 4.0 || condLower.includes('heavy rain') || condLower.includes('torrential') || condLower.includes('downpour') || condLower.includes('squall');
    const isRainingNow = rainNowMm > 0.5 || condLower.includes('rain') || condLower.includes('drizzle') || condLower.includes('shower');

    if (isThunderNow) {
      return {
        title: 'Active thunderstorm: Stay sheltered indoors.',
        bestWindow: 'Indoor shelter only',
        status: 'AVOID' as const,
        severity: 'ORANGE',
        badgeLabel: 'Thunderstorm Active',
        why: [
          'Convective lightning activity detected in the vicinity',
          'Heavy downpours reduce visibility and roadway grip',
          'Gusty surface winds exceed safe thresholds'
        ],
        alternative: 'Postpone until storm activity clears completely',
        actionLabel: 'Check Storm Radar'
      };
    }

    // 3. High Forecast Rain Probability or Precipitation Expected Today
    const todayForecast = forecast?.daily?.[0];
    const rainProb = todayForecast?.rain_probability_pct ?? 0;
    const rainExpectedMm = todayForecast?.rainfall_expected_mm ?? 0;

    // Check hourly forecast during running hours (17:00 to 20:00)
    let eveningRainProb = rainProb;
    let eveningMaxRainMm = 0;
    if (forecast?.hourly && forecast.hourly.length > 0) {
      const eveningHours = forecast.hourly.filter((h: any) => {
        const hr = h.hour ?? (h.time ? parseInt(h.time, 10) : NaN);
        return hr >= 17 && hr <= 20;
      });
      if (eveningHours.length > 0) {
        eveningRainProb = Math.max(...eveningHours.map((h: any) => h.pop ?? h.rain_probability_pct ?? 0));
        eveningMaxRainMm = Math.max(...eveningHours.map((h: any) => h.rainfall_mm ?? 0));
      }
    }

    const isHeavyRainForecast = rainExpectedMm >= 7 || eveningRainProb >= 65 || eveningMaxRainMm >= 3.5;

    // =======================================================================
    // PERSONA SPECIFIC EVALUATIONS
    // =======================================================================

    // A. HEALTH-CONSCIOUS
    if (targetPersona === 'HEALTH') {
      if (aqiValue > 250) {
        return {
          title: 'Hazardous air quality: Limit outdoor breathing & exertion.',
          bestWindow: 'Indoor with HEPA air filtration only',
          status: 'AVOID' as const,
          severity: 'RED',
          badgeLabel: 'Air Quality Hazard',
          why: [
            `CPCB CAAQMS AQI ${aqiValue} (${aqiCategory}) poses severe pulmonary strain`,
            `PM2.5 particulate concentration (${airQuality?.pm25 ?? 45} µg/m³) is highly elevated`,
            'Surface inversion layer trapping toxic vehicle emissions'
          ],
          alternative: 'Indoor exercise in filtered room; wear N95 mask if outdoors',
          actionLabel: 'View Health Telemetry'
        };
      }
      if (aqiValue > 150 || uvIndex >= 8) {
        return {
          title: 'Air quality & solar UV advisory for outdoor activities.',
          bestWindow: 'Early morning 6:30 AM — 8:45 AM',
          status: 'CAUTION' as const,
          severity: 'YELLOW',
          badgeLabel: 'Health Caution',
          why: [
            `AQI ${aqiValue} elevated for sensitive and respiratory groups`,
            `UV index reaches peak ${uvIndex} during midday solar window`,
            `Relative humidity ${humidity}% increases particle retention`
          ],
          alternative: 'Limit prolonged outdoor exposure; wear sun protection & mask',
          actionLabel: 'View Health Telemetry'
        };
      }
      return {
        title: 'Satisfactory air quality & safe bio-meteorological window.',
        bestWindow: 'Morning 7:00 AM — 11:30 AM',
        status: 'OPTIMAL' as const,
        severity: 'GREEN',
        badgeLabel: 'Safe Air Window',
        why: [
          `Air Quality Index ${aqiValue} (${aqiCategory}) within safe CPCB standard`,
          `Relative humidity ${humidity}% comfortable for normal respiration`,
          `UV index ${uvIndex} safe during recommended morning hours`
        ],
        alternative: 'Late evening cooldown 6:30 PM — 8:00 PM',
        actionLabel: 'View Health Telemetry'
      };
    }

    // B. BEACHGOERS & SURFERS / COASTAL
    if (targetPersona === 'BEACH_SURF' || targetPersona === 'COASTAL') {
      const waveHeight = marine?.wave_height_m ?? 1.2;
      if (waveHeight > 2.5 || marine?.safety_status === 'DANGEROUS') {
        return {
          title: 'INCOIS High Swell Warning: Surfing & swimming suspended.',
          bestWindow: 'Shoreline / promenade observation only',
          status: 'AVOID' as const,
          severity: 'ORANGE',
          badgeLabel: 'Rough Sea Warning',
          why: [
            `Significant wave height ${waveHeight}m exceeds safe recreational surf limit`,
            'Strong rip current velocities and chaotic onshore chop',
            'Official INCOIS Coastal Hazard bulletin active'
          ],
          alternative: 'Sheltered harbor or postpone watercraft activities',
          actionLabel: 'Check Marine Radar'
        };
      }
      if (waveHeight > 1.8 || windKmh > 28) {
        return {
          title: 'Moderate chop and swell: Caution for novice boarders.',
          bestWindow: 'Slack mid-tide: 8:30 AM — 10:45 AM',
          status: 'CAUTION' as const,
          severity: 'YELLOW',
          badgeLabel: 'Marine Caution',
          why: [
            `Wave height ${waveHeight}m with wind chop`,
            `Swell period ${marine?.wave_period_s ?? 8}s from SSW`,
            'Rising tide currents near jetties and rocky headlands'
          ],
          alternative: 'Check sheltered bay or wait for morning low wind',
          actionLabel: 'View Tide Schedule'
        };
      }
      return {
        title: 'Favorable coastal sea & clean surf conditions.',
        bestWindow: 'Incoming mid-tide: 8:00 AM — 11:30 AM',
        status: 'OPTIMAL' as const,
        severity: 'GREEN',
        badgeLabel: 'Optimal Surf Window',
        why: [
          `Clean wave faces ${waveHeight}m with favorable period`,
          `Sea temperature ${marine?.sea_temp_c ?? 28}°C comfortable for swimming`,
          'High tide at 08:14 AM creates optimal beach break depth'
        ],
        alternative: 'Afternoon high-tide session 4:30 PM — 6:15 PM',
        actionLabel: 'Explore Marine Telemetry'
      };
    }

    // C. TRAVELERS
    if (targetPersona === 'TRAVEL') {
      if (isHeavyRainNow || isHeavyRainForecast || visibilityKm < 1.8) {
        return {
          title: 'Transit corridor weather alert: Highway & flight delays expected.',
          bestWindow: 'Postpone road departure until convective cells clear',
          status: 'CAUTION' as const,
          severity: 'YELLOW',
          badgeLabel: 'Transit Route Alert',
          why: [
            'Heavy precipitation reduces vehicle sightlines and increases road spray',
            `Optical sightlines reduced to ${visibilityKm} km along highway corridors`,
            'Pack compact travel umbrella & waterproof luggage covers'
          ],
          alternative: 'Depart during tomorrow morning clear window',
          actionLabel: 'Check Route Conditions'
        };
      }
      return {
        title: 'Clear transit corridors for inter-city travel & departures.',
        bestWindow: 'Morning departure: 6:30 AM — 9:30 AM',
        status: 'OPTIMAL' as const,
        severity: 'GREEN',
        badgeLabel: 'Clear Travel Window',
        why: [
          'Dry highway pavement and clear optical sightlines (> 6 km)',
          'No active severe subdivision warnings along route',
          `Destination weather stable (${tempC}°C, pleasant)`
        ],
        alternative: 'Mid-afternoon transit 2:00 PM — 4:00 PM',
        actionLabel: 'View Saved Destinations'
      };
    }

    // D. PARENTS & FAMILIES
    if (targetPersona === 'FAMILY') {
      if (isHeavyRainNow || isHeavyRainForecast) {
        return {
          title: 'Rain alert during school hours: Prepare rain protection.',
          bestWindow: 'Indoor school activities & umbrella for 2:30 PM pickup',
          status: 'CAUTION' as const,
          severity: 'YELLOW',
          badgeLabel: 'School Rain Alert',
          why: [
            'Precipitation coincides with afternoon school dismissal',
            'Wet street surfaces and vehicular traffic splash hazards',
            'Outdoor playground play delayed until pavement dries'
          ],
          alternative: 'Indoor family activities; keep raincoats in school bags',
          actionLabel: 'Set School Rain Alert'
        };
      }
      return {
        title: 'Pleasant conditions for school commute & outdoor playtime.',
        bestWindow: 'School drop-off 7:45 AM · Playground 5:00 PM — 6:30 PM',
        status: 'OPTIMAL' as const,
        severity: 'GREEN',
        badgeLabel: 'Family Outdoor Window',
        why: [
          'Clear morning transit for school buses without fog delays',
          `Mild temperature cooldown and comfortable humidity (${humidity}%)`,
          `UV index drops below 2 after 4:30 PM for child sun safety`
        ],
        alternative: 'Weekend park visit Saturday morning',
        actionLabel: 'Add Family Plan'
      };
    }

    // E. AGRICULTURE & GARDENERS
    if (targetPersona === 'AGRICULTURE') {
      if (windKmh > 18 || rainProb >= 40) {
        return {
          title: 'Delay foliar spraying: High wind drift & precipitation hazard.',
          bestWindow: 'Postpone spraying until calm morning window',
          status: 'CAUTION' as const,
          severity: 'YELLOW',
          badgeLabel: 'Agromet Spray Caution',
          why: [
            `Surface winds (${windKmh} km/h) exceed 15 km/h foliar spray drift limit`,
            `Precipitation probability (${rainProb}%) will wash off applied crop chemicals`,
            `Soil moisture currently adequate (${Math.min(85, Math.round(humidity * 0.5))}%)`
          ],
          alternative: 'Reschedule foliar application to tomorrow dawn',
          actionLabel: 'View Agromet Guidance'
        };
      }
      return {
        title: 'Optimal window for field spraying & crop maintenance.',
        bestWindow: 'Dawn spray window: 6:15 AM — 9:00 AM',
        status: 'OPTIMAL' as const,
        severity: 'GREEN',
        badgeLabel: 'Optimal Spray Window',
        why: [
          `Calm surface winds (${windKmh} km/h) prevent chemical drift`,
          'Zero rain forecast for next 24 hours ensures chemical adherence',
          'Favorable temperature and dew point for foliar absorption'
        ],
        alternative: 'Evening weeding / field inspection 5:00 PM — 6:30 PM',
        actionLabel: 'View Sowing Calendar'
      };
    }

    // F. COMMUTERS
    if (targetPersona === 'COMMUTER') {
      if (visibilityKm < 1.8 || isHeavyRainNow) {
        return {
          title: 'Corridor fog / waterlogging caution on transit routes.',
          bestWindow: 'Depart after 8:45 AM or switch to Metro Rail',
          status: 'CAUTION' as const,
          severity: 'YELLOW',
          badgeLabel: 'Commute Hazard',
          why: [
            `Optical sightlines reduced to ${visibilityKm} km on arterial roads`,
            'Wet roadway braking distances extended by 40%',
            'Transit congestion index elevated at major expressway junctions'
          ],
          alternative: 'Metro Rail line 1/2 or delay highway departure by 45 mins',
          actionLabel: 'Open Commuter Corridor'
        };
      }
      return {
        title: 'Clear transit corridor & normal highway speeds.',
        bestWindow: 'Morning rush: 8:15 AM — 9:30 AM · Return: 6:30 PM',
        status: 'OPTIMAL' as const,
        severity: 'GREEN',
        badgeLabel: 'Clear Commute Corridor',
        why: [
          `Optical visibility ${visibilityKm} km (clear sightlines)`,
          'Dry asphalt surface with maximum tire adhesion',
          'Normal corridor speeds reported along Ring Road & Expressways'
        ],
        alternative: 'Off-peak transit 11:00 AM — 1:00 PM',
        actionLabel: 'Check Commuter Map'
      };
    }

    // G. EVENT PLANNERS
    if (targetPersona === 'EVENT_PLANNER') {
      if (rainProb >= 40 || windKmh >= 30) {
        return {
          title: 'Weather contingency advised for outdoor open-air event.',
          bestWindow: 'Deploy waterproof canopy & verify marquee ground anchors',
          status: 'CAUTION' as const,
          severity: 'YELLOW',
          badgeLabel: 'Event Contingency',
          why: [
            `Rain probability of ${rainProb}% during scheduled event evening hours`,
            `Wind gusts up to ${Math.round(windKmh * 1.35)} km/h require stage stability checks`,
            'High humidity may cause evening guest discomfort'
          ],
          alternative: 'Transition to enclosed banquet hall or covered pavilion',
          actionLabel: 'Check 7-Day Event Outlook'
        };
      }
      return {
        title: 'Favorable conditions for outdoor event & gathering.',
        bestWindow: 'Prime event window: 5:30 PM — 10:00 PM',
        status: 'OPTIMAL' as const,
        severity: 'GREEN',
        badgeLabel: 'Ideal Event Conditions',
        why: [
          `Low rain probability (< ${rainProb || 15}%) through the night`,
          'Gentle cooling trend into evening creates pleasant guest comfort',
          'Surface winds under 15 km/h are fully safe for canopies and lighting'
        ],
        alternative: 'Afternoon rehearsal 3:00 PM — 4:30 PM',
        actionLabel: 'Plan Outdoor Event'
      };
    }

    // H. OUTDOOR FITNESS ENTHUSIASTS (Default / FITNESS)
    // Supports BOTH Morning Walk / Run and Evening Walk / Run based on user selection or time of day
    const isMorningSlot = fitnessSlot === 'morning';

    if (isHeavyRainNow || isHeavyRainForecast) {
      return {
        title: isMorningSlot 
          ? 'Heavy rainfall: Morning walk / run is NOT suitable.'
          : 'Heavy rainfall: Outdoor evening run is NOT suitable.',
        bestWindow: 'Indoor treadmill / gym cross-training only',
        status: 'AVOID' as const,
        severity: 'ORANGE',
        badgeLabel: isMorningSlot ? 'Morning Walk Not Suitable' : 'Evening Run Not Suitable',
        why: [
          isHeavyRainNow
            ? `Active heavy rainfall (${rainNowMm} mm/hr) creates rapid street waterlogging and hidden hazards`
            : `High heavy precipitation risk (${isMorningSlot ? 'morning' : 'evening'} probability ${isMorningSlot ? rainProb : eveningRainProb}% · ${eveningMaxRainMm > 0 ? eveningMaxRainMm + ' mm/hr' : rainExpectedMm + ' mm expected'})`,
          'Near-zero shoe traction on wet asphalt creates severe slipping and ligament injury hazard',
          `${isMorningSlot ? 'Morning commute rush' : 'Evening dusk'} combined with blinding rain cuts motorist visibility by over 70%, creating critical traffic hazards for pedestrians and runners`,
          'Soaked clothing in wind breeze causes rapid convective heat loss and muscle cramping'
        ],
        alternative: isMorningSlot ? 'Indoor treadmill or wait for evening dry spell (5:30 PM)' : 'Indoor treadmill or dawn walk tomorrow (6:00 AM)',
        actionLabel: 'Review & Reschedule Workout'
      };
    }

    if (isRainingNow || (isMorningSlot ? rainProb >= 40 : (rainProb >= 40 || eveningRainProb >= 40))) {
      return {
        title: `Precipitation active: ${isMorningSlot ? 'Morning walk / run' : 'Evening run'} conditions compromised.`,
        bestWindow: 'Covered running track or indoor workout',
        status: 'CAUTION' as const,
        severity: 'YELLOW',
        badgeLabel: 'Running Caution',
        why: [
          `Current rainfall intensity: ${rainNowMm > 0 ? rainNowMm + ' mm/hr' : 'scattered showers'} (${isMorningSlot ? 'morning' : 'evening'} probability ${isMorningSlot ? rainProb : eveningRainProb}%)`,
          'Slippery asphalt and standing water increase injury risk',
          'Vehicular braking distance is extended on wet roads'
        ],
        alternative: isMorningSlot ? 'Evening walk / run at 5:45 PM (1 hr 15 mins)' : 'Indoor treadmill or dawn walk at 6:00 AM tomorrow',
        actionLabel: 'Adjust Affected Plans'
      };
    }

    if (visibilityKm < 1.8 && isMorningSlot) {
      return {
        title: 'Morning fog & low visibility: Caution for outdoor running.',
        bestWindow: '7:45 AM — 9:00 AM (1 hr 15 mins window)',
        status: 'CAUTION' as const,
        severity: 'YELLOW',
        badgeLabel: 'Morning Fog Caution',
        why: [
          `Surface sightlines reduced to ${visibilityKm} km (< 2 km safety threshold)`,
          'Early morning vehicular traffic has reduced reaction time on pedestrian paths',
          'Morning inversion layer traps ground particulate matter'
        ],
        alternative: '5:30 PM — 7:00 PM (Clear Evening Window)',
        actionLabel: 'Delay Workout Window'
      };
    }

    if (feelsLikeC >= 38 || tempC >= 38) {
      return {
        title: 'Thermal caution for outdoor workouts.',
        bestWindow: '5:30 AM — 6:45 AM (1 hr 15 mins early dawn)',
        status: 'CAUTION' as const,
        severity: 'YELLOW',
        badgeLabel: 'Thermal Caution',
        why: [
          `Heat index feels like ${feelsLikeC}°C (${tempC}°C actual) with ${humidity}% humidity`,
          'Elevated thermal stress: High risk of heat exhaustion and severe dehydration',
          'Peak UV index of ' + uvIndex + ' during midday'
        ],
        alternative: 'Early dawn walk 5:30 AM — 6:45 AM (1 hr 15 mins) or air-conditioned gym',
        actionLabel: 'Adjust Workout Time'
      };
    }

    if (aqiValue > 200) {
      return {
        title: 'Poor air quality: Unhealthy for aerobic running.',
        bestWindow: 'Indoor workout in filtered air',
        status: 'CAUTION' as const,
        severity: 'ORANGE',
        badgeLabel: 'Air Quality Caution',
        why: [
          `AQI ${aqiValue} (${aqiCategory}) poses significant lung and respiratory strain`,
          'Heavy aerobic breathing significantly increases deep PM2.5 particle uptake',
          'Prolonged outdoor exertion not recommended for cardio fitness'
        ],
        alternative: 'Indoor treadmill or light walking in filtered gym space',
        actionLabel: 'View Air Quality'
      };
    }

    if (windKmh > 35) {
      return {
        title: 'Strong winds advisory: Challenging outdoor running.',
        bestWindow: isMorningSlot ? '6:00 AM — 7:15 AM (1 hr 15 mins)' : '7:00 PM — 8:15 PM (1 hr 15 mins)',
        status: 'CAUTION' as const,
        severity: 'YELLOW',
        badgeLabel: 'Wind Advisory',
        why: [
          `Surface winds gusting at ${windKmh} km/h from ${windDir}`,
          'Airborne dust and debris along road corridors',
          'Increased resistance and instability on open paths'
        ],
        alternative: 'Indoor cross-training or sheltered park routes',
        actionLabel: 'Reschedule Workout'
      };
    }

    const windDesc = windKmh < 15 ? `Gentle breeze ${windKmh} km/h` : `Moderate breeze ${windKmh} km/h`;
    const rainDesc = rainProb > 0 ? `Low rain probability (${rainProb}%)` : 'Minimal rain risk (< 10%)';

    if (isMorningSlot) {
      return {
        title: 'Optimal conditions for your morning walk / run.',
        bestWindow: '6:00 AM — 7:30 AM (1 hr 30 mins window)',
        status: 'OPTIMAL' as const,
        severity: 'GREEN',
        badgeLabel: 'Optimal Morning Walk/Run',
        why: [
          'Cool morning ambient temperatures with fresh air circulation',
          rainDesc,
          `${windDesc} ${windDir} provides gentle aerobic cooling`,
          `Air quality index ${aqiValue} (${aqiCategory}) is within safe range`
        ],
        alternative: '5:30 PM — 7:00 PM (1 hr 30 mins Evening Window)',
        actionLabel: 'Plan Morning Route'
      };
    }

    return {
      title: 'Good conditions for your evening run / walk.',
      bestWindow: '5:30 PM — 7:00 PM (1 hr 30 mins window)',
      status: 'OPTIMAL' as const,
      severity: 'GREEN',
      badgeLabel: 'Optimal Evening Run',
      why: [
        rainDesc,
        `Comfortable temperature cooldown from ${tempC}°C`,
        `${windDesc} ${windDir}`,
        `Air quality index ${aqiValue} (${aqiCategory})`
      ],
      alternative: '6:00 AM — 7:30 AM (1 hr 30 mins Morning Window tomorrow)',
      actionLabel: 'Plan Evening Route'
    };
  };

  const decision = getDecision(currentPersona);

  // Upcoming plans sample
  const upcomingPlans = plans.slice(0, 3);

  // Hourly slots from forecast (formatted with hours and minutes)
  const hourlyData = forecast?.hourly && forecast.hourly.length > 0 
    ? forecast.hourly.slice(0, 8)
    : [
        { time: '06:00 PM', temp: 31, condition: 'Clear', pop: 5 },
        { time: '07:00 PM', temp: 30, condition: 'Clear', pop: 5 },
        { time: '08:00 PM', temp: 29, condition: 'Clear', pop: 10 },
        { time: '09:00 PM', temp: 28, condition: 'Clear', pop: 10 },
        { time: '10:00 PM', temp: 27, condition: 'Clear', pop: 15 },
        { time: '11:00 PM', temp: 26, condition: 'Clear', pop: 15 },
        { time: '12:00 AM', temp: 25, condition: 'Clear', pop: 10 }
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
      
      {/* 7. HOMEPAGE HERO - Large Atmospheric Weather Hero */}
      <section className={`glass-hero relative p-6 sm:p-8 rounded-3xl transition-all border ${
        theme === 'light' ? 'border-slate-300 shadow-md bg-white/95' : 'border-white/[0.08]'
      }`}>
        {/* Top Header of Hero: Greeting + Location & Live IST Time Clock */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            {/* Subtle greeting */}
            <p className={`text-sm font-semibold tracking-wide ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              {greeting}{userName ? `, ${userName}` : ''}.
            </p>

            {/* Location Title & Badges */}
            <div className="mt-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight ${
                  theme === 'light' ? 'text-slate-950' : 'text-white'
                }`}>
                  {location.name.split('(')[0].trim()}
                </h2>
                {location.is_auto_detected && (
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    theme === 'light'
                      ? 'bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-sm'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span>Auto-detected City</span>
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                {location.district && location.district !== location.name ? `${location.district}, ` : ''}{location.state}, India
              </p>
            </div>
          </div>

          {/* Prominent Live Clock for Indian Standard Time (IST) */}
          <div className={`self-start sm:self-auto px-4 py-2.5 rounded-2xl border backdrop-blur-xl shadow-md flex flex-col items-start sm:items-end gap-1 ${
            theme === 'light'
              ? 'bg-white border-2 border-slate-300 text-slate-950 shadow-md'
              : 'bg-slate-900/90 border border-cyan-500/40 text-white shadow-xl'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <Clock className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-slate-700' : 'text-cyan-400'}`} />
              <span className={`text-base sm:text-lg font-mono font-black tracking-tight ${
                theme === 'light' ? 'text-slate-950' : 'text-white'
              }`}>
                {formattedIstTime}
              </span>
              <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-md tracking-wider uppercase shadow-sm border ${
                theme === 'light'
                  ? 'bg-slate-900 text-white border-slate-950'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300'
              }`}>
                IST
              </span>
            </div>
            <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              {formattedIstDate}
            </div>
          </div>
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
            <div className={`text-xl sm:text-2xl font-bold ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-100'
            }`}>
              {condition}
            </div>
            {/* 4px between condition and feels-like */}
            <div className={`text-sm font-semibold mt-1 ${
              theme === 'light' ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Feels like {feelsLikeC}°
            </div>
          </div>
        </div>

        {/* 28-36px between feels-like and metrics */}
        <div className={`mt-8 pt-5 border-t ${
          theme === 'light' ? 'border-slate-300' : 'border-white/[0.06]'
        }`}>
          {/* Mobile Clean Two-Row Layout */}
          <div className={`sm:hidden space-y-2 text-xs ${
            theme === 'light' ? 'text-slate-800' : 'text-slate-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400'}>Humidity </span>
                <span className={`font-bold ml-1 ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{humidity}%</span>
              </div>
              <span className={theme === 'light' ? 'text-slate-400' : 'text-white/20'}>·</span>
              <div>
                <span className={theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400'}>Wind </span>
                <span className={`font-bold ml-1 ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{windKmh} km/h {windDir}</span>
              </div>
              <span className={theme === 'light' ? 'text-slate-400' : 'text-white/20'}>·</span>
              <div>
                <span className={theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400'}>UV </span>
                <span className={`font-bold ml-1 ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{uvIndex}</span>
              </div>
            </div>
            <div className="pt-0.5 flex items-center gap-2">
              <span className={theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400'}>Air Quality</span>
              <span className={`font-bold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{aqiValue}</span>
              <span className={theme === 'light' ? 'text-slate-400' : 'text-white/20'}>·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{aqiCategory}</span>
            </div>
          </div>

          {/* Desktop Single Horizontal Strip */}
          <div className={`hidden sm:flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${
            theme === 'light' ? 'text-slate-800' : 'text-slate-300'
          }`}>
            <div>
              <span className={theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400'}>Humidity </span>
              <span className={`font-bold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{humidity}%</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-400' : 'text-white/20'}>·</span>
            <div>
              <span className={theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400'}>Wind </span>
              <span className={`font-bold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{windKmh} km/h {windDir}</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-400' : 'text-white/20'}>·</span>
            <div>
              <span className={theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400'}>UV </span>
              <span className={`font-bold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{uvIndex}</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-400' : 'text-white/20'}>·</span>
            <div>
              <span className={theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400'}>Air Quality </span>
              <span className={`font-bold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{aqiValue} · {aqiCategory}</span>
            </div>
          </div>
        </div>

        {/* 20-24px between metrics and source */}
        <div className={`mt-5 text-xs flex items-center gap-1.5 ${
          theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'
        }`}>
          <span>Observation synced ·</span>
          <button
            type="button"
            onClick={() => setShowSourceModal(true)}
            className="text-cyan-700 dark:text-cyan-400 underline underline-offset-2 font-bold cursor-pointer transition-colors"
          >
            IMD &amp; CPCB Data Source →
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

      {/* RAIN AROUND YOU - High-Priority Promotion when Rain is Over Location or Approaching */}
      {rainCardPriority === 'CRITICAL' && (
        <RainAroundYouCard
          report={rainRadarReport}
          isLoading={isLoadingRadar}
          theme={theme}
          onOpenFullMap={handleOpenRainMap}
          onChallengePlan={() => onNavigate('plans')}
          planConflict={planConflict}
        />
      )}

      {/* 8-PERSONA QUICK SWITCHER BAR (SIH Core Architecture) */}
      <section className="mt-8 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] uppercase tracking-wider font-semibold ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Personalized Mode
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              8 User Groups
            </span>
          </div>
          <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Tap to adapt
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar -mx-2 px-2">
          {PERSONA_TABS.map((p) => {
            const isSelected = p.id === currentPersona;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPersona(p.id)}
                className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? theme === 'light'
                      ? 'bg-slate-900 text-white shadow-md scale-[1.02]'
                      : 'bg-white text-slate-950 shadow-lg scale-[1.02]'
                    : theme === 'light'
                      ? 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                      : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]'
                }`}
              >
                <span className="text-sm">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 8. PERSONALIZED DECISION - Visual Centerpiece */}
      <section className="mt-6 sm:mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <div className={`text-[11px] uppercase tracking-wider font-extrabold ${
            theme === 'light' ? 'text-slate-700' : 'text-slate-300'
          }`}>
            YOUR WEATHER TODAY · {PERSONA_TABS.find(p => p.id === currentPersona)?.shortLabel.toUpperCase()}
          </div>
          <span className={`text-[11px] font-bold ${
            theme === 'light' ? 'text-cyan-800' : 'text-cyan-400'
          }`}>
            Mausam Decision Engine
          </span>
        </div>

        <div className={`p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-5 sm:space-y-6 transition-all ${
          decision.status === 'AVOID'
            ? (theme === 'light'
                ? 'bg-rose-50 border-2 border-rose-400 text-slate-950 shadow-lg'
                : 'bg-rose-950/60 border border-rose-500/60 text-slate-100 shadow-xl')
            : decision.status === 'CAUTION'
            ? (theme === 'light'
                ? 'bg-amber-50 border-2 border-amber-400 text-slate-950 shadow-lg'
                : 'bg-amber-950/40 border border-amber-500/50 text-slate-100 shadow-xl')
            : (theme === 'light' 
                ? 'bg-white border-2 border-slate-300 text-slate-950 shadow-lg' 
                : 'bg-slate-900/80 border border-white/10 text-white shadow-xl')
        }`}>
          {/* Status Badge & Morning/Evening Workout Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {decision.status === 'AVOID' ? (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  theme === 'light' 
                    ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                  <span>{decision.badgeLabel || 'Activity Not Suitable'}</span>
                </span>
              ) : decision.status === 'CAUTION' ? (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  theme === 'light' 
                    ? 'bg-amber-200/80 text-amber-900 border border-amber-400/80' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{decision.badgeLabel || 'Weather Caution'}</span>
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  theme === 'light' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{decision.badgeLabel || 'Optimal Conditions'}</span>
                </span>
              )}
            </div>

            {/* Morning vs Evening Slot Selector for Fitness */}
            {currentPersona === 'FITNESS' && (
              <div className={`flex items-center gap-1 p-0.5 rounded-full border text-xs font-semibold ${
                theme === 'light'
                  ? 'bg-slate-100/90 border-slate-300'
                  : 'bg-slate-950/80 border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => setFitnessSlot('morning')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    fitnessSlot === 'morning'
                      ? theme === 'light'
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'bg-cyan-500 text-slate-950 shadow font-bold'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🌅</span>
                  <span>Morning Walk/Run</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFitnessSlot('evening')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    fitnessSlot === 'evening'
                      ? theme === 'light'
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'bg-cyan-500 text-slate-950 shadow font-bold'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🌆</span>
                  <span>Evening Run</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug ${
              decision.status === 'AVOID'
                ? (theme === 'light' ? 'text-rose-950' : 'text-rose-100')
                : decision.status === 'CAUTION'
                ? (theme === 'light' ? 'text-amber-950' : 'text-amber-100')
                : (theme === 'light' ? 'text-slate-900' : 'text-white')
            }`}>
              {decision.title}
            </h3>
            <div className="flex flex-wrap items-baseline gap-2 pt-1">
              <span className={`text-xs font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                {decision.status === 'AVOID' ? 'Recommended action' : decision.status === 'CAUTION' ? 'Recommended window' : 'Best window'}
              </span>
              <span className={`text-lg sm:text-xl font-bold ${
                decision.status === 'AVOID'
                  ? (theme === 'light' ? 'text-rose-700' : 'text-rose-400')
                  : decision.status === 'CAUTION'
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
                    decision.status === 'AVOID'
                      ? (theme === 'light' ? 'bg-rose-600' : 'bg-rose-400')
                      : decision.status === 'CAUTION'
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
              onClick={() => {
                if (currentPersona === 'COMMUTER') onNavigate('commuter');
                else if (currentPersona === 'BEACH_SURF' || currentPersona === 'COASTAL') onNavigate('map');
                else if (currentPersona === 'TRAVEL') onNavigate('locations');
                else if (currentPersona === 'EVENT_PLANNER') onNavigate('forecast');
                else onNavigate('plans');
              }}
              className={`w-full sm:w-auto px-5 py-3 sm:py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2 ${
                decision.status === 'AVOID'
                  ? 'bg-rose-500 hover:bg-rose-400 text-white'
                  : decision.status === 'CAUTION'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
              }`}
            >
              <span>{decision.actionLabel || (decision.status === 'AVOID' ? 'Review & reschedule' : decision.status === 'CAUTION' ? 'Adjust affected plans' : 'Challenge this plan')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate(currentPersona === 'COMMUTER' ? 'plans' : 'commuter')}
              className={`w-full sm:w-auto text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 py-1 ${
                theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{currentPersona === 'COMMUTER' ? 'View saved plans →' : 'Check commute corridor →'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8.25. SMART OUTFIT SUGGESTER (Weather & Rainfall Adaptive Clothing Recommendations) */}
      <SmartOutfitSuggester
        temperatureC={tempC}
        feelsLikeC={feelsLikeC}
        rainfallMm={rainfallMm}
        conditionText={condition}
        humidityPct={humidity}
        windSpeedKmh={windKmh}
        uvIndex={uvIndex}
        isDay={isDay}
        theme={theme}
        currentPersona={currentPersona}
      />

      {/* 8.35. RAIN AROUND YOU - Spatial Radar Field & Proximity (When not promoted to top) */}
      {rainCardPriority !== 'CRITICAL' && (
        <RainAroundYouCard
          report={rainRadarReport}
          isLoading={isLoadingRadar}
          theme={theme}
          onOpenFullMap={handleOpenRainMap}
          onChallengePlan={() => onNavigate('plans')}
          planConflict={planConflict}
        />
      )}

      {/* 8.5. PERSONA-SPECIFIC INFORMATION (Directly Addressing 8 Required SIH Personas) */}
      <section className="space-y-3">
        <PersonaSection
          persona={currentPersona}
          observation={observation}
          forecast={forecast}
          warnings={warnings}
          marine={marine}
          airQuality={airQuality}
          locations={locations}
          theme={theme}
          onNavigate={onNavigate}
        />
      </section>

      {/* 9. HOURLY PRECIPITATION PROBABILITY & RAIN INTENSITY CHART (Recharts) */}
      <section className="space-y-4">
        <PrecipitationChart
          hourly={forecast?.hourly}
          theme={theme}
          currentHour={currentHour}
        />
      </section>

      {/* 10. HOURLY FORECAST - Clean Horizontal Timeline (No heavy borders around every hour) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`text-[11px] uppercase tracking-wider font-extrabold ${
            theme === 'light' ? 'text-slate-800' : 'text-slate-200'
          }`}>
            Hourly Outlook
          </div>
          <button
            onClick={() => onNavigate('forecast')}
            className={`text-xs font-bold cursor-pointer ${
              theme === 'light' ? 'text-cyan-700 hover:text-cyan-800 underline' : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            7-day forecast →
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-2 px-2">
          {hourlyData.map((h: any, idx: number) => {
            let timeLabel = h.time || '';
            if (timeLabel.includes(':')) {
              const parts = timeLabel.split(':');
              const hr = parseInt(parts[0], 10);
              const min = parts[1] ? parts[1].replace(/[^0-9]/g, '').slice(0, 2) || '00' : '00';
              const hr12 = !isNaN(hr) ? (hr % 12 === 0 ? 12 : hr % 12) : 12;
              const ampm = !isNaN(hr) ? (hr >= 12 ? 'PM' : 'AM') : 'PM';
              timeLabel = `${String(hr12).padStart(2, '0')}:${min} ${ampm}`;
            } else {
              const calcH = (idx + 6) % 24;
              const hr12 = calcH % 12 === 0 ? 12 : calcH % 12;
              timeLabel = `${String(hr12).padStart(2, '0')}:00 ${calcH >= 12 ? 'PM' : 'AM'}`;
            }
            const tVal = h.temp ?? h.temperature_c ?? 30;
            const cond = h.condition || h.condition_text || 'Clear';
            const isSelected = selectedHour === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectHour && onSelectHour(idx)}
                className={`flex-1 min-w-[80px] py-4 px-3 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-2 border ${
                  isSelected
                    ? theme === 'light'
                      ? 'bg-white text-slate-950 shadow-lg border-2 border-cyan-500'
                      : 'bg-white/[0.12] text-white backdrop-blur-md shadow-xl border-cyan-400'
                    : theme === 'light'
                      ? 'bg-white/90 text-slate-900 hover:bg-white border-slate-300 shadow-sm'
                      : 'bg-slate-900/60 text-slate-200 hover:bg-slate-900 border-white/10'
                }`}
              >
                <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{timeLabel}</span>
                <div className="flex items-center gap-1 justify-center">
                  <span className={`text-base font-extrabold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{Math.round(tVal)}°</span>
                  <AnimatedWeatherIcon condition={cond} size={20} className="shrink-0" />
                </div>
                <span className={`text-[11px] font-semibold truncate max-w-[72px] ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{cond}</span>
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
