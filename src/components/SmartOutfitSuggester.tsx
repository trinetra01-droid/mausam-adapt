import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shirt, 
  Umbrella, 
  Glasses, 
  Footprints, 
  Sun, 
  CloudRain, 
  Wind, 
  Sparkles, 
  Check, 
  Briefcase, 
  Activity,
  Droplets,
  ShieldCheck,
  Heart,
  Sprout,
  Compass,
  Users,
  Waves,
  PartyPopper,
  ShieldAlert
} from 'lucide-react';
import { UserPersona } from '../types.js';

export interface SmartOutfitSuggesterProps {
  temperatureC: number;
  feelsLikeC?: number;
  rainfallMm?: number;
  conditionText?: string;
  humidityPct?: number;
  windSpeedKmh?: number;
  uvIndex?: number;
  isDay?: boolean;
  theme?: 'light' | 'dark';
  currentPersona?: UserPersona;
}

export type ProfileMode = 
  | 'COMMUTER' 
  | 'FITNESS' 
  | 'HEALTH' 
  | 'AGRICULTURE' 
  | 'TRAVEL' 
  | 'FAMILY' 
  | 'BEACH_SURF' 
  | 'COASTAL' 
  | 'EVENT_PLANNER'
  | 'CASUAL';

interface OutfitRecommendation {
  profileTitle: string;
  headline: string;
  summary: string;
  badge: string;
  badgeColor: string;
  upperBody: string;
  lowerBody: string;
  footwear: string;
  accessories: string[];
  weatherTip: string;
}

const PROFILE_CONFIGS: { id: ProfileMode; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'COMMUTER', label: 'Commuter', icon: Briefcase },
  { id: 'FITNESS', label: 'Fitness & Runner', icon: Activity },
  { id: 'HEALTH', label: 'Health Sensitive', icon: Heart },
  { id: 'AGRICULTURE', label: 'Farming & Field', icon: Sprout },
  { id: 'TRAVEL', label: 'Travel & Highway', icon: Compass },
  { id: 'FAMILY', label: 'Family & Kids', icon: Users },
  { id: 'BEACH_SURF', label: 'Beach & Coastal', icon: Waves },
  { id: 'EVENT_PLANNER', label: 'Event & Formal', icon: PartyPopper },
  { id: 'CASUAL', label: 'Everyday Casual', icon: Shirt }
];

export const SmartOutfitSuggester: React.FC<SmartOutfitSuggesterProps> = ({
  temperatureC,
  feelsLikeC,
  rainfallMm = 0,
  conditionText = '',
  humidityPct = 50,
  windSpeedKmh = 10,
  uvIndex = 5,
  isDay = true,
  theme = 'light',
  currentPersona
}) => {
  // Sync internal selected profile with external currentPersona when provided
  const [activeProfile, setActiveProfile] = useState<ProfileMode>(() => {
    if (currentPersona) return currentPersona as ProfileMode;
    return 'COMMUTER';
  });

  useEffect(() => {
    if (currentPersona) {
      setActiveProfile(currentPersona as ProfileMode);
    }
  }, [currentPersona]);

  const effFeelsLike = feelsLikeC !== undefined ? feelsLikeC : temperatureC;
  const condLower = (conditionText || '').toLowerCase();

  // Meteorological condition triggers
  const isRaining = rainfallMm > 0.2 || 
    condLower.includes('rain') || 
    condLower.includes('drizzle') || 
    condLower.includes('shower') || 
    condLower.includes('thunder') ||
    condLower.includes('storm');

  const isHeavyRain = rainfallMm > 7 || 
    condLower.includes('heavy rain') || 
    condLower.includes('torrential') || 
    condLower.includes('downpour');

  const isVeryHot = temperatureC >= 34 || effFeelsLike >= 37;
  const isWarm = temperatureC >= 27 && !isVeryHot;
  const isMild = temperatureC >= 20 && temperatureC < 27;
  const isCool = temperatureC >= 14 && temperatureC < 20;
  const isCold = temperatureC < 14;

  // Build persona-specific recommendations
  const outfit: OutfitRecommendation = useMemo(() => {
    // -------------------------------------------------------------
    // 1. COMMUTER (Transit, Office, Metro, Bike, Urban Mobility)
    // -------------------------------------------------------------
    if (activeProfile === 'COMMUTER') {
      if (isHeavyRain) {
        return {
          profileTitle: 'Commuter · Monsoon Transit Protocol',
          headline: 'Full Trench Rain Shell & Waterproof Commute Footwear',
          summary: `Torrential rain (${rainfallMm} mm). Protect work clothes with an outer waterproof hooded trench coat, water-shedding formal footwear, and carry an emergency dry shirt in your pack.`,
          badge: 'Heavy Rain Commute',
          badgeColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
          upperBody: 'Waterproof hooded raincoat or trench worn over crease-resistant formal shirt',
          lowerBody: 'Dark moisture-shedding trousers (avoid light khakis or cotton twill that stain)',
          footwear: 'Waterproof commute overshoes, dark rubber-sole oxfords, or water-sealed Chelsea boots',
          accessories: [
            'Heavy-duty windproof double-canopy umbrella',
            'Waterproof backpack rain sleeve / laptop dry bag',
            'Spare dry pair of formal socks in zip bag'
          ],
          weatherTip: 'Roll cuffs slightly during walk from station to vehicle to prevent street splash-back.'
        };
      }
      if (isRaining) {
        return {
          profileTitle: 'Commuter · Wet Street Protection',
          headline: 'Water-Repellent Commute Jacket & Compact Umbrella',
          summary: `Showers expected with wet pavement. Keep corporate attire clean with a packable rain shell and water-resistant commute shoes.`,
          badge: 'Showers & Commute',
          badgeColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
          upperBody: 'Crisp Oxford cotton shirt with lightweight water-repellent travel blazer or shell',
          lowerBody: 'Tailored dark navy or charcoal formal trousers',
          footwear: 'Treated leather dress shoes or dark water-repellent commute sneakers',
          accessories: [
            'Compact automatic folding umbrella',
            'Weatherproof laptop briefcase or backpack',
            'Microfiber cloth for glasses & phone screen'
          ],
          weatherTip: 'High indoor AC after walking in damp humidity can cause chills; keep a light cardigan at your desk.'
        };
      }
      if (isVeryHot) {
        return {
          profileTitle: 'Commuter · Extreme Heat Protocol',
          headline: 'Air-Circulating Linen / Pinpoint Cotton & UV Shield',
          summary: `High heat (${temperatureC}°C, feels like ${effFeelsLike}°C). Wear light-hued, breathable natural weaves that prevent sweat accumulation during transit.`,
          badge: 'High Heat Commute',
          badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          upperBody: 'Breathable 100% linen or airy poplin dress shirt (ice blue, white, or beige)',
          lowerBody: 'Lightweight tropical wool or cotton-stretch formal chinos',
          footwear: 'Breathable leather loafers or monk straps with moisture-absorbing bamboo socks',
          accessories: [
            'UV400 polarized commute sunglasses',
            'Insulated stainless steel hydration flask',
            'Pocket handkerchief'
          ],
          weatherTip: 'Wear a modal undershirt to absorb sweat before it reaches your dress shirt collar and cuffs.'
        };
      }
      if (isCold || isCool) {
        return {
          profileTitle: 'Commuter · Winter Corridors',
          headline: 'Structured Wool Overcoat & Fine Merino Layering',
          summary: `Chilly commute (${temperatureC}°C). Professional tailored suiting paired with merino wool knitwear and wind-buffering outerwear.`,
          badge: isCold ? 'Winter Commute' : 'Cool Weather',
          badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
          upperBody: 'Fine merino wool crewneck or v-neck sweater over formal shirt, topped with structured overcoat',
          lowerBody: 'Heavyweight tailored flannel or wool-blend trousers',
          footwear: 'Polished Goodyear-welted leather oxfords or Chelsea dress boots with wool socks',
          accessories: [
            'Cashmere or merino wool commute scarf',
            'Leather touchscreen gloves',
            'Thermal thermos for hot tea/coffee'
          ],
          weatherTip: 'Wind chill at bus stops and bike routes will feel 3-5°C colder; keep scarf wrapped around neck.'
        };
      }
      // Mild / Pleasant Commuter
      return {
        profileTitle: 'Commuter · Standard Business Casual',
        headline: 'Tailored Business Casual & Structured Layers',
        summary: `Mild and balanced (${temperatureC}°C). Perfect conditions for classic business attire, knit polos, or light sports coats.`,
        badge: 'Ideal Commute',
        badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        upperBody: 'Structured button-down shirt with tailored blazer or fine knit polo',
        lowerBody: 'Tailored chinos or slim-fit formal trousers',
        footwear: 'Classic leather derbies, brogues, or minimalist leather dress sneakers',
        accessories: [
          'Classic leather brief or sleek tech backpack',
          'Analog watch',
          'Light sunglasses for commute glare'
        ],
        weatherTip: 'Comfortable commute temperature throughout the morning and evening rush hours.'
      };
    }

    // -------------------------------------------------------------
    // 2. FITNESS (Running, Cycling, Workouts, Outdoor Athletics)
    // -------------------------------------------------------------
    if (activeProfile === 'FITNESS') {
      if (isRaining) {
        return {
          profileTitle: 'Fitness & Runner · Wet Training',
          headline: 'Breathable DWR Rain Jacket & Anti-Slip Trail Grips',
          summary: `Precipitation active. Avoid cotton completely; use hydrophobic technical synthetics, brimmed cap to clear vision, and high-traction soles.`,
          badge: 'Rain Workout Gear',
          badgeColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
          upperBody: 'Breathable DWR / water-resistant running jacket over technical sweat-wicking base layer',
          lowerBody: 'Quick-dry compression running tights or water-repellent lined shorts',
          footwear: 'Road / trail runners with deep wet-asphalt rubber lugs and synthetic blister-guard socks',
          accessories: [
            'Curved visor running cap (keeps raindrops out of eyes)',
            'Waterproof phone arm strap or zippered running vest',
            'High-visibility reflective armbands'
          ],
          weatherTip: 'Slippery paint markings and metal grates on road. Maintain shorter stride length and avoid high-speed turns.'
        };
      }
      if (isVeryHot) {
        return {
          profileTitle: 'Fitness & Runner · High Heat Stress',
          headline: 'Ultralight Aeroready Mesh & Sun-Reflective Singlet',
          summary: `Scorching conditions (${temperatureC}°C). Maximize body cooling with perforated mesh singlets, electrolyte hydration, and dawn/dusk scheduling.`,
          badge: 'Extreme Heat Athletics',
          badgeColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
          upperBody: 'Perforated featherlight running singlet with UPF 30+ sun-reflective fabric',
          lowerBody: 'Split running shorts (3" or 5") with breathable anti-chafing inner brief',
          footwear: 'Highly ventilated mesh road racing shoes with ultrathin anti-friction socks',
          accessories: [
            'Sweat-absorbing sports headband / wristband',
            'UV400 running sunglasses',
            'Handheld electrolyte flask (rehydrate every 15-20 mins)'
          ],
          weatherTip: 'High thermal stress. Reduce target tempo by 10-15% or shift long runs before 07:00 AM.'
        };
      }
      if (isCold || isCool) {
        return {
          profileTitle: 'Fitness & Runner · Cold Air Workout',
          headline: 'Thermal Compression Top & Windproof Athletic Vest',
          summary: `Crisp temperature (${temperatureC}°C). Start slightly cool as body temperature rises 10°C during steady-state aerobic output.`,
          badge: 'Cold Air Workout',
          badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
          upperBody: 'Long-sleeve brushed thermal compression top paired with lightweight packable wind vest',
          lowerBody: 'Full-length compression running tights or thermal athletic joggers',
          footwear: 'Cushioned running shoes with merino-blend running socks',
          accessories: [
            'Thermal running headband covering ears',
            'Lightweight technical running gloves',
            'Chest strap heart rate monitor'
          ],
          weatherTip: 'Dress as if the outdoor temperature is 7-8°C warmer than the thermometer reading.'
        };
      }
      // Warm / Mild Fitness
      return {
        profileTitle: 'Fitness & Runner · Peak Performance',
        headline: 'Sweat-Wicking Technical Tee & Ergonomic Shorts',
        summary: `Optimal athletic conditions (${temperatureC}°C). Excellent thermodynamic conditions for tempo runs, cycling, or outdoor HIIT.`,
        badge: 'Optimal Athletic Weather',
        badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        upperBody: 'Dri-FIT / Aeroready athletic tee or seamless athletic tank',
        lowerBody: '7-inch unrestrictive training shorts with zippered phone pocket',
        footwear: 'Engineered mesh performance runners with arch-support athletic socks',
        accessories: [
          'GPS fitness smartwatch',
          'Light sports sunglasses',
          'Post-workout hydration pack'
        ],
        weatherTip: 'Prime conditions for personal bests and endurance volume.'
      };
    }

    // -------------------------------------------------------------
    // 3. HEALTH (Asthma, Air Quality, Seniors, Allergy Sensitive)
    // -------------------------------------------------------------
    if (activeProfile === 'HEALTH') {
      const isHighWind = windSpeedKmh > 20;
      return {
        profileTitle: 'Health & Respiratory Sensitive Profile',
        headline: isRaining 
          ? 'Thermal Chest Protection & Damp Air Barrier' 
          : isVeryHot 
          ? 'Heat Buffer, Loose Cotton & UV Shield'
          : isHighWind 
          ? 'Dust Barrier, N95 Protection & Eye Shield' 
          : 'Hypoallergenic Soft Natural Weaves & Temperature Buffer',
        summary: isRaining
          ? `Rain & moisture can trigger sudden bronchospasm or chills. Wear a light windbreaker to keep upper chest and neck dry and warm.`
          : isVeryHot
          ? `High heat (${temperatureC}°C) stresses cardiovascular and hydration regulation. Loose, non-restrictive organic cotton minimizes heat exhaustion.`
          : `Sensitive profile protection. Soft, natural hypoallergenic fabrics that buffer against sudden ambient shifts and airborne particulates.`,
        badge: isRaining ? 'Respiratory Alert' : isVeryHot ? 'Heat Sensitivity' : 'Health Buffer',
        badgeColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        upperBody: isCool || isCold 
          ? 'High-neck soft merino/cashmere sweater or organic cotton pullover with warm scarf'
          : isVeryHot 
          ? 'Loose, unbleached 100% organic cotton kurta or relaxed button-up'
          : 'Soft, breathable cotton-modal layer with lightweight buttoned outer shirt',
        lowerBody: 'Non-restrictive relaxed-fit cotton trousers or soft linen pants with gentle waistband',
        footwear: 'Orthotic cushioned walking shoes with soft seamless bamboo socks to prevent friction',
        accessories: [
          'N95 / FFP2 particulate mask (essential against dust & air pollutants)',
          'UV400 wrap-around sunglasses (shields eyes from windblown pollen & grit)',
          'Pocket rescue inhaler / prescribed medication in temperature-safe pouch',
          'Thermal water flask with lukewarm hydration'
        ],
        weatherTip: isCool || isCold
          ? 'Breathe through the nose or wear a scarf over mouth to warm inhaled air before it enters lungs.'
          : 'Avoid sudden transitions between freezing air-conditioned rooms and boiling outdoor sun.'
      };
    }

    // -------------------------------------------------------------
    // 4. AGRICULTURE (Farming, Field Work, Rural Agronomy)
    // -------------------------------------------------------------
    if (activeProfile === 'AGRICULTURE') {
      if (isRaining || isHeavyRain) {
        return {
          profileTitle: 'Agriculture · Monsoon Field Work',
          headline: 'Heavy-Duty Waterproof Poncho & Knee-High Gumboots',
          summary: `Wet agricultural soil & downpour. Heavy-duty rubber boots for muddy bunds, waterproof rain protection, and anti-mud splash gear.`,
          badge: 'Monsoon Field Work',
          badgeColor: 'text-lime-500 bg-lime-500/10 border-lime-500/20',
          upperBody: 'Sturdy waterproof farmer poncho or heavy PVC raincoat over durable cotton shirt',
          lowerBody: 'Quick-wash durable cotton trousers rolled above calves or reinforced nylon work pants',
          footwear: 'High-traction knee-length agricultural gumboots / rubber wellington boots',
          accessories: [
            'Broad traditional palm/straw hat or waterproof farmer umbrella',
            'Heavy-duty waterproof nitrile/rubber work gloves',
            'Waterproof pouch for farm keys, seed packets & phone'
          ],
          weatherTip: 'High risk of slipping on muddy field ridges (medh). Check drainage channels and secure farm inputs in dry sheds.'
        };
      }
      if (isVeryHot) {
        return {
          profileTitle: 'Agriculture · Scorching Sun Protection',
          headline: 'Full-Sleeve Cotton Field Shirt & Broad Straw Hat',
          summary: `High sun exposure (${temperatureC}°C, UV ${uvIndex}). Long sleeves are crucial to prevent severe sun blister and heat exhaustion in open fields.`,
          badge: 'Sun & Field Shield',
          badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          upperBody: 'Light-colored 100% cotton full-sleeve shirt (shields skin from direct solar radiation)',
          lowerBody: 'Loose durable cotton trousers or traditional dhoti/lungi that facilitates ventilation',
          footwear: 'Rugged leather field boots or closed breathable work shoes with thick cotton socks',
          accessories: [
            'Traditional broad-brim straw hat or cotton gamcha / turban wrapped over head and neck',
            'Protective canvas / leather work gloves for crop handling',
            'Large 2-liter clay or steel water container for hydration in field'
          ],
          weatherTip: 'Take mandatory shaded rest breaks between 12:00 PM and 03:00 PM under tree canopies.'
        };
      }
      // Standard Field Work
      return {
        profileTitle: 'Agriculture · Field Operations',
        headline: 'Durable Canvas Workwear & Reinforced Footwear',
        summary: `Mild to warm (${temperatureC}°C). Rugged, thorn-resistant workwear designed for soil preparation, irrigation checks, and crop inspection.`,
        badge: 'Field Operations',
        badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        upperBody: 'Durable cotton-twill utility shirt with chest pockets for notebook and pen',
        lowerBody: 'Heavyweight denim or reinforced canvas work trousers',
        footwear: 'Thick-soled rugged field boots with ankle support',
        accessories: [
          'Cotton gamcha / neck cloth (wipes sweat and dust)',
          'Agricultural work gloves',
          'Field knife / pruner holster'
        ],
        weatherTip: 'Optimal conditions for field operations, pest scouting, and mechanical weeding.'
      };
    }

    // -------------------------------------------------------------
    // 5. TRAVEL (Highway Driving, Long Distance Transit, Flight)
    // -------------------------------------------------------------
    if (activeProfile === 'TRAVEL') {
      return {
        profileTitle: 'Travel & Highway Journey Profile',
        headline: isRaining 
          ? 'Packable Travel Rain Shell & Slip-On Traction Shoes' 
          : isVeryHot 
          ? 'Wrinkle-Resistant Airy Stretch Polos & Polarized Lens' 
          : 'Comfort-Stretch Transit Layers & Multi-Pocket Pants',
        summary: `Long-distance highway and transit gear. Ergonomic fabrics that do not constrict during extended seating, with fast slip-on shoes and modular temperature layering.`,
        badge: isRaining ? 'Highway Rain Transit' : 'Long-Distance Travel',
        badgeColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        upperBody: 'Moisture-buffering stretch cotton polo or soft overshirt with lightweight packable wind shell',
        lowerBody: 'Ergonomic 4-way stretch travel chinos or cargo trousers with secure zippered passport/toll pockets',
        footwear: 'Cushioned slip-on driving moccasins or lightweight travel sneakers with breathable socks',
        accessories: [
          'Polarized driving sunglasses (critical against wet asphalt or midday highway glare)',
          'Compact travel folding umbrella packed in outer door pouch',
          'Thermal insulated travel mug and fast phone vehicle charger'
        ],
        weatherTip: isRaining 
          ? 'Reduce vehicle highway cruise speed by 20 km/h; watch for standing water hydroplaning on expressways.'
          : 'AC inside vehicle/train dehydrates skin quickly; carry lip balm and drink water periodically.'
      };
    }

    // -------------------------------------------------------------
    // 6. FAMILY & KIDS (Parents, School, Family Outings)
    // -------------------------------------------------------------
    if (activeProfile === 'FAMILY') {
      return {
        profileTitle: 'Family & Children Outdoor Profile',
        headline: isRaining 
          ? 'Waterproof Family Pack & Splash-Resistant Kids Gear' 
          : isVeryHot 
          ? 'Sun-Protective Airy Cottons & Kids Sun Hats' 
          : 'Play-Friendly Washable Layers & Comfortable Walking Shoes',
        summary: `Family-centric outdoor planning. Machine-washable, stain-tolerant comfortable clothing with emergency weather protection for children and parents alike.`,
        badge: isRaining ? 'Family Wet Weather' : 'Family Day Out',
        badgeColor: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
        upperBody: 'Casual soft cotton t-shirt with packable light zip-up hoodies for parents and children',
        lowerBody: 'Flexible easy-wipe denim or elastic-waist cargo shorts/joggers',
        footwear: 'Comfortable washable sneakers with good traction to keep up with active children',
        accessories: [
          'Extra dry pair of socks and spare t-shirt in family tote',
          'Sun hats / caps for kids with wide neck flap',
          'Large family golf umbrella and pack of disinfectant wet wipes'
        ],
        weatherTip: 'Children lose and gain body heat much faster than adults; check their hands periodically for chills or overheating.'
      };
    }

    // -------------------------------------------------------------
    // 7. BEACH_SURF & COASTAL (Maritime, Sea Breeze, Coastal Sun)
    // -------------------------------------------------------------
    if (activeProfile === 'BEACH_SURF' || activeProfile === 'COASTAL') {
      return {
        profileTitle: 'Beach & Coastal Marine Profile',
        headline: isRaining 
          ? 'Salt-Resistant Windbreaker & Quick-Dry Boardshorts' 
          : isVeryHot 
          ? 'UPF 50+ Rashguard, Breezy Linen & Marine Sun Shield' 
          : 'Coastal Cotton-Linen Weaves & Sand-Resistant Footwear',
        summary: `Coastal and maritime conditions. High humidity (${humidityPct}%), salt air, and solar reflection from water necessitate quick-drying fabrics and high UV protection.`,
        badge: 'Coastal & Marine',
        badgeColor: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        upperBody: 'UPF 50+ quick-dry sun hoodie, breezy open-weave linen shirt, or airy cotton tee',
        lowerBody: 'Quick-dry water-shedding boardshorts or relaxed linen draw-string trousers',
        footwear: 'Waterproof sandals, EVA foam sliders, or non-marking deck shoes with grip',
        accessories: [
          'UV400 polarized marine sunglasses (cuts high surface water glare)',
          'Broad-spectrum water-resistant sunscreen (SPF 50+)',
          'Quick-dry microfiber beach towel & water-resistant dry bag for electronics'
        ],
        weatherTip: 'Sea breezes can mask intense UV radiation; reapply sunscreen every 2 hours even if feeling cool.'
      };
    }

    // -------------------------------------------------------------
    // 8. EVENT_PLANNER (Outdoor Weddings, Banquets, Celebrations)
    // -------------------------------------------------------------
    if (activeProfile === 'EVENT_PLANNER') {
      return {
        profileTitle: 'Event & Formal Celebration Profile',
        headline: isRaining 
          ? 'Festive Outerwear Shield & Stain-Resistant Formalwear' 
          : isVeryHot 
          ? 'Breathable Silk-Linen Blend & Elegant Heat Protection' 
          : 'Tailored Celebration Attire & Structured Suiting',
        summary: `Formal events and outdoor gatherings. Keep ceremonial attire immaculate and comfortable under current ambient conditions.`,
        badge: isRaining ? 'Monsoon Celebration' : 'Formal Event',
        badgeColor: 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20',
        upperBody: isCool || isCold 
          ? 'Embroidered bandhgala / formal suit with silk-cashmere pashmina shawl'
          : isVeryHot 
          ? 'Breathable raw silk or fine linen kurta / lightweight unlined summer blazer'
          : 'Crisp formal dress shirt with tailored celebration jacket or bandhgala',
        lowerBody: 'Tailored trousers or churidar in crease-resistant breathable twill',
        footwear: 'Polished formal leather dress shoes, oxfords, or handcrafted juttis with non-slip sole pads',
        accessories: [
          'High-end compact umbrella that matches formal palette',
          'Emergency stain remover wipe / garment tape',
          'Sleek dress watch and pocket square'
        ],
        weatherTip: isRaining 
          ? 'Hold hem of long kurtas/gowns while traversing outdoor lawn pathways to prevent grass stains.'
          : 'Keep a handheld battery fan or paper hand fan for outdoor marquee ceremonies.'
      };
    }

    // -------------------------------------------------------------
    // 9. CASUAL (Default Everyday Streetwear)
    // -------------------------------------------------------------
    if (isHeavyRain) {
      return {
        profileTitle: 'Casual Everyday Profile',
        headline: 'Heavy Downpour: Waterproof Jacket & Sturdy Umbrella',
        summary: `Torrential downpour. Wear waterproof outer layers and water-shedding shoes to stay dry.`,
        badge: 'Heavy Rain Alert',
        badgeColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
        upperBody: 'Waterproof hooded rain jacket or durable rain poncho over comfortable cotton tee',
        lowerBody: 'Quick-dry synthetic joggers or dark jeans with rolled-up cuffs',
        footwear: 'Waterproof rain boots, gumboots, or water-resistant sneakers',
        accessories: [
          'Large windproof umbrella',
          'Waterproof daypack cover',
          'Zip pouch for phone & wallet'
        ],
        weatherTip: 'Darker pants prevent visible splash stains from puddle droplets.'
      };
    }
    if (isRaining) {
      return {
        profileTitle: 'Casual Everyday Profile',
        headline: 'Carry an Umbrella & Pick Quick-Dry Fabrics',
        summary: `Light rain and scattered showers. Keep comfortable with quick-drying layers and an umbrella.`,
        badge: 'Showers Expected',
        badgeColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
        upperBody: 'Comfortable cotton-poly blend tee with lightweight water-repellent jacket',
        lowerBody: 'Dark casual denim or stretch chinos',
        footwear: 'Water-resistant closed sneakers or rubber-sole casual loafers',
        accessories: [
          'Compact folding umbrella',
          'Water-repellent tote bag or sling'
        ],
        weatherTip: 'Keep a compact umbrella in your everyday bag even if clouds look scattered.'
      };
    }
    if (isVeryHot) {
      return {
        profileTitle: 'Casual Everyday Profile',
        headline: 'Breezy Cotton Tee & UV Sun Protection',
        summary: `Hot weather (${temperatureC}°C). Loose, light-colored fabrics reflect heat and allow ventilation.`,
        badge: 'Hot & Sunny',
        badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        upperBody: 'Loose cotton t-shirt, breezy linen shirt, or airy short-sleeve polo',
        lowerBody: 'Relaxed cotton shorts, linen trousers, or lightweight joggers',
        footwear: 'Open airy sandals, sliders, or lightweight canvas sneakers',
        accessories: [
          'UV-blocking sunglasses',
          'Wide-brim sun cap or cotton bandana',
          'SPF 50 sunscreen'
        ],
        weatherTip: 'Light colors reflect solar heat while dark fabrics absorb infrared radiation.'
      };
    }
    if (isCold || isCool) {
      return {
        profileTitle: 'Casual Everyday Profile',
        headline: 'Warm Knitwear, Flannel & Insulated Outerwear',
        summary: `Cold weather (${temperatureC}°C). Layer warm knitwear with an insulated jacket.`,
        badge: isCold ? 'Winter Weather' : 'Chilly Weather',
        badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        upperBody: 'Thermal inner wear with warm hoodie, fleece sweater, or puffer jacket',
        lowerBody: 'Heavy denim jeans or fleece-lined sweatpants',
        footwear: 'Insulated casual boots or leather sneakers with warm socks',
        accessories: [
          'Woolen beanie or cap',
          'Warm muffler or scarf',
          'Touchscreen gloves'
        ],
        weatherTip: 'Multiple light layers trap warm air better than a single heavy overcoat.'
      };
    }
    // Pleasant casual
    return {
      profileTitle: 'Casual Everyday Profile',
      headline: 'Effortless Everyday Layers & Classic Casuals',
      summary: `Pleasant ${temperatureC}°C. Ideal weather for favorite denim, light overshirts, and clean sneakers.`,
      badge: 'Pleasant & Mild',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      upperBody: 'Classic cotton tee with open flannel, denim jacket, or lightweight cardigan',
      lowerBody: 'Classic denim jeans or comfortable twill chinos',
      footwear: 'Clean lifestyle sneakers or casual slip-ons',
      accessories: [
        'Minimalist sunglasses',
        'Everyday backpack or crossbody sling'
      ],
      weatherTip: 'Great day for outdoor errands or strolls; take a light layer for evening breezes.'
    };
  }, [activeProfile, temperatureC, effFeelsLike, isRaining, isHeavyRain, isVeryHot, isCold, isCool, humidityPct, windSpeedKmh, uvIndex, rainfallMm]);

  return (
    <section className={`p-5 sm:p-7 rounded-3xl backdrop-blur-xl shadow-xl transition-all border ${
      theme === 'light'
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-md'
        : 'bg-slate-900/90 border-white/10 text-white shadow-xl'
    }`}>
      {/* Header with Title and Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${
            isRaining 
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400' 
              : isVeryHot 
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
          }`}>
            {isRaining ? (
              <Umbrella className="w-5 h-5 animate-pulse" />
            ) : (
              <Shirt className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Smart Outfit Suggester
              </h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${outfit.badgeColor}`}>
                {outfit.badge}
              </span>
            </div>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Adaptive clothing intelligence tailored specifically to your active activity &amp; weather
            </p>
          </div>
        </div>

        {/* Active Profile Pill Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
            theme === 'light' 
              ? 'bg-slate-100 border-slate-200 text-slate-700' 
              : 'bg-slate-950/80 border-white/10 text-cyan-300'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{outfit.profileTitle}</span>
          </span>
        </div>
      </div>

      {/* Profile Selector Strip: Tap any profile to view its dedicated wardrobe intelligence */}
      <div className="pt-3.5 pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Select Persona Profile:
          </span>
          <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
            {PROFILE_CONFIGS.length} Profiles Available
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {PROFILE_CONFIGS.map((cfg) => {
            const Icon = cfg.icon;
            const isSelected = activeProfile === cfg.id;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => setActiveProfile(cfg.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                  isSelected
                    ? theme === 'light'
                      ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                      : 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold shadow-md'
                    : theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
                    : 'bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-white border-white/[0.08]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? (theme === 'light' ? 'text-white' : 'text-slate-950') : 'text-slate-400'}`} />
                <span>{cfg.label}</span>
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Recommendation Highlight Box */}
      <div className="pt-3 space-y-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={`text-lg sm:text-xl font-extrabold tracking-tight ${
              isRaining 
                ? (theme === 'light' ? 'text-cyan-800' : 'text-cyan-400')
                : (theme === 'light' ? 'text-slate-900' : 'text-white')
            }`}>
              {outfit.headline}
            </span>
          </div>
          <p className={`text-xs sm:text-sm leading-relaxed ${
            theme === 'light' ? 'text-slate-700' : 'text-slate-300'
          }`}>
            {outfit.summary}
          </p>
        </div>

        {/* Core Clothing Grid: Upper, Lower, Footwear, Essentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Upper Body Card */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            theme === 'light' 
              ? 'bg-slate-50/90 border-slate-200 shadow-xs' 
              : 'bg-slate-950/50 border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Shirt className="w-4 h-4 text-cyan-500 shrink-0" />
              <span className={`text-xs font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Upper Body
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-snug">
              {outfit.upperBody}
            </p>
          </div>

          {/* Lower Body Card */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            theme === 'light' 
              ? 'bg-slate-50/90 border-slate-200 shadow-xs' 
              : 'bg-slate-950/50 border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-teal-500 shrink-0" />
              <span className={`text-xs font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Lower Body
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-snug">
              {outfit.lowerBody}
            </p>
          </div>

          {/* Footwear Card */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            theme === 'light' 
              ? 'bg-slate-50/90 border-slate-200 shadow-xs' 
              : 'bg-slate-950/50 border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Footprints className="w-4 h-4 text-amber-500 shrink-0" />
              <span className={`text-xs font-bold uppercase tracking-wider ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Footwear
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-snug">
              {outfit.footwear}
            </p>
          </div>

          {/* Essentials & Accessories */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isRaining 
              ? (theme === 'light' ? 'bg-cyan-50 border-cyan-300' : 'bg-cyan-950/40 border-cyan-500/30')
              : (theme === 'light' ? 'bg-slate-50/90 border-slate-200 shadow-xs' : 'bg-slate-950/50 border-white/[0.08]')
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              {isRaining ? (
                <Umbrella className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              ) : (
                <Glasses className="w-4 h-4 text-purple-500 shrink-0" />
              )}
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isRaining ? 'text-cyan-700 dark:text-cyan-300' : (theme === 'light' ? 'text-slate-600' : 'text-slate-400')
              }`}>
                Must-Haves &amp; Gear
              </span>
            </div>
            <ul className="text-xs space-y-1.5 font-medium">
              {outfit.accessories.map((acc, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-cyan-500 shrink-0">•</span>
                  <span>{acc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Weather Context Bar & Practical Tip */}
        <div className={`p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border ${
          theme === 'light'
            ? 'bg-slate-100/80 border-slate-200 text-slate-800'
            : 'bg-slate-950/40 border-white/[0.06] text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{outfit.weatherTip}</span>
          </div>

          {/* Weather factor metrics strip */}
          <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono font-medium">
            <span className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{temperatureC}°C</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              <span>{rainfallMm > 0 ? `${rainfallMm} mm rain` : `${humidityPct}% hum`}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-slate-400" />
              <span>{windSpeedKmh} km/h</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
