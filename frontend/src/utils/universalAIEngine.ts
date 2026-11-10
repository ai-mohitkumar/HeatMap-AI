/**
 * HeatShield AI — Universal Biometeorological & Safety Intelligence Engine
 * 
 * Supports:
 * 1. ANY Location across India (46 synoptic stations, all 787 districts, 36 states/UTs, and ~650k villages via IDW).
 * 2. Cross-location comparative queries (e.g. "Delhi vs Mumbai", "Is Jaipur hotter than Patna?").
 * 3. Comprehensive Multi-Domain Question Answering:
 *    - Sports, workouts, cardio, school schedules
 *    - Vulnerable groups (infants, pregnancy, elderly, chronic illness, pets & cattle)
 *    - Occupational safety (OSHA/NIOSH work/rest cycles, hydration per hour)
 *    - Clinical triage (heat exhaustion vs stroke, medications, emergency cooling)
 *    - Nutrition & traditional cooling (ORS recipe, Sattu, Chaas, Aam Panna)
 *    - Home cooling & energy efficiency (desert coolers vs AC, wet curtains)
 *    - Atmospheric biometeorology (wet-bulb 35°C limit, Rothfusz Heat Index, humidity traps)
 *    - Emergency response & civil defense (108 Ambulance, 1077 NDMA)
 *    - General conversational and safety queries
 */

import { OFFLINE_STATIONS } from './offlineEngine';
import {
  ALL_INDIA_DISTRICTS,
  ALL_INDIA_STATES,
  searchVillagesAndDistricts,
  evaluateLocationHeat
} from './indiaGeoStore';

export interface LocationTelemetry {
  name: string;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windKmh: number;
  dewPointC: number;
  riskTier: string;
  peakDangerWindow: string;
  source: 'synoptic_station' | 'idw_spatial_interpolation';
}

export interface UniversalAIResponse {
  query: string;
  location: LocationTelemetry;
  answer: string;
  markdown: string;
  title: string;
  category: string;
  tier: string;
  riskTier: string;
  actionSuggestion: string;
  keyDirectives: string[];
  resolvedLocations?: LocationTelemetry[];
}

export type FallbackLocationInput = string | {
  name?: string;
  lat?: number;
  lon?: number;
  tempC?: number;
  feelsLikeC?: number;
  humidity?: number;
  windKmh?: number;
  riskTier?: string;
};

export function normalizeFallbackLocation(fallback?: FallbackLocationInput): {
  name: string;
  lat?: number;
  lon?: number;
  tempC?: number;
  feelsLikeC?: number;
  humidity?: number;
  windKmh?: number;
  riskTier?: string;
} {
  if (typeof fallback === 'string') {
    const q = fallback.trim().toLowerCase();
    const st = OFFLINE_STATIONS.find(
      s => s.station_id === fallback || s.station_name.toLowerCase().includes(q)
    ) || OFFLINE_STATIONS[0];
    return {
      name: st.station_name,
      lat: st.latitude,
      lon: st.longitude,
      tempC: st.temperature_c,
      feelsLikeC: st.heat_index_c,
      humidity: Math.round(st.relative_humidity_pct),
      riskTier: st.vulnerability_tier
    };
  }
  const f = fallback || {};
  return {
    name: f.name || 'Your Location',
    lat: f.lat,
    lon: f.lon,
    tempC: f.tempC,
    feelsLikeC: f.feelsLikeC,
    humidity: f.humidity,
    windKmh: f.windKmh,
    riskTier: f.riskTier
  };
}

/**
 * Extracts and resolves location(s) mentioned in a freeform user query.
 * If no location is mentioned, falls back to the current active session telemetry.
 */
export function extractAndResolveLocations(
  query: string,
  rawFallback?: FallbackLocationInput
): LocationTelemetry[] {
  const fallbackLocation = normalizeFallbackLocation(rawFallback);
  const qLower = query.toLowerCase();
  const matchedLocations: LocationTelemetry[] = [];
  const seenBaseCities = new Set<string>();

  const getBaseCity = (name: string): string => {
    return name
      .split(',')[0]
      .toLowerCase()
      .replace(/^new\s+/, '')
      .replace(/^central\s+/, '')
      .replace(/^north\s+/, '')
      .replace(/^south\s+/, '')
      .replace(/^east\s+/, '')
      .replace(/^west\s+/, '')
      .trim();
  };

  const addLocation = (loc: LocationTelemetry) => {
    const base = getBaseCity(loc.name);
    if (!seenBaseCities.has(base)) {
      seenBaseCities.add(base);
      matchedLocations.push(loc);
    }
  };

  // 0. Known common Indian aliases (Delhi, Bombay, Bangalore, Calcutta, Madras, etc.)
  const COMMON_ALIASES: Record<string, string> = {
    delhi: 'New Delhi',
    bombay: 'Mumbai',
    bangalore: 'Bengaluru',
    calcutta: 'Kolkata',
    madras: 'Chennai',
    vizag: 'Visakhapatnam',
    trichy: 'Tiruchirappalli',
    cochin: 'Kochi',
    trivandrum: 'Thiruvananthapuram',
    banaras: 'Varanasi',
    kashi: 'Varanasi',
    baroda: 'Vadodara',
    gurgaon: 'Gurugram'
  };

  for (const [alias, canonical] of Object.entries(COMMON_ALIASES)) {
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(qLower)) {
      const st = OFFLINE_STATIONS.find(s => s.station_name.toLowerCase().includes(canonical.toLowerCase()));
      if (st) {
        addLocation({
          name: `${st.station_name}, IN`,
          tempC: st.temperature_c,
          feelsLikeC: st.heat_index_c,
          humidityPct: Math.round(st.relative_humidity_pct),
          windKmh: 12,
          dewPointC: st.dew_point_c,
          riskTier: st.vulnerability_tier,
          peakDangerWindow: st.peak_danger_window || '11:30 AM – 4:00 PM',
          source: 'synoptic_station'
        });
      }
    }
  }

  // 1. Check against 46 synoptic stations
  for (const st of OFFLINE_STATIONS) {
    const stNameLower = st.station_name.toLowerCase();
    const regex = new RegExp(`\\b${stNameLower}\\b`, 'i');
    if (regex.test(qLower)) {
      addLocation({
        name: `${st.station_name}, IN`,
        tempC: st.temperature_c,
        feelsLikeC: st.heat_index_c,
        humidityPct: Math.round(st.relative_humidity_pct),
        windKmh: 12,
        dewPointC: st.dew_point_c,
        riskTier: st.vulnerability_tier,
        peakDangerWindow: st.peak_danger_window || '11:30 AM – 4:00 PM',
        source: 'synoptic_station'
      });
    }
  }

  // 2. Check against All India Districts
  for (const dist of ALL_INDIA_DISTRICTS) {
    const distLower = dist.district_name.toLowerCase();
    const regex = new RegExp(`\\b${distLower}\\b`, 'i');
    if (regex.test(qLower)) {
      try {
        const idw = evaluateLocationHeat(dist.latitude, dist.longitude);
        addLocation({
          name: `${dist.district_name}, ${dist.state_name}`,
          tempC: idw.weather.temperature,
          feelsLikeC: idw.weather.feels_like,
          humidityPct: idw.weather.humidity,
          windKmh: Math.round(idw.weather.wind_speed),
          dewPointC: idw.weather.dew_point,
          riskTier: idw.prediction.risk_level,
          peakDangerWindow: '11:30 AM – 4:00 PM',
          source: 'idw_spatial_interpolation'
        });
      } catch {
        // Continue
      }
    }
  }

  // 3. Check against States / UTs
  for (const st of ALL_INDIA_STATES) {
    const stateLower = st.state_name.toLowerCase();
    const regex = new RegExp(`\\b${stateLower}\\b`, 'i');
    if (regex.test(qLower)) {
      try {
        const idw = evaluateLocationHeat(st.latitude, st.longitude);
        addLocation({
          name: `${st.state_name}, India`,
          tempC: idw.weather.temperature,
          feelsLikeC: idw.weather.feels_like,
          humidityPct: idw.weather.humidity,
          windKmh: Math.round(idw.weather.wind_speed),
          dewPointC: idw.weather.dew_point,
          riskTier: idw.prediction.risk_level,
          peakDangerWindow: '11:30 AM – 4:00 PM',
          source: 'idw_spatial_interpolation'
        });
      } catch {
        // Continue
      }
    }
  }

  // 4. If query specifically has words like "village", "town", or hasn't matched anything yet, fuzzy match
  if (matchedLocations.length === 0) {
    const geoMatches = searchVillagesAndDistricts(query, 2);
    if (geoMatches.length > 0) {
      const g = geoMatches[0];
      try {
        const idw = evaluateLocationHeat(g.latitude, g.longitude);
        addLocation({
          name: g.hierarchy || `${g.name}, ${g.district_name}`,
          tempC: idw.weather.temperature,
          feelsLikeC: idw.weather.feels_like,
          humidityPct: idw.weather.humidity,
          windKmh: Math.round(idw.weather.wind_speed),
          dewPointC: idw.weather.dew_point,
          riskTier: idw.prediction.risk_level,
          peakDangerWindow: '11:30 AM – 4:00 PM',
          source: 'idw_spatial_interpolation'
        });
      } catch {
        // Continue
      }
    }
  }

  // 5. Fallback to active session location if no specific location was extracted
  if (matchedLocations.length === 0) {
    let t = fallbackLocation.tempC ?? 35.0;
    let fl = fallbackLocation.feelsLikeC ?? 38.0;
    let rh = fallbackLocation.humidity ?? 45;
    let w = fallbackLocation.windKmh ?? 12;
    let r = fallbackLocation.riskTier ?? 'High';

    if (fallbackLocation.lat && fallbackLocation.lon && (!fallbackLocation.tempC || !fallbackLocation.feelsLikeC)) {
      try {
        const idw = evaluateLocationHeat(fallbackLocation.lat, fallbackLocation.lon);
        t = idw.weather.temperature;
        fl = idw.weather.feels_like;
        rh = idw.weather.humidity;
        w = Math.round(idw.weather.wind_speed);
        r = idw.prediction.risk_level;
      } catch {
        // Keep fallback
      }
    }

    addLocation({
      name: fallbackLocation.name || 'Your Current Location',
      tempC: t,
      feelsLikeC: fl,
      humidityPct: rh,
      windKmh: w,
      dewPointC: Math.round(t - ((100 - rh) / 5)),
      riskTier: r,
      peakDangerWindow: '11:30 AM – 4:00 PM',
      source: 'synoptic_station'
    });
  }

  return matchedLocations;
}

/**
 * Universal Natural Language Biometeorological Response Generator
 */
export function answerHeatSafetyQuery(
  rawQuery: string,
  rawFallback?: FallbackLocationInput
): UniversalAIResponse {
  const query = rawQuery.trim();
  const q = query.toLowerCase();
  const locations = extractAndResolveLocations(query, rawFallback);
  const loc = locations[0];

  const currentHour = new Date().getHours();
  const isMidday = currentHour >= 11 && currentHour <= 16;
  const isNight = currentHour >= 20 || currentHour <= 5;

  let answer = '';
  let title = `HeatShield Biometeorological Telemetry (${loc.name})`;
  let category = 'general_telemetry';
  let riskTier = loc.riskTier;
  let actionSuggestion = 'Stay hydrated and monitor local heat advisory.';
  const keyDirectives: string[] = [];

  // ─────────────────────────────────────────────────────────────
  // 1. COMPARATIVE QUERIES (Location A vs Location B)
  // ─────────────────────────────────────────────────────────────
  if (locations.length >= 2 || (locations.length >= 1 && (q.includes(' vs ') || q.includes('compare') || q.includes('hotter than') || q.includes('cooler than')))) {
    title = 'Biometeorological Location Comparison';
    category = 'comparative_analysis';
    if (locations.length >= 2) {
      const locA = locations[0];
      const locB = locations[1];
      const hotter = locA.feelsLikeC >= locB.feelsLikeC ? locA : locB;
      const cooler = locA.feelsLikeC < locB.feelsLikeC ? locA : locB;
      const diff = Math.abs(locA.feelsLikeC - locB.feelsLikeC).toFixed(1);

      answer = `📊 **Biometeorological Comparison: ${locA.name} vs ${locB.name}**\n\n` +
        `• **${locA.name}:** Ambient ${locA.tempC}°C | Heat Index **${locA.feelsLikeC}°C** | Humidity ${locA.humidityPct}% | Status: **${locA.riskTier}**\n` +
        `• **${locB.name}:** Ambient ${locB.tempC}°C | Heat Index **${locB.feelsLikeC}°C** | Humidity ${locB.humidityPct}% | Status: **${locB.riskTier}**\n\n` +
        `🔥 **Verdict:** **${hotter.name}** is facing significantly higher physiological thermal stress (+${diff}°C higher Heat Index) than ${cooler.name}. ` +
        (hotter.humidityPct > 60
          ? `In ${hotter.name}, high relative humidity (${hotter.humidityPct}%) creates a moisture trap that impairs sweat evaporation, making it hazardous for outdoor activities.`
          : `In ${hotter.name}, intense dry-bulb temperatures demand strict solar protection and continuous shaded rest cycles.`);

      riskTier = hotter.riskTier;
      actionSuggestion = `Prioritize heat defenses in ${hotter.name} (+${diff}°C higher heat index).`;
      keyDirectives.push(`Higher thermal load in ${hotter.name}`, `Follow peak danger precautions (11:30 AM – 4:00 PM)`);

      return {
        query,
        location: loc,
        answer,
        markdown: answer,
        title,
        category,
        tier: riskTier,
        riskTier,
        actionSuggestion,
        keyDirectives,
        resolvedLocations: locations
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SPORTS & OUTDOOR ACTIVITIES (Cricket, Running, Gym, Walking)
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('cricket') || q.includes('football') || q.includes('sports') ||
    q.includes('match') || q.includes('play') || q.includes('game') ||
    q.includes('badminton') || q.includes('tennis') || q.includes('basketball')
  ) {
    const isPeakTime = q.includes('2 pm') || q.includes('1 pm') || q.includes('3 pm') || q.includes('12 pm') || q.includes('noon') || q.includes('afternoon');
    if (isPeakTime || (isMidday && !q.includes('morning') && !q.includes('evening'))) {
      answer = `🔴 **CRICKET & OUTDOOR SPORTS WARNING in ${loc.name}**\n\n` +
        `Playing intense outdoor sports during midday (11:30 AM – 4:00 PM) in ${loc.name} is **HIGHLY DANGEROUS**. Current Ambient is ${loc.tempC}°C with a Heat Index of **${loc.feelsLikeC}°C** (${loc.riskTier} Risk).\n\n` +
        `• **Why it's hazardous:** Running and bowling in direct sunlight raises internal core metabolic heat by 400–600W. Under ${loc.feelsLikeC}°C thermal index, sweat cannot evaporate fast enough to cool vital organs, leading to rapid heat exhaustion or cardiovascular collapse.\n` +
        `• **Recommended Action:** Reschedule matches to **early morning (6:00 AM – 8:30 AM)** or **after 6:00 PM** under ground floodlights.\n` +
        `• **If you must play:** Enforce mandatory 5-minute shade & hydration timeouts every 20 minutes with ORS or salted lemon water.`;
      actionSuggestion = 'Postpone matches to before 8:30 AM or after 6:00 PM.';
      keyDirectives.push('Mandatory 20-min hydration timeouts', 'Avoid midday solar radiation window');
    } else {
      answer = `⚡ **SPORTS SAFETY GUIDANCE for ${loc.name}**\n\n` +
        `Outdoor sports are manageable in the early morning (6:00 AM – 8:30 AM) or after 6:30 PM. Current baseline is ${loc.tempC}°C (Feels like ${loc.feelsLikeC}°C).\n\n` +
        `• Drink 400 ml of water 30 minutes before starting.\n` +
        `• Wear breathable white or light-colored cotton clothing.\n` +
        `• Stop immediately if any player experiences muscle spasms, nausea, or tunnel vision.`;
      actionSuggestion = 'Safe for morning or dusk play with frequent hydration breaks.';
      keyDirectives.push('Pre-hydrate with 400ml water', 'Stop play on first signs of muscle fatigue');
    }
  }

  else if (
    (q.includes('run') || q.includes('jog') || q.includes('walk') || q.includes('exercise') || q.includes('gym') || q.includes('workout')) &&
    !q.includes('pregnant') && !q.includes('pregnancy') && !q.includes('expecting') &&
    !q.includes('baby') && !q.includes('infant') && !q.includes('child') &&
    !q.includes('elderly') && !q.includes('senior') &&
    !q.includes('pet') && !q.includes('dog') && !q.includes('animal') &&
    !q.includes('worker') && !q.includes('labor')
  ) {
    answer = `🏃 **FITNESS & EXERCISE PROTOCOL for ${loc.name}**\n\n` +
      `Current conditions: Ambient **${loc.tempC}°C**, Heat Index **${loc.feelsLikeC}°C**, Humidity **${loc.humidityPct}%** (${loc.riskTier} Risk).\n\n` +
      `• **Optimal Running Window:** **5:30 AM – 7:30 AM**. Asphalt and concrete retain radiant heat long into the night; morning ground temperatures are 4–6°C cooler than evening roads.\n` +
      `• **Evening Running:** Wait until at least 7:30 PM to avoid urban heat island tarmac radiation.\n` +
      `• **Hydration Rate:** Consume 200–250 ml of electrolyte fluids every 20 minutes of steady cardio.\n` +
      `• **Heart Rate Monitoring:** Your cardiovascular system works 15–20% harder in heat to pump blood to skin for cooling. Reduce target pace by 15–20 seconds/km.`;
    actionSuggestion = 'Exercise between 5:30 AM – 7:30 AM; avoid tarmac runs in afternoon.';
    keyDirectives.push('Optimal window: 5:30 AM – 7:30 AM', 'Reduce cardio pace by 15%', 'Electrolytes every 20 mins');
  }

  else if (q.includes('swim') || q.includes('pool')) {
    answer = `🏊 **SWIMMING & WATER RECREATION in ${loc.name}**\n\n` +
      `Current thermal load: ${loc.tempC}°C (Feels like ${loc.feelsLikeC}°C).\n\n` +
      `• **Caution:** While water feels cool, outdoor pools reflect intense UV radiation (UV Index ~${loc.tempC > 40 ? 9 : 7}).\n` +
      `• **Dehydration Illusion:** Swimmers sweat underwater without noticing fluid loss. Drink clean water before and after swimming.\n` +
      `• **Best Hours:** Before 10:00 AM or after 5:30 PM to avoid severe sunburn and thermal rebound.`;
    actionSuggestion = 'Swim before 10 AM or after 5:30 PM with water-resistant sunscreen.';
    keyDirectives.push('Hydrate despite being in water', 'High UV reflection caution');
  }

  // ─────────────────────────────────────────────────────────────
  // 3. VULNERABLE POPULATIONS (Babies, Pregnancy, Elderly, Pets)
  // ─────────────────────────────────────────────────────────────
  else if (q.includes('baby') || q.includes('infant') || q.includes('toddler') || q.includes('child') || q.includes('kids') || q.includes('stroller')) {
    answer = `👶 **PEDIATRIC HEAT SAFETY DIRECTIVE for ${loc.name}**\n\n` +
      `Current Heat Index: **${loc.feelsLikeC}°C** (${loc.riskTier} Risk). Infants and young children are at acute risk because their sweating mechanisms are underdeveloped and their bodies heat up 3 to 5 times faster than adults.\n\n` +
      `• **Stroller Alert:** NEVER drape blankets or thick muslins over strollers. Tests show closed strollers heat up like greenhouses, exceeding 50°C in under 20 minutes.\n` +
      `• **Vehicles:** NEVER leave a child unattended in a parked car, even with windows cracked. Internal cabin temperatures reach fatal levels in 10 minutes.\n` +
      `• **Hydration:** Offer breastmilk, formula, or boiled cooled water frequently. Check wet diapers (at least 6 per 24 hours).\n` +
      `• **Warning Signs:** Sunken soft spot (fontanelle), dry tongue, no tears when crying, excessive lethargy, or flushed hot skin. Cool with lukewarm (not freezing) water sponge bath.`;
    riskTier = 'Extreme';
    actionSuggestion = 'Keep infants in cool indoors; never cover strollers with blankets.';
    keyDirectives.push('Never leave children in cars', 'Never drape blankets over strollers', 'Offer fluids frequently');
  }

  else if (q.includes('pregnant') || q.includes('pregnancy') || q.includes('expecting')) {
    answer = `🤰 **MATERNAL HEALTH & PREGNANCY HEAT DEFENSE in ${loc.name}**\n\n` +
      `Current Conditions: Ambient **${loc.tempC}°C**, Heat Index **${loc.feelsLikeC}°C**.\n\n` +
      `• **Thermoregulation:** Pregnancy increases basal metabolic rate and core temperature. Core temp exceeding 39°C (102.2°F) increases risks of preterm labor, maternal exhaustion, and developmental stress.\n` +
      `• **Hydration Target:** At least 2.5 to 3.5 liters daily. Dehydration releases oxytocin-like hormones that can trigger premature uterine contractions.\n` +
      `• **Swelling & Edema:** Elevate legs when resting to counter venous blood pooling worsened by vasodilating ambient heat.\n` +
      `• **Stay Indoors:** Avoid outdoor walking or errands between 11:00 AM and 4:30 PM. Rest in cross-ventilated rooms with fans or cooling units.`;
    actionSuggestion = 'Drink 3L+ water; avoid midday errands and rest with legs elevated.';
    keyDirectives.push('Target 3L fluid intake', 'Elevate feet during rest', 'Avoid 11 AM - 4:30 PM exposure');
  }

  else if (q.includes('elderly') || q.includes('grandparent') || q.includes('old age') || q.includes('senior') || q.includes('heart patient') || q.includes('bp') || q.includes('blood pressure')) {
    answer = `👵 **SENIOR CITIZEN & CARDIAC CARE DIRECTIVE for ${loc.name}**\n\n` +
      `Current Heat Index: **${loc.feelsLikeC}°C** in ${loc.name} (${loc.riskTier} Risk).\n\n` +
      `• **Blunted Thirst Reflex:** Adults over 65 have reduced thirst sensitivity. Seniors must drink water on a clock schedule (1 glass every hour), even if they do not feel thirsty.\n` +
      `• **Medication Interactions:** Blood pressure drugs (ACE inhibitors, beta-blockers) and diuretics (water pills) impair normal thermal balance and can trigger sudden postural hypotension (fainting when standing up).\n` +
      `• **Cooling Support:** If room temperature exceeds 32°C, electric fans alone may circulate hot air like a convection oven. Place a shallow pan of ice water in front of the fan, or sponge forehead, neck, and arms with damp towels.\n` +
      `• **Welfare Check:** Family members should check on elderly relatives at least twice daily.`;
    actionSuggestion = 'Drink water on a fixed hourly schedule; monitor blood pressure.';
    keyDirectives.push('Hourly water schedule', 'Fan + damp cloth technique', 'Check twice daily');
  }

  else if (q.includes('pet') || q.includes('dog') || q.includes('cat') || q.includes('animal') || q.includes('cow') || q.includes('cattle') || q.includes('buffalo') || q.includes('livestock')) {
    answer = `🐾 **ANIMAL & LIVESTOCK WELFARE PROTOCOL for ${loc.name}**\n\n` +
      `Current Surface Thermal Conditions: ${loc.tempC}°C (Feels like ${loc.feelsLikeC}°C).\n\n` +
      `• **Asphalt Paw Burns:** When air temperature is 35°C, dark asphalt tarmac reaches **52°C to 60°C**! Place the back of your hand on the pavement for 7 seconds. If too hot for your hand, it will blister your dog's paw pads. Walk pets only before 7:30 AM or after 7:30 PM.\n` +
      `• **Dogs & Heatstroke:** Dogs cannot sweat; they only cool by panting. Brachycephalic breeds (Pugs, Bulldogs) are at extreme risk. Symptoms: excessive dark red tongue, glassy eyes, staggering. Pour room-temperature water on their belly and paws.\n` +
      `• **Cattle & Farm Livestock:** High heat causes milk yield drops of 25–40%. Provide deep thatch shade, sprinkle water on cows 3 times daily, and ensure unlimited clean drinking water.`;
    actionSuggestion = 'Test road surface with 7-second hand test; walk pets at dawn or dusk.';
    keyDirectives.push('Asphalt reaches 55°C+ midday', 'Never leave pets in parked cars', 'Sprinkle cattle with water');
  }

  // ─────────────────────────────────────────────────────────────
  // 4. WORKER & OCCUPATIONAL SAFETY (NIOSH / OSHA)
  // ─────────────────────────────────────────────────────────────
  else if (
    q.includes('worker') || q.includes('labor') || q.includes('labour') ||
    q.includes('construction') || q.includes('farm') || q.includes('field') ||
    q.includes('shift') || q.includes('delivery') || q.includes('zomato') ||
    q.includes('swiggy') || q.includes('rickshaw') || q.includes('vendor')
  ) {
    let restCycle = '45 min work / 15 min rest';
    if (loc.feelsLikeC >= 45) {
      restCycle = '15 min work / 45 min shade rest per hour (Extreme)';
    } else if (loc.feelsLikeC >= 40) {
      restCycle = '30 min work / 30 min shade rest per hour (High)';
    }

    answer = `👷 **OCCUPATIONAL THERMAL SAFETY DIRECTIVE (OSHA / NIOSH) for ${loc.name}**\n\n` +
      `Current Heat Index: **${loc.feelsLikeC}°C** | Ambient: **${loc.tempC}°C** | Humidity: **${loc.humidityPct}%** (${loc.riskTier} Risk).\n\n` +
      `• **Mandatory Work/Rest Ratio:** **${restCycle}**. Heavy manual labor (carrying loads, digging, roofing, delivery riding) generates intense internal metabolic heat that cannot dissipate into ambient air.\n` +
      `• **Hydration Requirement:** Employers and contractors must provide at least **1 liter of cool drinking water per worker per hour** with ORS or salt replenishment.\n` +
      `• **Shift Optimization:** Shift heavy physical operations to early morning (5:00 AM – 10:30 AM) and evening (4:30 PM – 7:30 PM). Cease roofing and open-field work during peak sun.\n` +
      `• **Personal Protection:** Wear wide-brimmed cotton hats or wet gamcha head wraps, light-colored breathable clothing, and take breaks in deep canopy shade.`;
    actionSuggestion = `Enforce ${restCycle}; provide 1L cool water/hr per worker.`;
    keyDirectives.push(`Mandatory rest: ${restCycle}`, '1 Liter fluid per worker/hour', 'Wet gamcha/cotton headgear');
  }

  // ─────────────────────────────────────────────────────────────
  // 5. CLINICAL SYMPTOMS & MEDICAL TRIAGE (Exhaustion vs Stroke)
  // ─────────────────────────────────────────────────────────────
  else if (
    q.includes('dizzy') || q.includes('faint') || q.includes('headache') ||
    q.includes('vomit') || q.includes('nausea') || q.includes('stroke') ||
    q.includes('cramp') || q.includes('unconscious') || q.includes('emergency') ||
    q.includes('symptom') || q.includes('feeling hot') || q.includes('weakness')
  ) {
    const isEmergency = q.includes('unconscious') || q.includes('confusion') || q.includes('seizure') || q.includes('no sweat') || q.includes('stroke');
    if (isEmergency) {
      answer = `🚨 **LIFE-THREATENING HEATSTROKE EMERGENCY IN ${loc.name}**\n\n` +
        `This is a severe medical emergency. Core body temperature is likely exceeding 40°C (104°F) and cellular organ breakdown can occur within 30 minutes.\n\n` +
        `1. **CALL 108 AMBULANCE IMMEDIATELY.**\n` +
        `2. **Move to Coolest Shade or Air-Conditioned Space.**\n` +
        `3. **Rapid Active Cooling:** Apply ice packs or cold wet towels directly to the **neck, armpits, and groin** (major blood vessels pass close to skin surface here).\n` +
        `4. **Fan Vigorously & Sponge with Water.**\n` +
        `5. **NO Liquids if Semi-Conscious:** Choking hazard. Keep airway clear.`;
      riskTier = 'Extreme';
      actionSuggestion = 'Call 108 immediately; apply ice/cold towels to neck, armpits, groin.';
      keyDirectives.push('CALL 108 AMBULANCE', 'Ice packs on neck, armpits, groin', 'Do NOT force water if confused');
    } else {
      answer = `⚠️ **HEAT EXHAUSTION TRIAGE PROTOCOL for ${loc.name}**\n\n` +
        `Current Thermal Stress: Heat Index **${loc.feelsLikeC}°C**.\n\n` +
        `Symptoms like headache, dizziness, nausea, muscle cramps, and heavy sweating indicate early **Heat Exhaustion**.\n\n` +
        `• **Immediate Steps:** Stop all physical activity immediately. Lie down in an air-conditioned room or cool breeze, elevating legs slightly to restore blood flow to the brain.\n` +
        `• **Rehydrate:** Slowly sip cool water mixed with an ORS packet, lemon water with a pinch of salt, or coconut water.\n` +
        `• **Cool the Skin:** Place a cold wet towel on your forehead, back of the neck, and wrists.\n` +
        `• **When to Seek Hospital Care:** If vomiting persists, dizziness worsens after 30 minutes, or body temperature rises, call **108** immediately.`;
      actionSuggestion = 'Lie down in shade, elevate feet, sip ORS, and cool wrists and neck.';
      keyDirectives.push('Rest with feet elevated', 'Sip electrolyte/ORS solution', 'Call 108 if no improvement in 30 mins');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. NUTRITION, HYDRATION & HOME REMEDIES
  // ─────────────────────────────────────────────────────────────
  else if (
    q.includes('water') || q.includes('drink') || q.includes('hydrat') ||
    q.includes('ors') || q.includes('sattu') || q.includes('chaas') ||
    q.includes('aam panna') || q.includes('juice') || q.includes('diet') ||
    q.includes('food') || q.includes('eat')
  ) {
    const hourlyMl = loc.feelsLikeC >= 42 ? 500 : loc.feelsLikeC >= 38 ? 400 : 300;
    answer = `💧 **SCIENTIFIC HYDRATION & NUTRITION GUIDE for ${loc.name}**\n\n` +
      `Under current thermal stress (Heat Index **${loc.feelsLikeC}°C**, Humidity **${loc.humidityPct}%**):\n\n` +
      `• **Hydration Target:** Drink **${hourlyMl} ml of fluids per hour** while outdoors or active. Do not wait until you feel thirsty—thirst is a delayed sign of dehydration.\n` +
      `• **World Health Organization (WHO) Home ORS Recipe:** Dissolve **6 level teaspoons of sugar + 1/2 level teaspoon of salt** in **1 Liter of clean drinking water**.\n` +
      `• **Traditional Indian Cooling Superfoods:**\n` +
      `  - **Sattu Sharbat:** High protein, magnesium, and insoluble fiber provides steady stamina and cooling.\n` +
      `  - **Chaas (Buttermilk):** Natural probiotics and electrolytes restore sodium and potassium lost in sweat.\n` +
      `  - **Aam Panna (Raw Mango):** Rich in pectin, vitamin C, and organic acids to combat sunstroke.\n` +
      `  - **Coconut Water & Sabja (Basil) Seeds:** Natural isotonic hydration.\n` +
      `• **Foods to Avoid:** Heavy oily pakoras, deep-fried foods, high-protein red meats (creates high diet-induced thermogenesis), alcohol, and excessive caffeine.`;
    actionSuggestion = `Drink ${hourlyMl}ml/hr. Drink Chaas, Sattu, or ORS; avoid sodas.`;
    keyDirectives.push(`Target: ${hourlyMl}ml/hr`, 'WHO ORS: 6 tsp sugar + 1/2 tsp salt in 1L', 'Traditional drinks: Chaas, Sattu, Aam Panna');
  }

  // ─────────────────────────────────────────────────────────────
  // 7. HOUSEHOLD COOLING & ENERGY MANAGEMENT (AC, Cooler, Curtains)
  // ─────────────────────────────────────────────────────────────
  else if (
    q.includes('ac') || q.includes('cooler') || q.includes('fan') ||
    q.includes('curtain') || q.includes('roof') || q.includes('room') ||
    q.includes('house') || q.includes('sleep') || q.includes('night') ||
    q.includes('indoor')
  ) {
    const isCoolerEffective = loc.humidityPct < 55;
    const nightAdvice = isNight
      ? `• **Current Night Conditions:** It is currently night-time in ${loc.name}. Sleep on lower floors or well-ventilated spaces. Hang a damp cotton sheet in front of your fan to sleep comfortably without high AC costs.\n`
      : `• **Night Cooling Technique:** Hang a damp cotton sheet in front of a window or fan. As night air blows through, it chills the room naturally.\n`;
    answer = `🏠 **SMART HOUSEHOLD COOLING STRATEGY for ${loc.name}**\n\n` +
      `Current conditions: Temp **${loc.tempC}°C**, Humidity **${loc.humidityPct}%**.\n\n` +
      `• **Desert / Evaporative Coolers:** ${isCoolerEffective
        ? `✅ **Effective Today:** Ambient humidity is ${loc.humidityPct}%, so evaporative cooling works well. Keep windows opposite the cooler open for smooth exhaust airflow.`
        : `⚠️ **Ineffective / Muggy:** High humidity (${loc.humidityPct}%) prevents water evaporation. Coolers will make your room into a muggy moisture trap. Run the cooler fan on dry mode without the water pump, or switch to AC/dehumidifier.`}\n` +
      `• **Optimal AC Settings:** Set air conditioner to **24°C–26°C** and run a ceiling fan at low-medium speed. This circulating air drops effective temperature by 2°C while saving 20–25% electricity.\n` +
      `• **Daytime Solar Shield:** Draw dark curtains, bamboo blinds (chicks), or reflective window films across east and west windows between 9:00 AM and 5:00 PM to block radiant heat.\n` +
      nightAdvice;
    actionSuggestion = isCoolerEffective ? 'Run desert cooler with open exhaust window.' : 'Humidity is high; avoid water pump on cooler or use AC at 25°C.';
    keyDirectives.push('AC sweet spot: 24°C–26°C + fan', 'Draw curtains between 9 AM - 5 PM', 'Night: Damp sheet technique');
  }

  // ─────────────────────────────────────────────────────────────
  // 8. BIOMETEOROLOGY, WET-BULB & CLIMATE SCIENCE
  // ─────────────────────────────────────────────────────────────
  else if (
    q.includes('wet bulb') || q.includes('wet-bulb') || q.includes('dew point') ||
    q.includes('humidity') || q.includes('heat index') || q.includes('why so hot') ||
    q.includes('science') || q.includes('weather') || q.includes('forecast') ||
    q.includes('how hot') || q.includes('temperature') || q.includes('climate')
  ) {
    answer = `🌡️ **BIOMETEOROLOGICAL CLIMATE ANALYSIS for ${loc.name}**\n\n` +
      `• **Current Observations:** Dry-Bulb **${loc.tempC}°C** | Heat Index **${loc.feelsLikeC}°C** | Relative Humidity **${loc.humidityPct}%** | Dew Point **${loc.dewPointC}°C**.\n` +
      `• **Vulnerability Classification:** **${loc.riskTier} Risk** (${loc.source === 'synoptic_station' ? 'NOAA Synoptic Ground Station' : 'Continuous 4-Station IDW Spatial Interpolation'}).\n` +
      `• **The Wet-Bulb & Moisture Trap Effect:** When humidity reaches ${loc.humidityPct}%, moisture saturates the micro-boundary layer surrounding human skin. Sweat cannot evaporate, blocking the body's primary cooling mechanism. Even at ${loc.tempC}°C, the human cardiovascular system experiences stress equivalent to ${loc.feelsLikeC}°C.\n` +
      `• **Critical 35°C Wet-Bulb Limit:** Atmospheric science establishes 35°C wet-bulb temperature as the absolute physiological ceiling of human survivability, beyond which healthy adults succumb to hyperthermia within 6 hours without active cooling.\n` +
      `• **Peak Danger Window:** The highest diurnal solar exposure in ${loc.name} occurs from **${loc.peakDangerWindow}**.`;
    actionSuggestion = `Ambient ${loc.tempC}°C feels like ${loc.feelsLikeC}°C due to ${loc.humidityPct}% humidity. Stay protected.`;
    keyDirectives.push(`Dry-Bulb: ${loc.tempC}°C | Heat Index: ${loc.feelsLikeC}°C`, `Humidity Trap: ${loc.humidityPct}% RH`, `Peak Window: ${loc.peakDangerWindow}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 9. EMERGENCY NUMBERS & RESCUE HELPLINES
  // ─────────────────────────────────────────────────────────────
  else if (q.includes('helpline') || q.includes('number') || q.includes('ambulance') || q.includes('ndma') || q.includes('call') || q.includes('police')) {
    answer = `🚨 **VERIFIED NATIONAL EMERGENCY DIRECTORY for ${loc.name}**\n\n` +
      `Save these 24/7 toll-free emergency numbers for heat emergencies:\n\n` +
      `• **📞 108 — National Medical & Emergency Ambulance:** Dispatches trained paramedics equipped with cold saline IVs and oxygen.\n` +
      `• **📞 1077 — NDMA Disaster Control Room:** State and district disaster relief helpline for cooling shelters, drinking water crisis, and extreme heatwave declarations.\n` +
      `• **📞 112 — National Unified Emergency Number:** Connects directly to Police, Fire, and Emergency rescue.\n` +
      `• **📞 1070 — State Relief Commissioner Headquarters:** State disaster management coordination.`;
    actionSuggestion = 'Call 108 for medical ambulance; 1077 for disaster relief.';
    keyDirectives.push('Ambulance: 108', 'Disaster Relief: 1077', 'Unified Emergency: 112');
  }

  // ─────────────────────────────────────────────────────────────
  // 10. GENERAL / COMPREHENSIVE INTELLIGENCE FALLBACK
  // ─────────────────────────────────────────────────────────────
  else {
    answer = `☀️ **HeatShield AI Grounded Analysis for ${loc.name}**\n\n` +
      `**Current Atmospheric Telemetry:**\n` +
      `• **Ambient Temperature:** ${loc.tempC}°C\n` +
      `• **Physiological Heat Index:** **${loc.feelsLikeC}°C** (${loc.riskTier} Thermal Load)\n` +
      `• **Relative Humidity:** ${loc.humidityPct}% (Dew Point: ${loc.dewPointC}°C)\n` +
      `• **Convective Wind Flow:** ${loc.windKmh} km/h\n` +
      `• **Peak Danger Window:** **${loc.peakDangerWindow}**\n\n` +
      `**Key Safety Directives:**\n` +
      `1. **Hydration Target:** Consume 250–350 ml of water or ORS every 35–45 minutes during the day.\n` +
      `2. **Exposure Control:** Limit direct radiant solar exposure during peak hours (11:30 AM – 4:00 PM).\n` +
      `3. **Vulnerable Check:** Verify that children, elderly family members, and outdoor workers have access to shade and continuous fluids.\n` +
      `4. **Emergency Backup:** In case of sudden dizziness, fainting, or cessation of sweating, call **108** immediately.\n\n` +
      `*You can ask me any question about outdoor sports, work shifts, infant/pregnancy care, hydration, remedies, home cooling, or heat risk in any village, district, or state in India!*`;
    actionSuggestion = `Current Heat Index in ${loc.name} is ${loc.feelsLikeC}°C. Stay hydrated and avoid midday direct sun.`;
    keyDirectives.push(`Heat Index: ${loc.feelsLikeC}°C`, 'Peak Window: 11:30 AM – 4:00 PM', 'Hydrate every 35-45 minutes');
  }

  return {
    query,
    location: loc,
    answer,
    markdown: answer,
    title,
    category,
    tier: riskTier,
    riskTier,
    actionSuggestion,
    keyDirectives,
    resolvedLocations: locations
  };
}
