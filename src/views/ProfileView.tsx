import React, { useState, useEffect } from 'react';
import { 
  User, 
  Dumbbell, 
  Heart, 
  Car, 
  Sprout, 
  Ship, 
  Calendar, 
  Plane, 
  Users, 
  Check, 
  Shield,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  MapPin,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server
} from 'lucide-react';
import { UserPersona, LocationRecord } from '../types.js';
import { api } from '../services/api.js';
import { checkConnectionStatus, ConnectionStatusResult } from '../lib/supabase.js';

interface ProfileViewProps {
  locations: LocationRecord[];
  activePersonas: UserPersona[];
  onUpdatePersonas: (personas: UserPersona[]) => void;
  currentUser?: any;
  onNavigate?: (tab: string) => void;
  onSignOut?: () => void;
  onAuthSuccess?: (user: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  locations,
  activePersonas,
  onUpdatePersonas,
  currentUser,
  onNavigate,
  onSignOut,
  onAuthSuccess
}) => {
  const [user, setUser] = useState<any>(currentUser || null);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(currentUser || api.getToken()));
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [units, setUnits] = useState<'METRIC' | 'IMPERIAL'>('METRIC');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dbStatus, setDbStatus] = useState<ConnectionStatusResult | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  const checkDb = async () => {
    setIsCheckingDb(true);
    try {
      const res = await checkConnectionStatus();
      setDbStatus(res);
    } catch (e: any) {
      setDbStatus({
        isConnected: false,
        isConfigured: false,
        status: 'error',
        message: e?.message || 'Failed to check connection',
        timestamp: new Date().toISOString(),
        endpoint: ''
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  useEffect(() => {
    checkDb();
  }, []);

  const personasList: Array<{ id: UserPersona; title: string; desc: string; icon: any }> = [
    { id: 'FITNESS', title: 'Fitness & Running', desc: 'Running, cycling and marathon optimal thermal and air quality windows.', icon: Dumbbell },
    { id: 'COMMUTER', title: 'Daily Commute', desc: 'Highway fog, downpour waterlogging, and commute visibility warnings.', icon: Car },
    { id: 'HEALTH', title: 'Health & Air Quality', desc: 'AQI, PM2.5 respiratory exposure, UV and thermal stress tracking.', icon: Heart },
    { id: 'EVENT_PLANNER', title: 'Events & Weddings', desc: 'Open-air comfort, rain probability, and wind safeguards.', icon: Calendar },
    { id: 'AGRICULTURE', title: 'Farming & Agromet', desc: 'Crop spraying windows, frost hazard, and field precipitation.', icon: Sprout },
    { id: 'BEACH_SURF', title: 'Beachgoers & Surfers', desc: 'Sea conditions, wave height, tide timings, and water temperature.', icon: Ship },
    { id: 'COASTAL', title: 'Coastal & Marine', desc: 'INCOIS wave height, swell period, and rough sea advisories.', icon: Ship },
    { id: 'TRAVEL', title: 'Travel & Tourism', desc: 'Inter-state route weather, destination forecasts, and packing rules.', icon: Plane },
    { id: 'FAMILY', title: 'Family & School Transit', desc: 'Morning school commute, rain timing, and child outdoor play safety.', icon: Users }
  ];

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setIsLoggedIn(true);
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      return;
    }

    const token = api.getToken();
    if (token) {
      api.getProfile()
        .then((prof) => {
          setUser(prof);
          setIsLoggedIn(true);
          setName(prof.name);
          setEmail(prof.email);
          setUnits(prof.units || 'METRIC');
          if (prof.personas) onUpdatePersonas(prof.personas);
        })
        .catch(() => {
          api.setToken(null);
          setIsLoggedIn(false);
          setUser(null);
        });
    }
  }, [currentUser]);

  const handleTogglePersona = (p: UserPersona) => {
    const next = activePersonas.includes(p)
      ? activePersonas.filter(item => item !== p)
      : [...activePersonas, p];

    if (next.length === 0) return;
    onUpdatePersonas(next);
  };

  const handleSaveSettings = async () => {
    try {
      if (isLoggedIn) {
        await api.updateProfile({
          name,
          units,
          personas: activePersonas
        });
      }
      // Also update local commuter profile name
      try {
        const saved = localStorage.getItem('mausam_adapt_commuter_profile') || localStorage.getItem('trinetra_commuter_profile');
        const p = saved ? JSON.parse(saved) : {};
        p.userName = name;
        localStorage.setItem('mausam_adapt_commuter_profile', JSON.stringify(p));
      } catch (_) {}

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    if (onSignOut) onSignOut();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Header */}
      <section className="pt-4 border-b border-white/[0.06] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Account &amp; Preferences
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Personalize weather decisions, saved commute corridors, and units.
          </p>
        </div>

        {isLoggedIn && (
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </section>

      {/* Account Status Card */}
      {isLoggedIn && user ? (
        <section className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{user.name || 'Citizen User'}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>Verified Account</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-4 sm:border-l sm:border-white/10 sm:pl-6">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Personas</span>
              <span className="font-bold text-white">{activePersonas.length} Active</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Saved Cities</span>
              <span className="font-bold text-white">{locations.length} Locations</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-blue-950/40 border border-cyan-500/30 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              <h3 className="text-sm font-bold text-white">Browsing in Guest Mode</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-md">
              Sign in or create an account to save commute corridors, sync your active personas, and receive verified meteorological alerts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('auth')}
            className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Create Account</span>
          </button>
        </section>
      )}

      {/* Decision Personas (Multi-Select) */}
      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
            Decision Personas
          </div>
          <p className="text-xs text-slate-400">
            Select the activities you participate in. Mausam Adapt personalizes daily recommendations for your active modes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {personasList.map((p) => {
            const isSelected = activePersonas.includes(p.id);
            const Icon = p.icon;

            return (
              <div
                key={p.id}
                onClick={() => handleTogglePersona(p.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  isSelected
                    ? 'bg-white/[0.06] border-white/20 shadow-lg text-white'
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  isSelected ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-white/[0.05] text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{p.title}</h3>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Account & User Preferences */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white">
          Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Your Name (for personal greetings)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Temperature Units</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnits('METRIC')}
                className={`py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  units === 'METRIC' ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-slate-950/80 text-slate-400 border border-white/10'
                }`}
              >
                Metric (°C, km/h)
              </button>
              <button
                type="button"
                onClick={() => setUnits('IMPERIAL')}
                className={`py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  units === 'IMPERIAL' ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-slate-950/80 text-slate-400 border border-white/10'
                }`}
              >
                Imperial (°F, mph)
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {saveSuccess ? 'Preferences saved successfully!' : 'Preferences saved to your session.'}
          </span>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </section>

      {/* Supabase Database Integration Status */}
      <section className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Supabase Database &amp; Cloud Sync
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  dbStatus?.isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : dbStatus?.isConfigured
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {dbStatus?.status || 'checking'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect your Supabase PostgreSQL database for persistent profiles, locations, and plans across devices.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={checkDb}
            disabled={isCheckingDb}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10 disabled:opacity-50"
            title="Check database connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {/* Status Details */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            {dbStatus?.isConnected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="text-slate-200 font-medium">
                {dbStatus?.message || 'Testing connectivity with configured Supabase endpoint...'}
              </p>
              {dbStatus?.latencyMs !== undefined && (
                <p className="text-[11px] text-slate-400">
                  Latency: <span className="text-cyan-400 font-mono">{dbStatus.latencyMs}ms</span>
                </p>
              )}
            </div>
          </div>

          {!dbStatus?.isConnected && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] text-slate-400 space-y-2">
              <p className="text-[11px] font-medium text-slate-300">
                How to activate Supabase in 3 steps:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>Create a project at <span className="text-emerald-400 font-mono">supabase.com</span></li>
                <li>Run the migration script in <span className="text-cyan-300 font-mono">supabase/schema.sql</span> via Supabase SQL Editor</li>
                <li>Add your credentials in <span className="text-cyan-300 font-mono">.env</span> (<code className="text-slate-300 font-mono">SUPABASE_URL</code> &amp; <code className="text-slate-300 font-mono">SUPABASE_ANON_KEY</code>)</li>
              </ol>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
