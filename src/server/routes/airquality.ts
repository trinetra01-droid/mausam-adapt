import { Router, Request, Response } from 'express';
import { cpcbProvider } from '../providers/cpcb.js';
import { cache } from '../cache.js';

export const airQualityRouter = Router();

airQualityRouter.get('/', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.5847;
    const lng = parseFloat(req.query.lng as string) || 77.2066;
    const city = (req.query.city as string) || 'Delhi';
    const state = (req.query.state as string) || 'Delhi';

    const cacheKey = `cpcb:aqi:${city.toLowerCase()}`;
    const { data: aqiRecord } = await cache.fetchWithSWR(
      cacheKey,
      () => cpcbProvider.getAirQuality(city, state, lat, lng),
      600, // 10 min
      1800
    );

    res.json({
      available: true,
      data: aqiRecord,
      pollen: {
        available: false,
        message: 'Official Government of India CAAQMS does not provide real-time pollen instrumentation. Pollen data marked UNAVAILABLE per source policy.'
      }
    });
  } catch (err: any) {
    res.status(503).json({
      available: false,
      error: 'Official CPCB air quality data temporarily unavailable',
      detail: err.message
    });
  }
});
