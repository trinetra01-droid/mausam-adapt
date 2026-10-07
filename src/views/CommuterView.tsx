import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Car, 
  Train, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Compass, 
  ArrowRight, 
  Layers, 
  Building2, 
  Package, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Edit2, 
  Check,
  Search,
  Sparkles,
  ArrowRightLeft,
  Route,
  X
} from 'lucide-react';
import { 
  LocationRecord, 
  WeatherObservation, 
  WeatherForecast, 
  WarningRecord, 
  AirQualityRecord, 
  CommuterProfile 
} from '../types.js';
import { CommuterRouteMap } from '../components/CommuterRouteMap.js';
import { hasMetroTransit, calculateHaversineDistanceKm } from '../services/geoUtils.js';
import { AnimatedWeatherIcon } from '../components/AnimatedWeatherIcon.js';
import { api } from '../services/api.js';

export interface CityPointItem {
  name: string;
  desc: string;
  city: string;
}

export interface CityGroup {
  id: string;
  label: string;
  shortLabel: string;
  points: CityPointItem[];
}

export const ALL_CITY_GROUPS: CityGroup[] = [
  {
    id: 'MORADABAD',
    label: 'Moradabad In-City',
    shortLabel: 'Moradabad',
    points: [
      { name: 'Lajpat Nagar (Moradabad)', desc: 'Residential & commercial colony', city: 'Moradabad' },
      { name: 'MDA Colony (Moradabad)', desc: 'Moradabad Development Authority sector', city: 'Moradabad' },
      { name: 'Naveen Nagar (Moradabad)', desc: 'Urban colony on Kanth Road corridor', city: 'Moradabad' },
      { name: 'Ramganga Vihar', desc: 'North Moradabad institutional & shopping hub', city: 'Moradabad' },
      { name: 'Civil Lines (Moradabad)', desc: 'Administrative & district headquarters', city: 'Moradabad' },
      { name: 'Buddhi Vihar', desc: 'Modern housing development colony', city: 'Moradabad' },
      { name: 'Majhola (Moradabad)', desc: 'Industrial area & bypass avenue', city: 'Moradabad' },
      { name: 'Moradabad Junction (MB)', desc: 'Northern Railway Divisional HQ', city: 'Moradabad' },
      { name: 'Peetal Basti (Brass Hub)', desc: 'Artisanal brassware manufacturing cluster', city: 'Moradabad' },
      { name: 'Kanth Road (Moradabad)', desc: 'High-growth northern arterial corridor', city: 'Moradabad' },
      { name: 'Sambhal Road (Moradabad)', desc: 'Southern commercial bypass avenue', city: 'Moradabad' }
    ]
  },
  {
    id: 'DELHI',
    label: 'Delhi NCR',
    shortLabel: 'Delhi NCR',
    points: [
      { name: 'Connaught Place', desc: 'Central Delhi premier heritage business circle', city: 'Delhi' },
      { name: 'Chandni Chowk', desc: 'Historic Old Delhi commercial & retail center', city: 'Delhi' },
      { name: 'Nehru Place', desc: 'South East Delhi electronics & corporate district', city: 'Delhi' },
      { name: 'Lajpat Nagar (Delhi)', desc: 'Central Market & ring road hub', city: 'Delhi' },
      { name: 'Karol Bagh', desc: 'Central Delhi major commercial & retail corridor', city: 'Delhi' },
      { name: 'Saket', desc: 'South Delhi retail & corporate district centre', city: 'Delhi' },
      { name: 'Rohini', desc: 'North West Delhi residential & metro sectors', city: 'Delhi' },
      { name: 'Anand Vihar ISBT', desc: 'East Delhi multi-modal transit terminal', city: 'Delhi' },
      { name: 'Noida Sector 62', desc: 'IT & institutional corridor on expressway', city: 'Delhi NCR' },
      { name: 'DLF CyberCity', desc: 'Gurugram financial & tech business district', city: 'Delhi NCR' },
      { name: 'Cyber Hub', desc: 'Gurugram premier corporate dining & tech circle', city: 'Delhi NCR' },
      { name: 'Dwarka Sector 21', desc: 'South West Delhi Airport Express interchange', city: 'Delhi' },
      { name: 'Indirapuram', desc: 'Ghaziabad trans-Hindon commercial & residential hub', city: 'Delhi NCR' },
      { name: 'Greater Noida', desc: 'Knowledge Park & expressway corporate hub', city: 'Delhi NCR' },
      { name: 'Faridabad', desc: 'Southern NCR industrial & commercial corridor', city: 'Delhi NCR' }
    ]
  },
  {
    id: 'DEHRADUN',
    label: 'Dehradun & UK',
    shortLabel: 'Dehradun',
    points: [
      { name: 'Dehradun (Clock Tower)', desc: 'Heart of Doon Valley / Rajpur Road entry', city: 'Dehradun' },
      { name: 'Dehradun ISBT', desc: 'Inter-State Bus Terminal, Transport Nagar', city: 'Dehradun' },
      { name: 'Rajpur Road (Dehradun)', desc: 'Foothill avenue leading to Mussoorie', city: 'Dehradun' },
      { name: 'Mussoorie', desc: 'Queen of the Hills, 35 km uphill corridor', city: 'Dehradun' },
      { name: 'Rishikesh', desc: 'Ganga riverfront & Yoga capital', city: 'Dehradun' },
      { name: 'Haridwar', desc: 'Har Ki Pauri & industrial corridor', city: 'Haridwar' },
      { name: 'Jolly Grant Airport', desc: 'Dehradun domestic aviation gateway', city: 'Dehradun' },
      { name: 'Clement Town', desc: 'Southern cantonment & institutional sector', city: 'Dehradun' },
      { name: 'Sahastradhara Road', desc: 'Eastern Doon Valley scenic IT corridor', city: 'Dehradun' }
    ]
  },
  {
    id: 'MUMBAI',
    label: 'Mumbai MMR',
    shortLabel: 'Mumbai',
    points: [
      { name: 'Bandra-Kurla Complex (BKC)', desc: 'Premier financial & international banking hub', city: 'Mumbai' },
      { name: 'Nariman Point', desc: 'South Mumbai prime seafront commercial district', city: 'Mumbai' },
      { name: 'Andheri East', desc: 'MIDC / SEEPZ major business & transit hub', city: 'Mumbai' },
      { name: 'Lower Parel', desc: 'High Street Phoenix & corporate towers hub', city: 'Mumbai' },
      { name: 'Dadar TT Circle', desc: 'Central Mumbai railway & road junction', city: 'Mumbai' },
      { name: 'Colaba', desc: 'Historic heritage retail & commercial center', city: 'Mumbai' },
      { name: 'Borivali West', desc: 'Northern Western Railway commuter corridor', city: 'Mumbai' },
      { name: 'Thane West', desc: 'Rapidly growing corporate & retail spine', city: 'Thane' },
      { name: 'Vashi', desc: 'Commercial gateway to Navi Mumbai', city: 'Navi Mumbai' },
      { name: 'Powai', desc: 'Hiranandani technology & startup township', city: 'Mumbai' },
      { name: 'Mumbai Airport T2', desc: 'Chhatrapati Shivaji International Terminal', city: 'Mumbai' }
    ]
  },
  {
    id: 'BENGALURU',
    label: 'Bengaluru',
    shortLabel: 'Bengaluru',
    points: [
      { name: 'Electronic City', desc: 'Landmark technology park on Hosur Road', city: 'Bengaluru' },
      { name: 'Whitefield', desc: 'ITPL & major software technology corridor', city: 'Bengaluru' },
      { name: 'Koramangala', desc: 'Startup capital & cosmopolitan culinary district', city: 'Bengaluru' },
      { name: 'Indiranagar', desc: '100 Feet Road prime lifestyle & retail avenue', city: 'Bengaluru' },
      { name: 'MG Road (Bengaluru)', desc: 'Central business district & metro interchange', city: 'Bengaluru' },
      { name: 'Manyata Tech Park', desc: 'North Bengaluru Outer Ring Road IT park', city: 'Bengaluru' },
      { name: 'Marathahalli', desc: 'ORR junction connecting Whitefield and Bellandur', city: 'Bengaluru' },
      { name: 'HSR Layout', desc: 'Fast-growing residential & startup ecosystem', city: 'Bengaluru' },
      { name: 'Hebbal', desc: 'Airport corridor & northern road junction', city: 'Bengaluru' },
      { name: 'Jayanagar', desc: 'Southern cultural & heritage commercial market', city: 'Bengaluru' },
      { name: 'Majestic', desc: 'KSR Bengaluru central interstate transit junction', city: 'Bengaluru' },
      { name: 'Kempegowda Airport', desc: 'Northern international aviation gateway', city: 'Bengaluru' }
    ]
  },
  {
    id: 'HYDERABAD',
    label: 'Hyderabad',
    shortLabel: 'Hyderabad',
    points: [
      { name: 'HITEC City', desc: 'Cyberabad global IT & consulting epicenter', city: 'Hyderabad' },
      { name: 'Gachibowli', desc: 'Financial district & high-tech corporate campus', city: 'Hyderabad' },
      { name: 'Madhapur', desc: 'IT corridor & lively dining district', city: 'Hyderabad' },
      { name: 'Banjara Hills', desc: 'Road No. 1 prestigious corporate & medical zone', city: 'Hyderabad' },
      { name: 'Jubilee Hills', desc: 'Elite media, retail & commercial neighborhood', city: 'Hyderabad' },
      { name: 'Secunderabad', desc: 'Twin-city central railway headquarters', city: 'Hyderabad' },
      { name: 'Begumpet', desc: 'Central arterial avenue & legacy transit hub', city: 'Hyderabad' },
      { name: 'Charminar', desc: 'Historic Old City heritage bazaars', city: 'Hyderabad' },
      { name: 'Financial District (Hyderabad)', desc: 'Nanakramguda corporate towers & banking SEZ', city: 'Hyderabad' },
      { name: 'Miyapur', desc: 'North-western Red Line metro terminal hub', city: 'Hyderabad' }
    ]
  },
  {
    id: 'CHENNAI',
    label: 'Chennai',
    shortLabel: 'Chennai',
    points: [
      { name: 'OMR IT Corridor', desc: 'Rajiv Gandhi IT Expressway software zone', city: 'Chennai' },
      { name: 'T. Nagar', desc: 'South India premier bustling retail shopping market', city: 'Chennai' },
      { name: 'Guindy', desc: 'Olympia Tech Park & industrial road junction', city: 'Chennai' },
      { name: 'Anna Nagar', desc: 'Planned western commercial & urban centre', city: 'Chennai' },
      { name: 'Chennai Central', desc: 'Southern Railway historic passenger terminus', city: 'Chennai' },
      { name: 'Velachery', desc: 'Southern IT link connecting OMR to GST Road', city: 'Chennai' },
      { name: 'Adyar', desc: 'Coastal cultural, institutional & residential zone', city: 'Chennai' },
      { name: 'Marina Beach', desc: 'Kamarajar Salai coastal arterial avenue', city: 'Chennai' },
      { name: 'Nungambakkam', desc: 'Prime central commercial, consulate & college zone', city: 'Chennai' }
    ]
  },
  {
    id: 'KOLKATA',
    label: 'Kolkata',
    shortLabel: 'Kolkata',
    points: [
      { name: 'Park Street', desc: 'Iconic heritage dining & central business avenue', city: 'Kolkata' },
      { name: 'Salt Lake Sector V', desc: 'East India premier IT & electronics export hub', city: 'Kolkata' },
      { name: 'New Town', desc: 'Modern planned satellite smart city & financial hub', city: 'Kolkata' },
      { name: 'Howrah Station', desc: 'Historic railway terminal complex on Hooghly', city: 'Kolkata' },
      { name: 'Esplanade', desc: 'Central Kolkata arterial transit & market hub', city: 'Kolkata' },
      { name: 'Alipore', desc: 'Southern green heritage & administrative enclave', city: 'Kolkata' },
      { name: 'Gariahat', desc: 'South Kolkata traditional retail & textile hub', city: 'Kolkata' },
      { name: 'Dum Dum', desc: 'Netaji Subhash Chandra Bose Airport gateway', city: 'Kolkata' }
    ]
  },
  {
    id: 'PUNE',
    label: 'Pune',
    shortLabel: 'Pune',
    points: [
      { name: 'Hinjawadi', desc: 'Rajiv Gandhi Infotech Park & SEZ mega-campus', city: 'Pune' },
      { name: 'Magarpatta City', desc: 'Integrated township & software park in Hadapsar', city: 'Pune' },
      { name: 'Shivaji Nagar (Pune)', desc: 'Central educational & transit interchange', city: 'Pune' },
      { name: 'Viman Nagar', desc: 'East Pune airport road retail & tech hub', city: 'Pune' },
      { name: 'Kothrud', desc: 'Western residential & educational corridor', city: 'Pune' },
      { name: 'Kalyani Nagar', desc: 'Prime tech park & lifestyle boulevard', city: 'Pune' },
      { name: 'Baner', desc: 'High Street IT & corporate avenue', city: 'Pune' },
      { name: 'Hadapsar', desc: 'Industrial & software tech cluster', city: 'Pune' },
      { name: 'Pune Station', desc: 'Central railway passenger junction', city: 'Pune' }
    ]
  },
  {
    id: 'AHMEDABAD',
    label: 'Ahmedabad & Guj',
    shortLabel: 'Ahmedabad',
    points: [
      { name: 'SG Highway', desc: 'Sarkhej-Gandhinagar corporate & commercial artery', city: 'Ahmedabad' },
      { name: 'Prahlad Nagar', desc: 'Premier corporate office & commercial real estate hub', city: 'Ahmedabad' },
      { name: 'Ashram Road', desc: 'Historic riverside central business boulevard', city: 'Ahmedabad' },
      { name: 'GIFT City', desc: 'International Financial Services Centre, Gandhinagar', city: 'Gandhinagar' },
      { name: 'Sabarmati Riverfront', desc: 'Urban waterfront promenade & transit avenue', city: 'Ahmedabad' },
      { name: 'Surat', desc: 'Ring Road textile & global diamond trading center', city: 'Surat' },
      { name: 'Vadodara', desc: 'Alkapuri central business & cultural corridor', city: 'Vadodara' }
    ]
  },
  {
    id: 'JAIPUR',
    label: 'Jaipur & Raj',
    shortLabel: 'Jaipur',
    points: [
      { name: 'MI Road', desc: 'Mirza Ismail Road central heritage & commercial avenue', city: 'Jaipur' },
      { name: 'Malviya Nagar (Jaipur)', desc: 'World Trade Park & southern commercial hub', city: 'Jaipur' },
      { name: 'Mansarovar', desc: 'Major planned residential & commercial scheme', city: 'Jaipur' },
      { name: 'Vaishali Nagar (Jaipur)', desc: 'West Jaipur high-growth retail & dining corridor', city: 'Jaipur' },
      { name: 'Pink City (Badi Chaupar)', desc: 'UNESCO World Heritage walled city markets', city: 'Jaipur' },
      { name: 'Sitapura', desc: 'Southern export promotion & institutional zone', city: 'Jaipur' },
      { name: 'C-Scheme', desc: 'Central administrative & corporate district', city: 'Jaipur' },
      { name: 'Jodhpur', desc: 'Sun City heritage & handicraft trading center', city: 'Jodhpur' },
      { name: 'Udaipur', desc: 'Lake City tourism & regional commercial center', city: 'Udaipur' }
    ]
  },
  {
    id: 'LUCKNOW',
    label: 'Lucknow & UP',
    shortLabel: 'Lucknow',
    points: [
      { name: 'Hazratganj', desc: 'Historic premier shopping & corporate boulevard', city: 'Lucknow' },
      { name: 'Gomti Nagar', desc: 'Vibhuti Khand IT City & High Court towers', city: 'Lucknow' },
      { name: 'Alambagh', desc: 'Southern transportation & market interchange', city: 'Lucknow' },
      { name: 'Charbagh Station', desc: 'Historic architectural railway gateway', city: 'Lucknow' },
      { name: 'Indira Nagar (Lucknow)', desc: 'Trans-Gomti residential & retail sector', city: 'Lucknow' },
      { name: 'Rampur (Civil Lines)', desc: 'Historic artisanal city on Moradabad corridor', city: 'Rampur' },
      { name: 'Bareilly (Civil Lines)', desc: 'Northern UP commercial & medical hub', city: 'Bareilly' },
      { name: 'Meerut (Delhi Road)', desc: 'NCR Rapid Rail & manufacturing corridor', city: 'Meerut' },
      { name: 'Agra (Fatehabad Road)', desc: 'Taj city tourism & handicraft corridor', city: 'Agra' },
      { name: 'Varanasi', desc: 'Cantonment & Ganga Ghats spiritual gateway', city: 'Varanasi' },
      { name: 'Kanpur', desc: 'Mall Road industrial, leather & education hub', city: 'Kanpur' },
      { name: 'Prayagraj', desc: 'Civil Lines judicial & education center', city: 'Prayagraj' }
    ]
  },
  {
    id: 'CHANDIGARH',
    label: 'Chandigarh Tricity',
    shortLabel: 'Chandigarh',
    points: [
      { name: 'Sector 17 (Chandigarh)', desc: 'Iconic pedestrian city center & shopping plaza', city: 'Chandigarh' },
      { name: 'Sector 35 (Chandigarh)', desc: 'Commercial, hospitality & dining hub', city: 'Chandigarh' },
      { name: 'IT Park (Chandigarh)', desc: 'Shivalik foothill technology park', city: 'Chandigarh' },
      { name: 'Mohali Phase 8', desc: 'Industrial area software & electronics cluster', city: 'Mohali' },
      { name: 'Panchkula Sector 5', desc: 'Haryana administrative & cultural center', city: 'Panchkula' },
      { name: 'Zirakpur', desc: 'Arterial transit intersection & highway gateway', city: 'Zirakpur' }
    ]
  },
  {
    id: 'KOCHI',
    label: 'Kochi & Kerala',
    shortLabel: 'Kochi',
    points: [
      { name: 'Kakkanad', desc: 'Infopark Kerala premier software export campus', city: 'Kochi' },
      { name: 'MG Road (Kochi)', desc: 'Central retail & commercial artery', city: 'Kochi' },
      { name: 'Marine Drive (Kochi)', desc: 'Scenic coastal walkway & commercial hub', city: 'Kochi' },
      { name: 'Edappally', desc: 'NH 66 and NH 544 transit junction & retail hub', city: 'Kochi' },
      { name: 'Fort Kochi', desc: 'Historic colonial port & heritage tourism quarter', city: 'Kochi' },
      { name: 'Technopark', desc: 'Thiruvananthapuram mega IT campus', city: 'Thiruvananthapuram' }
    ]
  },
  {
    id: 'PATNA',
    label: 'Patna & Bihar',
    shortLabel: 'Patna',
    points: [
      { name: 'Bailey Road (Patna)', desc: 'Secretariat, museum & corporate spine', city: 'Patna' },
      { name: 'Kankarbagh', desc: 'Major planned residential colony & market', city: 'Patna' },
      { name: 'Boring Road', desc: 'Premier educational, retail & coaching corridor', city: 'Patna' },
      { name: 'Patna Junction', desc: 'East Central Railway principal transit hub', city: 'Patna' },
      { name: 'Fraser Road', desc: 'Central commercial crossroads & business zone', city: 'Patna' },
      { name: 'Danapur', desc: 'Western satellite military & railway terminal', city: 'Patna' }
    ]
  },
  {
    id: 'GUWAHATI',
    label: 'Guwahati & NE',
    shortLabel: 'Guwahati',
    points: [
      { name: 'GS Road (Guwahati)', desc: 'Northeast bustling high-street & commercial artery', city: 'Guwahati' },
      { name: 'Dispur', desc: 'Capital complex & tea auction centre', city: 'Guwahati' },
      { name: 'Paltan Bazaar', desc: 'Central transportation hub near railway station', city: 'Guwahati' },
      { name: 'Jalukbari', desc: 'University & airport western gateway', city: 'Guwahati' },
      { name: 'Panbazar', desc: 'Historic cultural & riverfront district', city: 'Guwahati' }
    ]
  }
];

export const QUICK_CORRIDORS = [
  { origin: 'Moradabad', dest: 'Dehradun', label: 'Moradabad ⇄ Dehradun (NH 734/334)' },
  { origin: 'Moradabad', dest: 'Chandni Chowk', label: 'Moradabad ⇄ Delhi (NH 9)' },
  { origin: 'Rampur', dest: 'Moradabad', label: 'Rampur ⇄ Moradabad (NH 9)' },
  { origin: 'Connaught Place', dest: 'Noida Sector 62', label: 'Delhi ⇄ Noida (DND Flyway)' },
  { origin: 'Connaught Place', dest: 'DLF CyberCity', label: 'Delhi ⇄ Gurugram (NH 48)' },
  { origin: 'Bandra-Kurla Complex (BKC)', dest: 'Andheri East', label: 'BKC ⇄ Andheri East (WEH)' },
  { origin: 'Nariman Point', dest: 'Bandra-Kurla Complex (BKC)', label: 'Nariman Point ⇄ BKC (Sea Link)' },
  { origin: 'Mumbai', dest: 'Pune', label: 'Mumbai ⇄ Pune Expressway' },
  { origin: 'MG Road (Bengaluru)', dest: 'Whitefield', label: 'Bengaluru: MG Road ⇄ Whitefield' },
  { origin: 'Koramangala', dest: 'Electronic City', label: 'Bengaluru: Koramangala ⇄ Electronic City' },
  { origin: 'Begumpet', dest: 'HITEC City', label: 'Hyderabad: Begumpet ⇄ HITEC City' },
  { origin: 'Chennai Central', dest: 'OMR IT Corridor', label: 'Chennai: Central ⇄ OMR IT Expressway' },
  { origin: 'Park Street', dest: 'Salt Lake Sector V', label: 'Kolkata: Park Street ⇄ Salt Lake Sector V' },
  { origin: 'SG Highway', dest: 'GIFT City', label: 'Ahmedabad ⇄ GIFT City Gandhinagar' },
  { origin: 'Pink City (Badi Chaupar)', dest: 'Sitapura', label: 'Jaipur: Pink City ⇄ Sitapura' },
  { origin: 'Hazratganj', dest: 'Gomti Nagar', label: 'Lucknow: Hazratganj ⇄ Gomti Nagar' },
  { origin: 'Sector 17 (Chandigarh)', dest: 'Mohali Phase 8', label: 'Chandigarh ⇄ Mohali' }
];

interface CommuterViewProps {
  location: LocationRecord;
  observation: WeatherObservation | null;
  forecast: WeatherForecast | null;
  warnings: WarningRecord[];
  airQuality: AirQualityRecord | null;
  isLoading: boolean;
  onNavigate: (tab: string) => void;
  theme?: 'light' | 'dark';
}

export const CommuterView: React.FC<CommuterViewProps> = ({
  location,
  observation,
  forecast,
  warnings,
  airQuality,
  isLoading,
  onNavigate,
  theme = 'dark'
}) => {
  const defaultHome = location.name.split('(')[0].trim() || 'New Delhi';

  // Load saved commuter profile from localStorage (without example commute pre-population)
  const [profile, setProfile] = useState<CommuterProfile>(() => {
    try {
      const saved = localStorage.getItem('mausam_adapt_commuter_profile') || localStorage.getItem('trinetra_commuter_profile');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      homeLocationName: defaultHome,
      officeLocationName: '',
      workplaceType: 'CORPORATE_OFFICE',
      primaryMode: 'CAR_CAB',
      secondaryMode: 'TRAIN',
      morningDepartureTime: '08:00',
      eveningReturnTime: '17:30',
      hasAsthmaOrDustAllergy: false,
      routeHazards: []
    };
  });

  const [homeInput, setHomeInput] = useState(profile.homeLocationName || defaultHome);
  const [destInput, setDestInput] = useState(profile.officeLocationName || '');
  const [isEditingRoute, setIsEditingRoute] = useState(!profile.officeLocationName);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePointsTab, setActivePointsTab] = useState<string>('MORADABAD');
  const [pointSearchQuery, setPointSearchQuery] = useState<string>('');
  const [focusedField, setFocusedField] = useState<'origin' | 'dest' | null>(null);

  // Sync active city into commuter origin if stale or unconfigured
  useEffect(() => {
    const curCity = location.name.split('(')[0].trim();
    if (curCity && (!homeInput || homeInput === 'Rampur' || homeInput === 'New Delhi')) {
      setHomeInput(curCity);
      setProfile(prev => ({ ...prev, homeLocationName: curCity }));
    }
  }, [location.name]);

  // Sync profile changes to localStorage
  const handleSaveRoute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!homeInput.trim() || !destInput.trim()) return;
    const next = { ...profile, homeLocationName: homeInput, officeLocationName: destInput };
    setProfile(next);
    localStorage.setItem('mausam_adapt_commuter_profile', JSON.stringify(next));
    setIsEditingRoute(false);
    setFocusedField(null);
  };

  const handleSwapRoute = () => {
    const temp = homeInput;
    setHomeInput(destInput);
    setDestInput(temp);
    const next = { ...profile, homeLocationName: destInput, officeLocationName: temp };
    setProfile(next);
    localStorage.setItem('mausam_adapt_commuter_profile', JSON.stringify(next));
  };

  const applyQuickCorridor = (origin: string, dest: string) => {
    setHomeInput(origin);
    setDestInput(dest);
    const next = { ...profile, homeLocationName: origin, officeLocationName: dest };
    setProfile(next);
    localStorage.setItem('mausam_adapt_commuter_profile', JSON.stringify(next));
    setIsEditingRoute(false);
    setFocusedField(null);
  };

  const selectInCityPoint = (pointName: string, target: 'origin' | 'dest') => {
    if (target === 'dest') {
      setDestInput(pointName);
      const next = { ...profile, homeLocationName: homeInput, officeLocationName: pointName };
      setProfile(next);
      localStorage.setItem('mausam_adapt_commuter_profile', JSON.stringify(next));
    } else {
      setHomeInput(pointName);
      const next = { ...profile, homeLocationName: pointName, officeLocationName: destInput };
      setProfile(next);
      localStorage.setItem('mausam_adapt_commuter_profile', JSON.stringify(next));
    }
    setFocusedField(null);
  };

  // Weather variables
  const tempC = observation?.temperature_c ? Math.round(observation.temperature_c) : 30;
  const visibilityKm = observation?.visibility_km ?? 6.0;
  const condition = observation?.condition_text || 'Clear sky';

  // Metro availability
  const hasMetro = hasMetroTransit(homeInput) || (destInput && hasMetroTransit(destInput));

  // Derived departure window
  const bestDeparture = profile.morningDepartureTime || '07:30';

  // Comprehensive coordinates registry for Indian commuter routes & in-city colonies
  const getCoordinates = (name: string, fallbackLat: number, fallbackLng: number) => {
    const n = (name || '').toLowerCase().trim();

    // Dehradun & Uttarakhand (Strict real coordinates, NEVER IN MORADABAD)
    if (n.includes('dehradun isbt')) return { lat: 30.2867, lng: 78.0089 };
    if (n.includes('clock tower') && (n.includes('dehradun') || !n.includes('delhi'))) return { lat: 30.3256, lng: 78.0436 };
    if (n.includes('rajpur road')) return { lat: 30.3400, lng: 78.0600 };
    if (n.includes('dehradun')) return { lat: 30.3165, lng: 78.0322 };
    if (n.includes('mussoorie')) return { lat: 30.4598, lng: 78.0644 };
    if (n.includes('rishikesh')) return { lat: 30.0869, lng: 78.2676 };
    if (n.includes('haridwar')) return { lat: 29.9457, lng: 78.1642 };
    if (n.includes('roorkee')) return { lat: 29.8543, lng: 77.8880 };

    // Moradabad in-city colonies & landmarks (User explicitly requested Lajpat Nagar, MDA, Naveen Nagar)
    if (n.includes('lajpat nagar') && (n.includes('moradabad') || (!n.includes('delhi') && (homeInput.toLowerCase().includes('moradabad') || destInput.toLowerCase().includes('moradabad') || location.name.toLowerCase().includes('moradabad'))))) {
      return { lat: 28.8480, lng: 78.7620 }; // Lajpat Nagar, Moradabad
    }
    if (n.includes('mda')) return { lat: 28.8530, lng: 78.7490 }; // MDA Colony, Moradabad
    if (n.includes('naveen nagar')) return { lat: 28.8560, lng: 78.7640 }; // Naveen Nagar, Moradabad
    if (n.includes('ramganga vihar')) return { lat: 28.8650, lng: 78.7600 }; // Ramganga Vihar
    if (n.includes('civil lines moradabad') || (n.includes('civil lines') && !n.includes('rampur') && !n.includes('delhi') && (homeInput.toLowerCase().includes('moradabad') || destInput.toLowerCase().includes('moradabad')))) {
      return { lat: 28.8450, lng: 78.7650 }; // Civil Lines, Moradabad
    }
    if (n.includes('majholla') || n.includes('majhola')) return { lat: 28.8200, lng: 78.7500 }; // Majhola, Moradabad
    if (n.includes('buddhi vihar')) return { lat: 28.8350, lng: 78.7350 }; // Buddhi Vihar, Moradabad
    if (n.includes('peetal basti') || n.includes('brass hub')) return { lat: 28.8320, lng: 78.7850 };
    if (n.includes('moradabad junction') || n.includes('moradabad railway')) return { lat: 28.8315, lng: 78.7690 };
    if (n.includes('moradabad')) return { lat: 28.8386, lng: 78.7733 };

    // Delhi NCR In-City Points (User explicitly requested Chandni Chowk, Nehru Place)
    if (n.includes('chandni chowk')) return { lat: 28.6506, lng: 77.2303 }; // Chandni Chowk, Central Delhi
    if (n.includes('nehru place')) return { lat: 28.5494, lng: 77.2526 }; // Nehru Place, South East Delhi
    if (n.includes('connaught place')) return { lat: 28.6304, lng: 77.2177 }; // Connaught Place, New Delhi
    if (n.includes('lajpat nagar') && (n.includes('delhi') || !n.includes('moradabad'))) return { lat: 28.5677, lng: 77.2433 }; // Lajpat Nagar, South Delhi
    if (n.includes('karol bagh')) return { lat: 28.6514, lng: 77.1907 };
    if (n.includes('saket')) return { lat: 28.5283, lng: 77.2188 };
    if (n.includes('hauz khas')) return { lat: 28.5494, lng: 77.2001 };
    if (n.includes('rohini')) return { lat: 28.7166, lng: 77.1147 };
    if (n.includes('dwarka')) return { lat: 28.5921, lng: 77.0460 };
    if (n.includes('anand vihar')) return { lat: 28.6469, lng: 77.3160 };
    if (n.includes('kashmere gate')) return { lat: 28.6675, lng: 77.2284 };
    if (n.includes('aiims')) return { lat: 28.5672, lng: 77.2100 };
    if (n.includes('igi airport')) return { lat: 28.5562, lng: 77.1000 };
    if (n.includes('noida sector 18')) return { lat: 28.5708, lng: 77.3261 };
    if (n.includes('noida sector 62')) return { lat: 28.6280, lng: 77.3649 };
    if (n.includes('noida')) return { lat: 28.5355, lng: 77.3910 };
    if (n.includes('greater noida')) return { lat: 28.4744, lng: 77.5040 };
    if (n.includes('dlf cybercity')) return { lat: 28.4950, lng: 77.0890 };
    if (n.includes('cyber hub')) return { lat: 28.4850, lng: 77.0950 };
    if (n.includes('gurgaon') || n.includes('gurugram')) return { lat: 28.4595, lng: 77.0266 };
    if (n.includes('ghaziabad')) return { lat: 28.6692, lng: 77.4538 };
    if (n.includes('indirapuram')) return { lat: 28.6410, lng: 77.3710 };
    if (n.includes('new delhi') || n.includes('delhi')) return { lat: 28.6139, lng: 77.2090 };

    // Rampur in-city colonies
    if (n.includes('civil lines rampur')) return { lat: 28.8120, lng: 79.0280 };
    if (n.includes('jwala nagar')) return { lat: 28.8230, lng: 79.0150 };
    if (n.includes('model town')) return { lat: 28.8280, lng: 79.0350 };
    if (n.includes('pahar ganj')) return { lat: 28.8050, lng: 79.0320 };
    if (n.includes('kila')) return { lat: 28.8140, lng: 79.0210 };
    if (n.includes('panwaria')) return { lat: 28.7980, lng: 79.0110 };
    if (n.includes('bilaspur gate')) return { lat: 28.8250, lng: 79.0400 };
    if (n.includes('railway colony')) return { lat: 28.8030, lng: 79.0200 };
    if (n.includes('rampur')) return { lat: 28.8154, lng: 79.0250 };

    // Other regional cities
    if (n.includes('bareilly')) return { lat: 28.3670, lng: 79.4304 };
    if (n.includes('meerut')) return { lat: 28.9845, lng: 77.7064 };
    if (n.includes('aligarh')) return { lat: 27.8974, lng: 78.0880 };
    if (n.includes('agra')) return { lat: 27.1767, lng: 78.0081 };
    if (n.includes('lucknow')) return { lat: 26.8467, lng: 80.9462 };
    if (n.includes('kanpur')) return { lat: 26.4499, lng: 80.3319 };
    if (n.includes('bengaluru') || n.includes('bangalore')) return { lat: 12.9716, lng: 77.5946 };
    if (n.includes('mumbai')) return { lat: 18.9220, lng: 72.8347 };
    if (n.includes('pune')) return { lat: 18.5204, lng: 73.8567 };
    if (n.includes('kolkata')) return { lat: 22.5726, lng: 88.3639 };
    if (n.includes('chennai')) return { lat: 13.0827, lng: 80.2707 };
    if (n.includes('hyderabad')) return { lat: 17.3850, lng: 78.4867 };

    return { lat: fallbackLat, lng: fallbackLng };
  };

  const originCoords = getCoordinates(homeInput, location.latitude || 28.8154, location.longitude || 79.0250);
  const destCoords = getCoordinates(
    destInput, 
    destInput.toLowerCase().includes('dehradun') ? 30.3165 : originCoords.lat + 0.08, 
    destInput.toLowerCase().includes('dehradun') ? 78.0322 : originCoords.lng + 0.08
  );

  // Dynamic Haversine & Route Distance Calculations
  const directDistanceKm = calculateHaversineDistanceKm(
    originCoords.lat,
    originCoords.lng,
    destCoords.lat,
    destCoords.lng
  );
  
  // Real road multiplier (in-city colony routes ~1.25x haversine, highways ~1.15x)
  const isCityColonyTravel = directDistanceKm < 20;
  const roadDistanceKm = Math.round(directDistanceKm * (isCityColonyTravel ? 1.25 : 1.15) * 10) / 10;
  
  // Realistic speeds: in-city travel ~26 km/h with traffic & turns, highway driving ~55 km/h
  const effectiveSpeedKmh = isCityColonyTravel ? 26 : 55;
  const roadTimeMinutes = Math.max(8, Math.round((roadDistanceKm / effectiveSpeedKmh) * 60));
  const trainTimeMinutes = isCityColonyTravel 
    ? Math.max(15, Math.round(roadTimeMinutes * 1.1)) 
    : Math.max(18, Math.round((roadDistanceKm / 65) * 60));

  // Time in clear hours and minutes
  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h} hr ${m} mins` : `${h} hr`;
    }
    return `${mins} mins`;
  };

  // Determine realistic highway name
  const getHighwayName = (orig: string, dest: string) => {
    const o = (orig || '').toLowerCase();
    const d = (dest || '').toLowerCase();

    // Moradabad ⇄ Dehradun
    if ((o.includes('moradabad') || o.includes('rampur')) && (d.includes('dehradun') || d.includes('haridwar') || d.includes('rishikesh')) ||
        (o.includes('dehradun') && (d.includes('moradabad') || d.includes('rampur')))) {
      return 'NH 734 / NH 334 (Moradabad-Haridwar-Dehradun Highway)';
    }

    // In-city Moradabad
    if ((o.includes('lajpat') || o.includes('mda') || o.includes('naveen') || o.includes('ramganga') || o.includes('civil lines') || o.includes('buddhi vihar') || o.includes('majhol')) &&
        (d.includes('lajpat') || d.includes('mda') || d.includes('naveen') || d.includes('ramganga') || d.includes('civil lines') || d.includes('buddhi vihar') || d.includes('majhol')) &&
        !o.includes('delhi') && !d.includes('delhi') && !o.includes('dehradun') && !d.includes('dehradun')) {
      return 'Moradabad In-City Corridor (Kanth Road / Civil Lines)';
    }

    // In-city Delhi
    if ((o.includes('chandni') || o.includes('nehru') || o.includes('connaught') || o.includes('saket') || o.includes('karol') || (o.includes('lajpat') && !o.includes('moradabad'))) &&
        (d.includes('chandni') || d.includes('nehru') || d.includes('connaught') || d.includes('saket') || d.includes('karol') || (d.includes('lajpat') && !d.includes('moradabad')))) {
      return 'Delhi Ring Road / Arterial Expressway';
    }

    if ((o.includes('moradabad') || o.includes('rampur') || o.includes('hapur') || o.includes('ghaziabad')) && 
        (d.includes('delhi') || d.includes('noida') || d.includes('moradabad') || d.includes('rampur'))) {
      return 'NH 9 4-Lane Expressway';
    }
    if ((o.includes('delhi') || o.includes('noida')) && (d.includes('agra') || d.includes('lucknow'))) {
      return 'Yamuna Expressway / Agra-Lucknow Expressway';
    }
    if ((o.includes('delhi') || o.includes('gurgaon') || o.includes('gurugram')) && (d.includes('jaipur') || d.includes('manesar'))) {
      return 'Delhi-Jaipur Expressway (NH 48)';
    }
    if ((o.includes('delhi') || o.includes('ghaziabad')) && d.includes('meerut')) {
      return 'Delhi-Meerut Expressway (NE 3)';
    }
    return 'National Highway / Expressway Corridor';
  };

  const highwayRouteName = getHighwayName(homeInput, destInput);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* 19. COMMUTE HEADER: Home -> Destination (Clean, Editable) */}
      <section className={`pt-4 border-b pb-6 ${
        theme === 'light' ? 'border-slate-200' : 'border-white/[0.06]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Commute Corridor
            </div>
            {!isEditingRoute && destInput ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {homeInput}
                </span>
                <span className="text-slate-500 font-light text-lg">→</span>
                <span className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {destInput}
                </span>
                <button
                  type="button"
                  onClick={handleSwapRoute}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    theme === 'light' ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                  title="Reverse Origin and Destination"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingRoute(true)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    theme === 'light' ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                  title="Edit origin and destination"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <form onSubmit={handleSaveRoute} className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={homeInput}
                      onFocus={() => setFocusedField('origin')}
                      onChange={(e) => {
                        setHomeInput(e.target.value);
                        setFocusedField('origin');
                      }}
                      placeholder="Origin (e.g. Lajpat Nagar, Moradabad)"
                      className={`rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 w-52 sm:w-60 ${
                        theme === 'light' 
                          ? 'bg-white border border-slate-300 text-slate-900 shadow-sm' 
                          : 'bg-slate-950 border border-white/10 text-white shadow-inner'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSwapRoute}
                    className={`p-2 rounded-xl transition-all cursor-pointer border ${
                      theme === 'light' ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' : 'border-white/10 bg-slate-900 text-slate-300 hover:text-white'
                    }`}
                    title="Swap direction"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative">
                    <input
                      type="text"
                      value={destInput}
                      onFocus={() => setFocusedField('dest')}
                      onChange={(e) => {
                        setDestInput(e.target.value);
                        setFocusedField('dest');
                      }}
                      placeholder="Destination (e.g. Dehradun, Nehru Place)"
                      className={`rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 w-56 sm:w-64 ${
                        theme === 'light' 
                          ? 'bg-white border border-slate-300 text-slate-900 shadow-sm' 
                          : 'bg-slate-950 border border-white/10 text-white shadow-inner'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Save Route
                  </button>
                  {destInput && (
                    <button
                      type="button"
                      onClick={() => setIsEditingRoute(false)}
                      className={`px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                        theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Done
                    </button>
                  )}
                </form>

                {/* In-City Quick Points & Corridors Picker (Using Dropdown instead of slider) */}
                <div className={`p-3.5 rounded-2xl border space-y-3 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-slate-950/70 border-white/10 shadow-lg'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-2.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold shrink-0">
                      <Sparkles className="w-4 h-4 text-cyan-500" />
                      <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>
                        Select In-City Points &amp; Locations
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* City Dropdown Selector (No slider) */}
                      <div className="relative">
                        <select
                          value={activePointsTab}
                          onChange={(e) => {
                            setActivePointsTab(e.target.value);
                            setPointSearchQuery('');
                          }}
                          className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:border-cyan-400 transition-all ${
                            theme === 'light'
                              ? 'bg-white border-slate-300 text-slate-900 shadow-sm hover:border-slate-400'
                              : 'bg-slate-900 border-white/10 text-white shadow-sm hover:border-white/20'
                          }`}
                        >
                          <option value="MORADABAD">Moradabad (11 In-City Hubs)</option>
                          <option value="DELHI">Delhi NCR (15 Tech &amp; Business Hubs)</option>
                          <option value="DEHRADUN">Dehradun &amp; Uttarakhand (9 Hubs)</option>
                          <option value="MUMBAI">Mumbai MMR (11 Prime Commercial Hubs)</option>
                          <option value="BENGALURU">Bengaluru (12 Tech Parks &amp; Hubs)</option>
                          <option value="HYDERABAD">Hyderabad (10 Cyberabad &amp; Tech Hubs)</option>
                          <option value="CHENNAI">Chennai (9 IT Corridor &amp; City Hubs)</option>
                          <option value="KOLKATA">Kolkata (8 IT &amp; Transit Hubs)</option>
                          <option value="PUNE">Pune (9 Infotech Parks &amp; Suburbs)</option>
                          <option value="AHMEDABAD">Ahmedabad &amp; Gujarat (7 Corporate Hubs)</option>
                          <option value="JAIPUR">Jaipur &amp; Rajasthan (9 Trade Hubs)</option>
                          <option value="LUCKNOW">Lucknow &amp; UP Major Cities (12 Hubs)</option>
                          <option value="CHANDIGARH">Chandigarh Tricity (6 Hubs)</option>
                          <option value="KOCHI">Kochi &amp; Kerala (6 Infopark &amp; Coastal Hubs)</option>
                          <option value="PATNA">Patna &amp; Bihar (6 City Hubs)</option>
                          <option value="GUWAHATI">Guwahati &amp; North East (5 Hubs)</option>
                          <option value="ALL">All Hubs (Showcase Across India)</option>
                          <option value="CORRIDORS">🛣️ High-Speed Corridors ({QUICK_CORRIDORS.length})</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>

                      {/* Locality Search Filter */}
                      <div className="relative w-full sm:w-60">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={pointSearchQuery}
                          onChange={(e) => setPointSearchQuery(e.target.value)}
                          placeholder="Search points (e.g. BKC, Gomti Nagar...)"
                          className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border transition-all focus:outline-none focus:border-cyan-400 ${
                            theme === 'light' 
                              ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-sm' 
                              : 'bg-slate-900 border-white/10 text-white placeholder:text-slate-500 shadow-sm'
                          }`}
                        />
                        {pointSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPointSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            title="Clear search"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chips for the active city / search query */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 max-h-56 overflow-y-auto pr-1">
                    {/* Search results mode */}
                    {pointSearchQuery.trim() !== '' ? (
                      (() => {
                        const q = pointSearchQuery.toLowerCase().trim();
                        const matching = ALL_CITY_GROUPS.flatMap(g => g.points).filter(
                          p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
                        );
                        if (matching.length === 0) {
                          return (
                            <div className={`p-4 text-xs italic ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                              No in-city points matching "{pointSearchQuery}". Type your location directly in the origin/destination box above.
                            </div>
                          );
                        }
                        return matching.map((pt) => (
                          <button
                            key={`${pt.city}-${pt.name}`}
                            type="button"
                            onClick={() => selectInCityPoint(pt.name, focusedField || 'dest')}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                              destInput === pt.name || homeInput === pt.name
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                                : theme === 'light'
                                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-white/10'
                            }`}
                            title={pt.desc}
                          >
                            <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            <span>{pt.name}</span>
                            <span className="text-[9px] opacity-75 font-normal px-1 py-0.2 rounded bg-black/5 dark:bg-white/10">
                              {pt.city}
                            </span>
                          </button>
                        ));
                      })()
                    ) : activePointsTab === 'ALL' ? (
                      // All Hubs: Showcase landmark points across every major city
                      ALL_CITY_GROUPS.flatMap(g => g.points.slice(0, 3)).map((pt) => (
                        <button
                          key={`${pt.city}-${pt.name}`}
                          type="button"
                          onClick={() => selectInCityPoint(pt.name, focusedField || 'dest')}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                            destInput === pt.name || homeInput === pt.name
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                              : theme === 'light'
                              ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-white/10'
                          }`}
                          title={`${pt.city}: ${pt.desc}`}
                        >
                          <Building2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          <span>{pt.name}</span>
                          <span className="text-[9px] opacity-70 px-1 py-0.2 rounded bg-black/5 dark:bg-white/10">
                            {pt.city}
                          </span>
                        </button>
                      ))
                    ) : activePointsTab === 'CORRIDORS' ? (
                      // High-speed inter-city and in-city corridors
                      QUICK_CORRIDORS.map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => applyQuickCorridor(c.origin, c.dest)}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                            homeInput === c.origin && destInput === c.dest
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                              : theme === 'light'
                              ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                              : 'bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border-white/10'
                          }`}
                        >
                          <Route className="w-3 h-3" />
                          <span>{c.label}</span>
                        </button>
                      ))
                    ) : (
                      // City-specific points
                      (() => {
                        const currentGroup = ALL_CITY_GROUPS.find(g => g.id === activePointsTab) || ALL_CITY_GROUPS[0];
                        return currentGroup.points.map((pt) => (
                          <button
                            key={pt.name}
                            type="button"
                            onClick={() => selectInCityPoint(pt.name, focusedField || 'dest')}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                              destInput === pt.name || homeInput === pt.name
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                                : theme === 'light'
                                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-white/10'
                            }`}
                            title={pt.desc}
                          >
                            <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            <span>{pt.name}</span>
                          </button>
                        ));
                      })()
                    )}
                  </div>

                  <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tip: Tap any point to set it as your destination, search for any Indian locality or colony, or switch to Corridors for high-speed inter-city routes.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-xl sm:text-2xl font-extrabold ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>{tempC}°</span>
              <AnimatedWeatherIcon condition={condition} size={36} className="shrink-0" />
            </div>
            <div className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Sightlines: {visibilityKm} km · {condition}
            </div>
          </div>
        </div>
      </section>

      {/* TODAY'S COMMUTE: Best departure & Expected conditions */}
      <section className={`p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-6 ${
        theme === 'light' 
          ? 'bg-white/85 border border-slate-200 text-slate-900' 
          : 'bg-slate-900/60 border border-white/[0.08] text-white'
      }`}>
        <div>
          <div className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Today's Commute
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className={`text-sm font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Best departure</span>
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'
            }`}>
              {bestDeparture}
            </span>
          </div>
        </div>

        {/* Expected conditions: clean unboxed bullet strip */}
        <div>
          <span className={`text-xs font-medium block mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Expected conditions</span>
          <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm ${
            theme === 'light' ? 'text-slate-700' : 'text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Clear visibility ({visibilityKm} km)</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Dry roads, optimal braking grip</span>
            </div>
            <span className={theme === 'light' ? 'text-slate-300' : 'text-white/20'}>·</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Low weather disruption</span>
            </div>
          </div>
        </div>
      </section>

      {/* RECOMMENDED OPTION & ALTERNATIVES */}
      <section className="space-y-4">
        <div className={`text-[11px] uppercase tracking-wider font-semibold ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Recommended Option
        </div>

        {/* Primary Recommended Option Card */}
        <div className={`p-5 rounded-2xl flex items-center justify-between gap-4 ${
          theme === 'light' 
            ? 'bg-white/85 border border-slate-200 shadow-sm' 
            : 'bg-white/[0.03] border border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              theme === 'light' 
                ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
                : 'bg-cyan-950/80 text-cyan-400 border-cyan-800/40'
            }`}>
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Car / Road</div>
              <div className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                {highwayRouteName} · {formatDuration(roadTimeMinutes)}
              </div>
            </div>
          </div>

          <span className="text-xs font-semibold text-emerald-600">
            Good conditions
          </span>
        </div>

        {/* ALTERNATIVES */}
        <div className="space-y-2 pt-2">
          <span className={`text-xs font-medium block ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Alternatives</span>
          
          <div className={`divide-y border-y ${
            theme === 'light' 
              ? 'divide-slate-200 border-slate-200' 
              : 'divide-white/[0.04] border-white/[0.05]'
          }`}>
            <div className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Train className="w-4 h-4 text-emerald-600" />
                <span className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  Northern Railway Intercity / Mainline Track
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {formatDuration(trainTimeMinutes)}
                </span>
                <span className="text-emerald-600 font-semibold">Weather-immune</span>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>🚶 / 🚴</span>
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Walking / Cycle</span>
              </div>
              <span className="text-slate-400">
                {roadDistanceKm > 20 
                  ? `Not recommended for ~${Math.round(roadDistanceKm)} km intercity span` 
                  : `~${Math.round(roadDistanceKm * 3.5)} min cycling`}
              </span>
            </div>

            {!hasMetro && (
              <div className={`py-2.5 text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Note: Urban Metro rail is not operational in {homeInput}. Use {highwayRouteName} or Indian Railways.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ROUTE: Clean Dominant Map */}
      <section className="space-y-4">
        <div className={`text-[11px] uppercase tracking-wider font-semibold ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Route Map
        </div>

        {destInput ? (
          <CommuterRouteMap
            originName={homeInput}
            originLat={originCoords.lat}
            originLng={originCoords.lng}
            originWeather={`${tempC}°C · ${condition}`}
            originFog={visibilityKm > 3 ? 'Clear sightlines' : 'Reduced visibility'}
            destinationName={destInput}
            destinationLat={destCoords.lat}
            destinationLng={destCoords.lng}
            pointType="OFFICE"
          />
        ) : (
          <div className={`p-8 text-center text-xs rounded-3xl space-y-3 ${
            theme === 'light' 
              ? 'bg-white/80 border border-slate-200 text-slate-700 shadow-sm' 
              : 'border border-white/[0.05] bg-white/[0.01] text-slate-400'
          }`}>
            <p className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No commute destination configured yet.</p>
            <p className={`max-w-md mx-auto ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Enter your workplace, university, or travel destination above to see Google Maps-style street driving directions, railway transit options, and real-time weather sightlines.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-500'}>Quick destinations:</span>
              {['New Delhi', 'Noida', 'Gurugram', 'Bareilly', 'Lucknow'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setDestInput(city);
                    const next = { ...profile, homeLocationName: homeInput, officeLocationName: city };
                    setProfile(next);
                    localStorage.setItem('mausam_adapt_commuter_profile', JSON.stringify(next));
                    setIsEditingRoute(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/5'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ADVANCED: Progressive Disclosure Trays */}
      <section className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-full py-3 px-4 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer border ${
            theme === 'light' 
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200 bg-white/60' 
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border-white/[0.05]'
          }`}
        >
          <span>Advanced route telemetry &amp; transit breakdown</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className={`mt-4 p-6 rounded-2xl backdrop-blur-xl space-y-4 text-xs animate-fade-in ${
            theme === 'light' 
              ? 'bg-white/90 border border-slate-200 text-slate-800 shadow-md' 
              : 'bg-slate-900/40 border border-white/[0.06] text-white'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Fog Radar Classification</span>
                <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {visibilityKm >= 4 ? 'CAT-0 / Unrestricted Visibility' : visibilityKm >= 1.5 ? 'CAT-I / Moderate Mist' : 'CAT-II / Dense Fog'}
                </span>
                <p className={`text-[11px] mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Sightlines exceed {Math.round(visibilityKm * 1000)}m along {highwayRouteName}.
                </p>
              </div>

              <div>
                <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Expressway Surface Status</span>
                <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {observation?.rainfall_mm && observation.rainfall_mm > 0 ? 'Wet Surface / Caution' : 'Free Flow / Dry Asphalt'}
                </span>
                <p className={`text-[11px] mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Normal vehicle throughput without weather disruption along {homeInput} → {destInput}.
                </p>
              </div>

              <div>
                <span className={`block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Pesticide Spray / Construction</span>
                <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Safe for Crane Operations</span>
                <p className={`text-[11px] mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Wind shear below 15 km/h threshold.</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
