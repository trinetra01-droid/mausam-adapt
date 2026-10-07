import React, { useState } from 'react';
import { 
  Home, 
  CalendarDays, 
  CheckSquare, 
  AlertTriangle, 
  Grid, 
  X, 
  Car, 
  Map as MapIcon, 
  MapPin, 
  Compass, 
  User, 
  ChevronRight,
  Shield,
  LogIn,
  CloudRain
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  hasActiveAlert?: boolean;
  currentUser?: any;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  hasActiveAlert = false,
  currentUser = null
}) => {
  const { theme } = useTheme();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const moreTabs = ['rain-map', 'commuter', 'locations', 'explore', 'profile', 'admin', 'auth', 'login', 'signup'];
  const isMoreActive = moreTabs.includes(currentTab);

  const handleTabClick = (tabId: string) => {
    if (tabId === 'more') {
      setShowMoreSheet(true);
    } else {
      onSelectTab(tabId);
      setShowMoreSheet(false);
    }
  };

  const moreItems = [
    {
      id: 'rain-map',
      label: 'Rain Around You',
      description: 'IMD Doppler Weather Radar & spatial precipitation extent',
      icon: CloudRain,
      isPrimary: true
    },
    {
      id: currentUser ? 'profile' : 'auth',
      label: currentUser ? `Account (${currentUser.name?.split(' ')[0] || 'Profile'})` : 'Sign In / Register',
      description: currentUser ? 'Manage your profile, units and alert thresholds' : 'Login to save daily corridors and personalize decisions',
      icon: currentUser ? User : LogIn,
      isPrimary: true
    },
    {
      id: 'commuter',
      label: 'Commute Corridor',
      description: 'City & intra-city travel, colony routes & sightlines',
      icon: Car
    },
    {
      id: 'locations',
      label: 'My Locations',
      description: 'Saved hubs, office & travel destinations',
      icon: MapPin
    },
    {
      id: 'explore',
      label: 'Explore Services',
      description: 'Specialized divisions of IMD & MoES',
      icon: Compass
    }
  ];

  return (
    <>
      {/* Fixed Mobile Bottom Navigation Bar (68-76px high, safe-area aware) */}
      <nav 
        aria-label="Mobile Navigation"
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-2xl border-t transition-colors bottom-nav-safe ${
          theme === 'light'
            ? 'bg-white/90 border-slate-200/90 text-slate-900 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.06)]'
            : 'bg-slate-950/95 border-white/[0.08] text-white shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)]'
        }`}
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => handleTabClick('home')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              currentTab === 'home' && !showMoreSheet
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Home className="w-5 h-5" />
              {currentTab === 'home' && !showMoreSheet && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">Home</span>
          </button>

          {/* 2. Forecast */}
          <button
            type="button"
            onClick={() => handleTabClick('forecast')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              currentTab === 'forecast' && !showMoreSheet
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <CalendarDays className="w-5 h-5" />
              {currentTab === 'forecast' && !showMoreSheet && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">Forecast</span>
          </button>

          {/* 3. Plans */}
          <button
            type="button"
            onClick={() => handleTabClick('plans')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              currentTab === 'plans' && !showMoreSheet
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <CheckSquare className="w-5 h-5" />
              {currentTab === 'plans' && !showMoreSheet && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">Plans</span>
          </button>

          {/* 4. Map & Alerts */}
          <button
            type="button"
            onClick={() => handleTabClick('map')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              (currentTab === 'map' || currentTab === 'alerts') && !showMoreSheet
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <MapIcon className="w-5 h-5" />
              {hasActiveAlert && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
              {(currentTab === 'map' || currentTab === 'alerts') && !showMoreSheet && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">Map &amp; Alerts</span>
          </button>

          {/* 5. More */}
          <button
            type="button"
            onClick={() => handleTabClick('more')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              isMoreActive || showMoreSheet
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Grid className="w-5 h-5" />
              {isMoreActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Thumb-friendly Slide-Up More Menu Sheet */}
      {showMoreSheet && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/75 backdrop-blur-md animate-fade-in">
          {/* Backdrop dismiss */}
          <div 
            className="flex-1" 
            onClick={() => setShowMoreSheet(false)}
          />

          <div className={`border-t rounded-t-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto pb-safe ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            {/* Sheet Handle & Header */}
            <div className={`w-12 h-1 rounded-full mx-auto mb-4 ${theme === 'light' ? 'bg-slate-300' : 'bg-white/20'}`} />

            <div className={`flex items-center justify-between pb-3 border-b ${
              theme === 'light' ? 'border-slate-200' : 'border-white/[0.06]'
            }`}>
              <div>
                <h3 className={`text-base font-bold tracking-tight ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                  More Services
                </h3>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Select a section to navigate
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreSheet(false)}
                className={`p-2 rounded-full ${
                  theme === 'light' ? 'text-slate-600 hover:text-slate-900 bg-slate-100' : 'text-slate-400 hover:text-white bg-white/[0.04]'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of more items */}
            <div className={`py-2 divide-y ${
              theme === 'light' ? 'divide-slate-200' : 'divide-white/[0.05]'
            }`}>
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setShowMoreSheet(false);
                    }}
                    className={`w-full py-3.5 px-2 flex items-center justify-between text-left transition-colors cursor-pointer rounded-xl ${
                      isActive 
                        ? theme === 'light' ? 'bg-cyan-50' : 'bg-white/[0.06]'
                        : theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isActive 
                          ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(34,211,238,0.4)]' 
                          : theme === 'light' ? 'bg-slate-100 text-slate-700' : 'bg-white/[0.05] text-slate-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${
                          isActive 
                            ? theme === 'light' ? 'text-cyan-800 font-bold' : 'text-cyan-400' 
                            : theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {item.label}
                        </div>
                        <div className={`text-xs truncate mt-0.5 ${
                          theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
