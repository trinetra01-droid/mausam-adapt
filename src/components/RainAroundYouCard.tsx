import React from 'react';
import { 
  CloudRain, 
  Compass, 
  MapPin, 
  ArrowRight, 
  Radio, 
  ShieldAlert, 
  Clock, 
  AlertTriangle,
  Layers,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { RainAroundYouReport, RainStatusType, PlanRecord } from '../types.js';
import { PlanConflictAnalysis } from '../services/rainSpatialAnalysis.js';

interface RainAroundYouCardProps {
  report: RainAroundYouReport | null;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  onOpenFullMap: () => void;
  onChallengePlan?: (plan: PlanRecord) => void;
  planConflict?: PlanConflictAnalysis;
}

export const RainAroundYouCard: React.FC<RainAroundYouCardProps> = ({
  report,
  isLoading = false,
  theme = 'light',
  onOpenFullMap,
  onChallengePlan,
  planConflict
}) => {
  const isLight = theme === 'light';

  if (isLoading && !report) {
    return (
      <div className={`p-5 rounded-3xl border transition-all animate-pulse ${
        isLight ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/[0.08]'
      }`}>
        <div className="h-4 w-36 bg-slate-300 dark:bg-slate-700 rounded-md mb-4" />
        <div className="h-28 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  // Handle radar unavailable state
  // Requirement: "If official radar data is unavailable, clearly show: 'Rain map unavailable'. Do not fabricate a rain area."
  if (report?.provenance?.freshnessState === 'UNAVAILABLE') {
    return (
      <div className={`p-5 rounded-3xl border transition-all ${
        isLight ? 'bg-white/90 border-slate-200 shadow-sm text-slate-800' : 'bg-slate-900/60 border-white/[0.08] text-slate-200'
      }`}>
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-inherit">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Rain Around You</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500">
            UNAVAILABLE
          </span>
        </div>
        <div className="pt-3 space-y-1">
          <h4 className="text-base font-bold">Rain map unavailable</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No active IMD Doppler Weather Radar within surveillance range for this location.
          </p>
        </div>
      </div>
    );
  }

  const status = report?.status || 'CLEAR_AROUND_YOU';
  const isOverUser = status === 'RAIN_OVER_YOU';
  const isApproaching = status === 'RAIN_APPROACHING';
  const isMovingAway = status === 'RAIN_MOVING_AWAY';
  const isNearby = status === 'RAIN_NEARBY';

  // Deterministic status badge styling
  const getStatusBadge = (s: RainStatusType) => {
    switch (s) {
      case 'RAIN_OVER_YOU':
        return {
          label: 'Rain Over You',
          bg: isLight ? 'bg-cyan-100 border-cyan-300 text-cyan-900' : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
          dot: 'bg-cyan-500'
        };
      case 'RAIN_APPROACHING':
        return {
          label: 'Rain Approaching',
          bg: isLight ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-500/20 border-amber-500/30 text-amber-300',
          dot: 'bg-amber-500'
        };
      case 'RAIN_MOVING_AWAY':
        return {
          label: 'Rain Moving Away',
          bg: isLight ? 'bg-sky-100 border-sky-300 text-sky-900' : 'bg-sky-500/20 border-sky-500/30 text-sky-300',
          dot: 'bg-sky-400'
        };
      case 'RAIN_NEARBY':
        return {
          label: 'Rain Nearby',
          bg: isLight ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-blue-500/20 border-blue-500/30 text-blue-300',
          dot: 'bg-blue-500'
        };
      case 'CLEAR_AROUND_YOU':
      default:
        return {
          label: 'Clear Around You',
          bg: isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
          dot: 'bg-emerald-500'
        };
    }
  };

  const badge = getStatusBadge(status);
  const currentFrame = report?.frames?.[report?.activeFrameIndex ?? 1] || report?.frames?.[0];
  const cells = currentFrame?.cells || [];

  return (
    <section className={`p-5 sm:p-6 rounded-3xl transition-all shadow-lg border backdrop-blur-xl ${
      isLight 
        ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-200/60' 
        : 'bg-slate-900/80 border-white/[0.08] text-white shadow-black/40'
    }`}>
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${
            isOverUser || isApproaching 
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400' 
              : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight uppercase">
                Rain Around You
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-pulse`} />
                <span>{badge.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Provenance Tag */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
          <Radio className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span>IMD Radar</span>
          <span>·</span>
          <span>{report?.provenance?.updatedAtIST || 'Live'}</span>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Radar Scope Preview */}
      <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Information Column */}
        <div className="md:col-span-7 space-y-3">
          <div>
            <h4 className="text-base sm:text-lg font-bold tracking-tight">
              {report?.statusHeadline || 'Precipitation Monitoring'}
            </h4>
            <p className={`text-xs sm:text-sm mt-0.5 leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              {report?.statusDetail}
            </p>
          </div>

          {/* Key Metric Strips */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className={`p-2.5 rounded-2xl border ${
              isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/50 border-white/[0.06]'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Active Precipitation
              </span>
              <strong className="text-xs sm:text-sm font-extrabold block mt-0.5">
                {report?.rainExtentKm ? `~${report.rainExtentKm} km around you` : 'None detected'}
              </strong>
            </div>

            <div className={`p-2.5 rounded-2xl border ${
              isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/50 border-white/[0.06]'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Radar Movement
              </span>
              <strong className="text-xs sm:text-sm font-extrabold block mt-0.5">
                {report?.movement 
                  ? `${report.movement.directionCardinal} (~${report.movement.speedKmh} km/h)`
                  : 'Stationary / Clear'}
              </strong>
            </div>
          </div>

          {/* Nearby Affected Towns (if any) */}
          {report?.nearbyAffectedAreas && report.nearbyAffectedAreas.length > 0 && (
            <div className={`p-2.5 rounded-2xl border text-xs flex items-center gap-2 ${
              isLight ? 'bg-cyan-50/70 border-cyan-200 text-cyan-950' : 'bg-cyan-950/30 border-cyan-500/20 text-cyan-200'
            }`}>
              <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div className="truncate">
                <span className="font-bold">Affected nearby: </span>
                <span>
                  {report.nearbyAffectedAreas.slice(0, 3).map(a => `${a.name} (${Math.round(a.distanceKm)} km ${a.bearingCardinal})`).join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenFullMap}
              className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              <span>Open Rain Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive 50 km radar layer
            </span>
          </div>
        </div>

        {/* Right Radar Scope Preview (SVG Vector Preview - zero heavy leaflet loading on home) */}
        <div 
          onClick={onOpenFullMap}
          className={`md:col-span-5 relative h-48 sm:h-52 rounded-2xl overflow-hidden cursor-pointer border group transition-all ${
            isLight ? 'bg-slate-900 border-slate-300' : 'bg-slate-950 border-white/10'
          }`}
          title="Tap to open full radar map"
        >
          {/* Radar background grid & concentric circles */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Dark background */}
            <rect width="200" height="200" fill="#090d16" />

            {/* Concentric distance rings (10km, 25km, 50km equivalent) */}
            <circle cx="100" cy="100" r="28" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
            <circle cx="100" cy="100" r="58" fill="none" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="1" />

            {/* Crosshair axes */}
            <line x1="100" y1="8" x2="100" y2="192" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="8" y1="100" x2="192" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

            {/* Cardinal points */}
            <text x="100" y="16" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" fontWeight="bold">N</text>
            <text x="190" y="103" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" fontWeight="bold">E</text>
            <text x="100" y="195" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" fontWeight="bold">S</text>
            <text x="12" y="103" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" fontWeight="bold">W</text>

            {/* Range markers */}
            <text x="100" y="70" fill="rgba(56, 189, 248, 0.5)" fontSize="6" textAnchor="middle">15 km</text>
            <text x="100" y="40" fill="rgba(56, 189, 248, 0.5)" fontSize="6" textAnchor="middle">30 km</text>

            {/* Render precipitation cells on preview */}
            {cells.map((c, i) => {
              // Convert polar distance & bearing into SVG coordinates relative to center (100, 100)
              // 50 km maps to ~88 px radius => ~1.76 px per km
              const scale = 1.76;
              const rad = ((c.bearingDegFromUser - 90) * Math.PI) / 180;
              const cx = 100 + Math.cos(rad) * Math.min(90, c.distanceFromUserKm * scale);
              const cy = 100 + Math.sin(rad) * Math.min(90, c.distanceFromUserKm * scale);
              const cellR = Math.max(8, c.radiusKm * scale);

              const fill = c.intensityDbz >= 48 ? 'rgba(239, 68, 68, 0.5)' :
                           c.intensityDbz >= 38 ? 'rgba(245, 158, 11, 0.45)' :
                           c.intensityDbz >= 28 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(56, 189, 248, 0.45)';
              const stroke = c.intensityDbz >= 48 ? '#ef4444' :
                             c.intensityDbz >= 38 ? '#f59e0b' :
                             c.intensityDbz >= 28 ? '#10b981' : '#38bdf8';

              return (
                <g key={c.id || i}>
                  <circle cx={cx} cy={cy} r={cellR} fill={fill} stroke={stroke} strokeWidth="1" />
                  <circle cx={cx} cy={cy} r={cellR * 0.45} fill={stroke} opacity="0.35" />
                </g>
              );
            })}

            {/* Movement Vector Indicator Arrow (if cells active) */}
            {report?.movement && cells.length > 0 && (
              <g>
                <path
                  d="M 125 45 L 145 45 M 140 40 L 146 45 L 140 50"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  fill="none"
                />
                <text x="148" y="48" fill="#38bdf8" fontSize="7" fontWeight="bold">
                  {report.movement.directionCardinal}
                </text>
              </g>
            )}

            {/* Center User Location Marker */}
            <circle cx="100" cy="100" r="10" fill="rgba(56, 189, 248, 0.2)" className="animate-ping" />
            <circle cx="100" cy="100" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          </svg>

          {/* Overlay badge on preview */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/80 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
            <span>Range: 50 km surveillance</span>
            <span className="flex items-center gap-1 text-cyan-300 font-bold group-hover:underline">
              <span>Inspect</span>
              <Maximize2 className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Plan Conflict Personalization Banner (if user plan is threatened) */}
      {planConflict && planConflict.hasConflict && planConflict.impactedPlan && (
        <div className={`mt-4 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-amber-50/90 border-amber-300 text-amber-950' : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold">Plan Impact: </span>
              <span>{planConflict.message}</span>
            </div>
          </div>
          {onChallengePlan && (
            <button
              type="button"
              onClick={() => onChallengePlan(planConflict.impactedPlan!)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow"
            >
              Challenge this plan
            </button>
          )}
        </div>
      )}
    </section>
  );
};
