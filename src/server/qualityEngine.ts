import { WeatherObservation, WarningRecord, MarineRecord, AirQualityRecord } from './types.js';

export interface QualityValidationResult {
  isValid: boolean;
  quality: 'VERIFIED' | 'SUSPECT' | 'RAW';
  confidence: number;
  anomalies: string[];
}

export class DataQualityEngine {
  /**
   * Validate meteorological observations against realistic Indian physical climatology bounds.
   * India absolute temperature records span approx -15°C (Ladakh/Himalayas) to +52°C (Rajasthan).
   */
  static validateWeatherObservation(obs: Partial<WeatherObservation>): QualityValidationResult {
    const anomalies: string[] = [];
    let confidence = 100;

    // 1. Mandatory fields
    if (obs.temperature_c === undefined || obs.temperature_c === null) {
      anomalies.push('Missing temperature field');
      return { isValid: false, quality: 'SUSPECT', confidence: 0, anomalies };
    }

    // 2. Temperature physical range validation (-25°C to +58°C)
    if (obs.temperature_c < -25 || obs.temperature_c > 58) {
      anomalies.push(`Temperature ${obs.temperature_c}°C outside realistic meteorological boundary (-25°C to 58°C)`);
      confidence -= 50;
    }

    // 3. Humidity bounds (0% to 100%)
    if (obs.humidity_pct !== undefined) {
      if (obs.humidity_pct < 0 || obs.humidity_pct > 100) {
        anomalies.push(`Relative humidity ${obs.humidity_pct}% out of physical bound [0, 100]`);
        confidence -= 30;
      }
    }

    // 4. Wind speed bounds (0 to 300 km/h - Super Cyclonic Storm upper bound)
    if (obs.wind_speed_kmh !== undefined) {
      if (obs.wind_speed_kmh < 0 || obs.wind_speed_kmh > 350) {
        anomalies.push(`Wind speed ${obs.wind_speed_kmh} km/h invalid or exceeds extreme cyclone threshold`);
        confidence -= 30;
      }
    }

    // 5. Wind direction bounds (0 to 360 degrees)
    if (obs.wind_direction_deg !== undefined && obs.wind_direction_deg !== null) {
      if (obs.wind_direction_deg < 0 || obs.wind_direction_deg > 360) {
        anomalies.push(`Wind direction ${obs.wind_direction_deg}° outside azimuth 0-360°`);
        confidence -= 15;
      }
    }

    // 6. Rainfall non-negative & hourly threshold (up to 300mm/h for extreme cloudburst)
    if (obs.rainfall_mm !== undefined && obs.rainfall_mm !== null) {
      if (obs.rainfall_mm < 0 || obs.rainfall_mm > 500) {
        anomalies.push(`Rainfall amount ${obs.rainfall_mm} mm out of plausible bounds`);
        confidence -= 30;
      }
    }

    // 7. Atmospheric pressure at mean sea level (MSLP: 870 hPa to 1084 hPa)
    if (obs.pressure_hpa !== undefined && obs.pressure_hpa !== null) {
      if (obs.pressure_hpa < 870 || obs.pressure_hpa > 1085) {
        anomalies.push(`Barometric pressure ${obs.pressure_hpa} hPa anomalous`);
        confidence -= 20;
      }
    }

    // 8. Timestamp freshness & temporal causality check
    if (obs.observed_at) {
      const obsTime = new Date(obs.observed_at).getTime();
      const now = Date.now();
      // Future timestamp beyond 30 min clock drift
      if (obsTime > now + 30 * 60 * 1000) {
        anomalies.push('Observed timestamp is in the future beyond acceptable clock drift');
        confidence -= 40;
      }
      // Extremely stale data (> 7 days)
      if (now - obsTime > 7 * 24 * 60 * 60 * 1000) {
        anomalies.push('Observation is older than 7 days');
        confidence -= 30;
      }
    }

    const isValid = confidence >= 50 && anomalies.filter(a => a.includes('outside realistic') || a.includes('Missing')).length === 0;
    const quality = confidence >= 85 ? 'VERIFIED' : confidence >= 50 ? 'RAW' : 'SUSPECT';

    return {
      isValid,
      quality,
      confidence: Math.max(0, confidence),
      anomalies
    };
  }

  /**
   * Validate INCOIS Marine observations
   */
  static validateMarineObservation(marine: Partial<MarineRecord>): QualityValidationResult {
    const anomalies: string[] = [];
    let confidence = 100;

    if (marine.wave_height_m !== undefined && (marine.wave_height_m < 0 || marine.wave_height_m > 25)) {
      anomalies.push(`Significant wave height ${marine.wave_height_m}m outside realistic ocean bounds (0-25m)`);
      confidence -= 40;
    }

    if (marine.sea_temp_c !== undefined && (marine.sea_temp_c < 10 || marine.sea_temp_c > 40)) {
      anomalies.push(`Sea surface temperature ${marine.sea_temp_c}°C outside tropical ocean bounds (10-40°C)`);
      confidence -= 30;
    }

    return {
      isValid: confidence >= 50,
      quality: confidence >= 80 ? 'VERIFIED' : 'RAW',
      confidence: Math.max(0, confidence),
      anomalies
    };
  }

  /**
   * Validate CPCB Air Quality observations
   */
  static validateAirQuality(aqiRecord: Partial<AirQualityRecord>): QualityValidationResult {
    const anomalies: string[] = [];
    let confidence = 100;

    if (aqiRecord.aqi === undefined || aqiRecord.aqi < 0 || aqiRecord.aqi > 999) {
      anomalies.push(`AQI value ${aqiRecord.aqi} outside standard index range [0-999]`);
      confidence -= 50;
    }

    if (aqiRecord.pm25 !== undefined && (aqiRecord.pm25 < 0 || aqiRecord.pm25 > 1500)) {
      anomalies.push(`PM2.5 value ${aqiRecord.pm25} µg/m³ outside plausible range`);
      confidence -= 30;
    }

    return {
      isValid: confidence >= 50,
      quality: confidence >= 80 ? 'VERIFIED' : 'RAW',
      confidence: Math.max(0, confidence),
      anomalies
    };
  }
}
