import React from 'react';
import { Wind, Activity, Info, ShieldCheck, AlertCircle } from 'lucide-react';
import { AirQualityRecord } from '../types.js';

interface AirQualityCardProps {
  airQuality: AirQualityRecord | null;
  isLoading: boolean;
}

export const AirQualityCard: React.FC<AirQualityCardProps> = ({
  airQuality,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-48 flex items-center justify-center">
        <span className="text-xs font-mono text-slate-400">Loading CPCB CAAQMS air quality...</span>
      </div>
    );
  }

  if (!airQuality) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-400 text-xs">
        Official CPCB Air Quality monitoring station data unavailable for this area.
      </div>
    );
  }

  const categoryColors = {
    Good: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    Satisfactory: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
    Moderate: 'text-yellow-400 bg-yellow-950/60 border-yellow-800',
    Poor: 'text-amber-400 bg-amber-950/60 border-amber-800',
    'Very Poor': 'text-rose-400 bg-rose-950/60 border-rose-800',
    Severe: 'text-red-500 bg-red-950/80 border-red-800 font-extrabold'
  };

  const badgeClass = categoryColors[airQuality.category] || 'text-slate-300 bg-slate-800';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span>National Air Quality Index (AQI)</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Source: CPCB CAAQMS
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-800">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono tabular-nums text-white">
              {airQuality.aqi}
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${badgeClass}`}>
              {airQuality.category}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Station: <strong className="text-white">{airQuality.station_name}</strong>
          </p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Prominent Pollutant: {airQuality.prominent_pollutant}
          </p>
        </div>

        {/* Core Pollutants */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-slate-950 border border-slate-850 rounded">
            <span className="text-[10px] text-slate-400 block font-mono">PM2.5</span>
            <strong className="text-white font-mono tabular-nums">{airQuality.pm25}</strong>
            <span className="text-[10px] text-slate-400 ml-0.5">µg/m³</span>
          </div>

          <div className="p-2 bg-slate-950 border border-slate-850 rounded">
            <span className="text-[10px] text-slate-400 block font-mono">PM10</span>
            <strong className="text-white font-mono tabular-nums">{airQuality.pm10}</strong>
            <span className="text-[10px] text-slate-400 ml-0.5">µg/m³</span>
          </div>

          <div className="p-2 bg-slate-950 border border-slate-850 rounded">
            <span className="text-[10px] text-slate-400 block font-mono">NO₂</span>
            <strong className="text-white font-mono tabular-nums">{airQuality.no2}</strong>
            <span className="text-[10px] text-slate-400 ml-0.5">µg/m³</span>
          </div>
        </div>
      </div>

      {/* Mandatory Pollen Source Policy Compliance Notice */}
      <div className="pt-3 flex items-start gap-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Pollen data:</strong> Unavailable. Official Central Pollution Control Board stations do not provide automated pollen telemetry. Fabrication prohibited.
        </span>
      </div>
    </div>
  );
};
