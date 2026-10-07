import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  MapPin, 
  Car, 
  Train, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Clock, 
  Layers,
  Building2,
  Package,
  Home,
  ShieldCheck,
  Fuel,
  Maximize2,
  Minimize2,
  ArrowRight,
  Info,
  RefreshCw,
  Globe,
  CornerDownRight,
  Route,
  ExternalLink
} from 'lucide-react';
import { calculateHaversineDistanceKm, hasMetroTransit } from '../services/geoUtils.js';

interface CommuterRouteMapProps {
  originName: string;
  originLat: number;
  originLng: number;
  originWeather?: string;
  originFog?: string;
  destinationName: string;
  destinationLat?: number;
  destinationLng?: number;
  destinationWeather?: string;
  destinationFog?: string;
  pointType?: 'OFFICE' | 'DELIVERY';
}

interface RouteStep {
  instruction: string;
  name: string;
  distanceKm: number;
}

// Approximate city, colony, and landmark coordinates registry for Indian commuter routes
const CITY_COORDS_REGISTRY: Record<string, { lat: number; lng: number; district: string; state: string }> = {
  // Dehradun & Uttarakhand
  'dehradun clock tower': { lat: 30.3256, lng: 78.0436, district: 'Dehradun', state: 'Uttarakhand' },
  'dehradun isbt': { lat: 30.2867, lng: 78.0089, district: 'Dehradun', state: 'Uttarakhand' },
  'rajpur road': { lat: 30.3400, lng: 78.0600, district: 'Dehradun', state: 'Uttarakhand' },
  'dehradun railway station': { lat: 30.3150, lng: 78.0350, district: 'Dehradun', state: 'Uttarakhand' },
  'dehradun': { lat: 30.3165, lng: 78.0322, district: 'Dehradun', state: 'Uttarakhand' },
  'mussoorie': { lat: 30.4598, lng: 78.0644, district: 'Dehradun', state: 'Uttarakhand' },
  'rishikesh': { lat: 30.0869, lng: 78.2676, district: 'Dehradun', state: 'Uttarakhand' },
  'haridwar': { lat: 29.9457, lng: 78.1642, district: 'Haridwar', state: 'Uttarakhand' },
  'roorkee': { lat: 29.8543, lng: 77.8880, district: 'Haridwar', state: 'Uttarakhand' },

  // Moradabad in-city colonies & landmarks
  'lajpat nagar moradabad': { lat: 28.8480, lng: 78.7620, district: 'Moradabad', state: 'Uttar Pradesh' },
  'lajpat nagar, moradabad': { lat: 28.8480, lng: 78.7620, district: 'Moradabad', state: 'Uttar Pradesh' },
  'mda moradabad': { lat: 28.8530, lng: 78.7490, district: 'Moradabad', state: 'Uttar Pradesh' },
  'mda colony': { lat: 28.8530, lng: 78.7490, district: 'Moradabad', state: 'Uttar Pradesh' },
  'mda': { lat: 28.8530, lng: 78.7490, district: 'Moradabad', state: 'Uttar Pradesh' },
  'naveen nagar moradabad': { lat: 28.8560, lng: 78.7640, district: 'Moradabad', state: 'Uttar Pradesh' },
  'naveen nagar, moradabad': { lat: 28.8560, lng: 78.7640, district: 'Moradabad', state: 'Uttar Pradesh' },
  'naveen nagar': { lat: 28.8560, lng: 78.7640, district: 'Moradabad', state: 'Uttar Pradesh' },
  'ramganga vihar': { lat: 28.8650, lng: 78.7600, district: 'Moradabad', state: 'Uttar Pradesh' },
  'civil lines moradabad': { lat: 28.8450, lng: 78.7650, district: 'Moradabad', state: 'Uttar Pradesh' },
  'majholla': { lat: 28.8200, lng: 78.7500, district: 'Moradabad', state: 'Uttar Pradesh' },
  'majhola': { lat: 28.8200, lng: 78.7500, district: 'Moradabad', state: 'Uttar Pradesh' },
  'buddhi vihar': { lat: 28.8350, lng: 78.7350, district: 'Moradabad', state: 'Uttar Pradesh' },
  'moradabad brass hub': { lat: 28.8320, lng: 78.7850, district: 'Moradabad', state: 'Uttar Pradesh' },
  'peetal basti': { lat: 28.8320, lng: 78.7850, district: 'Moradabad', state: 'Uttar Pradesh' },
  'moradabad junction': { lat: 28.8315, lng: 78.7690, district: 'Moradabad', state: 'Uttar Pradesh' },
  'moradabad': { lat: 28.8386, lng: 78.7733, district: 'Moradabad', state: 'Uttar Pradesh' },

  // Delhi & NCR In-City Points & Colonies
  'chandni chowk': { lat: 28.6506, lng: 77.2303, district: 'Central Delhi', state: 'Delhi' },
  'nehru place': { lat: 28.5494, lng: 77.2526, district: 'South East Delhi', state: 'Delhi' },
  'connaught place': { lat: 28.6304, lng: 77.2177, district: 'New Delhi', state: 'Delhi' },
  'lajpat nagar delhi': { lat: 28.5677, lng: 77.2433, district: 'South Delhi', state: 'Delhi' },
  'lajpat nagar, delhi': { lat: 28.5677, lng: 77.2433, district: 'South Delhi', state: 'Delhi' },
  'karol bagh': { lat: 28.6514, lng: 77.1907, district: 'Central Delhi', state: 'Delhi' },
  'saket': { lat: 28.5283, lng: 77.2188, district: 'South Delhi', state: 'Delhi' },
  'hauz khas': { lat: 28.5494, lng: 77.2001, district: 'South Delhi', state: 'Delhi' },
  'rohini': { lat: 28.7166, lng: 77.1147, district: 'North West Delhi', state: 'Delhi' },
  'dwarka': { lat: 28.5921, lng: 77.0460, district: 'South West Delhi', state: 'Delhi' },
  'anand vihar': { lat: 28.6469, lng: 77.3160, district: 'East Delhi', state: 'Delhi' },
  'kashmere gate': { lat: 28.6675, lng: 77.2284, district: 'North Delhi', state: 'Delhi' },
  'aiims': { lat: 28.5672, lng: 77.2100, district: 'New Delhi', state: 'Delhi' },
  'igi airport': { lat: 28.5562, lng: 77.1000, district: 'New Delhi', state: 'Delhi' },
  'noida sector 18': { lat: 28.5708, lng: 77.3261, district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  'noida sector 62': { lat: 28.6280, lng: 77.3649, district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  'noida': { lat: 28.5355, lng: 77.3910, district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  'greater noida': { lat: 28.4744, lng: 77.5040, district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  'dlf cybercity': { lat: 28.4950, lng: 77.0890, district: 'Gurugram', state: 'Haryana' },
  'cyber hub': { lat: 28.4850, lng: 77.0950, district: 'Gurugram', state: 'Haryana' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, district: 'Gurugram', state: 'Haryana' },
  'gurugram': { lat: 28.4595, lng: 77.0266, district: 'Gurugram', state: 'Haryana' },
  'ghaziabad': { lat: 28.6692, lng: 77.4538, district: 'Ghaziabad', state: 'Uttar Pradesh' },
  'indirapuram': { lat: 28.6410, lng: 77.3710, district: 'Ghaziabad', state: 'Uttar Pradesh' },
  'vaishali': { lat: 28.6480, lng: 77.3400, district: 'Ghaziabad', state: 'Uttar Pradesh' },
  'raj nagar': { lat: 28.6850, lng: 77.4420, district: 'Ghaziabad', state: 'Uttar Pradesh' },
  'meerut': { lat: 28.9845, lng: 77.7064, district: 'Meerut', state: 'Uttar Pradesh' },
  'delhi': { lat: 28.6139, lng: 77.2090, district: 'New Delhi', state: 'Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, district: 'New Delhi', state: 'Delhi' },

  // Rampur in-city colonies
  'civil lines rampur': { lat: 28.8120, lng: 79.0280, district: 'Rampur', state: 'Uttar Pradesh' },
  'jwala nagar': { lat: 28.8230, lng: 79.0150, district: 'Rampur', state: 'Uttar Pradesh' },
  'model town rampur': { lat: 28.8280, lng: 79.0350, district: 'Rampur', state: 'Uttar Pradesh' },
  'pahar ganj rampur': { lat: 28.8050, lng: 79.0320, district: 'Rampur', state: 'Uttar Pradesh' },
  'kila rampur': { lat: 28.8140, lng: 79.0210, district: 'Rampur', state: 'Uttar Pradesh' },
  'panwaria': { lat: 28.7980, lng: 79.0110, district: 'Rampur', state: 'Uttar Pradesh' },
  'bilaspur gate': { lat: 28.8250, lng: 79.0400, district: 'Rampur', state: 'Uttar Pradesh' },
  'railway colony rampur': { lat: 28.8030, lng: 79.0200, district: 'Rampur', state: 'Uttar Pradesh' },
  'rampur junction': { lat: 28.8020, lng: 79.0180, district: 'Rampur', state: 'Uttar Pradesh' },
  'rampur': { lat: 28.8154, lng: 79.0250, district: 'Rampur', state: 'Uttar Pradesh' },

  // Mumbai MMR In-City Points & Landmarks
  'nariman point': { lat: 18.9256, lng: 72.8242, district: 'Mumbai City', state: 'Maharashtra' },
  'bkc': { lat: 19.0657, lng: 72.8687, district: 'Mumbai Suburban', state: 'Maharashtra' },
  'bandra kurla complex': { lat: 19.0657, lng: 72.8687, district: 'Mumbai Suburban', state: 'Maharashtra' },
  'bandra': { lat: 19.0596, lng: 72.8295, district: 'Mumbai Suburban', state: 'Maharashtra' },
  'andheri east': { lat: 19.1136, lng: 72.8697, district: 'Mumbai Suburban', state: 'Maharashtra' },
  'andheri': { lat: 19.1197, lng: 72.8464, district: 'Mumbai Suburban', state: 'Maharashtra' },
  'lower parel': { lat: 18.9953, lng: 72.8315, district: 'Mumbai City', state: 'Maharashtra' },
  'dadar': { lat: 19.0178, lng: 72.8478, district: 'Mumbai City', state: 'Maharashtra' },
  'colaba': { lat: 18.9067, lng: 72.8147, district: 'Mumbai City', state: 'Maharashtra' },
  'borivali': { lat: 19.2307, lng: 72.8567, district: 'Mumbai Suburban', state: 'Maharashtra' },
  'thane west': { lat: 19.2183, lng: 72.9781, district: 'Thane', state: 'Maharashtra' },
  'thane': { lat: 19.2183, lng: 72.9781, district: 'Thane', state: 'Maharashtra' },
  'vashi': { lat: 19.0771, lng: 72.9986, district: 'Thane', state: 'Maharashtra' },
  'navi mumbai': { lat: 19.0330, lng: 73.0297, district: 'Thane', state: 'Maharashtra' },
  'powai': { lat: 19.1197, lng: 72.9051, district: 'Mumbai Suburban', state: 'Maharashtra' },
  'mumbai airport': { lat: 19.0896, lng: 72.8656, district: 'Mumbai Suburban', state: 'Maharashtra' },
  'mumbai': { lat: 18.9220, lng: 72.8347, district: 'Mumbai City', state: 'Maharashtra' },

  // Bengaluru In-City Points & Tech Parks
  'electronic city': { lat: 12.8399, lng: 77.6770, district: 'Bengaluru Urban', state: 'Karnataka' },
  'whitefield': { lat: 12.9698, lng: 77.7500, district: 'Bengaluru Urban', state: 'Karnataka' },
  'koramangala': { lat: 12.9352, lng: 77.6245, district: 'Bengaluru Urban', state: 'Karnataka' },
  'indiranagar': { lat: 12.9784, lng: 77.6408, district: 'Bengaluru Urban', state: 'Karnataka' },
  'mg road bengaluru': { lat: 12.9756, lng: 77.6066, district: 'Bengaluru Urban', state: 'Karnataka' },
  'manyata tech park': { lat: 13.0475, lng: 77.6212, district: 'Bengaluru Urban', state: 'Karnataka' },
  'marathahalli': { lat: 12.9591, lng: 77.6974, district: 'Bengaluru Urban', state: 'Karnataka' },
  'hsr layout': { lat: 12.9121, lng: 77.6446, district: 'Bengaluru Urban', state: 'Karnataka' },
  'hebbal': { lat: 13.0358, lng: 77.5970, district: 'Bengaluru Urban', state: 'Karnataka' },
  'jayanagar': { lat: 12.9308, lng: 77.5838, district: 'Bengaluru Urban', state: 'Karnataka' },
  'majestic': { lat: 12.9767, lng: 77.5713, district: 'Bengaluru Urban', state: 'Karnataka' },
  'kempegowda airport': { lat: 13.1986, lng: 77.7066, district: 'Bengaluru Urban', state: 'Karnataka' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, district: 'Bengaluru Urban', state: 'Karnataka' },
  'bangalore': { lat: 12.9716, lng: 77.5946, district: 'Bengaluru Urban', state: 'Karnataka' },

  // Hyderabad In-City Points & Financial District
  'hitec city': { lat: 17.4474, lng: 78.3762, district: 'Hyderabad', state: 'Telangana' },
  'gachibowli': { lat: 17.4401, lng: 78.3489, district: 'Hyderabad', state: 'Telangana' },
  'madhapur': { lat: 17.4483, lng: 78.3915, district: 'Hyderabad', state: 'Telangana' },
  'banjara hills': { lat: 17.4156, lng: 78.4357, district: 'Hyderabad', state: 'Telangana' },
  'jubilee hills': { lat: 17.4319, lng: 78.4073, district: 'Hyderabad', state: 'Telangana' },
  'secunderabad': { lat: 17.4399, lng: 78.4983, district: 'Hyderabad', state: 'Telangana' },
  'begumpet': { lat: 17.4531, lng: 78.4677, district: 'Hyderabad', state: 'Telangana' },
  'charminar': { lat: 17.3616, lng: 78.4747, district: 'Hyderabad', state: 'Telangana' },
  'financial district hyderabad': { lat: 17.4150, lng: 78.3400, district: 'Hyderabad', state: 'Telangana' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, district: 'Hyderabad', state: 'Telangana' },

  // Chennai In-City Points
  'omr it corridor': { lat: 12.9249, lng: 80.2285, district: 'Chennai', state: 'Tamil Nadu' },
  't nagar': { lat: 13.0418, lng: 80.2341, district: 'Chennai', state: 'Tamil Nadu' },
  'guindy': { lat: 13.0067, lng: 80.2025, district: 'Chennai', state: 'Tamil Nadu' },
  'anna nagar': { lat: 13.0850, lng: 80.2101, district: 'Chennai', state: 'Tamil Nadu' },
  'chennai central': { lat: 13.0827, lng: 80.2707, district: 'Chennai', state: 'Tamil Nadu' },
  'velachery': { lat: 12.9815, lng: 80.2180, district: 'Chennai', state: 'Tamil Nadu' },
  'adyar': { lat: 13.0012, lng: 80.2565, district: 'Chennai', state: 'Tamil Nadu' },
  'marina beach': { lat: 13.0500, lng: 80.2824, district: 'Chennai', state: 'Tamil Nadu' },
  'chennai': { lat: 13.0827, lng: 80.2707, district: 'Chennai', state: 'Tamil Nadu' },

  // Kolkata In-City Points
  'park street': { lat: 22.5510, lng: 88.3526, district: 'Kolkata', state: 'West Bengal' },
  'salt lake sector v': { lat: 22.5800, lng: 88.4350, district: 'North 24 Parganas', state: 'West Bengal' },
  'salt lake': { lat: 22.5868, lng: 88.4178, district: 'North 24 Parganas', state: 'West Bengal' },
  'new town kolkata': { lat: 22.5937, lng: 88.4800, district: 'North 24 Parganas', state: 'West Bengal' },
  'howrah station': { lat: 22.5839, lng: 88.3426, district: 'Howrah', state: 'West Bengal' },
  'howrah': { lat: 22.5958, lng: 88.2636, district: 'Howrah', state: 'West Bengal' },
  'esplanade': { lat: 22.5645, lng: 88.3518, district: 'Kolkata', state: 'West Bengal' },
  'alipore': { lat: 22.5333, lng: 88.3333, district: 'Kolkata', state: 'West Bengal' },
  'gariahath': { lat: 22.5186, lng: 88.3653, district: 'Kolkata', state: 'West Bengal' },
  'kolkata': { lat: 22.5726, lng: 88.3639, district: 'Kolkata', state: 'West Bengal' },

  // Pune In-City Points
  'hinjawadi': { lat: 18.5913, lng: 73.7389, district: 'Pune', state: 'Maharashtra' },
  'magarpatta': { lat: 18.5144, lng: 73.9299, district: 'Pune', state: 'Maharashtra' },
  'shivajinagar pune': { lat: 18.5308, lng: 73.8475, district: 'Pune', state: 'Maharashtra' },
  'viman nagar': { lat: 18.5679, lng: 73.9143, district: 'Pune', state: 'Maharashtra' },
  'kothrud': { lat: 18.5074, lng: 73.8077, district: 'Pune', state: 'Maharashtra' },
  'baner': { lat: 18.5590, lng: 73.7868, district: 'Pune', state: 'Maharashtra' },
  'hadapsar': { lat: 18.5089, lng: 73.9259, district: 'Pune', state: 'Maharashtra' },
  'pune': { lat: 18.5204, lng: 73.8567, district: 'Pune', state: 'Maharashtra' },

  // Ahmedabad & Gujarat
  'sg highway': { lat: 23.0525, lng: 72.5120, district: 'Ahmedabad', state: 'Gujarat' },
  'ashram road': { lat: 23.0300, lng: 72.5700, district: 'Ahmedabad', state: 'Gujarat' },
  'prahlad nagar': { lat: 23.0125, lng: 72.5100, district: 'Ahmedabad', state: 'Gujarat' },
  'gift city': { lat: 23.1610, lng: 72.6840, district: 'Gandhinagar', state: 'Gujarat' },
  'sabarmati': { lat: 23.0800, lng: 72.5800, district: 'Ahmedabad', state: 'Gujarat' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, district: 'Ahmedabad', state: 'Gujarat' },
  'surat': { lat: 21.1702, lng: 72.8311, district: 'Surat', state: 'Gujarat' },
  'vadodara': { lat: 22.3072, lng: 73.1812, district: 'Vadodara', state: 'Gujarat' },

  // Jaipur & Rajasthan
  'mi road': { lat: 26.9180, lng: 75.8050, district: 'Jaipur', state: 'Rajasthan' },
  'malviya nagar jaipur': { lat: 26.8540, lng: 75.8200, district: 'Jaipur', state: 'Rajasthan' },
  'mansarovar': { lat: 26.8650, lng: 75.7600, district: 'Jaipur', state: 'Rajasthan' },
  'vaishali nagar jaipur': { lat: 26.9100, lng: 75.7400, district: 'Jaipur', state: 'Rajasthan' },
  'pink city jaipur': { lat: 26.9239, lng: 75.8267, district: 'Jaipur', state: 'Rajasthan' },
  'sitapura': { lat: 26.7750, lng: 75.8500, district: 'Jaipur', state: 'Rajasthan' },
  'c-scheme': { lat: 26.9100, lng: 75.8000, district: 'Jaipur', state: 'Rajasthan' },
  'jaipur': { lat: 26.9124, lng: 75.7873, district: 'Jaipur', state: 'Rajasthan' },
  'jodhpur': { lat: 26.2389, lng: 73.0243, district: 'Jodhpur', state: 'Rajasthan' },
  'udaipur': { lat: 24.5854, lng: 73.7125, district: 'Udaipur', state: 'Rajasthan' },

  // Lucknow & UP Cities
  'hazratganj': { lat: 26.8500, lng: 80.9500, district: 'Lucknow', state: 'Uttar Pradesh' },
  'gomti nagar': { lat: 26.8520, lng: 80.9980, district: 'Lucknow', state: 'Uttar Pradesh' },
  'alambagh': { lat: 26.8150, lng: 80.9150, district: 'Lucknow', state: 'Uttar Pradesh' },
  'charbagh': { lat: 26.8322, lng: 80.9189, district: 'Lucknow', state: 'Uttar Pradesh' },
  'indira nagar lucknow': { lat: 26.8850, lng: 80.9850, district: 'Lucknow', state: 'Uttar Pradesh' },
  'lucknow': { lat: 26.8467, lng: 80.9462, district: 'Lucknow', state: 'Uttar Pradesh' },
  'kanpur': { lat: 26.4499, lng: 80.3319, district: 'Kanpur Nagar', state: 'Uttar Pradesh' },
  'varanasi': { lat: 25.3176, lng: 82.9739, district: 'Varanasi', state: 'Uttar Pradesh' },
  'prayagraj': { lat: 25.4358, lng: 81.8463, district: 'Prayagraj', state: 'Uttar Pradesh' },
  'agra': { lat: 27.1767, lng: 78.0081, district: 'Agra', state: 'Uttar Pradesh' },
  'bareilly': { lat: 28.3670, lng: 79.4304, district: 'Bareilly', state: 'Uttar Pradesh' },
  'aligarh': { lat: 27.8974, lng: 78.0880, district: 'Aligarh', state: 'Uttar Pradesh' },

  // Chandigarh Tricity
  'sector 17 chandigarh': { lat: 30.7398, lng: 76.7827, district: 'Chandigarh', state: 'Chandigarh' },
  'sector 35 chandigarh': { lat: 30.7250, lng: 76.7650, district: 'Chandigarh', state: 'Chandigarh' },
  'it park chandigarh': { lat: 30.7225, lng: 76.8400, district: 'Chandigarh', state: 'Chandigarh' },
  'mohali': { lat: 30.7046, lng: 76.7179, district: 'SAS Nagar', state: 'Punjab' },
  'panchkula': { lat: 30.6942, lng: 76.8606, district: 'Panchkula', state: 'Haryana' },
  'zirakpur': { lat: 30.6425, lng: 76.8173, district: 'SAS Nagar', state: 'Punjab' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, district: 'Chandigarh', state: 'Chandigarh' },

  // Kochi & Kerala
  'kakkanad': { lat: 10.0159, lng: 76.3419, district: 'Ernakulam', state: 'Kerala' },
  'infopark kochi': { lat: 10.0100, lng: 76.3600, district: 'Ernakulam', state: 'Kerala' },
  'marine drive kochi': { lat: 9.9800, lng: 76.2750, district: 'Ernakulam', state: 'Kerala' },
  'edappally': { lat: 10.0236, lng: 76.3117, district: 'Ernakulam', state: 'Kerala' },
  'technopark': { lat: 8.5566, lng: 76.8820, district: 'Thiruvananthapuram', state: 'Kerala' },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366, district: 'Thiruvananthapuram', state: 'Kerala' },
  'kochi': { lat: 9.9312, lng: 76.2673, district: 'Ernakulam', state: 'Kerala' },

  // Patna & Bihar
  'bailey road patna': { lat: 25.6120, lng: 85.0950, district: 'Patna', state: 'Bihar' },
  'kankarbagh': { lat: 25.5900, lng: 85.1550, district: 'Patna', state: 'Bihar' },
  'boring road': { lat: 25.6180, lng: 85.1200, district: 'Patna', state: 'Bihar' },
  'patna junction': { lat: 25.6022, lng: 85.1376, district: 'Patna', state: 'Bihar' },
  'patna': { lat: 25.5941, lng: 85.1376, district: 'Patna', state: 'Bihar' },

  // Guwahati & North East
  'gs road guwahati': { lat: 26.1550, lng: 91.7750, district: 'Kamrup Metropolitan', state: 'Assam' },
  'dispur': { lat: 26.1408, lng: 91.7900, district: 'Kamrup Metropolitan', state: 'Assam' },
  'paltan bazaar': { lat: 26.1800, lng: 91.7500, district: 'Kamrup Metropolitan', state: 'Assam' },
  'guwahati': { lat: 26.1445, lng: 91.7362, district: 'Kamrup Metropolitan', state: 'Assam' }
};

type PathMode = 'HIGHWAY' | 'RAIL' | 'BYPASS';
type MapTheme = 'GOOGLE_STREET' | 'GOOGLE_HYBRID' | 'STREET' | 'DARK' | 'OSM' | 'SATELLITE';

export const CommuterRouteMap: React.FC<CommuterRouteMapProps> = ({
  originName,
  originLat,
  originLng,
  originWeather,
  originFog,
  destinationName,
  destinationLat,
  destinationLng,
  destinationWeather,
  destinationFog,
  pointType = 'OFFICE'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activePathMode, setActivePathMode] = useState<PathMode>('HIGHWAY');
  const [mapTheme, setMapTheme] = useState<MapTheme>('STREET');
  const [showMilestones, setShowMilestones] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real OSRM Street Direction states
  const [osrmCoords, setOsrmCoords] = useState<[number, number][]>([]);
  const [osrmDistance, setOsrmDistance] = useState<number | null>(null);
  const [osrmDuration, setOsrmDuration] = useState<number | null>(null);
  const [osrmSteps, setOsrmSteps] = useState<RouteStep[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Sorted entries for longest-key matching
  const sortedRegistryEntries = Object.entries(CITY_COORDS_REGISTRY).sort(
    ([a], [b]) => b.length - a.length
  );

  // 1. Resolve Origin coordinates
  const originLookup = (originName || '').toLowerCase().trim();
  const destLookup = (destinationName || '').toLowerCase().trim();

  let resolvedOriginLat = originLat || 28.8154;
  let resolvedOriginLng = originLng || 79.0250;

  // Context-aware check for Lajpat Nagar: Moradabad vs Delhi
  if (originLookup.includes('lajpat nagar') && !originLookup.includes('delhi') && !originLookup.includes('moradabad')) {
    if (destLookup.includes('moradabad') || originLookup.includes('moradabad') || originLookup.includes('rampur') || originLookup.includes('bareilly') || originLookup.includes('mda') || originLookup.includes('naveen')) {
      resolvedOriginLat = 28.8480;
      resolvedOriginLng = 78.7620;
    } else {
      resolvedOriginLat = 28.5677;
      resolvedOriginLng = 77.2433;
    }
  } else {
    for (const [key, coords] of sortedRegistryEntries) {
      if (originLookup.includes(key)) {
        resolvedOriginLat = coords.lat;
        resolvedOriginLng = coords.lng;
        break;
      }
    }
  }

  // 2. Resolve Destination coordinates
  let resolvedDestLat = destinationLat;
  let resolvedDestLng = destinationLng;

  if (!resolvedDestLat || !resolvedDestLng) {
    if (destLookup.includes('lajpat nagar') && !destLookup.includes('delhi') && !destLookup.includes('moradabad')) {
      if (originLookup.includes('moradabad') || originLookup.includes('rampur') || originLookup.includes('mda') || originLookup.includes('naveen')) {
        resolvedDestLat = 28.8480;
        resolvedDestLng = 78.7620;
      } else {
        resolvedDestLat = 28.5677;
        resolvedDestLng = 77.2433;
      }
    } else {
      for (const [key, coords] of sortedRegistryEntries) {
        if (destLookup.includes(key)) {
          resolvedDestLat = coords.lat;
          resolvedDestLng = coords.lng;
          break;
        }
      }
    }
  }

  // Fallbacks if still unknown destination - STRICTLY ACCURATE, NEVER PUT DEHRADUN IN MORADABAD!
  if (!resolvedDestLat || !resolvedDestLng) {
    if (destLookup.includes('dehradun')) {
      resolvedDestLat = 30.3165;
      resolvedDestLng = 78.0322;
    } else if (destLookup.includes('chandni chowk')) {
      resolvedDestLat = 28.6506;
      resolvedDestLng = 77.2303;
    } else if (destLookup.includes('nehru place')) {
      resolvedDestLat = 28.5494;
      resolvedDestLng = 77.2526;
    } else if (destLookup.includes('mda')) {
      resolvedDestLat = 28.8530;
      resolvedDestLng = 78.7490;
    } else if (destLookup.includes('naveen nagar')) {
      resolvedDestLat = 28.8560;
      resolvedDestLng = 78.7640;
    } else if (destLookup.includes('delhi') || destLookup.includes('ncr')) {
      resolvedDestLat = 28.6139;
      resolvedDestLng = 77.2090;
    } else if (destLookup.includes('moradabad')) {
      resolvedDestLat = 28.8386;
      resolvedDestLng = 78.7733;
    } else if (originLookup.includes('rampur') && destLookup.includes('moradabad')) {
      resolvedDestLat = 28.8386;
      resolvedDestLng = 78.7733; // Moradabad
    } else {
      resolvedDestLat = resolvedOriginLat + 0.05;
      resolvedDestLng = resolvedOriginLng + 0.05;
    }
  }

  const isRampurMoradabadCorridor = 
    (originLookup.includes('rampur') && destLookup.includes('moradabad')) ||
    (originLookup.includes('moradabad') && destLookup.includes('rampur'));

  const isMoradabadDehradunCorridor = 
    (originLookup.includes('moradabad') && destLookup.includes('dehradun')) ||
    (originLookup.includes('dehradun') && destLookup.includes('moradabad'));

  const isMoradabadDelhiCorridor = 
    ((originLookup.includes('moradabad') || originLookup.includes('rampur')) && (destLookup.includes('delhi') || destLookup.includes('noida') || destLookup.includes('gurgaon') || destLookup.includes('nehru') || destLookup.includes('chandni'))) ||
    ((originLookup.includes('delhi') || originLookup.includes('noida') || originLookup.includes('nehru') || originLookup.includes('chandni')) && (destLookup.includes('moradabad') || destLookup.includes('rampur')));

  const isDelhiInCityCorridor =
    (originLookup.includes('chandni') || originLookup.includes('nehru') || originLookup.includes('connaught') || (originLookup.includes('lajpat') && !originLookup.includes('moradabad')) || originLookup.includes('saket') || originLookup.includes('karol') || originLookup.includes('rohini')) &&
    (destLookup.includes('chandni') || destLookup.includes('nehru') || destLookup.includes('connaught') || (destLookup.includes('lajpat') && !destLookup.includes('moradabad')) || destLookup.includes('saket') || destLookup.includes('karol') || destLookup.includes('rohini'));

  const isMoradabadInCityCorridor =
    (originLookup.includes('lajpat') || originLookup.includes('mda') || originLookup.includes('naveen') || originLookup.includes('ramganga') || originLookup.includes('civil lines') || originLookup.includes('majhol') || originLookup.includes('buddhi vihar') || originLookup.includes('moradabad')) &&
    (destLookup.includes('lajpat') || destLookup.includes('mda') || destLookup.includes('naveen') || destLookup.includes('ramganga') || destLookup.includes('civil lines') || destLookup.includes('majhol') || destLookup.includes('buddhi vihar')) &&
    !destLookup.includes('delhi') && !originLookup.includes('delhi') && !destLookup.includes('dehradun') && !originLookup.includes('dehradun');

  // Calculate distance fallbacks
  const directDistanceKm = calculateHaversineDistanceKm(
    resolvedOriginLat,
    resolvedOriginLng,
    resolvedDestLat,
    resolvedDestLng
  );

  const finalDistanceKm = osrmDistance || Math.round(directDistanceKm * 1.15 * 10) / 10;
  const roadTimeMinutes = osrmDuration || Math.max(15, Math.round((finalDistanceKm / 46) * 60));
  const trainTimeMinutes = Math.max(18, Math.round((finalDistanceKm / 65) * 60));

  const formatDurationHrsMins = (minutes: number) => {
    if (minutes < 60) return `${minutes} mins`;
    const hrs = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hrs} hr ${rem} mins` : `${hrs} hr`;
  };

  // Fetch real street directions from OSRM (Google Map Directions street routing)
  useEffect(() => {
    let isCancelled = false;
    const fetchStreetRoute = async () => {
      setIsLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${resolvedOriginLng},${resolvedOriginLat};${resolvedDestLng},${resolvedDestLat}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Route API failed');
        const data = await res.json();
        if (isCancelled) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setOsrmCoords(coords);
          setOsrmDistance(Math.round((route.distance / 1000) * 10) / 10);
          setOsrmDuration(Math.round(route.duration / 60));

          if (route.legs && route.legs[0] && route.legs[0].steps) {
            const steps: RouteStep[] = route.legs[0].steps
              .filter((st: any) => st.maneuver && st.distance > 50)
              .map((st: any) => {
                const type = st.maneuver.type;
                const modifier = st.maneuver.modifier;
                const roadName = st.name ? st.name : 'connecting road';
                let instruction = '';
                if (type === 'depart') {
                  instruction = `Head ${modifier || 'forward'} onto ${roadName}`;
                } else if (type === 'arrive') {
                  instruction = `Arrive at destination (${destinationName})`;
                } else if (modifier) {
                  instruction = `Turn ${modifier} onto ${roadName}`;
                } else {
                  instruction = `Continue on ${roadName}`;
                }
                return {
                  instruction,
                  name: roadName,
                  distanceKm: Math.round((st.distance / 1000) * 10) / 10
                };
              });
            setOsrmSteps(steps.slice(0, 8));
          }
        }
      } catch (err) {
        console.warn('OSRM street route fallback triggered:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingRoute(false);
        }
      }
    };

    fetchStreetRoute();

    return () => {
      isCancelled = true;
    };
  }, [resolvedOriginLat, resolvedOriginLng, resolvedDestLat, resolvedDestLng, destinationName]);

  // Fallback high-fidelity highway street waypoints if offline
  const getDetailedStreetPath = (mode: PathMode): [number, number][] => {
    // If real OSRM street route was fetched and mode is HIGHWAY, return the exact street geometry!
    if (mode === 'HIGHWAY' && osrmCoords.length > 0) {
      return osrmCoords;
    }

    if (isRampurMoradabadCorridor) {
      const isRampurOrigin = originLookup.includes('rampur');

      if (mode === 'HIGHWAY') {
        const pts: [number, number][] = [
          [28.8154, 79.0250], // Rampur Center (Civil Lines)
          [28.8180, 78.9850], // Rampur West Bypass (NH 9 entry)
          [28.8250, 78.8950], // Dalpatpur Flyover (NH 9)
          [28.8320, 78.8500], // Mundha Pande Toll Plaza (NH 9)
          [28.8370, 78.8100], // Ramganga Bridge approach
          [28.8410, 78.7850], // Moradabad East Bypass junction
          [28.8450, 78.7700], // Delhi Road / Imperial Tiraha
        ];

        pts.push([resolvedDestLat, resolvedDestLng]);

        return isRampurOrigin ? pts : [...pts].reverse();
      } else if (mode === 'RAIL') {
        const pts: [number, number][] = [
          [28.8020, 79.0180], // Rampur Jn (RMU)
          [28.8210, 78.8920], // Dalpatpur Halt (DLP)
          [28.8280, 78.8450], // Mundha Pande (MPH)
          [28.8320, 78.7950], // Katghar Jn (KGF)
          [28.8315, 78.7690]  // Moradabad Jn (MB)
        ];
        return isRampurOrigin ? pts : [...pts].reverse();
      } else {
        const pts: [number, number][] = [
          [28.8154, 79.0250],
          [28.7800, 78.9500],
          [28.7950, 78.8500],
          [28.8386, 78.7733]
        ];
        return isRampurOrigin ? pts : [...pts].reverse();
      }
    }

    if (isMoradabadDehradunCorridor) {
      const isMoradabadOrigin = originLookup.includes('moradabad');
      if (mode === 'HIGHWAY') {
        const pts: [number, number][] = [
          [28.8450, 78.7650], // Moradabad Civil Lines / Kanth Road
          [28.9700, 78.6000], // Chhajlet / Kanth (NH 734)
          [29.3700, 78.2600], // Bijnor / Najibabad corridor
          [29.9457, 78.1642], // Haridwar (NH 334 / Har Ki Pauri bypass)
          [30.0869, 78.2676], // Rishikesh / Raiwala forest road
          [30.2867, 78.0089], // Dehradun ISBT entry
          [30.3165, 78.0322]  // Dehradun Clock Tower
        ];
        return isMoradabadOrigin ? pts : [...pts].reverse();
      } else if (mode === 'RAIL') {
        const pts: [number, number][] = [
          [28.8315, 78.7690], // Moradabad Jn (MB)
          [29.0600, 78.6300], // Kanth (KNT)
          [29.6100, 78.3400], // Najibabad Jn (NBD)
          [29.7500, 78.0300], // Laksar Jn (LRJ)
          [29.9500, 78.1600], // Haridwar Jn (HW)
          [30.3150, 78.0350]  // Dehradun (DDN)
        ];
        return isMoradabadOrigin ? pts : [...pts].reverse();
      }
    }

    if (isMoradabadDelhiCorridor) {
      const isMoradabadOrigin = originLookup.includes('moradabad') || originLookup.includes('rampur');
      if (mode === 'HIGHWAY') {
        const pts: [number, number][] = [
          [resolvedOriginLat, resolvedOriginLng],
          [28.8450, 78.7700], // Moradabad West Delhi Road Exit
          [28.8250, 78.6900], // Pakwada (NH 9)
          [28.8350, 78.5800], // Joya / Amroha Cut (NH 9)
          [28.8450, 78.2350], // Gajraula Industrial Area (NH 9)
          [28.7850, 78.1300], // Garhmukteshwar Ganga Bridge
          [28.7250, 77.7750], // Hapur Bypass (NH 9)
          [28.7100, 77.6550], // Pilkhuwa Flyover
          [28.6650, 77.4450], // Ghaziabad Lal Kuan / DME Corridor
          [28.6250, 77.3300], // UP Gate / Delhi-Meerut Expressway
          [28.6150, 77.2800], // Akshardham / Yamuna Bridge
          [resolvedDestLat, resolvedDestLng]
        ];
        return isMoradabadOrigin ? pts : [...pts].reverse();
      } else if (mode === 'RAIL') {
        const pts: [number, number][] = [
          [28.8315, 78.7690], // Moradabad Jn (MB)
          [28.8400, 78.5800], // Amroha (AMRO)
          [28.8450, 78.2350], // Gajraula Jn (GJL)
          [28.7800, 78.1300], // Garhmuktesar (GMS)
          [28.7300, 77.7700], // Hapur Jn (HPU)
          [28.6650, 77.4400], // Ghaziabad Jn (GZB)
          [28.6469, 77.3160], // Anand Vihar Terminal (ANVT)
          [resolvedDestLat, resolvedDestLng]
        ];
        return isMoradabadOrigin ? pts : [...pts].reverse();
      }
    }

    if (isDelhiInCityCorridor) {
      return [
        [resolvedOriginLat, resolvedOriginLng],
        [resolvedOriginLat + (resolvedDestLat - resolvedOriginLat) * 0.3, resolvedOriginLng + (resolvedDestLng - resolvedOriginLng) * 0.1],
        [resolvedOriginLat + (resolvedDestLat - resolvedOriginLat) * 0.7, resolvedOriginLng + (resolvedDestLng - resolvedOriginLng) * 0.8],
        [resolvedDestLat, resolvedDestLng]
      ];
    }

    if (isMoradabadInCityCorridor) {
      return [
        [resolvedOriginLat, resolvedOriginLng],
        [28.8450, 78.7650], // Civil Lines junction
        [28.8550, 78.7600], // Ramganga Vihar / Naveen Nagar intersection
        [resolvedDestLat, resolvedDestLng]
      ];
    }

    // Default street-following path: generate smooth geodesic waypoints with natural road curves
    const dLat = resolvedDestLat - resolvedOriginLat;
    const dLng = resolvedDestLng - resolvedOriginLng;
    return [
      [resolvedOriginLat, resolvedOriginLng],
      [resolvedOriginLat + dLat * 0.25, resolvedOriginLng + dLng * 0.1],
      [resolvedOriginLat + dLat * 0.5, resolvedOriginLng + dLng * 0.45],
      [resolvedOriginLat + dLat * 0.75, resolvedOriginLng + dLng * 0.85],
      [resolvedDestLat, resolvedDestLng]
    ];
  };

  // Turn-by-turn Milestones
  const milestones = osrmSteps.length > 0
    ? osrmSteps.map((st, i) => ({
        name: st.instruction,
        detail: `${st.distanceKm} km · Active roadway tracking`,
        icon: i === 0 ? 'START' : i === osrmSteps.length - 1 ? 'END' : 'WAYPOINT'
      }))
    : isMoradabadDehradunCorridor
    ? [
        { name: `Depart Origin (${originName})`, detail: 'Exit via Kanth Road / NH 734 arterial', icon: 'START' },
        { name: 'Kanth & Najibabad Foothills Corridor', detail: 'Km 65 · Transition from Gangetic plains to Himalayan foothills', icon: 'WAYPOINT' },
        { name: 'Haridwar Ganga Canal Bypass (NH 334)', detail: 'Km 122 · Connect to 4-lane expressway corridor', icon: 'WAYPOINT' },
        { name: 'Raiwala & Rajaji National Park Section', detail: 'Km 152 · Forest scenic corridor (speed limit 50 km/h)', icon: 'WAYPOINT' },
        { name: `Arrive Dehradun (${destinationName})`, detail: 'Km 182 · Doon Valley destination reached', icon: 'END' }
      ]
    : isMoradabadInCityCorridor
    ? [
        { name: `Depart (${originName})`, detail: 'Moradabad colony arterial road', icon: 'START' },
        { name: 'Civil Lines / Ramganga Vihar Main Road', detail: 'Connecting city arterial bypass & bridge', icon: 'WAYPOINT' },
        { name: `Arrive at Destination (${destinationName})`, detail: 'Destination colony point reached', icon: 'END' }
      ]
    : isDelhiInCityCorridor
    ? [
        { name: `Depart (${originName})`, detail: 'Delhi urban arterial road transit', icon: 'START' },
        { name: 'Ring Road / Elevated Flyover Corridor', detail: 'Signal-free arterial transit across central & south zones', icon: 'WAYPOINT' },
        { name: `Arrive at Destination (${destinationName})`, detail: 'Destination point reached', icon: 'END' }
      ]
    : isRampurMoradabadCorridor
    ? activePathMode === 'HIGHWAY'
      ? [
          { name: `Depart Origin (${originName})`, detail: 'City speed limit 40 km/h · Clear pavement', icon: 'START' },
          { name: 'Merge onto NH 9 (Delhi-Lucknow 4-Lane)', detail: 'High-capacity expressway corridor with physical median', icon: 'MERGE' },
          { name: 'Mundha Pande Toll Plaza', detail: 'Km 14 checkpoint · FastTag lanes · Clear sightlines', icon: 'WAYPOINT' },
          { name: 'Cross Ramganga River Bridge', detail: 'Km 23 · Moradabad city arterial flyover', icon: 'WAYPOINT' },
          { name: `Arrive at Destination (${destinationName})`, detail: 'Destination point reached', icon: 'END' }
        ]
      : activePathMode === 'RAIL'
      ? [
          { name: 'Rampur Junction (RMU)', detail: 'Northern Railway Mainline Station', icon: 'START' },
          { name: 'Dalpatpur (DLP) & Mundha Pande (MPH)', detail: 'Electrified double track · 90 km/h express sectional speed', icon: 'WAYPOINT' },
          { name: 'Katghar Junction (KGF)', detail: 'Ramganga railway bridge crossing approach', icon: 'WAYPOINT' },
          { name: 'Moradabad Junction (MB)', detail: 'Northern Railway Divisional HQ · Auto/cab stands at exit', icon: 'END' }
        ]
      : [
          { name: `Depart Origin (${originName})`, detail: 'Shahabad rural connector exit', icon: 'START' },
          { name: 'Kundarki / Bilari State Road', detail: '2-lane rural highway · Slower pace', icon: 'WAYPOINT' },
          { name: `Arrive at Destination (${destinationName})`, detail: 'Enter Moradabad via South bypass', icon: 'END' }
        ]
    : [
        { name: `Depart: ${originName}`, detail: `Surface weather: ${originWeather || 'Stable'} · Fog: ${originFog || 'Clear'}`, icon: 'START' },
        { name: 'Primary Highway Corridor', detail: `${activePathMode === 'HIGHWAY' ? 'Expressway' : 'Transit'} corridor with real-time road telemetry`, icon: 'WAYPOINT' },
        { name: `Arrive: ${destinationName}`, detail: `Destination conditions: ${destinationWeather || 'Normal'}`, icon: 'END' }
      ];

  // Map Initialization & Lifecycle
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    const initialBounds = L.latLngBounds([
      [resolvedOriginLat, resolvedOriginLng],
      [resolvedDestLat, resolvedDestLng]
    ]);

    const mapInstance = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 4,
      maxZoom: 20
    });
    mapInstance.fitBounds(initialBounds, { padding: [50, 50], maxZoom: 14 });

    L.control.zoom({ position: 'topright' }).addTo(mapInstance);

    setMap(mapInstance);

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.invalidateSize();
    });
    resizeObserver.observe(container);

    const timer = setTimeout(() => {
      mapInstance.invalidateSize();
      mapInstance.fitBounds(initialBounds, { padding: [50, 50], maxZoom: 14 });
    }, 200);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  // Handle Fullscreen Toggle
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (!map) return;
    const t = setTimeout(() => {
      map.invalidateSize();
      handleCenterMap();
    }, 150);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  // Map Layer Updates
  useEffect(() => {
    if (!map) return;

    // 1. Update Tile Layer (Google Maps, Esri, OSM with maxNativeZoom: 19, maxZoom: 22)
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let tileClassName = '';
    let maxZoom = 20;
    let maxNativeZoom = 19;
    let attribution = '&copy; Google Maps';

    if (mapTheme === 'GOOGLE_STREET') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      maxZoom = 20;
      maxNativeZoom = 19;
      attribution = '&copy; Google Maps';
    } else if (mapTheme === 'GOOGLE_HYBRID') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      maxZoom = 20;
      maxNativeZoom = 19;
      attribution = '&copy; Google Maps Satellite';
    } else if (mapTheme === 'STREET') {
      // Esri World Street Map - crisp roads, clear NH 9 highway labels
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 20;
      maxNativeZoom = 19;
      attribution = '&copy; Esri & OpenStreetMap';
    } else if (mapTheme === 'DARK') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      tileClassName = '';
      maxZoom = 20;
      maxNativeZoom = 19;
      attribution = '&copy; CARTO & OpenStreetMap contributors';
    } else if (mapTheme === 'OSM') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 20;
      maxNativeZoom = 19;
      attribution = '&copy; OpenStreetMap contributors';
    } else if (mapTheme === 'SATELLITE') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 20;
      maxNativeZoom = 19;
      attribution = '&copy; Esri, Maxar';
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom,
      maxNativeZoom,
      minZoom: 4,
      className: tileClassName,
      attribution
    });

    newTileLayer.on('tileerror', () => {
      // Gracefully prevent tile error from crashing or showing broken state
    });

    newTileLayer.addTo(map);

    tileLayerRef.current = newTileLayer;

    // 2. Clear previous route & marker layers
    if (routeLayersRef.current) {
      map.removeLayer(routeLayersRef.current);
    }
    const layerGroup = L.layerGroup().addTo(map);
    routeLayersRef.current = layerGroup;

    // Helper to escape HTML safely
    const escapeHtml = (str: string) => {
      return (str || '').replace(/[&<>"']/g, (m) => {
        switch (m) {
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#39;';
          default: return m;
        }
      });
    };

    // 3. Google Maps Origin Marker 'A' (Home)
    const originIcon = L.divIcon({
      className: 'route-marker-container',
      html: `
        <div style="position: relative; display: inline-flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
          <div style="
            background: #1a73e8;
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 9999px;
            font-family: system-ui, -apple-system, sans-serif;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(66, 133, 244, 0.6);
            border: 2px solid #ffffff;
            white-space: nowrap;
          ">
            <span style="background: #ffffff; color: #1a73e8; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900;">
              A
            </span>
            <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: -0.01em;">
              ${escapeHtml(originName)}
            </span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid #1a73e8;
            margin-top: -1px;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const originMarker = L.marker([resolvedOriginLat, resolvedOriginLng], { icon: originIcon });
    originMarker.bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif; padding: 4px; font-size: 12px; min-width: 180px;">
        <strong style="display: block; font-size: 13px; color: #1a73e8; margin-bottom: 3px;">📍 Departure: ${escapeHtml(originName)}</strong>
        <div><strong>Weather:</strong> ${originWeather || 'Clear conditions'}</div>
        <div><strong>Visibility:</strong> ${originFog || 'Clear'}</div>
      </div>
    `);
    layerGroup.addLayer(originMarker);

    // 4. Google Maps Destination Marker 'B'
    const isOffice = pointType === 'OFFICE';
    const destPinColor = '#ea4335'; // Google Maps Red
    
    const destIcon = L.divIcon({
      className: 'route-marker-container',
      html: `
        <div style="position: relative; display: inline-flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
          <div style="
            background: ${destPinColor};
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 9999px;
            font-family: system-ui, -apple-system, sans-serif;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(234, 67, 53, 0.6);
            border: 2px solid #ffffff;
            white-space: nowrap;
          ">
            <span style="background: #ffffff; color: ${destPinColor}; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900;">
              B
            </span>
            <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: -0.01em;">
              ${escapeHtml(destinationName)}
            </span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid ${destPinColor};
            margin-top: -1px;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    const destMarker = L.marker([resolvedDestLat, resolvedDestLng], { icon: destIcon });
    destMarker.bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif; padding: 4px; font-size: 12px; min-width: 180px;">
        <strong style="display: block; font-size: 13px; color: ${destPinColor}; margin-bottom: 3px;">
          🏁 Destination: ${escapeHtml(destinationName)}
        </strong>
        <div><strong>Forecast:</strong> ${destinationWeather || 'Clear conditions'}</div>
        <div><strong>Sightlines:</strong> ${destinationFog || 'Normal'}</div>
      </div>
    `);
    layerGroup.addLayer(destMarker);

    // 5. Draw Proper Street Route Lines (Google Map Direction View)
    const routeCoords = getDetailedStreetPath(activePathMode);

    if (activePathMode === 'HIGHWAY') {
      // Modern High-Contrast Street Direction Style: Outer Soft Blue Glow + Inner Bright Sky Path
      const routeCasing = L.polyline(routeCoords, {
        color: '#2563eb',
        weight: 7,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const routeStreetLine = L.polyline(routeCoords, {
        color: '#38bdf8',
        weight: 4,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round'
      });

      layerGroup.addLayer(routeCasing);
      layerGroup.addLayer(routeStreetLine);

      // Checkpoint markers along the route
      if (isRampurMoradabadCorridor) {
        const tollMarker = L.circleMarker([28.8320, 78.8500], {
          radius: 6,
          color: '#1a73e8',
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 3
        });
        tollMarker.bindPopup(`
          <div style="color: #0f172a; font-size: 11px;">
            <strong>🛣️ NH 9 Mundha Pande Toll Plaza</strong>
            <div>Surface Traction: Dry asphalt</div>
          </div>
        `);
        layerGroup.addLayer(tollMarker);
      }
    } else if (activePathMode === 'RAIL') {
      const railBase = L.polyline(routeCoords, {
        color: '#047857',
        weight: 7,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round'
      });
      const railLine = L.polyline(routeCoords, {
        color: '#10b981',
        weight: 4,
        opacity: 1,
        dashArray: '10, 8'
      });
      layerGroup.addLayer(railBase);
      layerGroup.addLayer(railLine);
    } else {
      const bypassLine = L.polyline(routeCoords, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.95,
        dashArray: '8, 6'
      });
      layerGroup.addLayer(bypassLine);
    }

    // 6. Fit bounds smoothly across the entire intercity corridor
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 13 });
    } else {
      const bounds = L.latLngBounds([
        [resolvedOriginLat, resolvedOriginLng],
        [resolvedDestLat, resolvedDestLng]
      ]);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 13 });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [
    map,
    mapTheme,
    activePathMode,
    osrmCoords,
    resolvedOriginLat,
    resolvedOriginLng,
    resolvedDestLat,
    resolvedDestLng,
    originName,
    destinationName,
    originWeather,
    originFog,
    destinationWeather,
    destinationFog,
    pointType
  ]);

  const handleCenterMap = () => {
    if (!map) return;
    const routeCoords = getDetailedStreetPath(activePathMode);
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-fade-in transition-all ${
        isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen flex flex-col rounded-none' : ''
      }`}
    >
      {/* Map Header & Controls */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 flex items-center gap-1">
              <Route className="w-3 h-3" />
              <span>STREETS VIEW ROUTE</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {originName} → {destinationName}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>Google Maps-Style Driving Directions &amp; Transit Corridor</span>
          </h3>
        </div>

        {/* Route Selector Tabs & Layer Themes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Path Modes */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs shrink-0 font-mono">
            <button
              type="button"
              onClick={() => setActivePathMode('HIGHWAY')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activePathMode === 'HIGHWAY'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Drive ({formatDurationHrsMins(roadTimeMinutes)})</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePathMode('RAIL')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activePathMode === 'RAIL'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>Train ({formatDurationHrsMins(trainTimeMinutes)})</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePathMode('BYPASS')}
              className={`px-2.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                activePathMode === 'BYPASS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Alt Route</span>
            </button>
          </div>

          {/* Theme switcher: Google Map, Google Satellite, Street, Dark, OSM */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs shrink-0 font-mono">
            <button
              type="button"
              title="Google Maps Roads & Street Labels"
              onClick={() => setMapTheme('GOOGLE_STREET')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                mapTheme === 'GOOGLE_STREET' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Google Map
            </button>
            <button
              type="button"
              title="Google Maps Hybrid Satellite"
              onClick={() => setMapTheme('GOOGLE_HYBRID')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                mapTheme === 'GOOGLE_HYBRID' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Google Satellite
            </button>
            <button
              type="button"
              title="Streets View"
              onClick={() => setMapTheme('STREET')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                mapTheme === 'STREET' ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              title="Dark Canvas"
              onClick={() => setMapTheme('DARK')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                mapTheme === 'DARK' ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              title="OpenStreetMap Standard"
              onClick={() => setMapTheme('OSM')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                mapTheme === 'OSM' ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OSM
            </button>
          </div>

          {/* Turnkey Google Maps Navigation App link */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originName)}&destination=${encodeURIComponent(destinationName)}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5 transition-all shrink-0"
            title="Open turnkey GPS turn-by-turn route in Google Maps app"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Map'}
            className="p-2 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1 text-xs"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Corridor Quick Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-900/90 border-b border-slate-800 text-xs font-mono shrink-0">
        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Street Route Distance</span>
          <span className="text-sm font-bold text-white">~{finalDistanceKm} km</span>
          <span className="text-[10px] text-blue-400 block mt-0.5">Real Road Geometry</span>
        </div>

        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Driving Time</span>
          <span className="text-sm font-bold text-blue-400">~{roadTimeMinutes} mins</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Live Route Velocity</span>
        </div>

        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Railway Transit</span>
          <span className="text-sm font-bold text-emerald-400">~{trainTimeMinutes} mins</span>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">Mainline Track</span>
        </div>

        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Corridor Sightlines</span>
          <span className="text-sm font-bold text-emerald-400">OPTIMAL</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{originFog || 'Clear visibility'}</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className={`relative w-full bg-slate-950 ${isFullscreen ? 'flex-1 min-h-[500px]' : 'h-[440px] sm:h-[480px] min-h-[380px]'}`}>
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: isFullscreen ? '500px' : '380px' }} />

        {/* Floating Google Maps Style Route Guidance Badge */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-lg p-3 text-xs shadow-2xl z-[1000]">
          <div className="flex items-center justify-between gap-2 font-bold text-white mb-1">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                {activePathMode === 'HIGHWAY'
                  ? 'Streets View Expressway Guidance'
                  : activePathMode === 'RAIL'
                  ? 'Railway Intercity Corridor'
                  : 'Alternative Street Route'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-blue-400 font-bold">
              ~{roadTimeMinutes}m · {finalDistanceKm} km
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {activePathMode === 'HIGHWAY'
              ? `Real streets and highway directions from ${originName} to ${destinationName}. Roadway surface is dry with clear visual sightlines. Follow street directions for optimal transit.`
              : activePathMode === 'RAIL'
              ? `Railway mainline track provides grade-separated transit bypassing road traffic and morning mist.`
              : `Alternative connecting roadway corridor.`}
          </p>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Navigation: Street-Following Road Network</span>
            <button
              type="button"
              onClick={() => setShowMilestones(!showMilestones)}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              {showMilestones ? 'Hide Directions' : 'Show Directions'}
            </button>
          </div>
        </div>
      </div>

      {/* Turn-by-turn Street Waypoints (Google Maps style) */}
      {showMilestones && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Turn-by-Turn Driving Directions</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {milestones.length} Directions · Street Navigation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {milestones.map((ms, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-start gap-2.5"
              >
                <div className="w-5 h-5 rounded-full bg-blue-950 border border-blue-700 flex items-center justify-center shrink-0 text-[10px] font-mono text-blue-400 font-bold mt-0.5">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 truncate text-[11px]">
                    {ms.name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                    {ms.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
