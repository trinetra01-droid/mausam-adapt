export type FreshnessState = 'OFFICIAL_LIVE' | 'OFFICIAL_CACHED' | 'OFFICIAL_STALE' | 'DERIVED_FROM_OFFICIAL' | 'UNAVAILABLE' | 'TEST_FIXTURE';

export type WarningSeverity = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'NONE';

export type UserPersona = 
  | 'HEALTH' 
  | 'FITNESS' 
  | 'COASTAL' 
  | 'TRAVEL' 
  | 'FAMILY' 
  | 'AGRICULTURE' 
  | 'COMMUTER' 
  | 'CONSTRUCTION'
  | 'EVENT PLANNER';

export type ActivityType = 
  | 'RUNNING'
  | 'CYCLING'
  | 'OUTDOOR_EVENT'
  | 'WEDDING'
  | 'FARMING_SPRAY'
  | 'FARMING_HARVEST'
  | 'COASTAL_FISHING'
  | 'BEACH_VISIT'
  | 'COMMUTE'
  | 'CONSTRUCTION_WORK'
  | 'HIGHWAY_TRAVEL'
  | 'OUTDOOR_WALK'
  | 'SPORTS';

export type TransitMode = 'TWO_WHEELER' | 'METRO' | 'TRAIN' | 'CAR_CAB' | 'BUS' | 'AUTO_RICKSHAW' | 'WALK_CYCLE';

export interface CommuterProfile {
  homeLocationName?: string;
  officeLocationName: string;
  workplaceType: 'CORPORATE_OFFICE' | 'CONSTRUCTION_SITE' | 'INDUSTRIAL_PLANT' | 'FIELD_SALES';
  primaryMode: TransitMode;
  secondaryMode: TransitMode;
  morningDepartureTime: string;
  eveningReturnTime: string;
  hasAsthmaOrDustAllergy: boolean;
  routeHazards: string[];
}

export interface LocationRecord {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  country: string;
  timezone: string;
  type: 'home' | 'work' | 'delivery' | 'school' | 'farm' | 'destination' | 'event' | 'beach' | 'custom';
  is_saved?: boolean;
}

export interface WeatherObservation {
  id: string;
  provider: 'IMD' | 'AWS_IMD' | 'ARG_IMD';
  location_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  observed_at: string;
  valid_from: string;
  valid_until: string;
  temperature_c: number;
  feels_like_c: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  wind_direction_cardinal: string;
  rainfall_mm: number;
  pressure_hpa: number;
  visibility_km: number;
  uv_index: number;
  condition_text: string;
  quality: 'VERIFIED' | 'SUSPECT' | 'RAW';
  confidence: number;
  freshness_state: FreshnessState;
  ingestion_time: string;
  source_attribution: {
    source: string;
    organization: string;
    station_name?: string;
    observed_time_ist: string;
    retrieved_time_ist: string;
    official_portal: string;
  };
}

export interface HourlyForecast {
  time: string;
  hour: number;
  temperature_c: number;
  condition_text: string;
  rain_probability_pct: number;
  rainfall_mm: number;
  wind_speed_kmh: number;
  wind_direction_cardinal: string;
  humidity_pct: number;
  uv_index: number;
  comfort_index: number;
}

export interface DailyForecast {
  date: string;
  day_name: string;
  temp_min_c: number;
  temp_max_c: number;
  condition_text: string;
  rain_probability_pct: number;
  rainfall_expected_mm: number;
  wind_speed_kmh: number;
  humidity_pct: number;
  sunrise_ist: string;
  sunset_ist: string;
  subdivision_warning?: WarningSeverity;
}

export interface WeatherForecast {
  location_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  issued_at: string;
  valid_from: string;
  valid_until: string;
  freshness_state: FreshnessState;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  source_attribution: {
    source: string;
    bulletin_type: string;
    official_portal: string;
    retrieved_time_ist: string;
  };
}

export interface WarningRecord {
  id: string;
  provider: 'IMD' | 'INCOIS';
  severity: WarningSeverity;
  warning_type: string;
  title: string;
  message: string;
  affected_area: string;
  district: string;
  state: string;
  valid_from: string;
  valid_until: string;
  issued_at: string;
  bulletin_url?: string;
  bulletin_no?: string;
  freshness_state: FreshnessState;
  is_active: boolean;
}

export interface MarineRecord {
  id: string;
  provider: 'INCOIS';
  coastal_area: string;
  state: string;
  latitude: number;
  longitude: number;
  wave_height_m: number;
  swell_height_m: number;
  wave_period_s: number;
  sea_temp_c: number;
  current_speed_knots: number;
  wind_speed_knots: number;
  warning_text: string;
  safety_status: 'SAFE' | 'CAUTION' | 'DANGEROUS' | 'WARNING_ACTIVE';
  valid_from: string;
  valid_until: string;
  freshness_state: FreshnessState;
  source_attribution: {
    source: string;
    organization: string;
    portal: string;
    last_update_ist: string;
  };
}

export interface AirQualityRecord {
  id: string;
  provider: 'CPCB';
  station_name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  aqi: number;
  category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  prominent_pollutant: string;
  observed_at: string;
  freshness_state: FreshnessState;
  source_attribution: {
    source: string;
    organization: string;
    portal: string;
    recorded_at_ist: string;
  };
}

export interface DecisionResult {
  status: 'OPTIMAL' | 'FAIR' | 'RISKY' | 'AVOID' | 'SAFETY_OVERRIDE';
  score: number;
  activity: ActivityType;
  location_name: string;
  target_time: string;
  recommendation: string;
  reasons: string[];
  risks: string[];
  safety_override?: {
    active: boolean;
    severity: WarningSeverity;
    warning_type: string;
    official_bulletin: string;
    affected_area: string;
    source: string;
  };
  metrics_breakdown: {
    rain_suitability: number;
    temp_suitability: number;
    wind_suitability: number;
    humidity_suitability: number;
    aqi_suitability?: number;
    uv_suitability: number;
    visibility_suitability: number;
  };
  alternative_windows: Array<{
    time: string;
    score: number;
    status: 'OPTIMAL' | 'FAIR' | 'RISKY' | 'AVOID';
    summary: string;
  }>;
  time_slot?: string;
  better_alternative?: {
    recommended_time: string;
    recommended_time_label: string;
    temperature_c?: number;
    shift_action?: string;
  };
  metrics?: {
    temperature_c?: number;
    rain_probability_pct?: number;
    wind_speed_kmh?: number;
    humidity_pct?: number;
  };
  confidence: number;
  sources: string[];
  generated_at: string;
  route_details?: {
    is_route: boolean;
    origin: {
      name: string;
      district: string;
      state: string;
      weather_summary: string;
      warning_level?: WarningSeverity;
    };
    destination: {
      name: string;
      district: string;
      state: string;
      weather_summary: string;
      warning_level?: WarningSeverity;
      active_warning?: WarningRecord;
    };
    corridor_safety_verdict: string;
  };
}

export interface PlanRecord {
  id: string;
  user_id: string;
  title: string;
  activity: ActivityType;
  location_id?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  planned_date: string;
  start_time: string;
  duration_hours: number;
  status: 'SCHEDULED' | 'CONFLICT_DETECTED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED';
  decision_result?: DecisionResult;
  has_conflict: boolean;
  conflict_details?: {
    original_score: number;
    current_score: number;
    detected_risk: string;
    forecast_change: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ProviderStatus {
  provider_id: string;
  name: string;
  agency: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE' | 'AUTH_REQUIRED';
  endpoint: string;
  last_success_at: string | null;
  last_error_at: string | null;
  error_message: string | null;
  latency_ms: number;
  consecutive_failures: number;
  compliance_mode: string;
}
