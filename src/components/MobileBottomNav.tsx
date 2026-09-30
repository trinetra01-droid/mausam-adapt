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
  Shield
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  hasActiveAlert?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  hasActiveAlert = false
}) => {
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const moreTabs = ['commuter', 'map', 'locations', 'explore', 'profile', 'admin'];
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
      id: 'commuter',
      label: 'Commute',
      description: 'Route conditions, expressway sightlines & rail',
      icon: Car
    },
    {
      id: 'map',
      label: 'Weather Map',
      description: 'Interactive radar, satellite & alert overlays',
      icon: MapIcon
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
    },
    {
      id: 'profile',
      label: 'Profile & Settings',
      description: 'Personas, units & alert preferences',
      icon: User
    }
  ];

  return (
    <>
      {/* Fixed Mobile Bottom Navigation Bar (68-76px high, safe-area aware) */}
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)] bottom-nav-safe"
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

          {/* 4. Alerts */}
          <button
            type="button"
            onClick={() => handleTabClick('alerts')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              currentTab === 'alerts' && !showMoreSheet
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <AlertTriangle className="w-5 h-5" />
              {hasActiveAlert && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
              {currentTab === 'alerts' && !showMoreSheet && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">Alerts</span>
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

          <div className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto pb-safe">
            {/* Sheet Handle & Header */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  More Services
                </h3>
                <p className="text-xs text-slate-400">
                  Select a section to navigate
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreSheet(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of more items */}
            <div className="divide-y divide-white/[0.05] py-2">
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
                      isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isActive 
                          ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(34,211,238,0.4)]' 
                          : 'bg-white/[0.05] text-slate-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${
                          isActive ? 'text-cyan-400' : 'text-white'
                        }`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
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
