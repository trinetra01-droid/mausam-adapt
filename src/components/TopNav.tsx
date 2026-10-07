import React, { useState, useEffect } from 'react';
import { MapPin, User, RefreshCw, Search, X, Navigation, LogIn, Clock } from 'lucide-react';
import { LocationRecord, UserPersona } from '../types.js';
import { api } from '../services/api.js';

interface TopNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  selectedLocation: LocationRecord;
  locations: LocationRecord[];
  onSelectLocation: (loc: LocationRecord) => void;
  activePersonas: UserPersona[];
  isOnline: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onAutoDetect?: () => void;
  isDetectingLocation?: boolean;
  currentUser?: any;
  theme?: 'light' | 'dark';
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  selectedLocation,
  locations,
  onSelectLocation,
  activePersonas,
  isOnline,
  onRefresh,
  isRefreshing,
  onAutoDetect,
  isDetectingLocation = false,
  currentUser = null,
  theme = 'dark'
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [istTime, setIstTime] = useState('');
  const [istFull, setIstFull] = useState('');

  // Live IST Clock (always accurate to Asia/Kolkata, UTC+5:30)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const dateStr = now.toLocaleDateString('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
      setIstTime(timeStr);
      setIstFull(`${dateStr} · ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchLocations(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error('TopNav search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchedCity = (city: any) => {
    const existing = locations.find(
      (l) => Math.abs(l.latitude - (city.lat || city.latitude)) < 0.05 &&
             Math.abs(l.longitude - (city.lng || city.longitude)) < 0.05
    );
    if (existing) {
      onSelectLocation(existing);
    } else {
      const newLoc: LocationRecord = {
        id: `city-${Date.now()}`,
        name: city.name,
        district: city.district,
        state: city.state,
        country: 'India',
        latitude: city.lat || city.latitude,
        longitude: city.lng || city.longitude,
        timezone: 'Asia/Kolkata',
        type: city.type || 'custom',
        is_saved: false
      };
      onSelectLocation(newLoc);
    }
    setShowLocationDropdown(false);
    setSearchQuery('');
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'rain-map', label: 'Rain Map' },
    { id: 'forecast', label: 'Forecast' },
    { id: 'plans', label: 'Plans' },
    { id: 'commuter', label: 'Commute' },
    { id: 'map', label: 'Map & Alerts' },
    { id: 'locations', label: 'Locations' },
    { id: 'explore', label: 'Explore' },
    { id: 'profile', label: 'Profile' }
  ];

  const cityShortName = selectedLocation.name.split('(')[0].trim();

  return (
    <header className={`fixed ${!isOnline ? 'top-8' : 'top-0'} left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors ${
      theme === 'light'
        ? 'bg-white/85 border-slate-200/90 text-slate-900 shadow-sm'
        : 'bg-slate-950/90 border-white/[0.06] text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <span className={`text-base sm:text-lg font-extrabold tracking-tight transition-colors ${
              theme === 'light' ? 'text-slate-950 group-hover:text-cyan-600' : 'text-white group-hover:text-cyan-400'
            }`}>
              Mausam Adapt
            </span>
          </button>

          {/* Desktop Navigation Only - Clean, unboxed typography with thin active indicator */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const isActive = currentTab === item.id || (item.id === 'map' && currentTab === 'alerts');
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? theme === 'light' ? 'text-cyan-700 font-extrabold' : 'text-white font-bold'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-cyan-500 rounded-full animate-fade-in" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Compact Right Controls: IST Clock, Location, Refresh, Profile (Clean on Mobile & Desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Live Indian Standard Time (IST) Clock - Always Visible Across All Tabs */}
          {istTime && (
            <div 
              title={`Indian Standard Time (IST) · ${istFull} (UTC+05:30)`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-tight shadow-sm shrink-0 border transition-all ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/40 text-cyan-200'
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Clock className={`w-3.5 h-3.5 shrink-0 hidden xs:inline ${theme === 'light' ? 'text-slate-600' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline font-black tracking-tight">{istTime}</span>
              <span className="sm:hidden font-extrabold text-[11px]">{istTime.replace(/:\d\d\s/, ' ')}</span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-sans tracking-wider shadow-xs ${
                theme === 'light'
                  ? 'bg-slate-950 text-white'
                  : 'bg-cyan-400 text-slate-950'
              }`}>
                IST
              </span>
            </div>
          )}

          {/* Location Selector (Compact, Human) */}
          <div className="relative shrink">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm max-w-[90px] xs:max-w-[125px] sm:max-w-[200px] ${
                theme === 'light'
                  ? 'text-slate-900 hover:text-black bg-white/90 hover:bg-white border border-slate-300'
                  : 'text-slate-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]'
              }`}
            >
              {isDetectingLocation ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
              ) : selectedLocation.is_auto_detected ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
              ) : (
                <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              )}
              <span className="truncate">
                {isDetectingLocation ? 'Detecting...' : cityShortName}
              </span>
              {selectedLocation.is_auto_detected && !isDetectingLocation && (
                <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1 rounded border border-cyan-500/20 shrink-0 hidden xs:inline">
                  AUTO
                </span>
              )}
            </button>

            {/* Location Selector Dropdown / Mobile Sheet */}
            {showLocationDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
                  onClick={() => setShowLocationDropdown(false)}
                />

                <div className={`fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 mt-1 sm:w-80 backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in ${
                  theme === 'light'
                    ? 'bg-white/95 border-slate-200 text-slate-900 shadow-xl'
                    : 'bg-slate-900/95 border-white/10 text-white shadow-2xl'
                }`}>
                  {/* Instant Auto-Detect Button */}
                  {onAutoDetect && (
                    <div className={`p-2.5 border-b ${
                      theme === 'light' ? 'border-slate-200 bg-cyan-50/50' : 'border-white/[0.06] bg-cyan-500/[0.03]'
                    }`}>
                      <button
                        type="button"
                        onClick={() => {
                          onAutoDetect();
                          setShowLocationDropdown(false);
                        }}
                        disabled={isDetectingLocation}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                          theme === 'light'
                            ? 'bg-cyan-100/70 hover:bg-cyan-100 text-cyan-950 border-cyan-300'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/25'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Navigation className={`w-3.5 h-3.5 text-cyan-500 shrink-0 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                          <span className="truncate">{isDetectingLocation ? 'Detecting your city...' : 'Auto-detect current city'}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 font-mono shrink-0">GPS/IP</span>
                      </button>
                    </div>
                  )}

                  <div className={`p-3 border-b flex items-center justify-between gap-2 ${
                    theme === 'light' ? 'border-slate-200' : 'border-white/[0.06]'
                  }`}>
                    <div className="relative flex-1">
                      <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search city, district in India..."
                        className={`w-full rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none transition-colors border ${
                          theme === 'light'
                            ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:bg-white'
                            : 'bg-slate-950/80 border-white/10 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                        }`}
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLocationDropdown(false)}
                      className={`p-1.5 rounded-lg sm:hidden ${
                        theme === 'light' ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`max-h-60 overflow-y-auto divide-y ${
                    theme === 'light' ? 'divide-slate-200' : 'divide-white/[0.04]'
                  }`}>
                    {searchQuery.trim() ? (
                      isSearching ? (
                        <div className={`p-4 text-center text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Searching Indian cities...</div>
                      ) : searchResults.length === 0 ? (
                        <div className={`p-4 text-center text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>No matching cities found in India.</div>
                      ) : (
                        searchResults.map((city, idx) => (
                          <button
                            key={`${city.name}-${city.lat}-${idx}`}
                            onClick={() => handleSelectSearchedCity(city)}
                            className={`w-full text-left p-3 transition-colors flex items-center justify-between group cursor-pointer ${
                              theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className={`text-xs font-semibold truncate ${
                                theme === 'light' ? 'text-slate-900 group-hover:text-cyan-700' : 'text-slate-200 group-hover:text-cyan-400'
                              }`}>
                                {city.name}
                              </div>
                              <div className={`text-[11px] truncate ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                                {city.district}, {city.state}
                              </div>
                            </div>
                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">Select</span>
                          </button>
                        ))
                      )
                    ) : (
                      <>
                        <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                          theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          Saved Locations
                        </div>
                        {locations.map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => {
                              onSelectLocation(loc);
                              setShowLocationDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/[0.04]'
                            } ${
                              selectedLocation.id === loc.id 
                                ? theme === 'light' ? 'text-cyan-800 font-bold bg-cyan-50/50' : 'text-cyan-400 font-semibold bg-white/[0.02]' 
                                : theme === 'light' ? 'text-slate-800' : 'text-slate-300'
                            }`}
                          >
                            <div className="truncate">
                              <div className="truncate font-medium">{loc.name.split('(')[0].trim()}</div>
                              <div className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{loc.state}</div>
                            </div>
                            {selectedLocation.id === loc.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  <div className={`p-2.5 border-t text-center ${
                    theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-slate-950/40'
                  }`}>
                    <button
                      onClick={() => {
                        onSelectTab('locations');
                        setShowLocationDropdown(false);
                      }}
                      className={`text-xs font-semibold transition-colors cursor-pointer ${
                        theme === 'light' ? 'text-cyan-700 hover:text-cyan-800' : 'text-cyan-400 hover:text-cyan-300'
                      }`}
                    >
                      Manage All Locations →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            title="Refresh verified data"
            className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
              theme === 'light'
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 border border-slate-300'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
          </button>

          {/* User Account / Sign In & Sign Up Actions */}
          {currentUser ? (
            <button
              onClick={() => onSelectTab('profile')}
              className={`shrink-0 flex items-center gap-1.5 sm:gap-2 pl-2 pr-3 py-1.5 rounded-full transition-all cursor-pointer border ${
                currentTab === 'profile'
                  ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/50'
                  : theme === 'light'
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/10'
              }`}
              title={`Logged in as ${currentUser.name || currentUser.email}`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold max-w-[90px] truncate hidden sm:inline">
                {currentUser.name ? currentUser.name.split(' ')[0] : 'Account'}
              </span>
            </button>
          ) : (
            <div className="shrink-0 flex items-center gap-1.5 z-20">
              <button
                type="button"
                onClick={() => onSelectTab('auth')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border shadow-md ${
                  currentTab === 'auth' || currentTab === 'login'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg'
                    : theme === 'light'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-700 shadow-md'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400 shadow-md'
                }`}
                title="Sign in to your account"
              >
                <LogIn className={`w-3.5 h-3.5 shrink-0 ${theme === 'light' ? 'text-white' : 'text-slate-950'}`} />
                <span className="whitespace-nowrap font-extrabold tracking-wide">Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('signup')}
                className={`hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                  currentTab === 'signup'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold border-cyan-400/50 shadow-md'
                }`}
                title="Create free weather account"
              >
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
