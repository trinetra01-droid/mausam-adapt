import { db } from './db.js';
import { cache } from './cache.js';
import { imdProvider } from './providers/imd.js';
import { incoisProvider } from './providers/incois.js';
import { cpcbProvider } from './providers/cpcb.js';
import { mosdacProvider } from './providers/mosdac.js';
import { bhashiniProvider } from './providers/bhashini.js';
import { DecisionEngine } from './decisionEngine.js';
import { ActivityType, PlanRecord, WarningRecord } from './types.js';

export class BackgroundWorkerSystem {
  private intervals: NodeJS.Timeout[] = [];
  private isRunning = false;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[BackgroundWorkers] Starting idempotent meteorological ingestion & conflict evaluation workers...');

    // 1. Weather Ingestion Worker (Runs every 15 minutes)
    const weatherWorker = setInterval(() => this.runWeatherIngestionWorker(), 15 * 60 * 1000);
    this.intervals.push(weatherWorker);

    // 2. Warning Ingestion Worker (Runs every 10 minutes)
    const warningWorker = setInterval(() => this.runWarningIngestionWorker(), 10 * 60 * 1000);
    this.intervals.push(warningWorker);

    // 3. Plan Conflict Evaluation Worker (Runs every 10 minutes)
    const conflictWorker = setInterval(() => this.runPlanConflictWorker(), 10 * 60 * 1000);
    this.intervals.push(conflictWorker);

    // 4. Provider Health & Latency Monitor (Runs every 5 minutes)
    const healthWorker = setInterval(() => this.runProviderHealthWorker(), 5 * 60 * 1000);
    this.intervals.push(healthWorker);

    // Run initial cycle after brief initialization
    setTimeout(() => {
      this.runWeatherIngestionWorker();
      this.runWarningIngestionWorker();
      this.runPlanConflictWorker();
      this.runProviderHealthWorker();
    }, 2000);
  }

  stop(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.isRunning = false;
    console.log('[BackgroundWorkers] Stopped all background worker tasks.');
  }

  /**
   * Weather Ingestion Worker: Ingests current observations & 7-day forecasts for saved locations
   */
  async runWeatherIngestionWorker(): Promise<void> {
    try {
      const locRes = await db.query('SELECT * FROM locations WHERE is_saved = true LIMIT 30');
      const locations = locRes.rows;

      for (const loc of locations) {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);

        // Fetch and persist current observation
        const obs = await imdProvider.getCurrentObservation(loc.district, loc.state, lat, lng);
        await db.query(
          `INSERT INTO weather_observations (
            id, provider, location_id, location_name, district, state, latitude, longitude,
            observed_at, valid_from, valid_until, temperature_c, feels_like_c, humidity_pct,
            wind_speed_kmh, wind_direction_deg, wind_direction_cardinal, rainfall_mm,
            pressure_hpa, visibility_km, uv_index, condition_text, quality, confidence,
            freshness_state, raw_payload, ingestion_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            temperature_c = EXCLUDED.temperature_c,
            humidity_pct = EXCLUDED.humidity_pct,
            wind_speed_kmh = EXCLUDED.wind_speed_kmh,
            rainfall_mm = EXCLUDED.rainfall_mm,
            observed_at = EXCLUDED.observed_at,
            freshness_state = EXCLUDED.freshness_state,
            ingestion_time = CURRENT_TIMESTAMP`,
          [
            obs.id, obs.provider, loc.id, obs.location_name, obs.district, obs.state,
            lat, lng, obs.observed_at, obs.valid_from, obs.valid_until,
            obs.temperature_c, obs.feels_like_c, obs.humidity_pct, obs.wind_speed_kmh,
            obs.wind_direction_deg, obs.wind_direction_cardinal, obs.rainfall_mm,
            obs.pressure_hpa, obs.visibility_km, obs.uv_index, obs.condition_text,
            obs.quality, obs.confidence, obs.freshness_state, JSON.stringify(obs)
          ]
        );

        // Cache update
        await cache.set(`weather:obs:${loc.id}`, obs, 600, 1800);
      }
    } catch (err: any) {
      console.error('[BackgroundWorkers] Weather ingestion error:', err.message);
    }
  }

  /**
   * Warning Ingestion Worker: Ingests official IMD / INCOIS severe warnings & generates alert notifications
   */
  async runWarningIngestionWorker(): Promise<void> {
    try {
      const warnings = await imdProvider.getWarnings();

      for (const w of warnings) {
        await db.query(
          `INSERT INTO warnings (
            id, provider, severity, warning_type, title, message, affected_area,
            district, state, valid_from, valid_until, issued_at, bulletin_url, bulletin_no,
            is_active, freshness_state, ingestion_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            severity = EXCLUDED.severity,
            message = EXCLUDED.message,
            valid_until = EXCLUDED.valid_until,
            is_active = EXCLUDED.is_active,
            ingestion_time = CURRENT_TIMESTAMP`,
          [
            w.id, w.provider, w.severity, w.warning_type, w.title, w.message,
            w.affected_area, w.district, w.state, w.valid_from, w.valid_until,
            w.issued_at, w.bulletin_url, w.bulletin_no, w.is_active, w.freshness_state
          ]
        );

        // If warning is RED or ORANGE, generate notifications for affected users
        if (w.severity === 'RED' || w.severity === 'ORANGE') {
          const matchedLocs = await db.query(
            `SELECT DISTINCT l.id, l.user_id, l.name FROM locations l
             WHERE (LOWER(l.district) = LOWER($1) OR LOWER($2) LIKE '%' || LOWER(l.district) || '%')`,
            [w.district || '', w.affected_area]
          );

          for (const loc of matchedLocs.rows) {
            const alertId = `alert-${w.id}-${loc.id}`;
            await db.query(
              `INSERT INTO alerts (id, user_id, warning_id, location_id, severity, title, message, is_read)
               VALUES ($1, $2, $3, $4, $5, $6, $7, false)
               ON CONFLICT (id) DO NOTHING`,
              [
                alertId,
                loc.user_id || 'system-global',
                w.id,
                loc.id,
                w.severity,
                `OFFICIAL ${w.severity} WARNING: ${w.title}`,
                `${w.message} Affected zone: ${loc.name} (${w.affected_area}).`
              ]
            );
          }
        }
      }
    } catch (err: any) {
      console.error('[BackgroundWorkers] Warning ingestion error:', err.message);
    }
  }

  /**
   * Weather Conflict Engine: Continuously evaluates future saved plans against refreshed forecasts
   */
  async runPlanConflictWorker(): Promise<void> {
    try {
      const activePlansRes = await db.query(
        `SELECT * FROM plans WHERE status = 'SCHEDULED' AND planned_date >= CURRENT_DATE`
      );
      const plans: PlanRecord[] = activePlansRes.rows;

      const warningsRes = await db.query('SELECT * FROM warnings WHERE is_active = true');
      const warnings: WarningRecord[] = warningsRes.rows;

      for (const plan of plans) {
        const lat = parseFloat(plan.latitude as any);
        const lng = parseFloat(plan.longitude as any);
        const startHour = parseInt(plan.start_time.split(':')[0], 10) || 12;

        // Fetch forecast for plan location
        const forecast = await imdProvider.getForecast(plan.location_name, '', lat, lng);
        const obs = await imdProvider.getCurrentObservation(plan.location_name, '', lat, lng);

        const newDecision = DecisionEngine.evaluate({
          activity: plan.activity as ActivityType,
          locationName: plan.location_name,
          district: plan.location_name,
          state: '',
          targetHour: startHour,
          observation: obs,
          forecast,
          warnings
        });

        const oldScore = plan.decision_result ? plan.decision_result.score : 80;
        const currentScore = newDecision.score;
        const hasConflict = currentScore < 50 || newDecision.status === 'SAFETY_OVERRIDE';

        if (hasConflict && !plan.has_conflict) {
          console.log(`[ConflictEngine] Weather conflict detected for plan "${plan.title}" (Score dropped ${oldScore} -> ${currentScore})`);
          
          await db.query(
            `UPDATE plans SET 
              has_conflict = true, 
              status = 'CONFLICT_DETECTED', 
              conflict_details = $1, 
              decision_result = $2, 
              updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [
              JSON.stringify({
                original_score: oldScore,
                current_score: currentScore,
                detected_risk: newDecision.risks[0] || 'Unfavorable meteorological degradation',
                forecast_change: newDecision.recommendation,
                updated_at: new Date().toISOString()
              }),
              JSON.stringify(newDecision),
              plan.id
            ]
          );

          // Insert alert
          await db.query(
            `INSERT INTO alerts (id, user_id, location_id, severity, title, message, is_read)
             VALUES ($1, $2, $3, 'ORANGE', $4, $5, false)
             ON CONFLICT (id) DO NOTHING`,
            [
              `conflict-alert-${plan.id}-${Date.now()}`,
              plan.user_id,
              plan.location_id,
              `WEATHER CONFLICT: "${plan.title}"`,
              `Forecast shift detected: Suitability dropped to ${currentScore}/100. ${newDecision.risks[0] || 'Alternative hours recommended.'}`
            ]
          );
        } else if (!hasConflict && plan.has_conflict) {
          // Weather improved, resolve conflict
          await db.query(
            `UPDATE plans SET has_conflict = false, status = 'SCHEDULED', decision_result = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [JSON.stringify(newDecision), plan.id]
          );
        }
      }
    } catch (err: any) {
      console.error('[BackgroundWorkers] Plan conflict evaluator error:', err.message);
    }
  }

  /**
   * Provider Health & Latency Monitor
   */
  async runProviderHealthWorker(): Promise<void> {
    const checks = [
      { id: 'IMD', check: () => imdProvider.healthCheck() },
      { id: 'INCOIS', check: () => incoisProvider.healthCheck() },
      { id: 'CPCB', check: () => cpcbProvider.healthCheck() },
      { id: 'MOSDAC', check: () => mosdacProvider.healthCheck() },
      { id: 'BHASHINI', check: () => bhashiniProvider.healthCheck() }
    ];

    for (const item of checks) {
      try {
        const result = await item.check();
        await db.query(
          `UPDATE provider_status SET 
            status = $1,
            latency_ms = $2,
            last_success_at = CURRENT_TIMESTAMP,
            error_message = $3
           WHERE provider_id = $4`,
          [result.ok ? 'OPERATIONAL' : 'DEGRADED', result.latencyMs, result.message, item.id]
        );
      } catch (err: any) {
        await db.query(
          `UPDATE provider_status SET 
            status = 'UNAVAILABLE',
            last_error_at = CURRENT_TIMESTAMP,
            error_message = $1,
            consecutive_failures = consecutive_failures + 1
           WHERE provider_id = $2`,
          [err.message, item.id]
        );
      }
    }
  }
}

export const backgroundWorkers = new BackgroundWorkerSystem();
