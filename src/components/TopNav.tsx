import React, { useState, useEffect } from 'react';
import { MapPin, User, RefreshCw, Search, X } from 'lucide-react';
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
  theme = 'dark'
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
    { id: 'forecast', label: 'Forecast' },
    { id: 'plans', label: 'Plans' },
    { id: 'commuter', label: 'Commute' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'map', label: 'Map' },
    { id: 'locations', label: 'Locations' },
    { id: 'explore', label: 'Explore' },
    { id: 'profile', label: 'Profile' }
  ];

  const cityShortName = selectedLocation.name.split('(')[0].trim();

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all ${
      theme === 'light'
        ? 'bg-white/85 border-slate-200 text-slate-900 shadow-sm'
        : 'bg-slate-950/85 border-white/[0.06] text-white'
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
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? theme === 'light' ? 'text-cyan-600 font-semibold' : 'text-white'
                      : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-cyan-400 rounded-full animate-fade-in" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Compact Right Controls: Location, Refresh, Profile (Clean on Mobile & Desktop) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Location Selector (Compact, Human) */}
          <div className="relative">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-full transition-all cursor-pointer shadow-sm max-w-[150px] sm:max-w-[200px]"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{cityShortName}</span>
            </button>

            {/* Location Selector Dropdown / Mobile Sheet */}
            {showLocationDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
                  onClick={() => setShowLocationDropdown(false)}
                />

                <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 mt-1 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                  <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search city, district..."
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLocationDropdown(false)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] sm:hidden"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-white/[0.04]">
                    {searchQuery.trim() ? (
                      isSearching ? (
                        <div className="p-4 text-center text-xs text-slate-400">Searching Indian cities...</div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No matching cities found.</div>
                      ) : (
                        searchResults.map((city, idx) => (
                          <button
                            key={`${city.name}-${city.lat}-${idx}`}
                            onClick={() => handleSelectSearchedCity(city)}
                            className="w-full text-left p-3 hover:bg-white/[0.04] transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-400 truncate">
                                {city.name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {city.district}, {city.state}
                              </div>
                            </div>
                            <span className="text-[10px] text-cyan-400">Select</span>
                          </button>
                        ))
                      )
                    ) : (
                      <>
                        <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Saved Locations
                        </div>
                        {locations.map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => {
                              onSelectLocation(loc);
                              setShowLocationDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer ${
                              selectedLocation.id === loc.id ? 'text-cyan-400 font-semibold bg-white/[0.02]' : 'text-slate-300'
                            }`}
                          >
                            <div className="truncate">
                              <div className="truncate font-medium">{loc.name.split('(')[0].trim()}</div>
                              <div className="text-[11px] text-slate-400">{loc.state}</div>
                            </div>
                            {selectedLocation.id === loc.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="p-2.5 border-t border-white/[0.06] bg-slate-950/40 text-center">
                    <button
                      onClick={() => {
                        onSelectTab('locations');
                        setShowLocationDropdown(false);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                    >
                      Manage Locations →
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
              theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Profile Action */}
          <button
            onClick={() => onSelectTab('profile')}
            className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
              currentTab === 'profile'
                ? theme === 'light' ? 'text-cyan-600 bg-cyan-50' : 'text-cyan-400 bg-white/[0.08]'
                : theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
            }`}
            title="Profile & Personas"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
