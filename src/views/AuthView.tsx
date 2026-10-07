import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  Car,
  Heart,
  Calendar,
  Sprout,
  Plane,
  Users,
  Ship,
  LogIn
} from 'lucide-react';
import { api } from '../services/api.js';
import { UserPersona } from '../types.js';
import { useTheme } from '../context/ThemeContext.js';

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
  onNavigate: (tab: string) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, onNavigate, initialMode = 'login' }) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Personas for Sign Up
  const [selectedPersonas, setSelectedPersonas] = useState<UserPersona[]>(['COMMUTER', 'FITNESS']);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const availablePersonas: Array<{ id: UserPersona; title: string; icon: any }> = [
    { id: 'COMMUTER', title: 'Daily Commute', icon: Car },
    { id: 'FITNESS', title: 'Fitness & Running', icon: Dumbbell },
    { id: 'HEALTH', title: 'Health & AQI', icon: Heart },
    { id: 'AGRICULTURE', title: 'Agriculture & Farm', icon: Sprout },
    { id: 'EVENT_PLANNER', title: 'Events & Weddings', icon: Calendar },
    { id: 'TRAVEL', title: 'Travel & Trips', icon: Plane },
    { id: 'FAMILY', title: 'Family & School', icon: Users },
    { id: 'BEACH_SURF', title: 'Coastal & Beach', icon: Ship }
  ];

  const togglePersona = (p: UserPersona) => {
    setSelectedPersonas(prev => 
      prev.includes(p) ? (prev.length > 1 ? prev.filter(x => x !== p) : prev) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email.trim().toLowerCase(), password);
        setSuccessMsg(`Welcome back, ${res.user?.name || 'Citizen'}!`);
        setTimeout(() => {
          onAuthSuccess(res.user);
          onNavigate('home');
        }, 800);
      } else {
        const res = await api.register(name.trim(), email.trim().toLowerCase(), password, selectedPersonas);
        setSuccessMsg(`Account created successfully! Welcome, ${res.user?.name || 'Citizen'}!`);
        setTimeout(() => {
          onAuthSuccess(res.user);
          onNavigate('home');
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-4 pb-20 px-4 animate-fade-in">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className={`inline-flex p-3 rounded-2xl border mb-3 shadow-lg ${
          theme === 'light' 
            ? 'bg-cyan-100 border-cyan-300 text-cyan-800' 
            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
        }`}>
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
          theme === 'light' ? 'text-slate-950' : 'text-white'
        }`}>
          {mode === 'login' ? 'Sign In to Mausam Adapt' : 'Create Your Weather Account'}
        </h1>
        <p className={`text-xs sm:text-sm mt-1.5 font-medium ${
          theme === 'light' ? 'text-slate-700' : 'text-slate-300'
        }`}>
          {mode === 'login' 
            ? 'Access verified IMD forecast windows, commute alerts, and personalized activity decisions.'
            : 'Personalize weather-smart decisions for your daily routines and commute across India.'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className={`p-1 rounded-2xl border flex items-center mb-6 shadow-md ${
        theme === 'light' ? 'bg-slate-200 border-slate-300' : 'bg-slate-900 border-white/10'
      }`}>
        <button
          type="button"
          onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'login'
              ? theme === 'light' ? 'bg-cyan-600 text-white shadow-md' : 'bg-cyan-500 text-slate-950 shadow-md'
              : theme === 'light' ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'signup'
              ? theme === 'light' ? 'bg-cyan-600 text-white shadow-md' : 'bg-cyan-500 text-slate-950 shadow-md'
              : theme === 'light' ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Error / Success Notifications */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-600/15 border border-rose-500 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-600/15 border border-emerald-500 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-lg">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Auth Card Container */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 border ${
        theme === 'light'
          ? 'bg-white border-slate-300 text-slate-900 shadow-xl'
          : 'bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white shadow-2xl'
      }`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium focus:outline-none transition-colors border ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                      : 'bg-slate-950/90 border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium focus:outline-none transition-colors border ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                    : 'bg-slate-950/90 border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                }`}
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}>
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium focus:outline-none transition-colors border ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:bg-white focus:border-cyan-600'
                    : 'bg-slate-950/90 border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Activity Personas Selector (Sign Up only) */}
          {mode === 'signup' && (
            <div className="pt-2">
              <label className={`block text-xs font-bold mb-1.5 ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-200'
              }`}>
                Select Your Daily Activities (Personas)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {availablePersonas.map((p) => {
                  const isSelected = selectedPersonas.includes(p.id);
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePersona(p.id)}
                      className={`p-2 rounded-xl border text-left text-[11px] font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? theme === 'light'
                            ? 'bg-cyan-100 text-cyan-900 border-cyan-400 shadow-sm'
                            : 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-sm'
                          : theme === 'light'
                          ? 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          : 'bg-slate-950/60 text-slate-400 border-white/[0.06] hover:bg-slate-950'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Remember me (Sign In only) */}
          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className={`flex items-center gap-2 cursor-pointer font-medium ${
                theme === 'light' ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-0 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>
              <span className={`text-[11px] font-bold ${
                theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'
              }`}>
                Secure Session
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50 ${
              theme === 'light'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
            }`}
          >
            {isLoading ? (
              <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{mode === 'login' ? 'Sign In to Account' : 'Create My Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div className={`text-center pt-3 text-xs font-medium border-t ${
          theme === 'light' ? 'border-slate-200 text-slate-600' : 'border-white/[0.06] text-slate-400'
        }`}>
          {mode === 'login' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                className={`font-extrabold hover:underline cursor-pointer ${
                  theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                Sign up free →
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className={`font-extrabold hover:underline cursor-pointer ${
                  theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'
                }`}
              >
                Sign in here →
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
