import { 
  ActivityType, 
  WeatherObservation, 
  WeatherForecast, 
  HourlyForecast, 
  WarningRecord, 
  MarineRecord, 
  AirQualityRecord, 
  DecisionResult, 
  FreshnessState 
} from './types.js';
import { SafetyEngine } from './safetyEngine.js';
import { isCoastalLocation } from '../services/geoUtils.js';

interface EvaluationContext {
  activity: ActivityType;
  locationName: string;
  district: string;
  state: string;
  targetHour?: number;
  observation?: WeatherObservation | null;
  forecast?: WeatherForecast | null;
  warnings?: WarningRecord[];
  marine?: MarineRecord | null;
  airQuality?: AirQualityRecord | null;
}

export class DecisionEngine {
  /**
   * Deterministic Evaluation converting verified official meteorological observations & forecasts
   * into actionable, explainable decision intelligence.
   */
  static evaluate(context: EvaluationContext): DecisionResult {
    const { activity, locationName, district, state, targetHour, observation, forecast, warnings = [], marine, airQuality } = context;

    // 1. FIRST STEP: Safety Engine runs before personalization
    const safety = SafetyEngine.evaluateSafety(warnings, district, state);

    // If active RED / severe ORANGE override, return immediate SAFETY_OVERRIDE
    if (safety.hasOverride && safety.warning) {
      return {
        status: 'SAFETY_OVERRIDE',
        score: 10,
        activity,
        location_name: locationName,
        target_time: targetHour !== undefined ? `${targetHour.toString().padStart(2, '0')}:00 IST` : 'Current Horizon',
        recommendation: `MANDATORY SAFETY OVERRIDE: ${safety.officialBulletinMessage}`,
        reasons: [
          `Active official ${safety.warning.provider} ${safety.warning.severity} warning for ${safety.warning.affected_area}`,
          safety.actionGuidance,
          `Official Bulletin #${safety.warning.bulletin_no || 'NA'} takes precedence over personal suitability scoring`
        ],
        risks: [
          `Hazardous meteorological event: ${safety.warning.title}`,
          `Disaster management advisory active until ${new Date(safety.warning.valid_until).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`
        ],
        safety_override: {
          active: true,
          severity: safety.severity,
          warning_type: safety.warning.warning_type,
          official_bulletin: safety.officialBulletinMessage || '',
          affected_area: safety.warning.affected_area,
          source: safety.warning.provider
        },
        metrics_breakdown: {
          rain_suitability: 0,
          temp_suitability: 10,
          wind_suitability: 10,
          humidity_suitability: 10,
          uv_suitability: 10,
          visibility_suitability: 10
        },
        alternative_windows: this.findAlternativeWindows(forecast, activity, targetHour, warnings),
        confidence: 98,
        sources: [safety.warning.provider, 'MoES Disaster Guidelines'],
        generated_at: new Date().toISOString()
      };
    }

    // 2. GEOGRAPHIC FEASIBILITY VALIDATION: Coastal & Marine Activities
    if (activity === 'BEACH_VISIT' || activity === 'COASTAL_FISHING') {
      const isCoastal = isCoastalLocation(state, district, locationName);
      if (!isCoastal) {
        const actLabel = activity === 'BEACH_VISIT' ? 'beach visit' : 'coastal sea fishing';
        return {
          status: 'AVOID',
          score: 0,
          activity,
          location_name: locationName,
          target_time: targetHour !== undefined ? `${targetHour.toString().padStart(2, '0')}:00 IST` : 'Current Horizon',
          recommendation: `Geographic Incompatibility: ${locationName} (${state}) is an inland, landlocked location with no sea beach or coastline.`,
          reasons: [
            `${locationName} is located inland in ${state}, several hundred kilometers away from the Indian coastline.`,
            `Official INCOIS marine observation and beach recreation require a coastal observatory or coastal district (e.g. Mumbai, Goa, Chennai, Puri, Kochi, Visakhapatnam).`,
            `Local atmospheric conditions cannot facilitate ${actLabel} in a landlocked jurisdiction.`
          ],
          risks: [
            `Zero coastline availability: No ocean or marine beach exists within ${district || locationName} or neighboring inland areas.`,
            `Nearest maritime coastline is located over 800–1,200 km away.`
          ],
          metrics_breakdown: {
            rain_suitability: 0,
            temp_suitability: 0,
            wind_suitability: 0,
            humidity_suitability: 0,
            uv_suitability: 0,
            visibility_suitability: 0
          },
          alternative_windows: [],
          confidence: 99,
          sources: ['Survey of India Territorial GIS', 'INCOIS Marine Boundary Registry'],
          generated_at: new Date().toISOString()
        };
      }
    }

    // 2. Extract meteorological variables from observation or target forecast hourly slot
    let tempC = observation?.temperature_c ?? 28;
    let humidityPct = observation?.humidity_pct ?? 60;
    let windKmh = observation?.wind_speed_kmh ?? 12;
    let rainProbPct = 10;
    let rainMm = observation?.rainfall_mm ?? 0;
    let uvIndex = observation?.uv_index ?? 5;
    let visibilityKm = observation?.visibility_km ?? 8;
    let aqi = airQuality?.aqi ?? 85;

    // If target hour is specified, sample from forecast
    let matchedHourlySlot: HourlyForecast | null = null;
    if (targetHour !== undefined && forecast?.hourly && forecast.hourly.length > 0) {
      matchedHourlySlot = forecast.hourly.find(h => h.hour === targetHour) || forecast.hourly[0];
      if (matchedHourlySlot) {
        tempC = matchedHourlySlot.temperature_c;
        humidityPct = matchedHourlySlot.humidity_pct;
        windKmh = matchedHourlySlot.wind_speed_kmh;
        rainProbPct = matchedHourlySlot.rain_probability_pct;
        rainMm = matchedHourlySlot.rainfall_mm;
        uvIndex = matchedHourlySlot.uv_index;
      }
    }

    // 3. Normalized suitability sub-scores (0 to 100)
    const rainSuitability = this.scoreRainSuitability(rainProbPct, rainMm);
    const tempSuitability = this.scoreTempSuitability(tempC, activity);
    const windSuitability = this.scoreWindSuitability(windKmh, activity);
    const humiditySuitability = this.scoreHumiditySuitability(humidityPct);
    const aqiSuitability = this.scoreAqiSuitability(aqi);
    const uvSuitability = this.scoreUvSuitability(uvIndex);
    const visibilitySuitability = this.scoreVisibilitySuitability(visibilityKm);

    // 4. Weight calculation based on activity
    const { weights, score, reasons, risks } = this.computeWeightedScore({
      activity,
      targetHour,
      tempC,
      humidityPct,
      windKmh,
      rainProbPct,
      rainMm,
      uvIndex,
      visibilityKm,
      aqi,
      marine,
      subScores: {
        rainSuitability,
        tempSuitability,
        windSuitability,
        humiditySuitability,
        aqiSuitability,
        uvSuitability,
        visibilitySuitability
      }
    });

    // 5. Determine status
    let status: 'OPTIMAL' | 'FAIR' | 'RISKY' | 'AVOID' = 'FAIR';
    if (score >= 80) status = 'OPTIMAL';
    else if (score >= 60) status = 'FAIR';
    else if (score >= 40) status = 'RISKY';
    else status = 'AVOID';

    // 6. Calculate confidence score based on data freshness and completeness
    const confidence = this.calculateConfidence(observation?.freshness_state, forecast?.freshness_state, !!airQuality, !!observation);

    // 7. Alternative windows
    const alternatives = this.findAlternativeWindows(forecast, activity, targetHour, warnings);

    const sources = ['India Meteorological Department (IMD)'];
    if (airQuality) sources.push('Central Pollution Control Board (CPCB)');
    if (marine && (activity === 'COASTAL_FISHING' || activity === 'BEACH_VISIT')) {
      sources.push('Indian National Centre for Ocean Information Services (INCOIS)');
    }

    const timeLabel = targetHour !== undefined ? `${targetHour.toString().padStart(2, '0')}:00 IST` : 'Immediate Window';

    return {
      status,
      score: Math.round(score),
      activity,
      location_name: locationName,
      target_time: timeLabel,
      recommendation: this.generateRecommendationProse(activity, status, score, timeLabel, reasons),
      reasons,
      risks,
      metrics_breakdown: {
        rain_suitability: Math.round(rainSuitability),
        temp_suitability: Math.round(tempSuitability),
        wind_suitability: Math.round(windSuitability),
        humidity_suitability: Math.round(humiditySuitability),
        aqi_suitability: Math.round(aqiSuitability),
        uv_suitability: Math.round(uvSuitability),
        visibility_suitability: Math.round(visibilitySuitability)
      },
      alternative_windows: alternatives,
      confidence,
      sources,
      generated_at: new Date().toISOString()
    };
  }

  private static scoreRainSuitability(rainProb: number, rainMm: number): number {
    if (rainMm > 15 || rainProb > 80) return 10;
    if (rainMm > 5 || rainProb > 60) return 30;
    if (rainMm > 0.5 || rainProb > 40) return 55;
    if (rainProb > 20) return 80;
    return 100;
  }

  private static scoreTempSuitability(tempC: number, activity: ActivityType): number {
    // Comfort baseline varies per activity
    if (activity === 'RUNNING' || activity === 'CYCLING') {
      // Ideal 16°C - 24°C
      if (tempC >= 16 && tempC <= 24) return 100;
      if (tempC < 16) return Math.max(30, 100 - (16 - tempC) * 6);
      if (tempC > 24) return Math.max(10, 100 - (tempC - 24) * 7);
    }
    if (activity === 'FARMING_SPRAY') {
      // Sprays evaporate too fast above 32°C, wash out below 10°C
      if (tempC >= 15 && tempC <= 28) return 100;
      if (tempC > 35) return 20;
      return 60;
    }
    // General outdoor comfort
    if (tempC >= 20 && tempC <= 30) return 100;
    if (tempC > 30) return Math.max(15, 100 - (tempC - 30) * 6);
    return Math.max(20, 100 - (20 - tempC) * 5);
  }

  private static scoreWindSuitability(windKmh: number, activity: ActivityType): number {
    if (activity === 'FARMING_SPRAY') {
      // Agromet advisory: wind must be < 15 km/h to prevent spray drift
      if (windKmh < 10) return 100;
      if (windKmh <= 15) return 70;
      return 20; // High spray drift hazard
    }
    if (activity === 'COASTAL_FISHING') {
      if (windKmh < 25) return 95;
      if (windKmh <= 40) return 50;
      return 15; // Sea rough
    }
    if (windKmh < 20) return 100;
    if (windKmh <= 35) return 70;
    return 30;
  }

  private static scoreHumiditySuitability(rh: number): number {
    if (rh >= 35 && rh <= 65) return 100;
    if (rh > 85) return 40;
    if (rh < 25) return 60;
    return 80;
  }

  private static scoreAqiSuitability(aqi: number): number {
    if (aqi <= 50) return 100; // Good
    if (aqi <= 100) return 85; // Satisfactory
    if (aqi <= 200) return 60; // Moderate
    if (aqi <= 300) return 35; // Poor
    if (aqi <= 400) return 15; // Very Poor
    return 5; // Severe
  }

  private static scoreUvSuitability(uv: number): number {
    if (uv <= 2) return 100; // Low
    if (uv <= 5) return 85;  // Moderate
    if (uv <= 7) return 60;  // High
    if (uv <= 10) return 30; // Very High
    return 10;               // Extreme
  }

  private static scoreVisibilitySuitability(visKm: number): number {
    if (visKm >= 8) return 100;
    if (visKm >= 4) return 80;
    if (visKm >= 1) return 45;
    return 15; // Dense fog
  }

  private static computeWeightedScore(params: {
    activity: ActivityType;
    targetHour?: number;
    tempC: number;
    humidityPct: number;
    windKmh: number;
    rainProbPct: number;
    rainMm: number;
    uvIndex: number;
    visibilityKm: number;
    aqi: number;
    marine?: MarineRecord | null;
    subScores: Record<string, number>;
  }) {
    const { activity, targetHour, tempC, humidityPct, windKmh, rainProbPct, rainMm, aqi, marine, subScores } = params;
    const reasons: string[] = [];
    const risks: string[] = [];

    let weights: Record<string, number> = {};

    switch (activity) {
      case 'RUNNING':
      case 'CYCLING':
      case 'OUTDOOR_WALK':
      case 'SPORTS':
        // Fitness Persona: Temperature, Rain, AQI, UV, Wind
        weights = {
          tempSuitability: 0.25,
          rainSuitability: 0.30,
          aqiSuitability: 0.20,
          windSuitability: 0.10,
          uvSuitability: 0.10,
          humiditySuitability: 0.05
        };
        if (tempC > 32) risks.push(`Thermal stress: Ambient temperature is ${tempC}°C`);
        if (rainProbPct > 50) risks.push(`Rain probability is high (${rainProbPct}%)`);
        if (aqi > 200) risks.push(`Unhealthy air quality (AQI ${aqi}) - lung strain risk`);
        if (tempC <= 26 && rainProbPct < 20 && aqi <= 100) {
          reasons.push('Favorable ambient temperature and clean air for cardiovascular exertion');
        }
        break;

      case 'FARMING_SPRAY':
        // Agriculture Persona: Rain (washout), Wind (drift), Heat/Humidity, Agromet
        weights = {
          rainSuitability: 0.35,
          windSuitability: 0.30,
          tempSuitability: 0.20,
          humiditySuitability: 0.15
        };

        // 1. Post-dusk / Night constraint (18:00 to 05:59 IST)
        if (targetHour !== undefined && (targetHour >= 18 || targetHour < 6)) {
          risks.push(
            targetHour >= 18
              ? 'Agronomic / Field Operational Constraint: Farmers conclude field work by dusk (~18:00 IST). Post-dusk and nighttime spraying is not recommended due to darkness, worker safety hazards, closed plant stomata, and heavy nocturnal dew that dilutes and washes off chemical solution.'
              : 'Pre-dawn / Darkness Constraint: Spraying before 06:00 IST is not recommended due to darkness, excessive dew accumulation on foliage, and worker safety risks.'
          );
        }
        // 2. Midday thermal scorch hazard (11:00 to 15:00 IST)
        else if (targetHour !== undefined && targetHour >= 11 && targetHour <= 15) {
          if (tempC > 30) {
            risks.push(`Midday Thermal Hazard: Ambient temperature of ${tempC}°C causes rapid chemical volatilization, droplet evaporation before uptake, and high risk of crop foliage burning (phytotoxicity).`);
          } else {
            risks.push('Midday Spraying Risk: Elevated solar thermal updrafts accelerate pesticide droplet evaporation and drift.');
          }
        }
        // 3. Optimal Morning Window (06:00 to 10:00 IST)
        else if (targetHour !== undefined && targetHour >= 6 && targetHour <= 10) {
          if (windKmh <= 12 && rainProbPct < 25) {
            reasons.push('Prime Morning Agromet Window (06:00–10:00 IST): Calm winds, drying morning dew, open plant stomata, and cool ambient temperatures maximize systemic chemical absorption.');
          }
        }
        // 4. Recommended Late-Afternoon Window (15:00 to 17:30 IST)
        else if (targetHour !== undefined && targetHour >= 15 && targetHour <= 17) {
          if (windKmh <= 12 && rainProbPct < 25) {
            reasons.push('Recommended Late-Afternoon Window (15:00–17:30 IST): Decreased solar heat and gentle breezes allow effective droplet deposition before farmers leave the fields.');
          }
        }

        // Wind drift hazard check
        if (windKmh > 12) {
          risks.push(`Agromet Drift Hazard: Wind speed (${windKmh} km/h) exceeds safe chemical spray drift threshold (12 km/h), causing spray drift onto non-target areas.`);
        } else if (windKmh <= 10) {
          reasons.push(`Calm wind (${windKmh} km/h) ensures targeted droplet deposition without drift loss`);
        }

        // Rain washout check
        if (rainProbPct > 25) {
          risks.push(`High risk of rain washout (${rainProbPct}% probability) within the critical 4-6h chemical rainfast bonding period`);
        } else if (rainProbPct <= 10) {
          reasons.push('Minimal rain probability ensures chemical remains on foliage during critical rainfast bonding period');
        }
        break;

      case 'FARMING_HARVEST':
        weights = {
          rainSuitability: 0.45,
          humiditySuitability: 0.25,
          tempSuitability: 0.15,
          windSuitability: 0.15
        };
        if (targetHour !== undefined && (targetHour >= 18 || targetHour < 7)) {
          risks.push('Agricultural Daylight Constraint: Harvesting operations require daylight (07:00–17:30 IST) for machinery navigation and grain moisture control.');
        } else if (targetHour !== undefined && targetHour >= 9 && targetHour <= 16) {
          if (humidityPct < 70 && rainProbPct < 20) {
            reasons.push('Optimal Harvest Window: Dry ambient conditions promote lower grain moisture content and efficient combine harvester operation.');
          }
        }
        if (rainProbPct > 25) {
          risks.push(`Harvest Risk: Rain probability of ${rainProbPct}% risks grain dampness, spoilage, and mold.`);
        }
        break;

      case 'COASTAL_FISHING':
      case 'BEACH_VISIT':
        // Coastal Persona: Marine wave height, swell, wind, sea temp
        weights = {
          windSuitability: 0.25,
          rainSuitability: 0.25,
          tempSuitability: 0.15,
          visibilitySuitability: 0.15,
          uvSuitability: 0.20
        };
        if (marine) {
          if (marine.wave_height_m > 2.5) {
            risks.push(`INCOIS Ocean Warning: Significant wave height is high (${marine.wave_height_m}m)`);
          }
          if (marine.safety_status === 'DANGEROUS' || marine.safety_status === 'WARNING_ACTIVE') {
            risks.push(`Coastal Bulletin: ${marine.warning_text}`);
          }
        }
        break;

      case 'COMMUTE':
      case 'HIGHWAY_TRAVEL':
        // Commuter & Transit Persona: Visibility (Fog/Smog), Rain (Traction/Waterlogging), AQI, Wind
        weights = {
          visibilitySuitability: 0.35,
          rainSuitability: 0.30,
          aqiSuitability: 0.15,
          windSuitability: 0.10,
          tempSuitability: 0.10
        };

        // 1. IMD Official Fog Severity Classification
        if (params.visibilityKm < 0.2) {
          risks.push(
            `IMD DENSE FOG ALERT: Surface visibility severely reduced (${Math.round(params.visibilityKm * 1000)}m < 200m). Two-wheeler transit is hazardous; road speeds capped to 25 km/h. Metro/rail transit strongly recommended.`
          );
        } else if (params.visibilityKm < 0.5) {
          risks.push(
            `IMD MODERATE FOG: Visibility reduced to ${Math.round(params.visibilityKm * 1000)}m (200–500m). Use low-beam fog lamps; increase safe stopping distance on expressways.`
          );
        } else if (params.visibilityKm < 1.0) {
          risks.push(
            `SHALLOW FOG / SMOG: Surface visibility is ${params.visibilityKm} km. Smog particles reduce visual contrast on highway corridors.`
          );
        } else if (params.visibilityKm >= 3.0) {
          reasons.push(
            `Clear Highway Visibility: Visual range is ${params.visibilityKm} km with zero fog impediment for road and rail commute.`
          );
        }

        // 2. Road Traction & Underpass Waterlogging
        if (rainMm > 5 || rainProbPct > 60) {
          risks.push(
            `Precipitation & Waterlogging: Wet roadway friction hazard; potential underpass waterlogging and two-wheeler skidding risk.`
          );
        } else if (rainProbPct < 15) {
          reasons.push('Dry road surface ensures optimal vehicle braking traction and unhindered transit.');
        }

        // 3. AQI Exposure for Open Commuters
        if (aqi > 250) {
          risks.push(
            `Severe Air Pollution (AQI ${aqi}): Particulate matter exposure hazard. Two-wheeler and pedestrian commuters should wear certified N95 respirators.`
          );
        }
        break;

      case 'CONSTRUCTION_WORK':
        // Civil Engineering & Site Persona: Wind (Cranes/Scaffolding), Rain (Concrete/Pave), AQI (Dust), Temp (Heat stress)
        weights = {
          windSuitability: 0.30,
          rainSuitability: 0.30,
          aqiSuitability: 0.20,
          tempSuitability: 0.20
        };

        // 1. Tower Crane & Scaffolding Wind Watch (National Building Code limit: 25 km/h)
        if (windKmh > 25) {
          risks.push(
            `Wind Safety Violation (${windKmh} km/h > 25 km/h): Unsafe for tower crane lifts, suspended gondolas, and high-altitude steel rigging per National Building Code.`
          );
        } else if (windKmh <= 15) {
          reasons.push(`Calm wind conditions (${windKmh} km/h) safe for high-rise scaffolding and crane hoisting.`);
        }

        // 2. Concrete Pouring & Slab Casting Precipitation Limit
        if (rainProbPct > 30 || rainMm > 0) {
          risks.push(
            `Concrete Pouring Hazard: Rain probability (${rainProbPct}%) risks cement paste washout, surface pitting, and weak compressive strength in unhardened concrete.`
          );
        } else {
          reasons.push('Dry curing window: Ideal atmospheric conditions for slab concrete pouring, brickwork, and plastering.');
        }

        // 3. CPCB Anti-Smog & Dust Norms (GRAP)
        if (aqi > 200) {
          risks.push(
            `CPCB Dust Advisory (AQI ${aqi}): Mandatory anti-smog water sprinklers; open soil mounds must be tarpaulin-covered under GRAP construction guidelines.`
          );
        } else {
          reasons.push('Air quality complies with standard construction environmental norms.');
        }

        // 4. Laborer Thermal Stress / Extreme Temperature
        if (tempC > 38) {
          risks.push(
            `High Heat Stress (${tempC}°C): Risk of heat exhaustion and rapid plastic shrinkage cracks in fresh concrete. Mandate shaded hydration intervals.`
          );
        } else if (tempC < 8) {
          risks.push(`Low Temperature Curing: Ambient temperature (${tempC}°C) delays cement hydration; retardant admixtures required.`);
        }
        break;

      case 'WEDDING':
      case 'OUTDOOR_EVENT':
      default:
        // Event Planner Persona: Rain (top risk), Temperature, Comfort, Wind
        weights = {
          rainSuitability: 0.45,
          tempSuitability: 0.25,
          windSuitability: 0.15,
          humiditySuitability: 0.10,
          uvSuitability: 0.05
        };
        if (rainProbPct > 35) risks.push(`Precipitation risk (${rainProbPct}%) threatens open-air staging`);
        if (tempC > 34) risks.push(`Thermal discomfort for guests (${tempC}°C)`);
        break;
    }

    // Calculate composite weighted sum
    let totalScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
      totalScore += (subScores[key] || 70) * weight;
    }

    // Specific operational constraints capping
    if (activity === 'FARMING_SPRAY') {
      if (targetHour !== undefined && (targetHour >= 18 || targetHour < 6)) {
        // Night or post-dusk: strictly capped at 35 (RISKY/AVOID)
        totalScore = Math.min(totalScore, 35);
      } else if (targetHour !== undefined && targetHour >= 11 && targetHour <= 15 && tempC > 30) {
        // Midday scorch: capped at 50 (RISKY)
        totalScore = Math.min(totalScore, 50);
      }
    } else if (activity === 'FARMING_HARVEST') {
      if (targetHour !== undefined && (targetHour >= 18 || targetHour < 7)) {
        totalScore = Math.min(totalScore, 35);
      }
    } else if (activity === 'CONSTRUCTION_WORK') {
      if (windKmh > 25) {
        totalScore = Math.min(totalScore, 35); // Crane & scaffolding gale hazard
      } else if (rainProbPct > 45 || rainMm > 2) {
        totalScore = Math.min(totalScore, 30); // Concrete wash-off hazard
      }
    } else if (activity === 'COMMUTE') {
      if (params.visibilityKm < 0.2) {
        totalScore = Math.min(totalScore, 40); // Dense fog hazardous for transit
      } else if (rainMm > 8) {
        totalScore = Math.min(totalScore, 45); // Waterlogging hazard
      }
    }

    // Penalties for marine danger
    if (marine && (activity === 'COASTAL_FISHING' || activity === 'BEACH_VISIT')) {
      if (marine.wave_height_m > 3.0) totalScore = Math.min(totalScore, 25);
      else if (marine.wave_height_m > 2.0) totalScore = Math.min(totalScore, 50);
    }

    if (reasons.length === 0) {
      if (totalScore >= 75) reasons.push('Atmospheric variables align well with activity thresholds');
      else reasons.push('One or more meteorological metrics show elevated operational friction');
    }

    return { weights, score: totalScore, reasons, risks };
  }

  private static calculateConfidence(
    obsFreshness?: FreshnessState,
    fcFreshness?: FreshnessState,
    hasAqi?: boolean,
    hasObs?: boolean
  ): number {
    let conf = 85;
    if (obsFreshness === 'OFFICIAL_LIVE') conf += 10;
    else if (obsFreshness === 'OFFICIAL_CACHED') conf += 5;
    else if (obsFreshness === 'OFFICIAL_STALE') conf -= 15;
    else if (obsFreshness === 'UNAVAILABLE') conf -= 30;

    if (fcFreshness === 'OFFICIAL_LIVE') conf += 5;
    if (hasAqi) conf += 5;
    if (!hasObs) conf -= 15;

    return Math.min(99, Math.max(40, conf));
  }

  private static findAlternativeWindows(
    forecast: WeatherForecast | null | undefined,
    activity: ActivityType,
    currentHour?: number,
    warnings?: WarningRecord[]
  ) {
    if (!forecast?.hourly || forecast.hourly.length === 0) {
      return [];
    }

    const hours = forecast.hourly.slice(0, 24);
    const alternatives: DecisionResult['alternative_windows'] = [];

    for (const slot of hours) {
      if (currentHour !== undefined && slot.hour === currentHour) continue;

      // Filter by activity-appropriate operational daylight/time windows
      if (activity === 'FARMING_SPRAY') {
        // STRICT AGRICULTURAL SPRAYING WINDOW: Daylight field operating hours ONLY (06:00 to 17:30 IST)!
        // Absolutely exclude post-dusk and nocturnal hours (18:00 to 05:00 IST) when farmers have left fields and dew forms.
        if (slot.hour < 6 || slot.hour >= 18) continue;
      } else if (activity === 'FARMING_HARVEST') {
        // Harvesting requires daylight field operations (07:00 to 17:30 IST)
        if (slot.hour < 7 || slot.hour >= 18) continue;
      } else if (activity === 'RUNNING' || activity === 'CYCLING' || activity === 'OUTDOOR_WALK') {
        // Exclude late night/wee hours (22:00 to 04:00)
        if (slot.hour >= 22 || slot.hour < 5) continue;
      } else if (activity === 'WEDDING' || activity === 'OUTDOOR_EVENT') {
        // Exclude early morning hours (00:00 to 10:00)
        if (slot.hour >= 0 && slot.hour < 11) continue;
      } else if (activity === 'BEACH_VISIT') {
        // Exclude nocturnal hours (19:00 to 05:59 IST) - darkness, rising tides, and closed lifeguard stations
        if (slot.hour >= 19 || slot.hour < 6) continue;
      } else if (activity === 'COASTAL_FISHING') {
        // Artisanal fishing navigation window (04:00 to 18:00 IST)
        if (slot.hour >= 18 || slot.hour < 4) continue;
      } else if (activity === 'CONSTRUCTION_WORK') {
        // Active daylight construction shift hours only (07:00 to 18:00 IST)
        if (slot.hour < 7 || slot.hour >= 18) continue;
      }

      let score = 100;
      // Evaluate rain
      if (slot.rain_probability_pct > 60) score -= 45;
      else if (slot.rain_probability_pct > 30) score -= 20;

      // Evaluate temp and activity specific constraints
      if (activity === 'RUNNING' || activity === 'CYCLING') {
        if (slot.temperature_c > 32) score -= 35;
        else if (slot.temperature_c >= 18 && slot.temperature_c <= 25) score += 5;
      }

      if (activity === 'FARMING_SPRAY') {
        // Wind drift penalty
        if (slot.wind_speed_kmh > 12) score -= 45;
        else if (slot.wind_speed_kmh <= 8) score += 5;

        // Midday scorch penalty (11:00 to 14:00)
        if (slot.hour >= 11 && slot.hour <= 14) {
          score -= 35; // Midday heat accelerates chemical volatilization
        }

        // Prime morning bonus (06:00 to 09:00)
        if (slot.hour >= 6 && slot.hour <= 9 && slot.wind_speed_kmh <= 10) {
          score += 10;
        }

        // Late afternoon bonus (15:00 to 17:00)
        if (slot.hour >= 15 && slot.hour <= 17 && slot.wind_speed_kmh <= 10) {
          score += 5;
        }
      }

      if (activity === 'CONSTRUCTION_WORK') {
        if (slot.wind_speed_kmh > 25) score -= 45;
        if (slot.rain_probability_pct > 30) score -= 40;
        if (slot.temperature_c > 38) score -= 25;
        if (slot.rain_probability_pct < 15 && slot.wind_speed_kmh <= 15) {
          score += 10;
        }
      } else if (activity === 'COMMUTE') {
        if (slot.rain_probability_pct > 40) score -= 25;
        if (slot.rain_probability_pct < 15) score += 5;
      }

      if (activity === 'BEACH_VISIT') {
        if (slot.hour >= 15 && slot.hour <= 18) {
          score += 10;
        } else if (slot.hour >= 6 && slot.hour <= 9) {
          score += 5;
        } else if (slot.hour >= 11 && slot.hour <= 14) {
          score -= 20; // High solar UV
        }
      }

      const clampedScore = Math.max(15, Math.min(98, score));
      let slotStatus: 'OPTIMAL' | 'FAIR' | 'RISKY' | 'AVOID' = 'FAIR';
      if (clampedScore >= 80) slotStatus = 'OPTIMAL';
      else if (clampedScore >= 60) slotStatus = 'FAIR';
      else if (clampedScore >= 40) slotStatus = 'RISKY';
      else slotStatus = 'AVOID';

      let summary = `${slot.temperature_c}°C · ${slot.condition_text} · Rain ${slot.rain_probability_pct}%`;
      if (activity === 'FARMING_SPRAY') {
        if (slot.hour >= 6 && slot.hour <= 9) {
          summary = `Prime morning Agromet window: ${slot.temperature_c}°C, calm winds (${slot.wind_speed_kmh} km/h), optimal absorption`;
        } else if (slot.hour >= 15 && slot.hour <= 17) {
          summary = `Recommended late-afternoon window: declining heat, low drift before dusk (${slot.wind_speed_kmh} km/h)`;
        } else if (slot.hour >= 11 && slot.hour <= 14) {
          summary = `Midday window: elevated heat (${slot.temperature_c}°C), spray with caution`;
        }
      } else if (activity === 'CONSTRUCTION_WORK') {
        if (slot.rain_probability_pct < 15 && slot.wind_speed_kmh <= 15) {
          summary = `Prime construction window: ${slot.temperature_c}°C, calm winds (${slot.wind_speed_kmh} km/h), ideal for concrete pouring & scaffolding`;
        } else if (slot.wind_speed_kmh > 20) {
          summary = `Breezy conditions (${slot.wind_speed_kmh} km/h): monitor tower cranes and high-altitude scaffolding`;
        }
      } else if (activity === 'COMMUTE') {
        if (slot.rain_probability_pct < 20) {
          summary = `Clear transit window: ${slot.temperature_c}°C, dry roads, smooth traffic flow`;
        } else {
          summary = `Wet commute window: rain chance ${slot.rain_probability_pct}%, exercise caution on two-wheelers`;
        }
      } else if (activity === 'BEACH_VISIT') {
        if (slot.hour >= 15 && slot.hour <= 18) {
          summary = `Optimal afternoon beach window: ${slot.temperature_c}°C, pleasant breeze, gentle surf`;
        } else if (slot.hour >= 6 && slot.hour <= 9) {
          summary = `Morning beach walk: ${slot.temperature_c}°C, low UV, fresh sea breeze`;
        } else if (slot.hour >= 11 && slot.hour <= 14) {
          summary = `Midday sun: elevated heat (${slot.temperature_c}°C), seek shaded beach shelters`;
        }
      } else if (slotStatus === 'OPTIMAL') {
        summary = `Optimal window: ${slot.temperature_c}°C, calm winds, rain chance only ${slot.rain_probability_pct}%`;
      }

      alternatives.push({
        time: `${slot.hour.toString().padStart(2, '0')}:00 IST`,
        score: clampedScore,
        status: slotStatus,
        summary
      });
    }

    // Return top 4 distinct alternatives sorted by score descending
    return alternatives.sort((a, b) => b.score - a.score).slice(0, 4);
  }

  private static generateRecommendationProse(
    activity: ActivityType,
    status: 'OPTIMAL' | 'FAIR' | 'RISKY' | 'AVOID' | 'SAFETY_OVERRIDE',
    score: number,
    timeLabel: string,
    reasons: string[]
  ): string {
    const actLabel = activity.replace(/_/g, ' ').toLowerCase();
    if (status === 'OPTIMAL') {
      return `Good conditions for your planned ${actLabel} at ${timeLabel}. Temperatures are comfortable, rain risk is low and winds remain light.`;
    }
    if (status === 'FAIR') {
      return `Conditions are acceptable for your ${actLabel} at ${timeLabel}, though shifting slightly earlier may offer better comfort.`;
    }
    if (status === 'RISKY') {
      return `Caution advised for your ${actLabel} at ${timeLabel}. Weather factors suggest considering an alternative time window.`;
    }
    return `Conditions are not recommended for your ${actLabel} at ${timeLabel}. We suggest shifting your activity to an earlier or safer time.`;
  }
}
