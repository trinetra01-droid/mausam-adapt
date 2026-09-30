import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { WarningRecord, LocationRecord } from '../types.js';
import { api } from '../services/api.js';

interface AlertsViewProps {
  location: LocationRecord;
  warnings: WarningRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  location,
  warnings,
  isLoading,
  onRefresh
}) => {
  const [scope, setScope] = useState<'LOCAL' | 'ALL'>('LOCAL');
  const [allWarnings, setAllWarnings] = useState<WarningRecord[]>([]);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  useEffect(() => {
    api.getWarnings().then(res => setAllWarnings(res || [])).catch(() => {});
  }, []);

  const displayedWarnings = scope === 'LOCAL' ? warnings : allWarnings;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* 23. Official Alerts Header */}
      <section className="pt-4 border-b border-white/[0.06] pb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Official Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Direct bulletins from the India Meteorological Department.
          </p>
        </div>

        {/* Clean segment toggle */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-full border border-white/[0.06] text-xs">
          <button
            type="button"
            onClick={() => setScope('LOCAL')}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              scope === 'LOCAL' ? 'bg-white/[0.1] text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {location.name.split('(')[0].trim()}
          </button>
          <button
            type="button"
            onClick={() => setScope('ALL')}
            className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
              scope === 'ALL' ? 'bg-white/[0.1] text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All India ({allWarnings.length})
          </button>
        </div>
      </section>

      {/* Alerts Notification Center Feed */}
      <section className="space-y-4">
        {displayedWarnings.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Everything looks clear.</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No severe weather watches, atmospheric warnings, or advisories active for this area.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {displayedWarnings.map((alert, idx) => {
              const isCritical = alert.severity === 'RED';
              const isCaution = alert.severity === 'ORANGE' || alert.severity === 'YELLOW';
              const statusText = isCritical ? 'CRITICAL' : isCaution ? 'CAUTION' : 'ADVISORY';
              const statusColor = isCritical ? 'text-rose-400' : isCaution ? 'text-amber-400' : 'text-cyan-400';
              const isExpanded = expandedAlertId === (alert.id || String(idx));

              return (
                <div key={alert.id || idx} className="py-5 space-y-2">
                  <div 
                    onClick={() => setExpandedAlertId(isExpanded ? null : (alert.id || String(idx)))}
                    className="flex items-start justify-between gap-4 cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                          {statusText}
                        </span>
                        <span className="text-white/20 select-none">·</span>
                        <span className="text-xs text-slate-400 font-medium">
                          {alert.district || location.name}
                        </span>
                        {alert.valid_until && (
                          <>
                            <span className="text-white/20 select-none">·</span>
                            <span className="text-xs text-slate-400">
                              Valid until {new Date(alert.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {alert.title}
                      </h3>
                    </div>

                    <div className="pt-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Summary row */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {alert.message || 'Outdoor plans and travel along highway corridors may experience disruption.'}
                  </p>

                  {/* Expanded instructions */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/[0.04] text-xs text-slate-400 space-y-2 animate-fade-in">
                      {alert.warning_type && (
                        <div>
                          <strong className="text-slate-300">Category: </strong>
                          {alert.warning_type}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500">
                        Official source: India Meteorological Department & MoES Early Warning System
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
