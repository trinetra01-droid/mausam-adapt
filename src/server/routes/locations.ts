import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthRequest } from './auth.js';
import { INDIAN_CITIES_CATALOG, searchAllIndianCities } from '../indianCities.js';

export const locationsRouter = Router();

// Get Saved Locations
locationsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user ? req.user.id : null;
    const locs = await db.query(
      `SELECT * FROM locations WHERE (user_id = $1 OR user_id IS NULL) AND is_saved = true ORDER BY created_at ASC`,
      [userId]
    );
    const sanitized = (locs.rows || []).map(l => ({
      ...l,
      latitude: parseFloat(l.latitude),
      longitude: parseFloat(l.longitude)
    }));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch locations: ${err.message}` });
  }
});

// Get List of all 28 States & 8 Union Territories
locationsRouter.get('/states', (_req: AuthRequest, res: Response) => {
  const statesSet = new Set<string>();
  INDIAN_CITIES_CATALOG.forEach(c => statesSet.add(c.state));
  const sortedStates = Array.from(statesSet).sort();
  res.json(sortedStates);
});

// Get Cities by State
locationsRouter.get('/by-state', (req: AuthRequest, res: Response) => {
  const stateQuery = ((req.query.state as string) || '').trim().toLowerCase();
  if (!stateQuery) {
    return res.json(INDIAN_CITIES_CATALOG.slice(0, 30));
  }
  const cities = INDIAN_CITIES_CATALOG.filter(c => c.state.toLowerCase() === stateQuery);
  res.json(cities);
});

// Search Locations across all cities, districts, and towns in India
locationsRouter.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const query = ((req.query.q as string) || '').trim();
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const results = await searchAllIndianCities(query, limit);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: `Location search failed: ${err.message}` });
  }
});

// Add New Saved Location
locationsRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user ? req.user.id : null;
  try {
    const { name, latitude, longitude, district, state, type = 'custom' } = req.body;
    if (!name || latitude === undefined || longitude === undefined || !district || !state) {
      return res.status(400).json({ error: 'Name, latitude, longitude, district, and state are required' });
    }

    const locId = `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.query(
      `INSERT INTO locations (id, user_id, name, latitude, longitude, district, state, country, timezone, type, is_saved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'India', 'Asia/Kolkata', $8, true)`,
      [locId, userId, name, latitude, longitude, district, state, type]
    );

    res.status(201).json({
      id: locId,
      name,
      latitude,
      longitude,
      district,
      state,
      type,
      is_saved: true
    });
  } catch (err: any) {
    res.status(500).json({ error: `Save location error: ${err.message}` });
  }
});

// Delete Location
locationsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await db.query('DELETE FROM locations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: `Delete location error: ${err.message}` });
  }
});
