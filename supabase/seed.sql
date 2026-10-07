-- ==============================================================================
-- Mausam Adapt - Sample Starter Data Seed
-- Run this in your Supabase SQL Editor if you want to populate initial sample data!
-- ==============================================================================

-- 1. Sample Locations (Major Indian cities)
INSERT INTO public.locations (id, user_id, name, latitude, longitude, district, state, country, timezone, type, is_saved)
VALUES
  ('loc_delhi', 'default_user', 'New Delhi', 28.6139, 77.2090, 'New Delhi', 'Delhi', 'India', 'Asia/Kolkata', 'city', true),
  ('loc_mumbai', 'default_user', 'Mumbai', 19.0760, 72.8777, 'Mumbai Suburban', 'Maharashtra', 'India', 'Asia/Kolkata', 'city', true),
  ('loc_bengaluru', 'default_user', 'Bengaluru', 12.9716, 77.5946, 'Bengaluru Urban', 'Karnataka', 'India', 'Asia/Kolkata', 'city', true),
  ('loc_kolkata', 'default_user', 'Kolkata', 22.5726, 88.3639, 'Kolkata', 'West Bengal', 'India', 'Asia/Kolkata', 'city', true),
  ('loc_chennai', 'default_user', 'Chennai', 13.0827, 80.2707, 'Chennai', 'Tamil Nadu', 'India', 'Asia/Kolkata', 'city', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Sample Weather Observations
INSERT INTO public.weather_observations (
  id, provider, location_id, location_name, district, state, latitude, longitude,
  observed_at, valid_from, valid_until, temperature_c, feels_like_c, humidity_pct,
  wind_speed_kmh, wind_direction_deg, wind_direction_cardinal, rainfall_mm, pressure_hpa,
  visibility_km, uv_index, condition_text, quality, confidence, freshness_state
) VALUES
  ('obs_delhi_now', 'IMD_AWS', 'loc_delhi', 'New Delhi', 'New Delhi', 'Delhi', 28.6139, 77.2090,
   NOW(), NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '45 minutes', 27.5, 28.2, 58.0, 12.4, 290.0, 'WNW', 0.0, 1012.0, 4.5, 6.2, 'Partly Cloudy', 'VERIFIED', 96.5, 'OFFICIAL_LIVE'),
  ('obs_mumbai_now', 'IMD_AWS', 'loc_mumbai', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', 19.0760, 72.8777,
   NOW(), NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '50 minutes', 31.0, 36.5, 78.0, 18.2, 240.0, 'WSW', 1.2, 1009.5, 6.0, 8.0, 'Humid & Scattered Clouds', 'VERIFIED', 98.0, 'OFFICIAL_LIVE'),
  ('obs_blr_now', 'IMD_AWS', 'loc_bengaluru', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', 12.9716, 77.5946,
   NOW(), NOW() - INTERVAL '20 minutes', NOW() + INTERVAL '40 minutes', 24.8, 25.0, 62.0, 14.0, 110.0, 'ESE', 0.0, 1015.0, 8.0, 7.1, 'Breezy & Pleasant', 'VERIFIED', 95.0, 'OFFICIAL_LIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. Sample Forecasts
INSERT INTO public.forecasts (
  id, location_id, location_name, issued_at, forecast_date, forecast_hour,
  temp_min_c, temp_max_c, temp_day_c, condition_text, precipitation_probability,
  rainfall_expected_mm, wind_speed_kmh, humidity_pct, confidence, provider
) VALUES
  ('fc_delhi_d1', 'loc_delhi', 'New Delhi', NOW(), CURRENT_DATE, 12, 19.0, 31.5, 28.0, 'Sunny with light haze', 10.0, 0.0, 10.5, 52.0, 94.0, 'IMD_WRF'),
  ('fc_delhi_d2', 'loc_delhi', 'New Delhi', NOW(), CURRENT_DATE + INTERVAL '1 day', 12, 20.0, 32.0, 28.5, 'Clear skies', 5.0, 0.0, 11.0, 48.0, 92.0, 'IMD_WRF'),
  ('fc_mumbai_d1', 'loc_mumbai', 'Mumbai', NOW(), CURRENT_DATE, 12, 26.0, 33.0, 30.5, 'Light coastal showers', 65.0, 6.5, 20.0, 82.0, 91.0, 'IMD_GFS'),
  ('fc_blr_d1', 'loc_bengaluru', 'Bengaluru', NOW(), CURRENT_DATE, 12, 18.5, 27.0, 24.5, 'Passing afternoon drizzle', 40.0, 2.0, 15.0, 65.0, 89.0, 'IMD_GFS')
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Weather Warnings
INSERT INTO public.warnings (
  id, source, category, severity, headline, description, area_name, start_time, end_time, action_recommended, is_active
) VALUES
  ('warn_coastal_1', 'IMD_MOW', 'Heavy Rainfall', 'Moderate', 'Scattered heavy showers along North Konkan coast',
   'Moisture influx from Arabian Sea causing isolated spells of moderate to heavy rain and gusty winds.', 'Mumbai & Thane',
   NOW(), NOW() + INTERVAL '24 hours', 'Carry rain protection; check local suburban transit status before commuting.', true)
ON CONFLICT (id) DO NOTHING;
