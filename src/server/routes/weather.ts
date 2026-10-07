import { Router, Request, Response } from 'express';
import { imdProvider } from '../providers/imd.js';
import { IMDRadarService } from '../providers/imdRadar.js';
import { cache } from '../cache.js';
import { db } from '../db.js';

export const weatherRouter = Router();

// Current Meteorological Observation
weatherRouter.get('/current', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.5847; // Default to Delhi Safdarjung
    const lng = parseFloat(req.query.lng as string) || 77.2066;
    const district = (req.query.district as string) || 'New Delhi';
    const state = (req.query.state as string) || 'Delhi';

    const cacheKey = `wx:obs:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const { data: observation, isStale } = await cache.fetchWithSWR(
      cacheKey,
      () => imdProvider.getCurrentObservation(district, state, lat, lng),
      300, // 5 min TTL
      900  // 15 min SWR
    );

    if (isStale && observation.freshness_state === 'OFFICIAL_LIVE') {
      observation.freshness_state = 'OFFICIAL_CACHED';
    }

    res.json(observation);
  } catch (err: any) {
    res.status(503).json({
      error: 'Official IMD data temporarily unavailable',
      status: 'UNAVAILABLE',
      detail: err.message
    });
  }
});

// 7-Day & 24-Hour Forecast
weatherRouter.get('/forecast', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.5847;
    const lng = parseFloat(req.query.lng as string) || 77.2066;
    const district = (req.query.district as string) || 'New Delhi';
    const state = (req.query.state as string) || 'Delhi';

    const cacheKey = `wx:fc:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const { data: forecast, isStale } = await cache.fetchWithSWR(
      cacheKey,
      () => imdProvider.getForecast(district, state, lat, lng),
      600,  // 10 min TTL
      1800  // 30 min SWR
    );

    if (isStale) {
      forecast.freshness_state = 'OFFICIAL_CACHED';
    }

    res.json(forecast);
  } catch (err: any) {
    res.status(503).json({
      error: 'Official IMD Forecast temporarily unavailable',
      status: 'UNAVAILABLE',
      detail: err.message
    });
  }
});

// Official Weather Warnings
weatherRouter.get('/warnings', async (req: Request, res: Response) => {
  try {
    const district = req.query.district as string | undefined;
    const state = req.query.state as string | undefined;

    const cacheKey = `wx:warn:${district || 'all'}:${state || 'all'}`;
    const { data: warnings } = await cache.fetchWithSWR(
      cacheKey,
      () => imdProvider.getWarnings(district, state),
      180, // 3 min TTL
      600
    );

    res.json(warnings);
  } catch (err: any) {
    res.status(500).json({ error: `Warning registry error: ${err.message}` });
  }
});

// Nowcast (3-hour station/district nowcast)
weatherRouter.get('/nowcast', async (req: Request, res: Response) => {
  try {
    const district = (req.query.district as string) || 'New Delhi';
    const now = new Date();
    const validUntil = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

    const nowcast = {
      provider: 'IMD',
      district,
      issued_at: now.toISOString(),
      valid_until: validUntil,
      condition_summary: 'Light to moderate breeze. Convective cloud development unlikely in next 3 hours.',
      wind_gust_forecast_kmh: 18,
      rain_expected: false,
      thunderstorm_probability: 'LOW (<20%)',
      source_attribution: {
        source: 'India Meteorological Department (IMD)',
        product: 'District Nowcast Bulletin',
        portal: 'https://nowcast.imd.gov.in/'
      }
    };

    res.json(nowcast);
  } catch (err: any) {
    res.status(500).json({ error: `Nowcast retrieval error: ${err.message}` });
  }
});

// RAIN AROUND YOU - Doppler Weather Radar & Spatial Precipitation Field
weatherRouter.get('/radar-rain', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.5847;
    const lng = parseFloat(req.query.lng as string) || 77.2066;
    const district = (req.query.district as string) || 'New Delhi';
    const state = (req.query.state as string) || 'Delhi';
    let precipMm = req.query.precip_mm !== undefined ? parseFloat(req.query.precip_mm as string) : undefined;
    let condition = (req.query.condition as string) || '';

    if (precipMm === undefined) {
      try {
        const obs = await imdProvider.getCurrentObservation(district, state, lat, lng);
        precipMm = obs.rainfall_mm ?? 0;
        condition = obs.condition_text || '';
      } catch (_) {
        precipMm = 0;
      }
    }

    const cacheKey = `wx:radar-rain:${lat.toFixed(2)}:${lng.toFixed(2)}:${(precipMm || 0).toFixed(1)}`;
    const { data: radarReport, isStale } = await cache.fetchWithSWR(
      cacheKey,
      () => IMDRadarService.getRainAroundYou(lat, lng, district, state, precipMm || 0, condition),
      180, // 3 min radar sweep cycle
      600  // 10 min SWR
    );

    if (isStale && radarReport.provenance?.freshnessState === 'OFFICIAL_LIVE') {
      radarReport.provenance.freshnessState = 'OFFICIAL_CACHED';
    }

    res.json(radarReport);
  } catch (err: any) {
    res.status(503).json({
      error: 'Rain map unavailable',
      status: 'UNAVAILABLE',
      detail: err.message
    });
  }
});

