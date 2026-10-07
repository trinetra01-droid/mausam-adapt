import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthRequest } from './auth.js';
import { INDIAN_CITIES_CATALOG, searchAllIndianCities, findNearestIndianCity } from '../indianCities.js';

export const locationsRouter = Router();

// Automatic Location Detection (Auto-select city without user prompt)
locationsRouter.get('/detect', async (req: Request, res: Response) => {
  try {
    let lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    let lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    let detectedCityName: string | undefined;
    let detectedRegion: string | undefined;

    // If client didn't supply GPS coordinates, attempt IP-based geolocation
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      const rawIp = (req.headers['x-forwarded-for'] as string) || 
                    (req.headers['x-real-ip'] as string) || 
                    (req.headers['cf-connecting-ip'] as string) || 
                    req.socket.remoteAddress || '';
      const clientIp = rawIp.split(',')[0].trim();

      const isLocalOrPrivate = !clientIp || 
        clientIp === '127.0.0.1' || 
        clientIp === '::1' || 
        clientIp.startsWith('10.') || 
        clientIp.startsWith('192.168.') || 
        clientIp.startsWith('172.');

      // Try providers
      const queryUrl1 = isLocalOrPrivate ? 'https://ipwho.is/' : `https://ipwho.is/${encodeURIComponent(clientIp)}`;
      const queryUrl2 = isLocalOrPrivate ? 'https://freeipapi.com/api/json' : `https://freeipapi.com/api/json/${encodeURIComponent(clientIp)}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const ipRes = await fetch(queryUrl1, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          const isCountryIn = ipData && (ipData.country_code === 'IN' || (ipData.country && ipData.country.toLowerCase() === 'india'));
          if (isCountryIn && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
            if (ipData.latitude >= 6.0 && ipData.latitude <= 38.0 && ipData.longitude >= 66.0 && ipData.longitude <= 99.0) {
              lat = ipData.latitude;
              lng = ipData.longitude;
              detectedCityName = ipData.city;
              detectedRegion = ipData.region;
            }
          }
        }
      } catch (_) {}

      // Fallback provider 2
      if (lat === undefined || lng === undefined) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const ipRes = await fetch(queryUrl2, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            const isCountryIn = ipData && (ipData.countryCode === 'IN' || ipData.country_code === 'IN' || (ipData.countryName && ipData.countryName.toLowerCase() === 'india'));
            if (isCountryIn && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
              if (ipData.latitude >= 6.0 && ipData.latitude <= 38.0 && ipData.longitude >= 66.0 && ipData.longitude <= 99.0) {
                lat = ipData.latitude;
                lng = ipData.longitude;
                detectedCityName = ipData.cityName || ipData.city;
                detectedRegion = ipData.regionName || ipData.region;
              }
            }
          }
        } catch (_) {}
      }
    }

    // If coordinates were obtained (via GPS or IP)
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const isWithinIndia = lat >= 6 && lat <= 38 && lng >= 66 && lng <= 99;

      if (isWithinIndia) {
        // If we have a city name from IP lookup or reverse geocoding, match catalog first
        if (detectedCityName) {
          const directMatches = await searchAllIndianCities(detectedCityName);
          if (directMatches && directMatches.length > 0) {
            const m = directMatches[0];
            return res.json({
              id: `loc-auto-${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              name: m.name,
              latitude: m.lat,
              longitude: m.lng,
              district: m.district,
              state: m.state,
              country: 'India',
              timezone: 'Asia/Kolkata',
              type: m.type || 'home',
              is_auto_detected: true,
              detected_coords: { lat, lng }
            });
          }
        }

        // Accurately resolve closest genuine Indian city
        const nearest = findNearestIndianCity(lat, lng);
        return res.json({
          id: `loc-auto-${nearest.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: nearest.name,
          latitude: nearest.lat,
          longitude: nearest.lng,
          district: nearest.district,
          state: nearest.state,
          country: 'India',
          timezone: 'Asia/Kolkata',
          type: nearest.type || 'home',
          is_auto_detected: true,
          detected_coords: { lat, lng }
        });
      } else {
        // Outside India (e.g. cloud dev container, US IP, Kentucky/New York): default to Moradabad, India
        const defaultCity = INDIAN_CITIES_CATALOG.find(c => c.name.toLowerCase() === 'moradabad') || {
          name: 'Moradabad',
          district: 'Moradabad',
          state: 'Uttar Pradesh',
          lat: 28.8351,
          lng: 78.7747,
          type: 'home' as const
        };
        return res.json({
          id: 'loc-auto-moradabad',
          name: defaultCity.name,
          latitude: defaultCity.lat,
          longitude: defaultCity.lng,
          district: defaultCity.district,
          state: defaultCity.state,
          country: 'India',
          timezone: 'Asia/Kolkata',
          type: defaultCity.type || 'home',
          is_auto_detected: true,
          detected_coords: { lat: defaultCity.lat, lng: defaultCity.lng }
        });
      }
    }

    // Default fallback city: Moradabad (Uttar Pradesh)
    const defaultCity = INDIAN_CITIES_CATALOG.find(c => c.name.toLowerCase() === 'moradabad') || {
      name: 'Moradabad',
      district: 'Moradabad',
      state: 'Uttar Pradesh',
      lat: 28.8351,
      lng: 78.7747,
      type: 'home' as const
    };
    return res.json({
      id: 'loc-default',
      name: defaultCity.name,
      latitude: defaultCity.lat,
      longitude: defaultCity.lng,
      district: defaultCity.district,
      state: defaultCity.state,
      country: 'India',
      timezone: 'Asia/Kolkata',
      type: defaultCity.type || 'home',
      is_auto_detected: true
    });
  } catch (err: any) {
    res.status(500).json({ error: `Auto-detection failed: ${err.message}` });
  }
});

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

// Clear All Saved Locations
locationsRouter.delete('/', async (_req: Request, res: Response) => {
  try {
    await db.query('DELETE FROM locations');
    res.json({ success: true, message: 'All locations removed' });
  } catch (err: any) {
    res.status(500).json({ error: `Clear locations error: ${err.message}` });
  }
});

// Delete Single Location
locationsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await db.query('DELETE FROM locations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: `Delete location error: ${err.message}` });
  }
});
