import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { CloudRain, Droplets, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { HourlyForecast } from '../types.js';

interface PrecipitationChartProps {
  hourly?: HourlyForecast[];
  theme?: 'light' | 'dark';
  currentHour?: number;
}

export const PrecipitationChart: React.FC<PrecipitationChartProps> = ({
  hourly = [],
  theme = 'dark',
  currentHour = new Date().getHours()
}) => {
  const [viewMode, setViewMode] = useState<'probability' | 'intensity' | 'combined'>('combined');

  // Format and process hourly forecast data (next 12 to 24 hours) with hours and minutes
  const chartData = useMemo(() => {
    if (!hourly || hourly.length === 0) {
      // Fallback sensible sample if data is still loading
      return Array.from({ length: 12 }, (_, i) => {
        const h = (currentHour + i) % 24;
        const hr12 = h % 12 === 0 ? 12 : h % 12;
        const timeStr = `${String(hr12).padStart(2, '0')}:00 ${h >= 12 ? 'PM' : 'AM'}`;
        return {
          time: timeStr,
          hour: h,
          pop: 0,
          rainfall: 0,
          temp: 28,
          condition: 'Clear'
        };
      });
    }

    return hourly.slice(0, 16).map((slot) => {
      const h = slot.hour ?? 0;
      let timeStr = slot.time || '';
      let minStr = '00';
      if (timeStr && timeStr.includes(':')) {
        const parts = timeStr.split(':');
        const hr = parseInt(parts[0], 10);
        minStr = parts[1] ? parts[1].replace(/[^0-9]/g, '').slice(0, 2) || '00' : '00';
        const parsedH = !isNaN(hr) ? hr : h;
        const hr12 = parsedH % 12 === 0 ? 12 : parsedH % 12;
        timeStr = `${String(hr12).padStart(2, '0')}:${minStr} ${parsedH >= 12 ? 'PM' : 'AM'}`;
      } else {
        const hr12 = h % 12 === 0 ? 12 : h % 12;
        timeStr = `${String(hr12).padStart(2, '0')}:00 ${h >= 12 ? 'PM' : 'AM'}`;
      }

      const pop = Math.min(100, Math.max(0, slot.rain_probability_pct ?? 0));
      const rainfall = Math.max(0, Number((slot.rainfall_mm ?? 0).toFixed(1)));

      return {
        time: timeStr,
        hour: h,
        pop,
        rainfall,
        temp: Math.round(slot.temperature_c ?? 28),
        condition: slot.condition_text || 'Clear'
      };
    });
  }, [hourly, currentHour]);

  // Derived precipitation statistics
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        maxPop: 0,
        peakTime: '--',
        totalExpectedRain: 0
      };
    }

    let maxPop = 0;
    let peakTime = chartData[0].time;
    let totalExpectedRain = 0;

    chartData.forEach((d) => {
      if (d.pop > maxPop) {
        maxPop = d.pop;
        peakTime = d.time;
      }
      totalExpectedRain += d.rainfall;
    });

    return {
      maxPop,
      peakTime,
      totalExpectedRain: Number(totalExpectedRain.toFixed(1))
    };
  }, [chartData]);

  const isLight = theme === 'light';

  // Styling parameters based on theme
  const gridStroke = isLight ? 'rgba(203, 213, 225, 0.45)' : 'rgba(255, 255, 255, 0.06)';
  const tickColor = isLight ? '#64748b' : '#94a3b8';

  // Custom high-fidelity Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const popVal = data.pop;
      const rainVal = data.rainfall;
      const isHeavy = rainVal >= 4 || popVal >= 65;
      const isModerate = rainVal >= 1.5 || popVal >= 40;

      return (
        <div
          className={`p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 border min-w-[210px] ${
            isLight
              ? 'bg-white/95 text-slate-900 border-slate-200/90 shadow-slate-300/40 backdrop-blur-xl'
              : 'bg-slate-900/95 text-white border-white/10 shadow-black/60 backdrop-blur-xl'
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b pb-2 border-slate-200/60 dark:border-white/10">
            <span className="font-bold text-sm tracking-tight">{data.time}</span>
            <span className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400">
              {data.temp}°C · {data.condition}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-cyan-500" />
                Rain Probability:
              </span>
              <span className={`font-bold ${popVal > 60 ? 'text-amber-500' : popVal > 25 ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {popVal}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                Precipitation Rate:
              </span>
              <span className={`font-bold ${rainVal > 3 ? 'text-rose-500' : rainVal > 0.5 ? 'text-blue-500' : 'text-slate-600 dark:text-slate-400'}`}>
                {rainVal > 0 ? `${rainVal} mm/hr` : '0 mm'}
              </span>
            </div>

            {/* Precipitation Hazard Assessment */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/10">
              <div className="text-[11px] flex items-start gap-1.5">
                {isHeavy ? (
                  <>
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      Condition: <strong>Heavy Precipitation</strong> (Waterlogging &amp; splash hazard)
                    </span>
                  </>
                ) : isModerate ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Condition: <strong>Scattered Showers</strong> (Wet surfaces, light drizzle)
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Condition: <strong>Clear / Dry Skies</strong> (No precipitation expected)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`p-5 sm:p-6 rounded-3xl transition-all shadow-xl backdrop-blur-xl border ${
        isLight
          ? 'bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-200/60'
          : 'bg-slate-900/60 border-white/[0.08] text-white shadow-black/40'
      }`}
    >
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-cyan-500" />
            <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Hourly Precipitation Probability &amp; Rain Intensity
            </h3>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Rain likelihood and expected precipitation rate across the upcoming forecast window
          </p>
        </div>

        {/* View Mode Pills */}
        <div className={`flex items-center p-1 rounded-xl border self-start sm:self-auto text-xs font-medium ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.04] border-white/10'
        }`}>
          <button
            type="button"
            onClick={() => setViewMode('probability')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'probability'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Probability (%)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('intensity')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'intensity'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Intensity (mm)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('combined')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'combined'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Combined
          </button>
        </div>
      </div>

      {/* Precipitation Summary Strip */}
      <div className={`mt-4 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs border ${
        stats.maxPop >= 50
          ? isLight
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
          : isLight
            ? 'bg-slate-50/80 border-slate-200 text-slate-800'
            : 'bg-white/[0.03] border-white/10 text-slate-300'
      }`}>
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>
            {stats.maxPop > 0
              ? `Peak precipitation probability is ${stats.maxPop}% at ${stats.peakTime}.`
              : 'No precipitation expected in the upcoming forecast window.'}
            {stats.totalExpectedRain > 0 && ` Cumulative expected rainfall: ${stats.totalExpectedRain.toFixed(1)} mm.`}
          </span>
        </div>
        <div className="text-[11px] font-medium opacity-75 shrink-0">
          {stats.maxPop <= 20 ? 'Low rain likelihood' : stats.maxPop <= 50 ? 'Moderate rain probability' : 'High rain probability'}
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="h-56 sm:h-64 w-full mt-5">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'probability' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="popGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isLight ? '#0284c7' : '#38bdf8'} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={isLight ? '#0284c7' : '#38bdf8'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="time" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Rain Hazard (>65%)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
              <Area
                type="monotone"
                dataKey="pop"
                stroke={isLight ? '#0284c7' : '#38bdf8'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#popGradient)"
                name="Rain Probability"
              />
            </AreaChart>
          ) : viewMode === 'intensity' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="time" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} unit="mm" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Heavy Rain (>3mm)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
              <Bar
                dataKey="rainfall"
                fill={isLight ? '#0ea5e9' : '#38bdf8'}
                radius={[6, 6, 0, 0]}
                name="Rain Intensity"
              />
            </BarChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="combinedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isLight ? '#0284c7' : '#38bdf8'} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={isLight ? '#0284c7' : '#38bdf8'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="time" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" domain={[0, 100]} tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} unit="mm" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine yAxisId="left" y={65} stroke="#f59e0b" strokeDasharray="4 4" />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="pop"
                stroke={isLight ? '#0284c7' : '#38bdf8'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#combinedGradient)"
                name="Rain Probability"
              />
              <Bar
                yAxisId="right"
                dataKey="rainfall"
                fill={isLight ? '#2563eb' : '#60a5fa'}
                opacity={0.65}
                radius={[4, 4, 0, 0]}
                name="Rainfall Rate"
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Guidance Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
            <span>Rain Probability (%)</span>
          </div>
          {viewMode !== 'probability' && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
              <span>Rainfall Rate (mm/hr)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span>Heavy rain (&gt;4 mm/hr or &gt;65%) indicates acute waterlogging and reduced surface friction.</span>
        </div>
      </div>
    </div>
  );
};
