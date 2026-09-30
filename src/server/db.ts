import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Pool } = pg;

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseManager {
  private pgliteInstance: PGlite | null = null;
  private pgPool: pg.Pool | null = null;
  private isExternalPg = false;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await this.doInit();
      this.initialized = true;
    })();

    try {
      await this.initPromise;
    } catch (err) {
      this.initPromise = null;
      throw err;
    }
  }

  private async doInit(): Promise<void> {

    const dbUrl = process.env.DATABASE_URL;
    
    // Production deployments must use the provisioned external PostgreSQL database.
    // Accept both standard PostgreSQL URL schemes used by hosted providers.
    const isPostgresUrl = !!dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'));

    if (process.env.NODE_ENV === 'production' && !isPostgresUrl) {
      throw new Error('[Database] DATABASE_URL is missing or is not a valid PostgreSQL connection URL.');
    }

    // Check if external Postgres connection is viable
    if (isPostgresUrl && !dbUrl!.includes('localhost:5432/trinetra_mausam')) {
      try {
        console.log('[Database] Attempting connection to external PostgreSQL...');
        const pool = new Pool({
          connectionString: dbUrl,
          connectionTimeoutMillis: 3000,
        });
        await pool.query('SELECT 1');
        this.pgPool = pool;
        this.isExternalPg = true;
        console.log('[Database] Connected to external PostgreSQL database.');
      } catch (err: any) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('[Database] External PostgreSQL connection failed in production: ' + err.message);
        }
        console.warn('[Database] External PostgreSQL unreachable, falling back to embedded persistent PostgreSQL (PGlite).', err.message);
      }
    }

    if (!this.isExternalPg) {
      const dataDir = path.resolve(process.cwd(), 'data/postgres');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      } else {
        const pidFile = path.join(dataDir, 'postmaster.pid');
        if (fs.existsSync(pidFile)) {
          try {
            fs.unlinkSync(pidFile);
            console.log('[Database] Cleaned up stale postmaster.pid');
          } catch (_) {}
        }
      }
      console.log(`[Database] Initializing persistent PostgreSQL database at ${dataDir}...`);
      try {
        this.pgliteInstance = new PGlite(dataDir);
        await this.pgliteInstance.waitReady;
      } catch (err) {
        console.warn('[Database] PGlite recovery triggered due to lock/crash, resetting clean instance:', err);
        try {
          fs.rmSync(dataDir, { recursive: true, force: true });
          fs.mkdirSync(dataDir, { recursive: true });
        } catch (_) {}
        this.pgliteInstance = new PGlite(dataDir);
        await this.pgliteInstance.waitReady;
      }
      console.log('[Database] Embedded PostgreSQL engine ready.');
    }

    await this.runMigrations();
    await this.seedInitialData();
  }

  private async executeQuery<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    if (this.isExternalPg && this.pgPool) {
      const res = await this.pgPool.query(sql, params);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount || 0,
      };
    } else if (this.pgliteInstance) {
      const res = await this.pgliteInstance.query(sql, params);
      return {
        rows: (res.rows || []) as T[],
        rowCount: res.rows ? res.rows.length : 0,
      };
    }
    throw new Error('Database not initialized');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.initialized) {
      await this.init();
    }
    return this.executeQuery<T>(sql, params);
  }

  private async runMigrations(): Promise<void> {
    console.log('[Database] Running schema migrations...');

    // Users table
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        language VARCHAR(32) DEFAULT 'en',
        timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
        units VARCHAR(16) DEFAULT 'METRIC',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User Profiles & Personas
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        personas JSONB DEFAULT '["FITNESS", "COMMUTER"]'::jsonb,
        home_location_id VARCHAR(64),
        work_location_id VARCHAR(64),
        school_location_id VARCHAR(64),
        farm_location_id VARCHAR(64),
        preferences JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Locations table
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        name VARCHAR(255) NOT NULL,
        latitude NUMERIC(9, 6) NOT NULL,
        longitude NUMERIC(9, 6) NOT NULL,
        district VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        country VARCHAR(64) DEFAULT 'India',
        timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
        type VARCHAR(32) DEFAULT 'custom',
        is_saved BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Weather Observations (Time-series)
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS weather_observations (
        id VARCHAR(64) PRIMARY KEY,
        provider VARCHAR(64) NOT NULL,
        location_id VARCHAR(64),
        location_name VARCHAR(255) NOT NULL,
        district VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        latitude NUMERIC(9, 6) NOT NULL,
        longitude NUMERIC(9, 6) NOT NULL,
        observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
        valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
        temperature_c NUMERIC(5, 2) NOT NULL,
        feels_like_c NUMERIC(5, 2),
        humidity_pct NUMERIC(5, 2) NOT NULL,
        wind_speed_kmh NUMERIC(5, 2) NOT NULL,
        wind_direction_deg NUMERIC(5, 2),
        wind_direction_cardinal VARCHAR(8),
        rainfall_mm NUMERIC(6, 2) DEFAULT 0,
        pressure_hpa NUMERIC(6, 2),
        visibility_km NUMERIC(5, 2),
        uv_index NUMERIC(4, 1),
        condition_text VARCHAR(255),
        quality VARCHAR(32) DEFAULT 'VERIFIED',
        confidence NUMERIC(5, 2) DEFAULT 95.0,
        freshness_state VARCHAR(32) DEFAULT 'OFFICIAL_LIVE',
        raw_payload JSONB,
        ingestion_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Weather Forecasts (Time-series)
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS forecasts (
        id VARCHAR(64) PRIMARY KEY,
        provider VARCHAR(64) NOT NULL,
        location_id VARCHAR(64),
        district VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        latitude NUMERIC(9, 6) NOT NULL,
        longitude NUMERIC(9, 6) NOT NULL,
        forecast_type VARCHAR(32) NOT NULL,
        issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
        valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
        valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
        hourly_data JSONB,
        daily_data JSONB,
        raw_payload JSONB,
        freshness_state VARCHAR(32) DEFAULT 'OFFICIAL_LIVE',
        ingestion_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Warnings & Severe Weather Bulletins
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS warnings (
        id VARCHAR(64) PRIMARY KEY,
        provider VARCHAR(64) NOT NULL,
        severity VARCHAR(32) NOT NULL,
        warning_type VARCHAR(128) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        affected_area TEXT NOT NULL,
        district VARCHAR(255),
        state VARCHAR(255),
        valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
        valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
        issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
        bulletin_url TEXT,
        bulletin_no VARCHAR(64),
        is_active BOOLEAN DEFAULT true,
        freshness_state VARCHAR(32) DEFAULT 'OFFICIAL_LIVE',
        ingestion_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Marine Observations (INCOIS)
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS marine_observations (
        id VARCHAR(64) PRIMARY KEY,
        provider VARCHAR(64) NOT NULL,
        coastal_area VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        latitude NUMERIC(9, 6) NOT NULL,
        longitude NUMERIC(9, 6) NOT NULL,
        wave_height_m NUMERIC(5, 2),
        swell_height_m NUMERIC(5, 2),
        wave_period_s NUMERIC(5, 2),
        sea_temp_c NUMERIC(5, 2),
        current_speed_knots NUMERIC(5, 2),
        wind_speed_knots NUMERIC(5, 2),
        warning_text TEXT,
        safety_status VARCHAR(32) DEFAULT 'SAFE',
        valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
        valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
        freshness_state VARCHAR(32) DEFAULT 'OFFICIAL_LIVE',
        ingestion_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Air Quality Records (CPCB)
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS air_quality_records (
        id VARCHAR(64) PRIMARY KEY,
        provider VARCHAR(64) NOT NULL,
        station_name VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        latitude NUMERIC(9, 6) NOT NULL,
        longitude NUMERIC(9, 6) NOT NULL,
        aqi INTEGER NOT NULL,
        category VARCHAR(64) NOT NULL,
        pm25 NUMERIC(6, 2),
        pm10 NUMERIC(6, 2),
        no2 NUMERIC(6, 2),
        so2 NUMERIC(6, 2),
        co NUMERIC(6, 2),
        o3 NUMERIC(6, 2),
        prominent_pollutant VARCHAR(32),
        observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        freshness_state VARCHAR(32) DEFAULT 'OFFICIAL_LIVE',
        ingestion_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Satellite Products (MOSDAC / ISRO)
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS satellite_products (
        id VARCHAR(64) PRIMARY KEY,
        provider VARCHAR(64) NOT NULL,
        satellite_name VARCHAR(64) NOT NULL,
        sensor VARCHAR(64) NOT NULL,
        product_type VARCHAR(64) NOT NULL,
        image_url TEXT,
        bounds JSONB,
        acquisition_time TIMESTAMP WITH TIME ZONE NOT NULL,
        ingestion_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User Plans & Activities
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS plans (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        activity VARCHAR(64) NOT NULL,
        location_id VARCHAR(64),
        location_name VARCHAR(255) NOT NULL,
        latitude NUMERIC(9, 6) NOT NULL,
        longitude NUMERIC(9, 6) NOT NULL,
        planned_date DATE NOT NULL,
        start_time VARCHAR(8) NOT NULL,
        duration_hours NUMERIC(4, 1) DEFAULT 1.0,
        status VARCHAR(32) DEFAULT 'SCHEDULED',
        has_conflict BOOLEAN DEFAULT false,
        conflict_details JSONB,
        decision_result JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Plan Reschedules History
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS plan_reschedules (
        id VARCHAR(64) PRIMARY KEY,
        plan_id VARCHAR(64) REFERENCES plans(id) ON DELETE CASCADE,
        user_id VARCHAR(64) NOT NULL,
        old_time VARCHAR(32) NOT NULL,
        new_time VARCHAR(32) NOT NULL,
        old_decision JSONB,
        new_decision JSONB,
        trigger_reason TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Alerts & Notifications
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        warning_id VARCHAR(64),
        location_id VARCHAR(64),
        severity VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Provider Health Status
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS provider_status (
        provider_id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        agency VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL,
        endpoint TEXT NOT NULL,
        last_success_at TIMESTAMP WITH TIME ZONE,
        last_error_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        latency_ms INTEGER DEFAULT 0,
        consecutive_failures INTEGER DEFAULT 0,
        compliance_mode VARCHAR(64) DEFAULT 'GOVERNMENT_DIRECT',
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `);

    // Decision Audit Logs
    await this.executeQuery(`
      CREATE TABLE IF NOT EXISTS decision_audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        plan_id VARCHAR(64),
        location_id VARCHAR(64),
        activity VARCHAR(64) NOT NULL,
        inputs JSONB NOT NULL,
        output JSONB NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[Database] Schema migrations applied successfully.');
  }

  private async seedInitialData(): Promise<void> {
    // Check if initial locations exist
    const locCheck = await this.executeQuery('SELECT COUNT(*) as count FROM locations');
    const locCount = parseInt(locCheck.rows[0]?.count || '0', 10);

    if (locCount === 0) {
      console.log('[Database] Seeding initial Indian key metropolises and strategic climate locations...');
      const seedLocations = [
        { id: 'loc-delhi', name: 'New Delhi (Safdarjung)', lat: 28.5847, lng: 77.2066, district: 'New Delhi', state: 'Delhi', type: 'home' },
        { id: 'loc-mumbai', name: 'Mumbai (Colaba / Coastal)', lat: 18.9067, lng: 72.8147, district: 'Mumbai City', state: 'Maharashtra', type: 'beach' },
        { id: 'loc-bengaluru', name: 'Bengaluru (IMD Bengaluru)', lat: 12.9716, lng: 77.5946, district: 'Bengaluru Urban', state: 'Karnataka', type: 'work' },
        { id: 'loc-chennai', name: 'Chennai (Meenambakkam)', lat: 12.9941, lng: 80.1808, district: 'Chennai', state: 'Tamil Nadu', type: 'destination' },
        { id: 'loc-kolkata', name: 'Kolkata (Alipore)', lat: 22.5333, lng: 88.3333, district: 'Kolkata', state: 'West Bengal', type: 'destination' },
        { id: 'loc-shimla', name: 'Shimla (Hill Station)', lat: 31.1048, lng: 77.1734, district: 'Shimla', state: 'Himachal Pradesh', type: 'custom' },
        { id: 'loc-kochi', name: 'Kochi (Port / Coastal)', lat: 9.9312, lng: 76.2673, district: 'Ernakulam', state: 'Kerala', type: 'beach' },
        { id: 'loc-nagpur', name: 'Nagpur (Central India Agromet)', lat: 21.1458, lng: 79.0882, district: 'Nagpur', state: 'Maharashtra', type: 'farm' },
        { id: 'loc-bhubaneswar', name: 'Bhubaneswar (Coastal Odisha)', lat: 20.2961, lng: 85.8245, district: 'Khordha', state: 'Odisha', type: 'custom' },
        { id: 'loc-guwahati', name: 'Guwahati (Brahmaputra Basin)', lat: 26.1445, lng: 91.7362, district: 'Kamrup Metropolitan', state: 'Assam', type: 'custom' }
      ];

      for (const loc of seedLocations) {
        await this.executeQuery(
          `INSERT INTO locations (id, name, latitude, longitude, district, state, country, timezone, type, is_saved)
           VALUES ($1, $2, $3, $4, $5, $6, 'India', 'Asia/Kolkata', $7, true)`,
          [loc.id, loc.name, loc.lat, loc.lng, loc.district, loc.state, loc.type]
        );
      }
    }

    // Seed provider statuses
    const provCheck = await this.executeQuery('SELECT COUNT(*) as count FROM provider_status');
    const provCount = parseInt(provCheck.rows[0]?.count || '0', 10);

    if (provCount === 0) {
      console.log('[Database] Initializing Government provider status registry...');
      const providers = [
        {
          id: 'IMD',
          name: 'India Meteorological Department',
          agency: 'Ministry of Earth Sciences (MoES)',
          endpoint: 'https://api.imd.gov.in/public/index.php',
          status: 'OPERATIONAL',
          compliance: 'GOVERNMENT_DIRECT'
        },
        {
          id: 'INCOIS',
          name: 'Indian National Centre for Ocean Information Services',
          agency: 'Ministry of Earth Sciences (MoES)',
          endpoint: 'https://incois.gov.in/portal/datainfo/data.jsp',
          status: 'OPERATIONAL',
          compliance: 'GOVERNMENT_DIRECT'
        },
        {
          id: 'CPCB',
          name: 'Central Pollution Control Board',
          agency: 'Ministry of Environment, Forest and Climate Change',
          endpoint: 'https://cpcb.gov.in/air-quality-data/',
          status: 'OPERATIONAL',
          compliance: 'GOVERNMENT_DIRECT'
        },
        {
          id: 'MOSDAC',
          name: 'Meteorological & Oceanographic Satellite Data Archival Centre',
          agency: 'Space Applications Centre (ISRO)',
          endpoint: 'https://mosdac.gov.in/live/',
          status: 'OPERATIONAL',
          compliance: 'GOVERNMENT_DIRECT'
        },
        {
          id: 'BHASHINI',
          name: 'National Language Translation Mission (NLTM)',
          agency: 'Ministry of Electronics and Information Technology (MeitY)',
          endpoint: 'https://bhashini.gov.in/ulca/model/explore-models',
          status: 'OPERATIONAL',
          compliance: 'GOVERNMENT_DIRECT'
        }
      ];

      for (const p of providers) {
        await this.executeQuery(
          `INSERT INTO provider_status (provider_id, name, agency, status, endpoint, latency_ms, compliance_mode, last_success_at)
           VALUES ($1, $2, $3, $4, $5, 120, $6, CURRENT_TIMESTAMP)`,
          [p.id, p.name, p.agency, p.status, p.endpoint, p.compliance]
        );
      }
    }
  }
}

export const db = new DatabaseManager();
