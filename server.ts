import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from './src/server/db.js';
import { backgroundWorkers } from './src/server/workers.js';
import { authRouter } from './src/server/routes/auth.js';
import { weatherRouter } from './src/server/routes/weather.js';
import { plansRouter } from './src/server/routes/plans.js';
import { locationsRouter } from './src/server/routes/locations.js';
import { decisionRouter } from './src/server/routes/decision.js';
import { marineRouter } from './src/server/routes/marine.js';
import { airQualityRouter } from './src/server/routes/airquality.js';
import { exploreRouter } from './src/server/routes/explore.js';
import { bhashiniRouter } from './src/server/routes/bhashini.js';
import { adminRouter } from './src/server/routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
let cliPort: string | undefined;
for (let i = 0; i < process.argv.length; i++) {
  if ((process.argv[i] === '--port' || process.argv[i] === '-p') && process.argv[i + 1]) {
    cliPort = process.argv[i + 1];
    break;
  }
  if (process.argv[i].startsWith('--port=')) {
    cliPort = process.argv[i].split('=')[1];
    break;
  }
}
const PORT = parseInt(cliPort || process.env.PORT || process.env.APP_PORT || process.env.DEFAULT_APP_PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'));

// Middleware
// Security middleware: the production frontend and API are same-origin.
// No wildcard CORS is needed; removing it prevents arbitrary sites from reading API responses.
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https:",
        "connect-src 'self' https:",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "media-src 'self' blob: https:"
      ].join('; ')
    );
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  next();
});

app.use(express.json());

// Structured Request Logging & Request IDs
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  res.setHeader('X-Request-Id', reqId);
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.url.startsWith('/@') && !req.url.startsWith('/src') && !req.url.includes('.')) {
      console.log(`[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${duration}ms) [${reqId}]`);
    }
  });
  next();
});

// System Observability Endpoints
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', service: 'Mausam Adapt', timestamp: new Date().toISOString() });
});

app.get('/ready', async (req: Request, res: Response) => {
  try {
    await db.query('SELECT 1');
    res.json({ ready: true, database: 'CONNECTED' });
  } catch (err: any) {
    res.status(503).json({ ready: false, database: 'DISCONNECTED', error: err.message });
  }
});

app.get('/metrics', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  const uptime = process.uptime();
  const mem = process.memoryUsage();
  res.send([
    `# HELP process_uptime_seconds Process uptime in seconds.`,
    `# TYPE process_uptime_seconds gauge`,
    `process_uptime_seconds ${uptime}`,
    `# HELP process_heap_bytes Process heap size in bytes.`,
    `# TYPE process_heap_bytes gauge`,
    `process_heap_bytes ${mem.heapUsed}`,
    `# HELP trinetra_active_providers Total government data providers integrated.`,
    `# TYPE trinetra_active_providers gauge`,
    `trinetra_active_providers 5`
  ].join('\n'));
});

// SSE Live Events Stream (Real-Time Meteorological Broadcast)
const sseClients = new Set<Response>();

app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to TRINETRA live meteorological stream' })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Heartbeat to keep SSE active
setInterval(() => {
  const payload = JSON.stringify({ type: 'HEARTBEAT', time: new Date().toISOString() });
  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
}, 30000);

// Mount API Routers
app.use('/api/auth', authRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/plans', plansRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/decision', decisionRouter);
app.use('/api/marine', marineRouter);
app.use('/api/airquality', airQualityRouter);
app.use('/api/explore', exploreRouter);
app.use('/api/bhashini', bhashiniRouter);
app.use('/api/admin', adminRouter);

async function startServer() {
  try {
    // 1. Initialize PostgreSQL
    console.log('[Trinetra] Initializing database...');
    await db.init();

    // 2. Mount Frontend
    if (isProd) {
      console.log('[Trinetra] Serving production build from dist/');
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
    } else {
      console.log('[Trinetra] Mounting Vite development middlewares...');
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`========================================================`);
      console.log(`  TRINETRA — MAUSAM ADAPT`);
      console.log(`  "From Weather Data to Weather-Smart Decisions"`);
      console.log(`  Operational on http://0.0.0.0:${PORT}`);
      console.log(`========================================================`);

      // Start background ingestion only after the HTTP server is listening.
      backgroundWorkers.start();
    });
  } catch (err: any) {
    console.error('[Trinetra] Fatal startup failure:', err);
    process.exit(1);
  }
}

startServer();
