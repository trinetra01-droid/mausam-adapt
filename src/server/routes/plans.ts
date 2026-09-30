import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthRequest } from './auth.js';
import { imdProvider } from '../providers/imd.js';
import { cpcbProvider } from '../providers/cpcb.js';
import { incoisProvider } from '../providers/incois.js';
import { DecisionEngine } from '../decisionEngine.js';
import { ActivityType, PlanRecord } from '../types.js';
import { resolveLocationJurisdiction, resolveCityInfo } from '../indianCities.js';
import { SafetyEngine } from '../safetyEngine.js';

export const plansRouter = Router();

// Get User's Plans
plansRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user ? req.user.id : 'anonymous';
  try {
    const plansRes = await db.query(
      `SELECT * FROM plans WHERE user_id = $1 OR user_id = 'anonymous' ORDER BY planned_date ASC, start_time ASC`,
      [userId]
    );
    res.json(plansRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to load plans: ${err.message}` });
  }
});

// "Challenge My Plan" - Deterministic meteorological forecast evaluation + Persistence
plansRouter.post('/challenge', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user ? req.user.id : 'anonymous';
  try {
    const {
      title,
      activity,
      location_name = 'New Delhi',
      latitude = 28.5847,
      longitude = 77.2066,
      planned_date = new Date().toISOString().split('T')[0],
      start_time = '17:00',
      duration_hours = 2.0
    } = req.body;

    if (!title || !activity) {
      return res.status(400).json({ error: 'Title and activity type are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const startHour = parseInt(start_time.split(':')[0], 10) || 12;

    const jurisdiction = resolveLocationJurisdiction(location_name, lat, lng, req.body.district, req.body.state);

    // Fetch actual meteorological components
    const [obs, forecast, warnings, aqi, marine] = await Promise.all([
      imdProvider.getCurrentObservation(location_name, jurisdiction.state, lat, lng),
      imdProvider.getForecast(location_name, jurisdiction.state, lat, lng),
      imdProvider.getWarnings(jurisdiction.district, jurisdiction.state),
      cpcbProvider.getAirQuality(location_name, jurisdiction.state, lat, lng),
      incoisProvider.getCoastalObservation(location_name, jurisdiction.state, lat, lng)
    ]);

    // Deterministic evaluation against forecast
    let decisionResult = DecisionEngine.evaluate({
      activity: activity as ActivityType,
      locationName: location_name,
      district: jurisdiction.district,
      state: jurisdiction.state,
      targetHour: startHour,
      observation: obs,
      forecast,
      warnings,
      marine,
      airQuality: aqi
    });

    // If highway travel, verify safety of destination if mentioned in title
    if (activity === 'HIGHWAY_TRAVEL') {
      const match = title.match(/(?:to|for)\s+([a-zA-Z\s]+)/i);
      if (match) {
        const destCity = await resolveCityInfo(match[1]);
        if (destCity) {
          const destWarns = await imdProvider.getWarnings(destCity.district, destCity.state);
          const destSafety = SafetyEngine.evaluateSafety(destWarns, destCity.district, destCity.state);
          if (destSafety.hasOverride && destSafety.warning) {
            decisionResult.status = 'SAFETY_OVERRIDE';
            decisionResult.score = 15;
            decisionResult.recommendation = `MANDATORY SAFETY OVERRIDE: Destination (${destCity.name}) is under active IMD ${destSafety.severity} Warning: ${destSafety.warning.title}. Travel along corridor is hazardous.`;
            decisionResult.reasons.unshift(`Destination Warning: ${destSafety.warning.title} (${destSafety.warning.affected_area})`);
            decisionResult.risks.unshift(`Severe weather disruption at destination ${destCity.name}`);
            decisionResult.safety_override = {
              active: true,
              severity: destSafety.severity,
              warning_type: destSafety.warning.warning_type,
              official_bulletin: destSafety.officialBulletinMessage || destSafety.warning.message,
              affected_area: destSafety.warning.affected_area,
              source: destSafety.warning.provider
            };
          }
        }
      }
    }

    const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const hasConflict = decisionResult.score < 50 || decisionResult.status === 'SAFETY_OVERRIDE';

    await db.query(
      `INSERT INTO plans (
        id, user_id, title, activity, location_name, latitude, longitude,
        planned_date, start_time, duration_hours, status, has_conflict, decision_result
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        planId,
        userId,
        title,
        activity,
        location_name,
        lat,
        lng,
        planned_date,
        start_time,
        duration_hours,
        hasConflict ? 'CONFLICT_DETECTED' : 'SCHEDULED',
        hasConflict,
        JSON.stringify(decisionResult)
      ]
    );

    // Audit log
    await db.query(
      `INSERT INTO decision_audit_logs (id, user_id, plan_id, activity, inputs, output)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `log-${Date.now()}`,
        userId,
        planId,
        activity,
        JSON.stringify({ location_name, lat, lng, planned_date, start_time, duration_hours }),
        JSON.stringify(decisionResult)
      ]
    );

    res.json({
      plan_id: planId,
      decision: decisionResult,
      plan: {
        id: planId,
        title,
        activity,
        location_name,
        planned_date,
        start_time,
        has_conflict: hasConflict
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: `Challenge Plan evaluation error: ${err.message}` });
  }
});

// What-If Hourly Timeline Simulation
// Accepts location, activity, date, and evaluates across hours 0..23 dynamically from actual forecast data
plansRouter.post('/what-if', async (req: AuthRequest, res: Response) => {
  try {
    const { activity = 'RUNNING', location_name = 'New Delhi', latitude = 28.5847, longitude = 77.2066 } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const jurisdiction = resolveLocationJurisdiction(location_name, lat, lng, req.body.district, req.body.state);

    const [forecast, warnings, obs, aqi, marine] = await Promise.all([
      imdProvider.getForecast(location_name, jurisdiction.state, lat, lng),
      imdProvider.getWarnings(jurisdiction.district, jurisdiction.state),
      imdProvider.getCurrentObservation(location_name, jurisdiction.state, lat, lng),
      cpcbProvider.getAirQuality(location_name, jurisdiction.state, lat, lng),
      incoisProvider.getCoastalObservation(location_name, jurisdiction.state, lat, lng)
    ]);

    const timelineHours = [6, 8, 10, 12, 14, 16, 17, 18, 19, 20, 21];
    const timeline = timelineHours.map(hour => {
      const decision = DecisionEngine.evaluate({
        activity: activity as ActivityType,
        locationName: location_name,
        district: jurisdiction.district,
        state: jurisdiction.state,
        targetHour: hour,
        observation: obs,
        forecast,
        warnings,
        marine,
        airQuality: aqi
      });

      const matchedHour = forecast.hourly.find(h => h.hour === hour);

      return {
        hour,
        time_label: `${hour.toString().padStart(2, '0')}:00 IST`,
        score: decision.score,
        status: decision.status,
        temperature_c: matchedHour?.temperature_c || 28,
        rain_probability_pct: matchedHour?.rain_probability_pct || 10,
        wind_speed_kmh: matchedHour?.wind_speed_kmh || 12,
        condition_text: matchedHour?.condition_text || 'Clear',
        recommendation: decision.recommendation,
        risks: decision.risks
      };
    });

    res.json({
      activity,
      location_name,
      timeline,
      optimal_hour: timeline.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), timeline[0])
    });
  } catch (err: any) {
    res.status(500).json({ error: `What-If simulation error: ${err.message}` });
  }
});

// Reschedule Plan
plansRouter.post('/reschedule', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user ? req.user.id : 'anonymous';
  try {
    const { plan_id, new_start_time, trigger_reason = 'Weather conflict avoidance' } = req.body;
    if (!plan_id || !new_start_time) {
      return res.status(400).json({ error: 'plan_id and new_start_time required' });
    }

    const planRes = await db.query('SELECT * FROM plans WHERE id = $1', [plan_id]);
    if (planRes.rowCount === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = planRes.rows[0];
    const newHour = parseInt(new_start_time.split(':')[0], 10) || 12;

    const jurisdiction = resolveLocationJurisdiction(plan.location_name, parseFloat(plan.latitude), parseFloat(plan.longitude));

    const forecast = await imdProvider.getForecast(plan.location_name, jurisdiction.state, parseFloat(plan.latitude), parseFloat(plan.longitude));
    const warnings = await imdProvider.getWarnings(jurisdiction.district, jurisdiction.state);

    const newDecision = DecisionEngine.evaluate({
      activity: plan.activity as ActivityType,
      locationName: plan.location_name,
      district: jurisdiction.district,
      state: jurisdiction.state,
      targetHour: newHour,
      forecast,
      warnings
    });

    // Save reschedule history
    await db.query(
      `INSERT INTO plan_reschedules (id, plan_id, user_id, old_time, new_time, old_decision, new_decision, trigger_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        `resched-${Date.now()}`,
        plan_id,
        userId,
        plan.start_time,
        new_start_time,
        JSON.stringify(plan.decision_result),
        JSON.stringify(newDecision),
        trigger_reason
      ]
    );

    // Update plan
    await db.query(
      `UPDATE plans SET 
        start_time = $1, 
        has_conflict = false, 
        status = 'RESCHEDULED', 
        decision_result = $2, 
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [new_start_time, JSON.stringify(newDecision), plan_id]
    );

    res.json({
      success: true,
      message: `Plan successfully rescheduled to ${new_start_time}`,
      new_decision: newDecision
    });
  } catch (err: any) {
    res.status(500).json({ error: `Reschedule error: ${err.message}` });
  }
});

// Delete Plan
plansRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const planId = req.params.id;
    await db.query('DELETE FROM plan_reschedules WHERE plan_id = $1', [planId]).catch(() => {});
    await db.query('DELETE FROM decision_audit_logs WHERE plan_id = $1', [planId]).catch(() => {});
    const result = await db.query('DELETE FROM plans WHERE id = $1', [planId]);
    res.json({ success: true, count: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: `Delete plan error: ${err.message}` });
  }
});
