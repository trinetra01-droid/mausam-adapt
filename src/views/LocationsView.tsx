import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Search, 
  Check, 
  Building2, 
  Home, 
  Plane,
  Compass
} from 'lucide-react';
import { LocationRecord } from '../types.js';
import { api } from '../services/api.js';
import { useTheme } from '../context/ThemeContext.js';

interface LocationsViewProps {
  locations: LocationRecord[];
  selectedLocation: LocationRecord;
  onSelectLocation: (loc: LocationRecord) => void;
  onRefreshLocations: () => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onRefreshLocations
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedType, setSelectedType] = useState<LocationRecord['type']>('home');

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await api.searchLocations(q);
      setSearchResults(results);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddLocation = async (loc: any) => {
    try {
      const created = await api.addLocation({
        name: loc.name,
        latitude: loc.lat || loc.latitude,
        longitude: loc.lng || loc.longitude,
        district: loc.district,
        state: loc.state,
        type: selectedType
      });
      onRefreshLocations();
      onSelectLocation(created);
      setSearchQuery('');
      setSearchResults([]);
      setShowAddSection(false);

      // Sync with commuter profile if home or work
      if (selectedType === 'home' || selectedType === 'work') {
        try {
          const saved = localStorage.getItem('trinetra_commuter_profile');
          const p = saved ? JSON.parse(saved) : {};
          if (selectedType === 'home') p.homeLocationName = loc.name;
          if (selectedType === 'work') p.workplaceName = loc.name;
          localStorage.setItem('trinetra_commuter_profile', JSON.stringify(p));
        } catch (_) {}
      }
    } catch (e: any) {
      alert(`Could not add location: ${e.message}`);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      await api.deleteLocation(id);
      onRefreshLocations();
    } catch (e: any) {
      console.error('Delete location error:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllLocations();
      onRefreshLocations();
    } catch (e: any) {
      console.error('Clear all locations error:', e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Header: MY LOCATIONS with High Contrast */}
      <section className={`pt-4 pb-6 flex items-center justify-between border-b ${
        theme === 'light' ? 'border-slate-300' : 'border-white/[0.06]'
      }`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            theme === 'light' ? 'text-slate-950' : 'text-white'
          }`}>
            My Locations
          </h1>
          <p className={`text-sm mt-1 font-medium ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-400'
          }`}>
            Your personalized saved cities, hubs, and travel destinations in India.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {locations.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className={`px-3.5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer inline-flex items-center gap-1.5 border shadow-sm ${
                theme === 'light'
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove All</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddSection(!showAddSection)}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm border ${
              theme === 'light'
                ? 'bg-slate-900 hover:bg-black text-white border-slate-950'
                : 'bg-white/[0.1] hover:bg-white/[0.2] text-white border-white/20'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Location</span>
          </button>
        </div>
      </section>

      {/* Add Location Search Area */}
      {showAddSection && (
        <section className={`p-6 rounded-3xl backdrop-blur-xl space-y-4 animate-fade-in border shadow-lg ${
          theme === 'light'
            ? 'bg-white/95 border-slate-200 text-slate-900'
            : 'bg-slate-900/80 border-white/10 text-white'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              theme === 'light' ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Save as:
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {(['home', 'work', 'destination', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-full transition-colors cursor-pointer capitalize border ${
                    selectedType === type
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                      : theme === 'light'
                      ? 'bg-slate-100 text-slate-700 hover:text-black border-slate-200'
                      : 'bg-white/5 text-slate-400 hover:text-white border-white/5'
                  }`}
                >
                  {type === 'work' ? 'Office' : type === 'destination' ? 'Travel' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3.5 top-3.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Indian cities (e.g. Rampur, Moradabad, Bareilly, Delhi)..."
              className={`w-full rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors border ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:bg-white'
                  : 'bg-slate-950/80 border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
              }`}
              autoFocus
            />
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className={`divide-y max-h-56 overflow-y-auto border-t pt-2 ${
              theme === 'light' ? 'divide-slate-200 border-slate-200' : 'divide-white/[0.05] border-white/[0.06]'
            }`}>
              {searchResults.map((city, idx) => (
                <div
                  key={`${city.name}-${idx}`}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div>
                    <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                      {city.name}
                    </div>
                    <div className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      {city.district}, {city.state}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddLocation(city)}
                    className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                  >
                    Save
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Locations List */}
      <section className="space-y-3">
        <div className={`rounded-3xl p-2 sm:p-4 divide-y border shadow-md backdrop-blur-xl ${
          theme === 'light'
            ? 'bg-white/85 border-slate-200 divide-slate-200'
            : 'bg-slate-900/60 border-white/[0.08] divide-white/[0.06]'
        }`}>
          {locations.map((loc) => {
            const isActive = selectedLocation.id === loc.id;
            const typeLabel = loc.type === 'home' ? 'Home' : loc.type === 'work' ? 'Office' : 'Travel';
            const icon = loc.type === 'home' ? '🏠' : loc.type === 'work' ? '🏢' : '📍';

            return (
              <div
                key={loc.id}
                className="py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group rounded-2xl transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'
                      }`}>
                        {typeLabel}
                      </span>
                      <span className="opacity-30 select-none">·</span>
                      <span className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                        {loc.state}, India
                      </span>
                    </div>

                    <h3 className={`text-lg sm:text-xl font-extrabold mt-0.5 ${
                      theme === 'light' ? 'text-slate-950' : 'text-white'
                    }`}>
                      {loc.name.split('(')[0].trim()}
                    </h3>

                    <div className={`text-xs font-medium mt-0.5 ${
                      theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      Verified India Meteorological Department Station
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  {isActive ? (
                    <span className="px-3.5 py-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-300 shadow-sm flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Active Location</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectLocation(loc)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer border ${
                        theme === 'light'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border-white/10'
                      }`}
                    >
                      Set Active
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    title="Remove location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {locations.length === 0 && (
            <div className={`p-10 text-center rounded-2xl text-xs space-y-3 ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-400'
            }`}>
              <Compass className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
              <p className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>
                No saved locations in India.
              </p>
              <p className="max-w-sm mx-auto leading-relaxed">
                All pre-populated cities have been cleared. Tap <strong className="font-bold">"Add Location"</strong> above to save your cities in Uttar Pradesh, Delhi, or across India.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
