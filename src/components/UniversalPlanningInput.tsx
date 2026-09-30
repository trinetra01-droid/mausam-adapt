import React, { useState } from 'react';
import { Search, Mic, ArrowRight, Sparkles, CheckCircle2, AlertOctagon, Info, Navigation, MapPin, ShieldAlert } from 'lucide-react';
import { DecisionResult, LocationRecord } from '../types.js';
import { api } from '../services/api.js';
import { isCoastalLocation } from '../services/geoUtils.js';

interface UniversalPlanningInputProps {
  location: LocationRecord;
  onDecisionGenerated?: (decision: DecisionResult) => void;
}

export const UniversalPlanningInput: React.FC<UniversalPlanningInputProps> = ({
  location,
  onDecisionGenerated
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [bhashiniNotice, setBhashiniNotice] = useState<string | null>(null);

  const isCoastal = isCoastalLocation(location.state, location.district, location.name);

  const samplePrompts = isCoastal
    ? [
        'Can I go to the beach this afternoon?',
        'Is it safe for coastal fishing tomorrow at 5 AM?',
        `Plan for Mumbai from ${location.name}`,
        'I want to run at 6 PM',
        'Outdoor wedding tomorrow at 7 PM'
      ]
    : [
        'Should I spray my crop today?',
        'I want to run at 6 PM',
        'Outdoor wedding tomorrow at 7 PM',
        `Plan for Delhi from ${location.name}`,
        'Highway travel to Delhi',
        'Is it safe for harvest work tomorrow?'
      ];

  const handleEvaluate = async (textToRun?: string) => {
    const q = textToRun || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setResult(null);
    setBhashiniNotice(null);

    try {
      const response = await api.evaluateUniversalQuery(
        q,
        location.name,
        location.latitude,
        location.longitude,
        location.district,
        location.state
      );
      setResult(response.decision);
      if (onDecisionGenerated) {
        onDecisionGenerated(response.decision);
      }
    } catch (err: any) {
      console.error('Evaluation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceClick = () => {
    // Check official Bhashini platform configuration per strict compliance policy
    setBhashiniNotice(
      'BHASHINI Voice Engine Notice: Official Government of India BHASHINI credentials (BHASHINI_API_KEY) are required for Indian-language voice speech-to-text. Commercial voice APIs (Google/OpenAI) are strictly prohibited by Mausam Adapt compliance rules.'
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            What are you planning?
          </h2>
          <p className="text-xs text-slate-400">
            Type or plan an activity. Deterministic decision engine evaluates IMD weather, CPCB AQI, and MoES warnings.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40">
          <span>GOV DETERMINISTIC ENGINE</span>
        </div>
      </div>

      {/* Main Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleEvaluate();
        }}
        className="relative flex items-center"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. I want to run at 6 PM, or Outdoor wedding at 5 PM..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-10 pr-24 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        <div className="absolute right-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={handleVoiceClick}
            title="Voice input via Government BHASHINI platform"
            className="p-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer rounded-md hover:bg-slate-900"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-1 cursor-pointer font-sans"
          >
            <span>{isLoading ? 'Evaluating...' : 'Evaluate'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Bhashini Notice if triggered */}
      {bhashiniNotice && (
        <div className="mt-3 p-3 bg-slate-950 border border-amber-600/40 rounded-lg text-xs text-amber-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{bhashiniNotice}</span>
        </div>
      )}

      {/* Suggested Quick Prompts */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <span className="text-[11px] text-slate-400">Suggestions:</span>
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setQuery(prompt);
              handleEvaluate(prompt);
            }}
            className="text-[11px] px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Instant Decision Result Box */}
      {result && (
        <div className="mt-5 p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-lg transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-850">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase font-mono ${
                result.status === 'OPTIMAL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                result.status === 'FAIR' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                result.status === 'RISKY' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                result.status === 'SAFETY_OVERRIDE' ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse' :
                'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {result.status}
              </span>
              <span className="text-xs font-semibold text-slate-300 capitalize">
                {result.activity.replace(/_/g, ' ')} · {result.target_time}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">Suitability Index:</span>
              <span className={`text-base font-bold tabular-nums ${
                result.score >= 75 ? 'text-emerald-400' : result.score >= 50 ? 'text-cyan-400' : 'text-amber-400'
              }`}>
                {result.score}/100
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400">Confidence: <strong className="text-slate-300">{result.confidence}%</strong></span>
            </div>
          </div>

          <p className="text-sm text-slate-200 mt-3 font-medium leading-relaxed">
            {result.recommendation}
          </p>

          {/* Intercity Travel Corridor Details */}
          {result.route_details && result.route_details.is_route && (
            <div className="mt-4 p-3.5 bg-slate-900/90 border border-slate-750 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Intercity Route Corridor: {result.route_details.origin.name} → {result.route_details.destination.name}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-tight ${
                  result.status === 'SAFETY_OVERRIDE'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : result.status === 'RISKY'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {result.route_details.corridor_safety_verdict}
                </span>
              </div>

              {/* Origin to Destination comparison cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Origin Card */}
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Origin: {result.route_details.origin.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      result.route_details.origin.warning_level && result.route_details.origin.warning_level !== 'NONE'
                        ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {result.route_details.origin.warning_level && result.route_details.origin.warning_level !== 'NONE' 
                        ? `${result.route_details.origin.warning_level} ALERT` 
                        : 'CLEAR'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span>{result.route_details.origin.state}</span> · <span className="text-slate-300 font-medium">{result.route_details.origin.weather_summary}</span>
                  </div>
                </div>

                {/* Destination Card */}
                <div className={`p-2.5 bg-slate-950 border rounded ${
                  result.route_details.destination.warning_level === 'ORANGE' || result.route_details.destination.warning_level === 'RED'
                    ? 'border-amber-600/80 bg-amber-950/20'
                    : 'border-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> Destination: {result.route_details.destination.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      result.route_details.destination.warning_level === 'RED'
                        ? 'bg-rose-600 text-white font-bold animate-pulse'
                        : result.route_details.destination.warning_level === 'ORANGE'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : result.route_details.destination.warning_level === 'YELLOW'
                        ? 'bg-yellow-500 text-slate-950 font-bold'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {result.route_details.destination.warning_level && result.route_details.destination.warning_level !== 'NONE'
                        ? `${result.route_details.destination.warning_level} ALERT`
                        : 'CLEAR'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span>{result.route_details.destination.state}</span> · <span className="text-slate-200 font-medium">{result.route_details.destination.weather_summary}</span>
                  </div>
                </div>
              </div>

              {/* Destination Active Warning Callout Banner */}
              {result.route_details.destination.active_warning && (
                <div className="mt-2.5 p-2.5 bg-amber-950/70 border border-amber-600/80 rounded flex items-start gap-2.5 text-xs text-amber-100">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">
                      Destination Weather Alert: {result.route_details.destination.active_warning.severity} ALERT · {result.route_details.destination.active_warning.title}
                    </span>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans">
                      {result.route_details.destination.active_warning.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reasons & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-850 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Favorable Factors
              </div>
              <ul className="space-y-1 text-slate-300">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">·</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.risks.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-amber-400 mb-1 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" /> Identified Atmospheric Risks
                </div>
                <ul className="space-y-1 text-slate-300">
                  {result.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400">·</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Alternative Recommended Forecast Windows */}
          {result.alternative_windows && result.alternative_windows.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-850">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Forecast-Supported Alternative Windows:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {result.alternative_windows.map((w, i) => (
                  <div key={i} className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs">
                    <div className="flex items-center justify-between font-mono mb-1">
                      <strong className="text-white">{w.time}</strong>
                      <span className={`text-[10px] font-bold ${w.score >= 75 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {w.score}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">{w.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-850 pt-2">
            <span>Sources: {result.sources.join(' · ')}</span>
            <span>Generated: {new Date(result.generated_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      )}
    </div>
  );
};
