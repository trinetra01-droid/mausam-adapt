import { Router, Request, Response } from 'express';
import { incoisProvider } from '../providers/incois.js';
import { cache } from '../cache.js';

export const marineRouter = Router();

marineRouter.get('/', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 18.9067;
    const lng = parseFloat(req.query.lng as string) || 72.8147;
    const area = (req.query.area as string) || 'Mumbai Coastal Waters';
    const state = (req.query.state as string) || 'Maharashtra';

    const cacheKey = `marine:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const { data: marineData } = await cache.fetchWithSWR(
      cacheKey,
      () => incoisProvider.getCoastalObservation(area, state, lat, lng),
      600, // 10 min
      1800
    );

    if (!marineData) {
      return res.status(200).json({
        available: false,
        message: 'Non-coastal terrestrial location. INCOIS ocean state data applies to coastal maritime sectors.'
      });
    }

    res.json({
      available: true,
      data: marineData
    });
  } catch (err: any) {
    res.status(503).json({
      available: false,
      error: 'Official INCOIS marine data temporarily unavailable',
      detail: err.message
    });
  }
});
