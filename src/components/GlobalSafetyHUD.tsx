import React from 'react';
import { AlertTriangle, ShieldAlert, ExternalLink, Clock, MapPin } from 'lucide-react';
import { WarningRecord } from '../types.js';

interface GlobalSafetyHUDProps {
  warnings: WarningRecord[];
  district: string;
  state: string;
  onViewAlerts: () => void;
}

export const GlobalSafetyHUD: React.FC<GlobalSafetyHUDProps> = ({
  warnings,
  district,
  state,
  onViewAlerts
}) => {
  const normDistrict = (district || '').trim().toLowerCase();
  const normState = (state || '').trim().toLowerCase();

  const isNameMatch = (a: string, b: string): boolean => {
    if (!a || !b || a.length < 2 || b.length < 2) return false;
    return a === b || a.includes(b) || b.includes(a);
  };

  const isAreaMentioned = (areaText: string, term: string): boolean => {
    if (!areaText || !term || term.length < 3) return false;
    const cleanArea = areaText.toLowerCase();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(cleanArea);
  };

  // Find most severe active warning affecting this specific jurisdiction
  const activeWarnings = warnings.filter(w => {
    if (!w.is_active) return false;
    const wDist = (w.district || '').trim().toLowerCase();
    const wState = (w.state || '').trim().toLowerCase();
    const wArea = (w.affected_area || '').trim().toLowerCase();

    // If warning specifies a state that is explicitly distinct from target state,
    // it only matches if the affected area explicitly mentions the target district or state
    if (normState && wState && !isNameMatch(normState, wState)) {
      const areaMentionsTarget = 
        (normDistrict && isAreaMentioned(wArea, normDistrict)) ||
        (normState && isAreaMentioned(wArea, normState));
      if (!areaMentionsTarget) {
        return false;
      }
    }

    const matchesDistrict = Boolean(normDistrict && wDist && isNameMatch(normDistrict, wDist));
    const matchesState = Boolean(normState && wState && isNameMatch(normState, wState));
    const matchesArea = Boolean(
      (normDistrict && isAreaMentioned(wArea, normDistrict)) ||
      (normState && isAreaMentioned(wArea, normState))
    );

    return matchesDistrict || matchesState || matchesArea;
  });

  if (activeWarnings.length === 0) {
    return null;
  }

  // Sort by severity (RED > ORANGE > YELLOW)
  const severityOrder = { RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0, NONE: 0 };
  activeWarnings.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  const topWarning = activeWarnings[0];

  const isRed = topWarning.severity === 'RED';
  const isOrange = topWarning.severity === 'ORANGE';

  const containerBg = isRed 
    ? 'bg-rose-950/70 border-rose-600/70 text-rose-100'
    : isOrange 
    ? 'bg-amber-950/70 border-amber-600/70 text-amber-100'
    : 'bg-yellow-950/60 border-yellow-600/50 text-yellow-100';

  const badgeBg = isRed
    ? 'bg-rose-600 text-white'
    : isOrange
    ? 'bg-amber-500 text-slate-950'
    : 'bg-yellow-500 text-slate-950';

  return (
    <div className={`w-full border rounded-xl p-4 sm:p-5 mb-6 transition-all shadow-lg ${containerBg}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-black/30 shrink-0 mt-0.5">
            <ShieldAlert className={`w-6 h-6 ${isRed ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${badgeBg}`}>
                {topWarning.severity} ALERT · OFFICIAL WARNING
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Source: {topWarning.provider} (Ministry of Earth Sciences)
              </span>
              {topWarning.bulletin_no && (
                <span className="text-xs text-slate-400 font-mono">
                  Bulletin #{topWarning.bulletin_no}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {topWarning.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-3xl leading-relaxed">
              {topWarning.message}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Affected: <strong className="text-white">{topWarning.affected_area}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Valid until: {new Date(topWarning.valid_until).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <button
            onClick={onViewAlerts}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>View All Official Bulletins</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
