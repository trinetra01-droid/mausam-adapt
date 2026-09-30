import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Satellite, 
  CloudRain, 
  Zap, 
  Compass, 
  Sprout, 
  Ship, 
  Wind, 
  Plane, 
  ExternalLink,
  X,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.js';

interface CategoryTile {
  id: string;
  name: string;
  icon: any;
  summary: string;
  agency: string;
  details: string[];
  link: string;
}

const CATEGORIES: CategoryTile[] = [
  {
    id: 'radar',
    name: 'Doppler Radar',
    icon: Radio,
    summary: 'Network of 37 S, C, and X-Band Doppler Weather Radars with 250km reflectivity scan.',
    agency: 'IMD National Radar Centre',
    details: ['Volume Scan Coverage (VCP)', 'Mesoscale Convective Storm Tracking', 'Hydrometeor Classification'],
    link: 'https://mausam.imd.gov.in/responsive/radar.php'
  },
  {
    id: 'satellite',
    name: 'Satellite Feeds',
    icon: Satellite,
    summary: 'INSAT-3D, INSAT-3DR, and Oceansat payloads stationed over the Indian subcontinent.',
    agency: 'ISRO / MOSDAC & IMD',
    details: ['Infrared & Visible Channel Imagery', 'Cloud Top Temperature (CTT)', 'Atmospheric Motion Vectors'],
    link: 'https://mosdac.gov.in'
  },
  {
    id: 'rainfall',
    name: 'Rainfall & Monsoon',
    icon: CloudRain,
    summary: 'District-wise cumulative rainfall statistics, departure maps, and river basin telemetry.',
    agency: 'Hydromet Division, IMD',
    details: ['Monsoon Progress Isochrones', 'River Basin Flood Advisory', 'District Rainfall Departures'],
    link: 'https://hydro.imd.gov.in'
  },
  {
    id: 'lightning',
    name: 'Lightning & Damini',
    icon: Zap,
    summary: 'Real-time lightning flash detection and nowcast alerts within a 20-40km radius.',
    agency: 'IITM Pune & MoES',
    details: ['Damini Sensor Grid', 'Cloud-to-Ground Flash Density', 'Nowcast Severe Alert Broadcasts'],
    link: 'https://www.tropmet.res.in'
  },
  {
    id: 'cyclone',
    name: 'Cyclone Warning',
    icon: Compass,
    summary: 'Regional Specialized Meteorological Centre (RSMC) tropical cyclone track forecasts.',
    agency: 'RSMC New Delhi',
    details: ['Storm Surge Inundation Modeling', 'Cone of Uncertainty Trajectory', 'Fishermen & Coastal Evacuation Bulletins'],
    link: 'https://rsmcnewdelhi.imd.gov.in'
  },
  {
    id: 'agriculture',
    name: 'Agromet & Meghdoot',
    icon: Sprout,
    summary: 'Agro-meteorological field advisories for kharif and rabi crop stages.',
    agency: 'Agrimet Advisory Division',
    details: ['Meghdoot Bi-weekly Bulletins', 'Pesticide & Fertilizer Spray Windows', 'Frost & Heatwave Crop Safeguards'],
    link: 'https://agrimet.imd.gov.in'
  },
  {
    id: 'marine',
    name: 'Coastal & Marine',
    icon: Ship,
    summary: 'Ocean state forecasts, high wave alerts, swell surges, and tsunami warnings.',
    agency: 'INCOIS Hyderabad',
    details: ['Significant Wave Height & Period', 'Potential Fishing Zone (PFZ) Advisories', 'Swell Surge & Rough Sea Forecasts'],
    link: 'https://incois.gov.in'
  },
  {
    id: 'climate',
    name: 'Climate Diagnostics',
    icon: Wind,
    summary: 'Long-range seasonal monsoon forecasts, El Niño/La Niña status, and extreme climate trends.',
    agency: 'National Climate Centre (NCC)',
    details: ['ENSO & Indian Ocean Dipole (IOD)', 'Sub-Seasonal to Seasonal (S2S) Models', 'Historical Climate Data Archives'],
    link: 'https://www.imdpune.gov.in'
  },
  {
    id: 'aviation',
    name: 'Aviation Weather',
    icon: Plane,
    summary: 'Aerodrome forecasts (TAF), METAR observations, and en-route turbulence SIGMETs.',
    agency: 'Aviation Met Service, IMD',
    details: ['Runway Visual Range (RVR)', 'Low-Level Wind Shear Warnings', 'International Aerodrome TAFs'],
    link: 'https://aviation.imd.gov.in'
  }
];

export const ExploreView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryTile | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* 25. Header */}
      <section className="pt-4 border-b border-white/[0.06] pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Explore Scientific Services
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Direct access to the specialized research and forecasting divisions of the India Meteorological Department and Ministry of Earth Sciences.
        </p>
      </section>

      {/* Visual Category Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              className="p-6 rounded-3xl bg-slate-900/50 hover:bg-slate-900/80 border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer flex flex-col justify-between gap-6 group shadow-lg"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] group-hover:bg-cyan-950/80 group-hover:text-cyan-400 text-slate-300 flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {cat.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">{cat.agency}</div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {cat.summary}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-white pt-2 border-t border-white/[0.04]">
                <span>View capabilities</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </section>

      {/* Selected Category Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  {selectedCategory.agency}
                </span>
                <h3 className="text-xl font-bold text-white">
                  {selectedCategory.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/[0.05]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedCategory.summary}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Specialized Capabilities
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {selectedCategory.details.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={selectedCategory.link}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-md"
              >
                <span>Visit Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
