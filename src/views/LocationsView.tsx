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

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* 22. Header: MY LOCATIONS */}
      <section className="pt-4 border-b border-white/[0.06] pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Locations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Saved observatories and travel hubs across India.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddSection(!showAddSection)}
          className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold rounded-full transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Location</span>
        </button>
      </section>

      {/* Add Location Search Area (Clean, Unboxed) */}
      {showAddSection && (
        <section className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-300">
              Save as:
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              {(['home', 'work', 'destination', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-full transition-colors cursor-pointer capitalize ${
                    selectedType === type ? 'bg-cyan-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'work' ? 'Office' : type === 'destination' ? 'Travel' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Indian cities (e.g. Rampur, Moradabad, Bareilly, Delhi)..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              autoFocus
            />
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="divide-y divide-white/[0.05] border-t border-white/[0.06] max-h-56 overflow-y-auto">
              {searchResults.map((city, idx) => (
                <div
                  key={`${city.name}-${idx}`}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{city.name}</div>
                    <div className="text-xs text-slate-400">{city.district}, {city.state}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddLocation(city)}
                    className="px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Locations List (Clean, Unboxed Rows) */}
      <section className="space-y-4">
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {locations.map((loc) => {
            const isActive = selectedLocation.id === loc.id;
            const typeLabel = loc.type === 'home' ? 'Home' : loc.type === 'work' ? 'Office' : 'Travel';
            const icon = loc.type === 'home' ? '🏠' : loc.type === 'work' ? '🏢' : '📍';

            return (
              <div
                key={loc.id}
                className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-xl mt-0.5">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-cyan-400">
                        {typeLabel}
                      </span>
                      <span className="text-white/20 select-none">·</span>
                      <span className="text-xs text-slate-400">{loc.state}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                      {loc.name.split('(')[0].trim()}
                    </h3>

                    <div className="text-xs text-slate-400 mt-0.5">
                      Clear conditions · Normal atmospheric safety
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  {isActive ? (
                    <span className="px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/40 rounded-full border border-emerald-800/40">
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectLocation(loc)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors cursor-pointer"
                    >
                      Set Active
                    </button>
                  )}

                  {locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove location"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
