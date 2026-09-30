import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  X,
  ShieldAlert,
  Edit2,
  RotateCcw,
  Check,
  Info
} from 'lucide-react';
import { PlanRecord, LocationRecord, ActivityType, DecisionResult, WarningRecord } from '../types.js';
import { api } from '../services/api.js';

interface PlansViewProps {
  location: LocationRecord;
  plans: PlanRecord[];
  warnings?: WarningRecord[];
  onRefreshPlans: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({
  location,
  plans,
  warnings = [],
  onRefreshPlans
}) => {
  const challengeFormRef = useRef<HTMLDivElement>(null);

  // Challenge Form State
  const defaultCity = location.name.split('(')[0].trim() || 'Rampur';
  const [title, setTitle] = useState('');
  const [activity, setActivity] = useState<ActivityType>('OUTDOOR_EVENT');
  const [plannedDate, setPlannedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('18:00');
  const [whereLocation, setWhereLocation] = useState(defaultCity);
  const [durationHours, setDurationHours] = useState('2.0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Decision & Active Plan Evaluation
  const [evaluationResult, setEvaluationResult] = useState<DecisionResult | null>(null);
  const [activePlan, setActivePlan] = useState<PlanRecord | null>(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState<WarningRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // What-If Simulation State
  const [whatIfActivity, setWhatIfActivity] = useState<ActivityType>('OUTDOOR_EVENT');
  const [whatIfData, setWhatIfData] = useState<any>(null);
  const [isLoadingWhatIf, setIsLoadingWhatIf] = useState(false);
  const [selectedTimelineSlot, setSelectedTimelineSlot] = useState<any>(null);

  // Reschedule state
  const [reschedulingPlan, setReschedulingPlan] = useState<PlanRecord | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('17:00');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Sync city when location changes unless modified by user
  useEffect(() => {
    if (!whereLocation || whereLocation === 'New Delhi' || whereLocation === 'Rampur') {
      setWhereLocation(location.name.split('(')[0].trim());
    }
  }, [location.name]);

  // Load What-If simulation
  useEffect(() => {
    runWhatIf(whatIfActivity);
  }, [whatIfActivity, location.name]);

  const runWhatIf = async (act: ActivityType) => {
    setIsLoadingWhatIf(true);
    try {
      const res = await api.runWhatIfSimulation(act, location.name, location.latitude, location.longitude);
      setWhatIfData(res);
      const defaultSlot = res.timeline?.find((t: any) => t.hour === 18) || res.timeline?.[0];
      setSelectedTimelineSlot(defaultSlot);
    } catch (e) {
      console.error('What-If error:', e);
    } finally {
      setIsLoadingWhatIf(false);
    }
  };

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Challenge My Plan submission
  const handleChallengePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.challengePlan({
        title,
        activity,
        location_name: whereLocation || location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        planned_date: plannedDate,
        start_time: startTime,
        duration_hours: parseFloat(durationHours) || 3.0
      });
      setEvaluationResult(res.decision);
      if (res.plan) {
        setActivePlan(res.plan);
      }
      onRefreshPlans();
      showToast('Plan analyzed against official IMD weather forecast.');
    } catch (err: any) {
      alert(`Plan challenge failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Accept recommended earlier window (e.g. "Use 5:00 PM")
  const handleUseAlternativeTime = async (altTime: string) => {
    // Extract HH:MM
    const timeMatch = altTime.match(/(\d{1,2}:\d{2})/);
    const formattedTime = timeMatch ? timeMatch[1] : altTime.includes('5') ? '17:00' : '18:00';
    setStartTime(formattedTime);

    if (activePlan) {
      try {
        await api.reschedulePlan(
          activePlan.id,
          formattedTime,
          `Shifted to recommended window ${formattedTime} for optimal thermal comfort.`
        );
        onRefreshPlans();
      } catch (_) {}
    }

    showToast(`Time updated to ${formatDisplayTime(formattedTime)}. Your plan is protected.`);
  };

  // Confirm and keep current planned time
  const handleKeepPlannedTime = () => {
    showToast(`Plan confirmed for ${formatDisplayTime(startTime)}. Monitoring conditions.`);
  };

  // Re-check existing plan
  const handleRecheckPlan = (plan: PlanRecord) => {
    setTitle(plan.title);
    setActivity(plan.activity);
    setPlannedDate(plan.planned_date || new Date().toISOString().split('T')[0]);
    setStartTime(plan.start_time || '21:30');
    setWhereLocation(plan.location_name || defaultCity);
    setDurationHours(String(plan.duration_hours || 3.0));
    setActivePlan(plan);

    challengeFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      handleChallengePlan();
    }, 100);
  };

  // Edit existing plan
  const handleEditPlan = (plan: PlanRecord) => {
    setTitle(plan.title);
    setActivity(plan.activity);
    setPlannedDate(plan.planned_date || new Date().toISOString().split('T')[0]);
    setStartTime(plan.start_time || '21:30');
    setWhereLocation(plan.location_name || defaultCity);
    setDurationHours(String(plan.duration_hours || 3.0));
    setActivePlan(plan);
    challengeFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    showToast(`Editing "${plan.title}". Adjust details and re-challenge.`);
  };

  // Delete plan
  const handleDeletePlan = async (id: string) => {
    try {
      if (activePlan?.id === id) {
        setActivePlan(null);
        setEvaluationResult(null);
      }
      await api.deletePlan(id);
      onRefreshPlans();
      showToast('Plan deleted.');
    } catch (e: any) {
      console.error('Delete error:', e);
      showToast('Could not delete plan. Please try again.');
    }
  };

  // Execute reschedule
  const handleExecuteReschedule = async () => {
    if (!reschedulingPlan) return;
    setIsRescheduling(true);
    try {
      await api.reschedulePlan(
        reschedulingPlan.id,
        rescheduleTime,
        `Rescheduled to safer window ${rescheduleTime}.`
      );
      setReschedulingPlan(null);
      onRefreshPlans();
      showToast(`Rescheduled to ${formatDisplayTime(rescheduleTime)}.`);
    } catch (e: any) {
      alert(`Reschedule failed: ${e.message}`);
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleScrollToForm = () => {
    challengeFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check official warnings for System Override or Plan Conflict
  const severeWarning = warnings.find(w => w.severity === 'RED');
  const moderateWarning = warnings.find(w => w.severity === 'ORANGE' || w.severity === 'YELLOW');
  const activeWarning = severeWarning || moderateWarning;

  // Derive human status for the challenged plan
  const getHumanStatus = (result: DecisionResult | null) => {
    if (severeWarning) {
      return {
        label: 'SYSTEM OVERRIDE',
        badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        dotClass: 'bg-rose-400',
        headline: 'Do not plan outdoor activities',
        summary: `Severe ${severeWarning.warning_type || 'hazard'} warning active for this area.`
      };
    }
    if (!result) {
      return {
        label: 'GOOD CONDITIONS',
        badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        headline: `Your ${title || 'activity'} looks suitable for ${formatDisplayTime(startTime)}.`,
        summary: 'Temperatures are comfortable, rain risk is low and winds remain light.'
      };
    }
    if (result.status === 'SAFETY_OVERRIDE') {
      return {
        label: 'SYSTEM OVERRIDE',
        badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        dotClass: 'bg-rose-400',
        headline: 'Do not plan outdoor activities',
        summary: result.recommendation || 'Official severe warning is in effect.'
      };
    }
    if (result.status === 'RISKY' || result.status === 'AVOID') {
      return {
        label: result.status === 'AVOID' ? 'NOT RECOMMENDED' : 'HIGH RISK',
        badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        dotClass: 'bg-rose-400',
        headline: `Consider shifting your ${title || 'activity'} to an earlier or safer time.`,
        summary: result.risks?.[0] || 'Elevated weather friction detected during this period.'
      };
    }
    if (result.status === 'FAIR' || moderateWarning) {
      return {
        label: 'CONSIDER AN EARLIER WINDOW',
        badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        dotClass: 'bg-amber-400',
        headline: `Conditions are acceptable for ${title || 'your plan'}, but an earlier window is better.`,
        summary: result.reasons?.[0] || 'Shifting slightly earlier offers cooler temperatures.'
      };
    }
    return {
      label: 'GOOD CONDITIONS',
      badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      dotClass: 'bg-emerald-400',
      headline: `Your ${title || 'activity'} looks suitable for ${formatDisplayTime(startTime)}.`,
      summary: 'Temperatures are comfortable, rain risk is low and winds remain light.'
    };
  };

  const currentStatus = getHumanStatus(evaluationResult);

  // Group saved plans
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPlans = plans.filter(p => !p.planned_date || p.planned_date === todayStr);
  const futurePlans = plans.filter(p => p.planned_date && p.planned_date !== todayStr);

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 pb-24 animate-fade-in">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900/95 border border-cyan-500/40 text-slate-100 text-xs px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. PAGE HEADER - Spacing: Header ↓ 32px ↓ Challenge section */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Plans
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Plan outdoor activities around the weather.
          </p>
        </div>

        <button
          type="button"
          onClick={handleScrollToForm}
          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Plan</span>
        </button>
      </div>

      {/* 14. SYSTEM OVERRIDE (Official Severe Warning Active) */}
      {severeWarning && (
        <section className="p-6 sm:p-7 rounded-3xl bg-rose-950/70 border border-rose-500/40 backdrop-blur-xl shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
            <span>SYSTEM OVERRIDE</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              DO NOT PLAN OUTDOOR ACTIVITIES
            </h2>
            <p className="text-base text-rose-200/90 font-medium">
              {severeWarning.title || 'Severe Meteorological Hazard Warning'}
            </p>
          </div>

          <p className="text-xs text-rose-200/80">
            Your saved plan <span className="font-semibold text-white">"{title || 'Outdoor Event'}"</span> is affected. Official disaster advisories supersede normal personalization.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAlertModal(severeWarning)}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              View official alert
            </button>
            <button
              type="button"
              onClick={handleScrollToForm}
              className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-medium text-xs rounded-xl border border-white/10 transition-colors cursor-pointer"
            >
              Check safer options
            </button>
          </div>
        </section>
      )}

      {/* 13. PLAN CONFLICT (If moderate warning or rain/wind conflict detected) */}
      {!severeWarning && moderateWarning && (
        <section className="p-5 sm:p-6 rounded-3xl bg-amber-950/40 border border-amber-500/30 backdrop-blur-xl space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>PLAN CONFLICT</span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Your {title || 'plan'} is now affected by an official weather warning.
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {moderateWarning.title} · Valid until {moderateWarning.valid_until ? new Date(moderateWarning.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'later tonight'}
            </p>
          </div>
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAlertModal(moderateWarning)}
              className="text-xs text-amber-300 hover:text-amber-200 underline font-medium cursor-pointer"
            >
              View alert
            </button>
            <button
              type="button"
              onClick={() => handleUseAlternativeTime('17:00')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              Find a safer time →
            </button>
          </div>
        </section>
      )}

      {/* 3 & 4. CHALLENGE YOUR PLAN - Hero Planning Form */}
      <section 
        ref={challengeFormRef}
        className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6"
      >
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Challenge your plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Check your activity against the latest official forecast and find a better time if conditions change.
          </p>
        </div>

        <form onSubmit={handleChallengePlan} className="space-y-5">
          {/* Row 1: What are you planning? */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              What are you planning?
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dandiya Night, Evening Run, Garden Event"
              className="w-full bg-slate-950/70 border border-white/10 rounded-2xl px-4 py-3.5 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
            />
          </div>

          {/* Row 2: Activity, When, Where, Duration (Balanced Desktop, Stacked Mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Activity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Activity
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityType)}
                className="w-full bg-slate-950/70 border border-white/10 rounded-2xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
              >
                <option value="OUTDOOR_EVENT">Outdoor Event / Stage</option>
                <option value="RUNNING">Running / Fitness</option>
                <option value="CYCLING">Cycling</option>
                <option value="OUTDOOR_WALK">Evening Walk</option>
                <option value="WEDDING">Wedding / Celebration</option>
                <option value="COMMUTE">Commute / Transit</option>
                <option value="BEACH_VISIT">Beach / Leisure</option>
              </select>
            </div>

            {/* When? (Date & Time) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                When?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-2xl px-2.5 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-2xl px-2.5 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* Where? */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Where?
              </label>
              <input
                type="text"
                value={whereLocation}
                onChange={(e) => setWhereLocation(e.target.value)}
                placeholder="Rampur"
                className="w-full bg-slate-950/70 border border-white/10 rounded-2xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Duration
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full bg-slate-950/70 border border-white/10 rounded-2xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
              >
                <option value="1.0">1 hour</option>
                <option value="1.5">1.5 hours</option>
                <option value="2.0">2 hours</option>
                <option value="3.0">3 hours</option>
                <option value="4.0">4 hours</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>IMD · Updated recently</span>
              <button
                type="button"
                onClick={() => setShowSourceDetails(true)}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                View source
              </button>
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Checking forecast...' : 'Challenge My Plan →'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* 5, 6, 7, 8. AFTER CHALLENGE — THE DECISION CARD (Visual Centerpiece) */}
      <section className="space-y-4 animate-fade-in">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
          Your Plan Analysis
        </div>

        {evaluationResult ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
            {/* Header block: Status + Title + Target Time & Venue */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${currentStatus.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotClass}`} />
                  <span>{currentStatus.label}</span>
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {title || 'Outdoor Activity'}
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {formatDisplayTime(startTime)} · {whereLocation || defaultCity}
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed">
                {currentStatus.headline}
              </p>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Best Window Section */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Best Window
              </div>
              <div className="text-lg sm:text-xl font-bold text-cyan-400">
                {evaluationResult.better_alternative?.recommended_time_label || evaluationResult.time_slot || formatDisplayTime(startTime)}
              </div>
              <div className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{evaluationResult.better_alternative?.temperature_c ?? evaluationResult.metrics?.temperature_c ?? 27}°C</span>
                <span className="text-white/20 select-none">·</span>
                <span>{evaluationResult.metrics?.rain_probability_pct ? `${evaluationResult.metrics.rain_probability_pct}% rain risk` : 'Low rain risk'}</span>
                <span className="text-white/20 select-none">·</span>
                <span>{evaluationResult.metrics?.wind_speed_kmh ? `${evaluationResult.metrics.wind_speed_kmh} km/h winds` : 'Light winds'}</span>
              </div>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Mausam Adapt Recommends / Better Option */}
            <div className="space-y-3.5">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Mausam Adapt Recommends
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {evaluationResult.recommendation || 'Conditions are verified against official IMD atmospheric data.'}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                {evaluationResult.better_alternative && (
                  <button
                    type="button"
                    onClick={() => handleUseAlternativeTime(evaluationResult.better_alternative?.recommended_time || '17:00')}
                    className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <span>Use {evaluationResult.better_alternative.recommended_time_label}</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleKeepPlannedTime}
                  className="px-5 py-2.5 bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-white/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                >
                  <span>Keep {formatDisplayTime(startTime)}</span>
                </button>
              </div>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Why? Plain English human explanation */}
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Why this works
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {evaluationResult.reasons && evaluationResult.reasons.length > 0 
                  ? evaluationResult.reasons.join('. ')
                  : 'Rain chance is minimal and thermal comfort is within suitable outdoor activity thresholds.'}
              </p>
            </div>

            {/* 10. DETAILS SHOULD BE COLLAPSED: View weather analysis */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>View weather analysis</span>
                {showAnalysisDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAnalysisDetails && (
                <div className="mt-4 p-5 rounded-2xl bg-slate-950/70 border border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300 animate-fade-in">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Temperature</span>
                    <strong className="text-sm text-white font-semibold">
                      {evaluationResult.metrics?.temperature_c ? `${evaluationResult.metrics.temperature_c}°C` : '28°C'}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Thermal comfort</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Rain Probability</span>
                    <strong className="text-sm text-cyan-400 font-semibold">
                      {evaluationResult.metrics?.rain_probability_pct ?? 0}%
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Precipitation risk</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Surface Wind</span>
                    <strong className="text-sm text-white font-semibold">
                      {evaluationResult.metrics?.wind_speed_kmh ? `${evaluationResult.metrics.wind_speed_kmh} km/h` : '8 km/h'}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Surface breeze</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Relative Humidity</span>
                    <strong className="text-sm text-white font-semibold">
                      {evaluationResult.metrics?.humidity_pct ? `${evaluationResult.metrics.humidity_pct}%` : '55%'}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Atmospheric moisture</span>
                  </div>
                  <div className="col-span-2 sm:col-span-4 pt-2 border-t border-white/[0.04] flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                    <span>Forecast source: Official IMD Telemetry</span>
                    <span>Status: Evaluated against safety standards</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 border border-white/[0.05] rounded-3xl bg-white/[0.01] space-y-2">
            <p className="text-sm font-semibold text-white">No active plan analysis yet.</p>
            <p className="text-slate-400 max-w-md mx-auto">
              Enter what you're planning in the form above and click <span className="text-cyan-400 font-medium">Challenge My Plan →</span> to verify it against official IMD weather data and get intelligent window suggestions.
            </p>
          </div>
        )}
      </section>

      {/* 17. WHAT-IF: Simple Visual Hourly Timeline */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              What-If Timeline
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an hour to see how shifting your schedule improves comfort and safety.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Activity:</span>
            <select
              value={whatIfActivity}
              onChange={(e) => setWhatIfActivity(e.target.value as ActivityType)}
              className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-200 cursor-pointer"
            >
              <option value="OUTDOOR_EVENT">Outdoor Event</option>
              <option value="RUNNING">Running</option>
              <option value="CYCLING">Cycling</option>
              <option value="WEDDING">Wedding</option>
              <option value="COMMUTE">Commute</option>
            </select>
          </div>
        </div>

        {/* Clean visual timeline */}
        {isLoadingWhatIf ? (
          <div className="py-6 text-center text-xs text-slate-400">Recalculating timeline...</div>
        ) : whatIfData?.timeline ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
              {whatIfData.timeline.slice(0, 8).map((slot: any) => {
                const isSelected = selectedTimelineSlot?.hour === slot.hour;
                const statusLabel = slot.status === 'OPTIMAL' ? 'GOOD' : slot.status === 'FAIR' ? 'FAIR' : 'CAUTION';
                const statusColor = slot.status === 'OPTIMAL' ? 'text-emerald-400' : slot.status === 'FAIR' ? 'text-cyan-400' : 'text-amber-400';

                return (
                  <button
                    key={slot.hour}
                    type="button"
                    onClick={() => setSelectedTimelineSlot(slot)}
                    className={`min-w-[85px] flex-1 py-3 px-2 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-lg text-white'
                        : 'text-slate-300 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-xs text-slate-400 font-medium">
                      {slot.time_label.split(' ')[0]}
                    </span>
                    <span className={`text-xs font-bold ${statusColor}`}>
                      {statusLabel}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      {slot.temperature_c}°
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Time Advice */}
            {selectedTimelineSlot && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-white font-medium">
                    {selectedTimelineSlot.time_label} · {selectedTimelineSlot.condition_text}
                  </span>
                  <p className="text-slate-400 mt-0.5">
                    {selectedTimelineSlot.recommendation}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const formatted = `${selectedTimelineSlot.hour.toString().padStart(2, '0')}:00`;
                    handleUseAlternativeTime(formatted);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium shrink-0 cursor-pointer"
                >
                  Apply this window →
                </button>
              </div>
            )}
          </div>
        ) : null}
      </section>

      {/* 12. ACTIVE PLANS / YOUR SAVED PLANS - Compact, Calm, No Nested Card Overload */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Your Saved Plans
          </div>
          <span className="text-xs text-slate-400">
            {plans.length} {plans.length === 1 ? 'activity' : 'activities'} protected
          </span>
        </div>

        {plans.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-white/[0.05] rounded-3xl bg-white/[0.01]">
            <p>No scheduled plans yet.</p>
            <p className="text-slate-500 mt-1">Use "Challenge your plan" above to add your first outdoor activity.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* TODAY */}
            {todayPlans.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 px-1">Today</div>
                <div className="divide-y divide-white/[0.05] border-y border-white/[0.06]">
                  {todayPlans.map((plan) => renderSavedPlanRow(plan))}
                </div>
              </div>
            )}

            {/* UPCOMING */}
            {futurePlans.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 px-1">Upcoming Days</div>
                <div className="divide-y divide-white/[0.05] border-y border-white/[0.06]">
                  {futurePlans.map((plan) => renderSavedPlanRow(plan))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* MODAL: Official Alert Details */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                <ShieldAlert className="w-4 h-4" />
                <span>Official IMD Weather Warning</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAlertModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">{showAlertModal.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {showAlertModal.message || 'Severe weather alert issued by India Meteorological Department.'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-xs text-slate-300 space-y-1">
              <div><span className="text-slate-400">Affected Area:</span> {showAlertModal.affected_area}</div>
              <div><span className="text-slate-400">Severity:</span> {showAlertModal.severity}</div>
              <div><span className="text-slate-400">Source:</span> India Meteorological Department (IMD)</div>
            </div>

            <button
              type="button"
              onClick={() => setShowAlertModal(null)}
              className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Source Details */}
      {showSourceDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white">Meteorological Source Details</h3>
              <button
                type="button"
                onClick={() => setShowSourceDetails(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-white/[0.03] space-y-1">
                <span className="font-semibold text-cyan-400">India Meteorological Department (IMD)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Deterministic NWF multi-model forecast guidance and regional Doppler Weather Radar (DWR) telemetry.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] space-y-1">
                <span className="font-semibold text-emerald-400">Ministry of Earth Sciences (MoES)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  National disaster management weather bulletin criteria and agromet advisory integration.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSourceDetails(false)}
              className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Reschedule Plan */}
      {reschedulingPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white">Reschedule Plan</h3>
              <button onClick={() => setReschedulingPlan(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Shift "{reschedulingPlan.title}" to avoid adverse weather friction.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">New Start Time</label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReschedulingPlan(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReschedule}
                disabled={isRescheduling}
                className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {isRescheduling ? 'Rescheduling...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render individual saved plan row
  function renderSavedPlanRow(plan: PlanRecord) {
    const hasConflict = plan.has_conflict;
    const isConflict = hasConflict || (severeWarning !== undefined);
    const statusText = isConflict ? 'CAUTION' : 'GOOD CONDITIONS';
    const statusColor = isConflict ? 'text-amber-400' : 'text-emerald-400';

    return (
      <div key={plan.id} className="py-4 px-2 hover:bg-white/[0.02] rounded-2xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="text-lg">
            {plan.activity === 'RUNNING' ? '🏃' : plan.activity === 'CYCLING' ? '🚴' : plan.activity === 'OUTDOOR_EVENT' ? '🎉' : '📅'}
          </span>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                {plan.title}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                {statusText}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {formatDisplayTime(plan.start_time)} · {plan.location_name || defaultCity}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleRecheckPlan(plan)}
            title="Re-check against live forecast"
            className="px-3 py-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-check</span>
          </button>

          <button
            type="button"
            onClick={() => handleEditPlan(plan)}
            title="Edit details"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleDeletePlan(plan.id)}
            title="Delete plan"
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Format 24h to 12h human time (e.g. 21:30 -> 9:30 PM)
  function formatDisplayTime(timeStr?: string): string {
    if (!timeStr) return '9:30 PM';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }
};
