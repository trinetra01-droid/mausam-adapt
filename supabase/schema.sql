-- ==============================================================================
-- Mausam Adapt - Supabase Database Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
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

-- 2. User Profiles & Personas
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  personas JSONB DEFAULT '["FITNESS", "COMMUTER"]'::jsonb,
  home_location_id VARCHAR(64),
  work_location_id VARCHAR(64),
  school_location_id VARCHAR(64),
  farm_location_id VARCHAR(64),
  preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Locations Table
CREATE TABLE IF NOT EXISTS public.locations (
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

-- 4. Weather Observations (Historical & Live)
CREATE TABLE IF NOT EXISTS public.weather_observations (
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

-- 5. Weather Forecasts
CREATE TABLE IF NOT EXISTS public.forecasts (
  id VARCHAR(64) PRIMARY KEY,
  location_id VARCHAR(64),
  location_name VARCHAR(255) NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  forecast_date DATE NOT NULL,
  forecast_hour INTEGER,
  temp_min_c NUMERIC(5, 2),
  temp_max_c NUMERIC(5, 2),
  temp_day_c NUMERIC(5, 2),
  condition_text VARCHAR(255),
  precipitation_probability NUMERIC(5, 2),
  rainfall_expected_mm NUMERIC(6, 2),
  wind_speed_kmh NUMERIC(5, 2),
  humidity_pct NUMERIC(5, 2),
  confidence NUMERIC(5, 2) DEFAULT 90.0,
  provider VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Warnings & Extreme Alerts
CREATE TABLE IF NOT EXISTS public.warnings (
  id VARCHAR(64) PRIMARY KEY,
  source VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  headline VARCHAR(255) NOT NULL,
  description TEXT,
  area_name VARCHAR(255) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  action_recommended TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Plans & Activities
CREATE TABLE IF NOT EXISTS public.plans (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  activity_type VARCHAR(64) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  safety_score NUMERIC(5, 2) DEFAULT 100,
  status VARCHAR(32) DEFAULT 'SCHEDULED',
  advisory TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Rain Nowcasts (Doppler Radar & Rain Around You)
CREATE TABLE IF NOT EXISTS public.rain_nowcasts (
  id VARCHAR(64) PRIMARY KEY,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  forecast_minutes INTEGER NOT NULL,
  intensity_dbz NUMERIC(5, 2) NOT NULL,
  expected_rain_rate_mmh NUMERIC(6, 2) NOT NULL,
  confidence NUMERIC(5, 2) DEFAULT 92.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high-speed spatial and time queries
CREATE INDEX IF NOT EXISTS idx_obs_location ON public.weather_observations(location_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_forecasts_location_date ON public.forecasts(location_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_warnings_active ON public.warnings(is_active, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_plans_user ON public.plans(user_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_locations_user ON public.locations(user_id);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rain_nowcasts ENABLE ROW LEVEL SECURITY;

-- 1. Public Weather, Forecasts, Warnings, and Radar data (Read-access for all clients)
CREATE POLICY "Allow read access to weather observations" 
  ON public.weather_observations FOR SELECT USING (true);

CREATE POLICY "Allow write access to weather observations" 
  ON public.weather_observations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access to forecasts" 
  ON public.forecasts FOR SELECT USING (true);

CREATE POLICY "Allow write access to forecasts" 
  ON public.forecasts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access to warnings" 
  ON public.warnings FOR SELECT USING (true);

CREATE POLICY "Allow write access to warnings" 
  ON public.warnings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access to rain nowcasts" 
  ON public.rain_nowcasts FOR SELECT USING (true);

CREATE POLICY "Allow write access to rain nowcasts" 
  ON public.rain_nowcasts FOR ALL USING (true) WITH CHECK (true);

-- 2. User Accounts, Profiles, Locations, and Plans (Read & Write policies)
CREATE POLICY "Allow access to users" 
  ON public.users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow access to user profiles" 
  ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow access to locations" 
  ON public.locations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow access to plans" 
  ON public.plans FOR ALL USING (true) WITH CHECK (true);
