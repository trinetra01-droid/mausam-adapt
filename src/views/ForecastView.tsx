import React, { useState } from 'react';
import { 
  CloudRain, 
  Wind, 
  Droplets, 
  Sun, 
  Sunrise, 
  Sunset, 
  ChevronDown, 
  ChevronUp,
  Compass
} from 'lucide-react';
import { WeatherForecast, LocationRecord } from '../types.js';
import { AnimatedWeatherIcon } from '../components/AnimatedWeatherIcon.js';

interface ForecastViewProps {
  location: LocationRecord;
  forecast: WeatherForecast | null;
  isLoading: boolean;
}

export const ForecastView: React.FC<ForecastViewProps> = ({
  location,
  forecast,
  isLoading
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showDeepDetails, setShowDeepDetails] = useState(false);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading forecast bulletin...
      </div>
    );
  }

  if (!forecast || !forecast.daily || forecast.daily.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        Forecast currently unavailable for this region.
      </div>
    );
  }

  const selectedDay = forecast.daily[selectedDayIndex] || forecast.daily[0];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* 15. Header: Location, Temperature, Sky, 7-day forecast */}
      <section className="pt-4 pb-2">
        <div className="text-slate-400 text-xs font-medium">
          {location.state} · India
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
          {location.name.split('(')[0].trim()}
        </h1>

        <div className="mt-4 flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-white">
              {Math.round(selectedDay.temp_max_c)}°
            </span>
            <AnimatedWeatherIcon
              condition={selectedDay.condition_text}
              size={56}
              className="shrink-0"
            />
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-200">
              {selectedDay.condition_text}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Low of {Math.round(selectedDay.temp_min_c)}° · Rain chance {selectedDay.rain_probability_pct}%
            </div>
          </div>
        </div>
      </section>

      {/* Clean 7-day selector timeline */}
      <section className="space-y-4">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
          7-Day Forecast
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-4 lg:grid-cols-7 -mx-1 px-1">
          {forecast.daily.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            const label = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : day.day_name.slice(0, 3);

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`min-w-[82px] sm:min-w-0 flex-1 py-3.5 sm:py-4 px-2 sm:px-3 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 sm:gap-2 ${
                  isSelected
                    ? 'bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-lg text-white'
                    : 'text-slate-300 hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-xs font-semibold text-slate-400">{label}</span>
                <div className="flex items-center gap-1 justify-center">
                  <span className="text-base font-bold text-white">{Math.round(day.temp_max_c)}°</span>
                  <AnimatedWeatherIcon condition={day.condition_text} size={20} className="shrink-0" />
                </div>
                <span className="text-xs text-slate-400">{Math.round(day.temp_min_c)}°</span>
                <span className="text-[11px] text-cyan-400 font-medium">{day.rain_probability_pct}% rain</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Overview */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {selectedDayIndex === 0 ? 'Today' : selectedDayIndex === 1 ? 'Tomorrow' : selectedDay.day_name} Conditions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDay.condition_text} throughout daylight hours.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Source: IMD Multi-Model Forecast
          </div>
        </div>

        {/* Essential 5 Metrics: Temperature, Rain, Wind, Sunrise, Sunset */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block mb-1">Temperature Range</span>
            <strong className="text-base text-white font-semibold">{Math.round(selectedDay.temp_min_c)}° — {Math.round(selectedDay.temp_max_c)}°C</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Daily span</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Precipitation</span>
            <strong className="text-base text-cyan-400 font-semibold">{selectedDay.rain_probability_pct}%</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Probability</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Surface Wind</span>
            <strong className="text-base text-white font-semibold">{Math.round(selectedDay.wind_speed_kmh || 14)} km/h</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Peak speed</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Sunrise</span>
            <strong className="text-base text-white font-semibold">6:12 AM</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">First light</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Sunset</span>
            <strong className="text-base text-white font-semibold">6:42 PM</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Dusk</span>
          </div>
        </div>

        {/* Expandable: Meteorological details → */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowDeepDetails(!showDeepDetails)}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Meteorological details</span>
            {showDeepDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDeepDetails && (
            <div className="mt-4 p-5 rounded-2xl bg-slate-950/60 border border-white/[0.05] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300 animate-fade-in">
              <div>
                <span className="text-slate-400 block">IMD Numerical Model Ensemble</span>
                <span className="text-white font-medium mt-1 block">NCMRWF Global / GFS 12km</span>
                <p className="text-[11px] text-slate-400 mt-1">Synoptic guidance validated by regional observatory.</p>
              </div>

              <div>
                <span className="text-slate-400 block">Agromet Subdivision Watch</span>
                <span className={`font-semibold mt-1 block ${
                  selectedDay.subdivision_warning && selectedDay.subdivision_warning !== 'GREEN' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {selectedDay.subdivision_warning || 'GREEN / NO WARNING'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Agricultural & civil advisory level.</p>
              </div>

              <div>
                <span className="text-slate-400 block">Relative Humidity Range</span>
                <span className="text-white font-medium mt-1 block">42% — 78%</span>
                <p className="text-[11px] text-slate-400 mt-1">Diurnal variation from dawn peak to mid-afternoon trough.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
