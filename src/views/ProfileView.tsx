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
  Shield 
} from 'lucide-react';
import { UserPersona, LocationRecord } from '../types.js';
import { api } from '../services/api.js';

interface ProfileViewProps {
  locations: LocationRecord[];
  activePersonas: UserPersona[];
  onUpdatePersonas: (personas: UserPersona[]) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  locations,
  activePersonas,
  onUpdatePersonas
}) => {
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [units, setUnits] = useState<'METRIC' | 'IMPERIAL'>('METRIC');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const personasList: Array<{ id: UserPersona; title: string; desc: string; icon: any }> = [
    { id: 'FITNESS', title: 'Fitness & Running', desc: 'Running, cycling and marathon optimal thermal and air quality windows.', icon: Dumbbell },
    { id: 'COMMUTER', title: 'Daily Commute', desc: 'Highway fog, downpour waterlogging, and commute visibility warnings.', icon: Car },
    { id: 'HEALTH', title: 'Health & Air Quality', desc: 'AQI, PM2.5 respiratory exposure, UV and thermal stress tracking.', icon: Heart },
    { id: 'EVENT PLANNER', title: 'Events & Weddings', desc: 'Open-air comfort, rain probability, and wind safeguards.', icon: Calendar },
    { id: 'AGRICULTURE', title: 'Farming & Agromet', desc: 'Crop spraying windows, frost hazard, and field precipitation.', icon: Sprout },
    { id: 'COASTAL', title: 'Coastal & Marine', desc: 'Wave height, swell period, and rough sea advisories.', icon: Ship },
    { id: 'TRAVEL', title: 'Travel & Tourism', desc: 'Inter-state route weather, hill station forecasts, and packing rules.', icon: Plane },
    { id: 'FAMILY', title: 'Family & School Transit', desc: 'Morning school bus fog, extreme temperature warnings, and safe hours.', icon: Users }
  ];

  useEffect(() => {
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
        });
    }
  }, []);

  const handleTogglePersona = (p: UserPersona) => {
    const next = activePersonas.includes(p)
      ? activePersonas.filter(item => item !== p)
      : [...activePersonas, p];

    if (next.length === 0) return;
    onUpdatePersonas(next);
  };

  const handleSaveSettings = async () => {
    try {
      await api.updateProfile({
        name,
        units,
        personas: activePersonas
      });
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

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* Header */}
      <section className="pt-4 border-b border-white/[0.06] pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Profile &amp; Preferences
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Tailor weather decisions to your daily activities and preferred units.
        </p>
      </section>

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
            {saveSuccess ? 'Preferences saved successfully!' : 'Preferences saved to your browser session.'}
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
    </div>
  );
};
