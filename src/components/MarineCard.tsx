import React from 'react';
import { Waves, Compass, Thermometer, AlertTriangle, ShieldCheck, Anchor } from 'lucide-react';
import { MarineRecord } from '../types.js';

interface MarineCardProps {
  marine: MarineRecord | null;
  isLoading: boolean;
}

export const MarineCard: React.FC<MarineCardProps> = ({
  marine,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-48 flex items-center justify-center">
        <span className="text-xs font-mono text-slate-400">Querying INCOIS Ocean Information Services...</span>
      </div>
    );
  }

  if (!marine) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-400 text-xs">
        Non-coastal station coordinates. INCOIS Ocean State Services apply to coastal and maritime sectors.
      </div>
    );
  }

  const isWarning = marine.safety_status === 'CAUTION' || marine.safety_status === 'WARNING_ACTIVE';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <Anchor className="w-4 h-4 text-cyan-400" />
          <span>INCOIS Ocean State & Coastal Dynamics</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Source: INCOIS / MoES
        </div>
      </div>

      <div className="py-4 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">{marine.coastal_area}</h4>
            <p className="text-xs text-slate-300 mt-0.5">{marine.warning_text}</p>
          </div>
          <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase border self-start sm:self-auto ${
            isWarning 
              ? 'bg-amber-950 text-amber-300 border-amber-800' 
              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
          }`}>
            {marine.safety_status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
          <div className="p-2.5 bg-slate-950 border border-slate-850 rounded">
            <span className="text-[10px] text-slate-400 block font-mono">Signif. Wave Height</span>
            <strong className="text-white font-mono tabular-nums text-base">{marine.wave_height_m}</strong>
            <span className="text-[10px] text-slate-400 ml-1">meters</span>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-850 rounded">
            <span className="text-[10px] text-slate-400 block font-mono">Swell Height</span>
            <strong className="text-white font-mono tabular-nums text-base">{marine.swell_height_m}</strong>
            <span className="text-[10px] text-slate-400 ml-1">meters</span>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-850 rounded">
            <span className="text-[10px] text-slate-400 block font-mono">Wave Period</span>
            <strong className="text-white font-mono tabular-nums text-base">{marine.wave_period_s}</strong>
            <span className="text-[10px] text-slate-400 ml-1">seconds</span>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-850 rounded">
            <span className="text-[10px] text-slate-400 block font-mono">Sea Surface Temp</span>
            <strong className="text-white font-mono tabular-nums text-base">{marine.sea_temp_c}</strong>
            <span className="text-[10px] text-slate-400 ml-1">°C</span>
          </div>
        </div>
      </div>

      <div className="pt-3 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span>Verified by Indian National Centre for Ocean Information Services</span>
        <span>Updated: {marine.source_attribution.last_update_ist}</span>
      </div>
    </div>
  );
};
