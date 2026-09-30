import { Router, Request, Response } from 'express';
import { mosdacProvider } from '../providers/mosdac.js';

export const exploreRouter = Router();

// Full IMD & MoES Ecosystem Directory
exploreRouter.get('/summary', async (req: Request, res: Response) => {
  const satelliteProducts = await mosdacProvider.getOperationalProducts();

  res.json({
    title: 'India Meteorological Department & MoES Ecosystem Explorer',
    categories: [
      {
        id: 'weather_intelligence',
        name: 'Weather Intelligence',
        description: 'Near-real-time remote sensing, lightning and radar monitoring across India',
        services: [
          {
            title: 'Doppler Weather Radar (DWR) Network',
            agency: 'IMD',
            description: '37 operational S-band & X-band Doppler radars monitoring precipitation, wind shear and severe thunderstorms in 250km radial scans.',
            features: ['Reflectivity (MAXZ)', 'Radial Velocity', 'Echo Top Height', 'Hydrometeor Classification'],
            official_url: 'https://mausam.imd.gov.in/responsive/radar.php'
          },
          {
            title: 'INSAT-3D & 3DR Geostationary Satellites',
            agency: 'SAC / ISRO & IMD',
            description: 'Thermal Infrared, Water Vapor and High-Resolution Visible imagery scanning South Asia every 15-30 minutes.',
            features: ['TIR-1 Convective Clouds', 'Upper Troposphere Water Vapor', 'Cloud Top Temperature', 'RAPID Scan Mode'],
            official_url: 'https://mosdac.gov.in/live/'
          },
          {
            title: 'Damini Lightning Detection Network',
            agency: 'IITM Pune & IMD',
            description: 'Sensors across India detecting intra-cloud and cloud-to-ground lightning flashes with 30-minute advance location warnings.',
            features: ['Strike Azimuth & Distance', 'Thunderstorm Cell Velocity', 'Damini Hazard Ring'],
            official_url: 'https://www.tropmet.res.in/'
          },
          {
            title: 'Subdivision & District Rainfall Monitoring (RFD)',
            agency: 'IMD Hydromet',
            description: 'Daily, weekly and seasonal departure rainfall statistics compared against 50-year climatological normals (1971-2020).',
            features: ['Large Excess (>60%)', 'Normal (-19% to +19%)', 'Deficient (-20% to -59%)'],
            official_url: 'https://mausam.imd.gov.in/responsive/rainfallinformation.php'
          },
          {
            title: 'Regional Specialized Meteorological Centre (RSMC) Tropical Cyclones',
            agency: 'IMD New Delhi RSMC',
            description: 'WMO designated regional center tracking depressions, deep depressions and cyclonic storms in Bay of Bengal and Arabian Sea.',
            features: ['Observed Track Cone', 'Quadrant Wind Radius (34/50/64 kts)', 'T-Number Dvorak Analysis', 'Storm Surge Height'],
            official_url: 'https://rsmcnewdelhi.imd.gov.in/'
          }
        ]
      },
      {
        id: 'specialized',
        name: 'Specialized National Sectors',
        description: 'Targeted agricultural, highway, aviation and marine meteorological services',
        services: [
          {
            title: 'Agromet Advisory Services (Meghdoot / Gramin Krishi Mausam Sewa)',
            agency: 'IMD & ICAR',
            description: 'District and block-level agromet bulletins issued every Tuesday and Friday tailored for crop sowing, spraying and harvesting.',
            features: ['Pesticide Spray Windows', 'Soil Moisture Suitability', 'Frost & Heat Wave Warnings', 'Crop Stage Guidance'],
            official_url: 'https://agromet.imd.gov.in/'
          },
          {
            title: 'Highway Weather Advisory & Nowcast',
            agency: 'IMD & MoRTH',
            description: 'Corridor-based fog, torrential rain and landslide forecasts along national highway stretches.',
            features: ['Fog Density & Visibility Class', 'Waterlogging Risk Index', 'Ghat Section Wind Gusts'],
            official_url: 'https://mausam.imd.gov.in/'
          },
          {
            title: 'Port & Sea Area Fishermen Advisories',
            agency: 'IMD & INCOIS',
            description: 'Warning flags (1 through 11) hoisted at major Indian ports and rough sea alerts for nearshore artisanal and offshore deep-sea fishermen.',
            features: ['Distance from Harbor', 'Squally Wind Warning (>45 kmph)', 'Port Signals hoised'],
            official_url: 'https://mausam.imd.gov.in/responsive/marine.php'
          },
          {
            title: 'Pilgrimage & Mountain Tourism Forecasts',
            agency: 'IMD',
            description: 'Specialized high-altitude forecasts for Himalayan pilgrimage routes (Amarnath, Char Dham, Vaishno Devi) and western ghat hill retreats.',
            features: ['Freezing Level Height', 'Snowfall Occurrence Probability', 'Wind Chill Index'],
            official_url: 'https://mausam.imd.gov.in/'
          }
        ]
      },
      {
        id: 'climate_atlas',
        name: 'Climate & Hazard Atlas of India',
        description: 'Historical extreme weather recurrence, hazard vulnerability and climatological baselines',
        services: [
          {
            title: 'Hazard Atlas of India (Extreme Weather Vulnerability)',
            agency: 'IMD Climate Services',
            description: 'District-wise spatial mapping of cyclones, floods, drought, cold waves, heat waves, dust storms and thunderstorm recurrence.',
            features: ['Return Period Analysis', 'Socio-Economic Exposure Matrix', 'Normalized Vulnerability Index'],
            official_url: 'https://imdpune.gov.in/'
          }
        ]
      }
    ],
    operational_satellite_metadata: satelliteProducts
  });
});
