import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Database, 
  Server, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Cpu
} from 'lucide-react';
import { api } from '../services/api.js';

export const AdminView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = () => {
    setIsLoading(true);
    api.getAdminOverview()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs font-mono text-slate-400">
        Loading system telemetry and provider status matrix...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
            System Observability & Provider Compliance
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
            Government Provider & Pipeline Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of India Meteorological Department, INCOIS, CPCB, MOSDAC, and BHASHINI adapters.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* System Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 block mb-1">PostgreSQL Storage</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {data?.database?.total_observations_recorded || 0}
          </span>
          <span className="text-[11px] text-emerald-400 block mt-1">Observations Recorded</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 block mb-1">Active Warnings Monitored</span>
          <span className="text-xl font-bold text-amber-400 tabular-nums">
            {data?.database?.active_warnings_tracked || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">MoES Bulletins Ingested</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 block mb-1">Resilient Cache Tier</span>
          <span className="text-xl font-bold text-cyan-400 tabular-nums">
            {data?.cache?.active_memory_keys || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">{data?.cache?.engine}</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 block mb-1">Process Heap Memory</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {data?.system?.memory_usage_mb || 0} MB
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Uptime: {data?.system?.uptime_seconds}s</span>
        </div>
      </div>

      {/* Official Government Providers Health Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Official Government Providers Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Only authentic Government of India ministries are integrated. Commercial fallback substitution strictly blocked.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            STRICT COMPLIANCE MODE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Provider Agency</th>
                <th className="px-4 py-3">Ministry / Directorate</th>
                <th className="px-4 py-3">Operational Status</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Integration Mode</th>
                <th className="px-4 py-3">Endpoint Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {data?.providers?.map((p: any) => (
                <tr key={p.provider_id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-white">
                    {p.name} ({p.provider_id})
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-sans">
                    {p.agency}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'OPERATIONAL'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-cyan-400 font-bold">
                    {p.latency_ms} ms
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {p.compliance_mode}
                  </td>
                  <td className="px-4 py-3 text-slate-400 truncate max-w-xs" title={p.endpoint}>
                    {p.endpoint}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Background Ingestion Workers Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-white tracking-tight mb-1">
          Background Ingestion & Conflict Evaluator Workers
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Independent workers executing scheduled idempotent meteorological ingestion and plan conflict checks.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          {data?.workers?.active_workers?.map((w: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-xs">{w.name}</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                  {w.state}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block">Schedule: {w.cadence}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
