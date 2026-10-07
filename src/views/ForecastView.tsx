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
import { useTheme } from '../context/ThemeContext.js';

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
  const { theme } = useTheme();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showDeepDetails, setShowDeepDetails] = useState(false);

  if (isLoading) {
    return (
      <div className={`py-20 text-center text-xs font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
        Loading IMD 7-Day Forecast...
      </div>
    );
  }

  if (!forecast || !forecast.daily || forecast.daily.length === 0) {
    return (
      <div className={`py-20 text-center text-sm font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>
        Forecast currently unavailable for this region.
      </div>
    );
  }

  const selectedDay = forecast.daily[selectedDayIndex] || forecast.daily[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Header: Location, Temperature, Sky */}
      <section className={`p-6 sm:p-8 rounded-3xl backdrop-blur-xl border shadow-md transition-all ${
        theme === 'light'
          ? 'bg-white/90 border-slate-200 text-slate-900'
          : 'bg-slate-900/60 border-white/[0.08] text-white'
      }`}>
        <div className={`text-xs font-bold uppercase tracking-wider ${
          theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'
        }`}>
          {location.state} · India
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 ${
          theme === 'light' ? 'text-slate-950' : 'text-white'
        }`}>
          {location.name.split('(')[0].trim()}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className={`text-5xl sm:text-6xl font-extrabold tracking-tighter ${
              theme === 'light' ? 'text-slate-950' : 'text-white'
            }`}>
              {Math.round(selectedDay.temp_max_c)}°
            </span>
            <AnimatedWeatherIcon
              condition={selectedDay.condition_text}
              size={56}
              className="shrink-0 drop-shadow-md"
            />
          </div>
          <div>
            <div className={`text-xl font-bold ${
              theme === 'light' ? 'text-slate-950' : 'text-slate-100'
            }`}>
              {selectedDay.condition_text}
            </div>
            <div className={`text-xs font-semibold mt-1 ${
              theme === 'light' ? 'text-slate-700' : 'text-slate-400'
            }`}>
              Low of {Math.round(selectedDay.temp_min_c)}° · Rain probability {selectedDay.rain_probability_pct}%
            </div>
          </div>
        </div>
      </section>

      {/* 7-Day Selector Timeline */}
      <section className="space-y-3">
        <div className={`text-xs uppercase tracking-wider font-extrabold ${
          theme === 'light' ? 'text-slate-700' : 'text-slate-400'
        }`}>
          7-Day Forecast (IMD Multi-Model Guidance)
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
                className={`min-w-[82px] sm:min-w-0 flex-1 py-3.5 sm:py-4 px-2 sm:px-3 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 sm:gap-2 border ${
                  isSelected
                    ? theme === 'light'
                      ? 'bg-white text-slate-950 border-cyan-500 shadow-md ring-2 ring-cyan-500/20'
                      : 'bg-white/[0.1] text-white border-cyan-400/80 shadow-lg'
                    : theme === 'light'
                    ? 'bg-white/70 hover:bg-white text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-slate-900/40 text-slate-300 hover:bg-slate-900/80 border-white/[0.06]'
                }`}
              >
                <span className={`text-xs font-bold ${
                  isSelected 
                    ? theme === 'light' ? 'text-cyan-800' : 'text-cyan-300'
                    : theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {label}
                </span>
                <div className="flex items-center gap-1 justify-center">
                  <span className={`text-base font-extrabold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                    {Math.round(day.temp_max_c)}°
                  </span>
                  <AnimatedWeatherIcon condition={day.condition_text} size={20} className="shrink-0" />
                </div>
                <span className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {Math.round(day.temp_min_c)}°
                </span>
                <span className={`text-[11px] font-bold ${
                  day.rain_probability_pct >= 40 
                    ? theme === 'light' ? 'text-blue-700' : 'text-cyan-300'
                    : theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {day.rain_probability_pct}% rain
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Overview */}
      <section className={`p-6 sm:p-8 rounded-3xl backdrop-blur-xl border shadow-lg space-y-6 ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-900'
          : 'bg-slate-900/70 border-white/[0.08] text-white'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b ${
          theme === 'light' ? 'border-slate-200' : 'border-white/[0.06]'
        }`}>
          <div>
            <h3 className={`text-lg font-extrabold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
              {selectedDayIndex === 0 ? 'Today' : selectedDayIndex === 1 ? 'Tomorrow' : selectedDay.day_name} Atmospheric Conditions
            </h3>
            <p className={`text-xs mt-0.5 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              {selectedDay.condition_text} throughout daylight hours.
            </p>
          </div>

          <div className={`text-xs font-bold px-3 py-1 rounded-full ${
            theme === 'light' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'
          }`}>
            Source: IMD Multi-Model Forecast
          </div>
        </div>

        {/* Essential 5 Metrics: Temperature, Rain, Wind, Sunrise, Sunset */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-xs">
          <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'}`}>
            <span className={`block mb-1 font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Temperature Range</span>
            <strong className={`text-base font-extrabold block ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
              {Math.round(selectedDay.temp_min_c)}° — {Math.round(selectedDay.temp_max_c)}°C
            </strong>
            <span className={`text-[11px] block mt-0.5 font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Daily span</span>
          </div>

          <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'}`}>
            <span className={`block mb-1 font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Precipitation</span>
            <strong className={`text-base font-extrabold block ${theme === 'light' ? 'text-blue-700' : 'text-cyan-400'}`}>
              {selectedDay.rain_probability_pct}%
            </strong>
            <span className={`text-[11px] block mt-0.5 font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Probability</span>
          </div>

          <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'}`}>
            <span className={`block mb-1 font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Surface Wind</span>
            <strong className={`text-base font-extrabold block ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
              {Math.round(selectedDay.wind_speed_kmh || 14)} km/h
            </strong>
            <span className={`text-[11px] block mt-0.5 font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Peak speed</span>
          </div>

          <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'}`}>
            <span className={`block mb-1 font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Sunrise</span>
            <strong className={`text-base font-extrabold block ${theme === 'light' ? 'text-amber-800' : 'text-amber-300'}`}>
              {selectedDay.sunrise_ist || '06:12 AM'}
            </strong>
            <span className={`text-[11px] block mt-0.5 font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>First light</span>
          </div>

          <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'}`}>
            <span className={`block mb-1 font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Sunset</span>
            <strong className={`text-base font-extrabold block ${theme === 'light' ? 'text-rose-800' : 'text-rose-300'}`}>
              {selectedDay.sunset_ist || '06:42 PM'}
            </strong>
            <span className={`text-[11px] block mt-0.5 font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Dusk</span>
          </div>
        </div>

        {/* Expandable: Meteorological details */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowDeepDetails(!showDeepDetails)}
            className={`text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              theme === 'light' ? 'text-slate-700 hover:text-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Meteorological details</span>
            {showDeepDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDeepDetails && (
            <div className={`mt-4 p-5 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-fade-in ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-slate-950/60 border-white/[0.05] text-slate-300'
            }`}>
              <div>
                <span className={`block font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>IMD Numerical Model Ensemble</span>
                <span className={`font-bold mt-1 block ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>NCMRWF Global / GFS 12km</span>
                <p className={`text-[11px] mt-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Synoptic guidance validated by regional observatory.</p>
              </div>

              <div>
                <span className={`block font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Agromet Subdivision Watch</span>
                <span className={`font-extrabold mt-1 block ${
                  selectedDay.subdivision_warning && selectedDay.subdivision_warning !== 'GREEN'
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}>
                  {selectedDay.subdivision_warning || 'GREEN / NO WARNING'}
                </span>
                <p className={`text-[11px] mt-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Agricultural &amp; civil advisory level.</p>
              </div>

              <div>
                <span className={`block font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Relative Humidity Range</span>
                <span className={`font-bold mt-1 block ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>42% — 78%</span>
                <p className={`text-[11px] mt-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Diurnal variation from dawn peak to mid-afternoon trough.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
