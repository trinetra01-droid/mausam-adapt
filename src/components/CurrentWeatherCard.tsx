import React from 'react';
import { 
  CloudSun, 
  CloudMoon,
  Droplets, 
  Wind, 
  Compass, 
  Gauge, 
  Eye, 
  Sun, 
  Moon,
  CloudRain, 
  CloudFog,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { WeatherObservation } from '../types.js';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon.js';

interface CurrentWeatherCardProps {
  observation: WeatherObservation | null;
  isLoading: boolean;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  observation,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-mono text-slate-400">Querying IMD Regional Observatory...</span>
        </div>
      </div>
    );
  }

  if (!observation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
        Official observation currently unavailable for this station coordinates.
      </div>
    );
  }

  const isLive = observation.freshness_state === 'OFFICIAL_LIVE';
  const isCached = observation.freshness_state === 'OFFICIAL_CACHED';

  const getWeatherIcon = (condition: string, uv: number) => {
    const c = condition.toLowerCase();
    const isNight = c.includes('night') || uv === 0;

    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return <CloudRain className="w-12 h-12 text-cyan-400" />;
    }
    if (c.includes('fog') || c.includes('mist') || c.includes('haze')) {
      return <CloudFog className="w-12 h-12 text-slate-400" />;
    }
    if (isNight) {
      if (c.includes('cloud')) {
        return <CloudMoon className="w-12 h-12 text-indigo-300" />;
      }
      return <Moon className="w-12 h-12 text-indigo-300" />;
    }
    if (c.includes('cloud')) {
      return <CloudSun className="w-12 h-12 text-cyan-400" />;
    }
    return <Sun className="w-12 h-12 text-amber-400" />;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm">
      {/* Attribution & Freshness Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-white">
            {observation.source_attribution.source}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-400 truncate">
            {observation.source_attribution.station_name || observation.location_name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
            isLive 
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
              : isCached 
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'bg-slate-800 text-slate-300'
          }`}>
            {observation.freshness_state}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Observed: {observation.source_attribution.observed_time_ist}
          </span>
        </div>
      </div>

      {/* Main Meteorological Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-800">
        {/* Primary Temperature & Condition */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            {getWeatherIcon(observation.condition_text, observation.uv_index)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-baseline">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono tabular-nums text-white">
                  {Math.round(observation.temperature_c * 10) / 10}
                </span>
                <span className="text-xl font-light text-slate-400 ml-1">°C</span>
              </div>
              <AnimatedWeatherIcon
                condition={observation.condition_text}
                isDay={observation.uv_index > 0}
                size={40}
                className="shrink-0"
              />
            </div>
            <p className="text-sm font-medium text-slate-300 mt-1">
              {observation.condition_text}
            </p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Feels like {Math.round(observation.feels_like_c * 10) / 10}°C
            </p>
          </div>
        </div>

        {/* Core Secondary Variables */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-lg">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Humidity</span>
            </div>
            <div className="text-base font-bold font-mono tabular-nums text-white">
              {Math.round(observation.humidity_pct)}<span className="text-xs font-normal text-slate-400 ml-0.5">%</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-lg">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Wind Speed</span>
            </div>
            <div className="text-base font-bold font-mono tabular-nums text-white">
              {Math.round(observation.wind_speed_kmh)}<span className="text-xs font-normal text-slate-400 ml-1">km/h</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-lg">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direction</span>
            </div>
            <div className="text-base font-bold font-mono text-white truncate">
              {observation.wind_direction_cardinal} <span className="text-xs font-normal text-slate-400">({observation.wind_direction_deg}°)</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-lg">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
              <span>Past 24h Rain</span>
            </div>
            <div className="text-base font-bold font-mono tabular-nums text-white">
              {observation.rainfall_mm}<span className="text-xs font-normal text-slate-400 ml-1">mm</span>
            </div>
          </div>
        </div>

        {/* Tertiary Atmospheric Variables */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-lg">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span>Pressure</span>
            </div>
            <div className="text-base font-bold font-mono tabular-nums text-white">
              {Math.round(observation.pressure_hpa)}<span className="text-xs font-normal text-slate-400 ml-1">hPa</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-lg">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Visibility</span>
            </div>
            <div className="text-base font-bold font-mono tabular-nums text-white">
              {observation.visibility_km}<span className="text-xs font-normal text-slate-400 ml-1">km</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-lg">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              {observation.uv_index === 0 ? (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>UV Index</span>
            </div>
            <div className="text-base font-bold font-mono tabular-nums text-white">
              {observation.uv_index}{observation.uv_index === 0 && <span className="text-xs font-normal text-indigo-300/80 font-sans ml-1">(Night)</span>}
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-850 rounded-lg">
            <div className="text-slate-400 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Quality</span>
            </div>
            <div className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1">
              <span>{observation.quality}</span>
              <span className="text-slate-400 font-normal">({observation.confidence}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Footnote & Portal Verification Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 text-xs text-slate-400">
        <div className="text-[11px]">
          <span>{observation.source_attribution.organization}</span>
          <span className="mx-1.5">·</span>
          <span>IMD National Weather Forecasting Centre (NWFC)</span>
        </div>
        <div>
          <a
            href={observation.source_attribution.official_portal}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 text-[11px] hover:underline"
          >
            <span>Verify on Official Mausam Portal</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
};
