/**
 * Geographic and Coastal Utility for Indian Territories
 * Determines whether a given location/district/state has coastal/maritime access
 * or is an inland/landlocked territory.
 */

// Coastal States and Union Territories of India
const COASTAL_STATES = [
  'gujarat',
  'maharashtra',
  'goa',
  'karnataka',
  'kerala',
  'tamil nadu',
  'andhra pradesh',
  'odisha',
  'west bengal',
  'puducherry',
  'daman and diu',
  'dadra and nagar haveli and daman and diu',
  'andaman and nicobar',
  'lakshadweep'
];

// Inland/Landlocked districts located within coastal states that have no direct coastline
const INLAND_DISTRICTS_IN_COASTAL_STATES = [
  // Maharashtra inland
  'pune', 'nagpur', 'nashik', 'aurangabad', 'chhatrapati sambhajinagar', 'solapur', 
  'kolhapur', 'jalgaon', 'amravati', 'nanded', 'satara', 'sangli', 'ahmednagar', 
  'beed', 'jalna', 'latur', 'osmanabad', 'dharashiv', 'parbhani', 'wardha', 'yavatmal', 
  'chandrapur', 'gadchiroli', 'bhandara', 'gondia', 'buldhana', 'dhule', 'nandurbar',
  // Karnataka inland
  'bengaluru', 'bangalore', 'bengaluru urban', 'bengaluru rural', 'mysuru', 'mysore', 
  'hubballi', 'dharwad', 'belagavi', 'kalaburagi', 'ballari', 'tumakuru', 'shivamogga', 
  'davanagere', 'chitradurga', 'kolar', 'chikkaballapur', 'ramanagara', 'mandya', 
  'hassan', 'chikkamagaluru', 'kodagu', 'raichur', 'koppal', 'gadag', 'haveri', 'vijayanagara', 'yadgir', 'bidar',
  // Tamil Nadu inland
  'coimbatore', 'madurai', 'tiruchirappalli', 'salem', 'erode', 'tiruppur', 
  'vellore', 'dindigul', 'dharmapuri', 'krishnagiri', 'namakkal', 'karur', 
  'perambalur', 'ariyalur', 'sivaganga', 'virudhunagar', 'theni', 'tenkasi', 'ranipet', 'tirupathur',
  // Kerala inland
  'wayanad', 'idukki', 'palakkad', 'kottayam', 'pathanamthitta',
  // Andhra Pradesh inland
  'kurnool', 'anantapur', 'ananthapuramu', 'kadapa', 'ysr', 'chittoor', 'tirupati', 
  'nandyal', 'annamayya', 'sri sathya sai', 'palnadu', 'ntr',
  // Odisha inland
  'sambalpur', 'rourkela', 'sundargarh', 'bolangir', 'mayurbhanj', 'angul', 
  'dhenkanal', 'kandhamal', 'kalahandi', 'koraput', 'rayagada', 'nabarangpur', 
  'malkangiri', 'nuapada', 'bargarh', 'jharsuguda', 'deogarh', 'subarnapur', 'boudh', 'nayagarh',
  // West Bengal inland
  'asansol', 'siliguri', 'bardhaman', 'paschim bardhaman', 'purba bardhaman', 
  'malda', 'darjeeling', 'jalpaiguri', 'alipurduar', 'cooch behar', 'uttar dinajpur', 
  'dakshin dinajpur', 'murshidabad', 'birbhum', 'bankura', 'purulia', 'jhargram', 'paschim medinipur', 'hooghly', 'nadia',
  // Gujarat inland
  'vadodara', 'rajkot', 'gandhinagar', 'mehsana', 'paten', 'banaskantha', 
  'sabarkantha', 'aravalli', 'mahisagar', 'panchmahal', 'dahod', 'chhota udepur', 
  'narmada', 'tapi', 'dang', 'surendranagar', 'botad'
];

/**
 * Returns true if the location is in an authentic coastal/maritime district of India
 */
export function isCoastalLocation(state?: string, district?: string, locationName?: string): boolean {
  const s = (state || '').trim().toLowerCase();
  const d = (district || '').trim().toLowerCase();
  const l = (locationName || '').trim().toLowerCase();

  // If state is not coastal, it is 100% landlocked
  const matchesCoastalState = COASTAL_STATES.some(cs => s.includes(cs));
  if (!matchesCoastalState) {
    return false;
  }

  // Check if it matches an inland district in a coastal state
  const isExplicitlyInland = INLAND_DISTRICTS_IN_COASTAL_STATES.some(
    inland => d.includes(inland) || l.includes(inland)
  );

  if (isExplicitlyInland) {
    return false;
  }

  return true;
}

// Operational Indian Cities with Rapid Transit Metro / RRTS Networks
const OPERATIONAL_METRO_CITIES = [
  'delhi', 'new delhi', 'noida', 'greater noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad', 'bahadurgarh',
  'mumbai', 'navi mumbai', 'thane', 'pune', 'nagpur',
  'bengaluru', 'bangalore',
  'kolkata', 'howrah',
  'chennai',
  'hyderabad', 'secunderabad',
  'ahmedabad', 'gandhinagar', 'surat',
  'kochi',
  'lucknow', 'kanpur', 'agra', 'meerut',
  'jaipur'
];

/**
 * Returns true if an operational urban Metro/RRTS system exists in this city/district
 * Cities like Rampur, Moradabad, Bareilly, Prayagraj, Gorakhpur do NOT have a metro!
 */
export function hasMetroTransit(locationName?: string, district?: string, state?: string): boolean {
  const l = (locationName || '').toLowerCase();
  const d = (district || '').toLowerCase();
  return OPERATIONAL_METRO_CITIES.some(mc => l.includes(mc) || d.includes(mc));
}

export interface TransitReality {
  hasMetro: boolean;
  metroStatusText: string;
  recommendedPublicTransit: string;
  recommendedHighway: string;
  localCorridorNotes: string;
}

/**
 * Returns factual local transit network details for any Indian city
 */
export function getCityTransitReality(locationName?: string, district?: string, state?: string): TransitReality {
  const l = (locationName || '').toLowerCase();
  const d = (district || '').toLowerCase();

  const isMetro = hasMetroTransit(locationName, district, state);

  if (l.includes('rampur') || d.includes('rampur') || l.includes('moradabad') || d.includes('moradabad')) {
    return {
      hasMetro: false,
      metroStatusText: 'No Metro Network in Rampur or Moradabad. (UP operational metros: Lucknow, Kanpur, Agra, Noida/Greater Noida, Ghaziabad).',
      recommendedPublicTransit: 'Northern Railway Mainline (Rampur Jn RMU ⇄ Moradabad Jn MB: 25–35 mins)',
      recommendedHighway: 'National Highway 9 (NH-9) 4-Lane Toll Expressway (~28 km, 35–45 mins)',
      localCorridorNotes: 'Direct 4-lane expressway via Mundha Pande with high-frequency Northern Railway MEMU, Intercity, and Jan Shatabdi trains running every 20–40 minutes.'
    };
  }

  if (l.includes('bareilly') || d.includes('bareilly')) {
    return {
      hasMetro: false,
      metroStatusText: 'No Metro in Bareilly. Mass transit is Northern / North Eastern Railway and UPSRTC buses.',
      recommendedPublicTransit: 'Indian Railways (Bareilly Jn BE ⇄ Rampur / Moradabad)',
      recommendedHighway: 'NH 530 / NH 30 & NH 9 Expressway Corridors',
      localCorridorNotes: 'High-density rail and expressway connections across the Rohilkhand region.'
    };
  }

  if (isMetro) {
    return {
      hasMetro: true,
      metroStatusText: 'Operational Rapid Transit Metro / RRTS Network Available.',
      recommendedPublicTransit: 'Urban Metro Rapid Transit (Weather-immune grade separated network)',
      recommendedHighway: 'Urban Arterial Ring Roads & Expressways',
      localCorridorNotes: 'Metro provides top weather protection during extreme smog, fog, and road waterlogging.'
    };
  }

  return {
    hasMetro: false,
    metroStatusText: `No Metro in ${locationName || 'this district'}. Mass transit relies on Indian Railways and State Roadways.`,
    recommendedPublicTransit: 'Indian Railways (Passenger/Express Trains) & State Transport Buses',
    recommendedHighway: 'National / State Highway Arterial Corridors',
    localCorridorNotes: 'Check highway visibility lamps and train departure schedules for intercity commute.'
  };
}

/**
 * Computes great-circle distance between two geographic coordinates in kilometers
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
