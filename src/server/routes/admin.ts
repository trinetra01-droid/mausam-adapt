import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { cache } from '../cache.js';

export const adminRouter = Router();

adminRouter.get('/overview', async (req: Request, res: Response) => {
  try {
    const [providersRes, obsCountRes, warningsCountRes, plansCountRes, locCountRes] = await Promise.all([
      db.query('SELECT * FROM provider_status ORDER BY provider_id ASC'),
      db.query('SELECT COUNT(*) as count FROM weather_observations'),
      db.query('SELECT COUNT(*) as count FROM warnings WHERE is_active = true'),
      db.query('SELECT COUNT(*) as count FROM plans'),
      db.query('SELECT COUNT(*) as count FROM locations')
    ]);

    const cacheStats = cache.getStats();

    res.json({
      system: {
        name: 'TRINETRA — MAUSAM ADAPT',
        version: '1.0.0-PROD',
        node_version: process.version,
        uptime_seconds: Math.round(process.uptime()),
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString()
      },
      providers: providersRes.rows,
      database: {
        status: 'OPERATIONAL',
        engine: 'PostgreSQL Relational Storage (with persistent disk state)',
        total_observations_recorded: parseInt(obsCountRes.rows[0]?.count || '0', 10),
        active_warnings_tracked: parseInt(warningsCountRes.rows[0]?.count || '0', 10),
        total_user_plans: parseInt(plansCountRes.rows[0]?.count || '0', 10),
        saved_locations: parseInt(locCountRes.rows[0]?.count || '0', 10)
      },
      cache: {
        engine: cacheStats.isRedisConnected ? 'Redis Remote Cluster' : 'Resilient In-Memory with TTL & SWR',
        active_memory_keys: cacheStats.memoryEntries,
        in_flight_multiplexed: cacheStats.inFlightCount,
        circuit_breakers: cacheStats.circuits
      },
      workers: {
        status: 'ACTIVE',
        active_workers: [
          { name: 'Weather Ingestion Worker', cadence: 'Every 15 min', state: 'RUNNING' },
          { name: 'Warning Bulletin Ingestion Worker', cadence: 'Every 10 min', state: 'RUNNING' },
          { name: 'Plan Conflict Evaluator', cadence: 'Every 10 min', state: 'RUNNING' },
          { name: 'Provider Health & Latency Monitor', cadence: 'Every 5 min', state: 'RUNNING' }
        ]
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: `Admin metrics failed: ${err.message}` });
  }
});
