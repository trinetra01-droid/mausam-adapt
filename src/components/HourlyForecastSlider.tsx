import React from 'react';
import { CloudRain, Wind, Droplets } from 'lucide-react';
import { HourlyForecast } from '../types.js';

interface HourlyForecastSliderProps {
  hourly: HourlyForecast[];
  onSelectHour?: (hour: number) => void;
  selectedHour?: number;
}

export const HourlyForecastSlider: React.FC<HourlyForecastSliderProps> = ({
  hourly,
  onSelectHour,
  selectedHour
}) => {
  if (!hourly || hourly.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-8 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Hourly Meteorological Sequence (Mausamgram)
          </h3>
          <p className="text-xs text-slate-400">
            24-hour diurnal temperature, precipitation probability, and atmospheric comfort curve
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Source: IMD City Numerical Weather Prediction (NWP)
        </div>
      </div>

      {/* Horizontal Scrollable Hourly Slider */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {hourly.map((slot) => {
          const isSelected = selectedHour === slot.hour;
          return (
            <button
              key={slot.time}
              onClick={() => onSelectHour && onSelectHour(slot.hour)}
              className={`flex flex-col items-center min-w-[88px] sm:min-w-[96px] p-3 rounded-lg border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/40'
                  : 'bg-slate-950/70 border-slate-850 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] font-mono text-slate-400 font-semibold mb-1">
                {slot.time.split(' ')[0]}
              </span>

              <div className="text-base font-bold font-mono tabular-nums text-white my-1">
                {Math.round(slot.temperature_c)}°C
              </div>

              <div className="text-[10px] text-slate-400 truncate max-w-[80px] mb-2" title={slot.condition_text}>
                {slot.condition_text}
              </div>

              {/* Rain Chance */}
              <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 mb-1">
                <CloudRain className="w-3 h-3" />
                <span className="tabular-nums">{slot.rain_probability_pct}%</span>
              </div>

              {/* Wind Speed */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                <Wind className="w-3 h-3 text-slate-400" />
                <span className="tabular-nums">{slot.wind_speed_kmh} km/h</span>
              </div>

              {/* Comfort Indicator */}
              <div className="w-full mt-2 pt-1.5 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Comfort</span>
                <span className={`font-semibold ${slot.comfort_index >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {slot.comfort_index}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
