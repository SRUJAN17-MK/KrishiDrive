/**
 * Geocoding helpers.
 * Resolution pipeline:
 * 1. Direct coordinate strings ("lat, lng" or "lat,lng")
 * 2. Major Indian APMC mandi and agricultural hub dictionary (instant, zero-latency)
 * 3. Open-Meteo geocoding API (fast, free)
 * 4. OpenStreetMap Nominatim geocoding fallback (rural Indian villages, talukas, and gram panchayats)
 *
 * Results are cached in memory.
 */
'use strict';

const CITY_COORDS = {
  // Major Agricultural & APMC Hubs (Maharashtra)
  nashik: { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  vashi: { lat: 19.0771, lng: 72.9986, state: 'Maharashtra' },
  mumbai: { lat: 18.9220, lng: 72.8347, state: 'Maharashtra' },
  pune: { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  gultekdi: { lat: 18.4967, lng: 73.8683, state: 'Maharashtra' },
  lasalgaon: { lat: 20.1472, lng: 74.2274, state: 'Maharashtra' }, // Asia's largest onion mandi
  pimpalgaon: { lat: 20.1634, lng: 73.9851, state: 'Maharashtra' }, // Major tomato & onion market
  baramati: { lat: 18.1517, lng: 74.5777, state: 'Maharashtra' },
  nagpur: { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  aurangabad: { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  chhatrapati_sambhajinagar: { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  solapur: { lat: 17.6599, lng: 75.9064, state: 'Maharashtra' },
  kolhapur: { lat: 16.7050, lng: 74.2433, state: 'Maharashtra' },
  sangli: { lat: 16.8524, lng: 74.5815, state: 'Maharashtra' }, // Turmeric capital
  satara: { lat: 17.6805, lng: 74.0183, state: 'Maharashtra' },
  jalgaon: { lat: 21.0077, lng: 75.5626, state: 'Maharashtra' }, // Banana capital
  akola: { lat: 20.7002, lng: 77.0082, state: 'Maharashtra' },
  amravati: { lat: 20.9320, lng: 77.7523, state: 'Maharashtra' },
  latur: { lat: 18.4088, lng: 76.5604, state: 'Maharashtra' }, // Pulse/Soybean hub
  nanded: { lat: 19.1383, lng: 77.3210, state: 'Maharashtra' },
  dindori: { lat: 20.2014, lng: 73.8344, state: 'Maharashtra' },

  // Northern Agricultural Mandis (Punjab, Haryana, Delhi NCR, UP)
  delhi: { lat: 28.6139, lng: 77.2090, state: 'Delhi NCR' },
  azadpur: { lat: 28.7067, lng: 77.1772, state: 'Delhi NCR' }, // Asia's largest fruit & vegetable APMC
  ludhiana: { lat: 30.9010, lng: 75.8573, state: 'Punjab' },
  khanna: { lat: 30.7027, lng: 76.2206, state: 'Punjab' }, // Asia's largest grain market
  amritsar: { lat: 31.6340, lng: 74.8723, state: 'Punjab' },
  jalandhar: { lat: 31.3260, lng: 75.5762, state: 'Punjab' },
  chandigarh: { lat: 30.7333, lng: 76.7794, state: 'Haryana' },
  karnal: { lat: 29.6857, lng: 76.9905, state: 'Haryana' }, // Basmati hub
  panipat: { lat: 29.3909, lng: 76.9635, state: 'Haryana' },
  ambala: { lat: 30.3782, lng: 76.7767, state: 'Haryana' },
  rohtak: { lat: 28.8955, lng: 76.6066, state: 'Haryana' },
  hisar: { lat: 29.1492, lng: 75.7217, state: 'Haryana' },
  lucknow: { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  kanpur: { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
  varanasi: { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  agra: { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' },
  meerut: { lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh' },

  // Central & Western Mandis (Gujarat, Rajasthan, MP)
  ahmedabad: { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  surat: { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  unjha: { lat: 23.8052, lng: 72.3926, state: 'Gujarat' }, // Asia's biggest cumin/isabgol market
  rajkot: { lat: 22.3039, lng: 70.8022, state: 'Gujarat' },
  jaipur: { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  kota: { lat: 25.2138, lng: 75.8648, state: 'Rajasthan' },
  sri_ganganagar: { lat: 29.9038, lng: 73.8772, state: 'Rajasthan' },
  bhopal: { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  indore: { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' }, // Major soybean mandi
  ujjain: { lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh' },

  // Southern & Eastern Agricultural Hubs
  hyderabad: { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  warangal: { lat: 17.9689, lng: 79.5941, state: 'Telangana' }, // Chili market
  bangalore: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  bengaluru: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  hubli: { lat: 15.3647, lng: 75.1240, state: 'Karnataka' },
  guntur: { lat: 16.3067, lng: 80.4365, state: 'Andhra Pradesh' }, // Asia's largest chili market
  visakhapatnam: { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  chennai: { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  coimbatore: { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  madurai: { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  kochi: { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  kolkata: { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  patna: { lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  raipur: { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },
  ranchi: { lat: 23.3441, lng: 85.3096, state: 'Jharkhand' },
  guwahati: { lat: 26.1445, lng: 91.7362, state: 'Assam' }
};

const geocodeCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Checks if input is already a valid coordinate object or string like "19.9975, 73.7898".
 */
function parseDirectCoordinates(input) {
  if (!input) return null;
  if (typeof input === 'object' && input !== null) {
    const lat = Number(input.lat ?? input.latitude);
    const lng = Number(input.lng ?? input.lon ?? input.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        name: input.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat: Math.round(lat * 1e5) / 1e5,
        lng: Math.round(lng * 1e5) / 1e5,
        source: 'coordinates'
      };
    }
  }

  const str = String(input).trim();
  const coordRegex = /^[-+]?([0-8]?\d(?:\.\d+)?|90(?:\.0+)?)\s*,\s*[-+]?(180(?:\.0+)?|(?:1[0-7]\d|\d{1,2})(?:\.\d+)?)$/;
  const match = str.match(coordRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat: Math.round(lat * 1e5) / 1e5,
        lng: Math.round(lng * 1e5) / 1e5,
        source: 'coordinates'
      };
    }
  }
  return null;
}

function resolveLocal(placeStr) {
  if (!placeStr) return null;
  const direct = parseDirectCoordinates(placeStr);
  if (direct) return direct;

  const norm = String(placeStr).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const keys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const cleanKey = key.replace(/_/g, ' ');
    if (norm.includes(cleanKey)) {
      return {
        name: key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        lat: CITY_COORDS[key].lat,
        lng: CITY_COORDS[key].lng,
        state: CITY_COORDS[key].state,
        source: 'builtin'
      };
    }
  }
  return null;
}

/**
 * Geocode using Open-Meteo geocoding search
 */
async function queryOpenMeteo(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data.results && data.results[0];
    if (!hit) return null;
    return {
      name: hit.name,
      lat: Math.round(hit.latitude * 1e5) / 1e5,
      lng: Math.round(hit.longitude * 1e5) / 1e5,
      state: hit.admin1 || '',
      country: hit.country || '',
      source: 'open-meteo-geocoding'
    };
  } catch {
    return null;
  }
}

/**
 * Fallback to OpenStreetMap Nominatim for Indian villages, talukas, and gram panchayats
 */
async function queryNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'KrishiDrive-AgriPlatform/2.1 (contact@krishidrive.org)'
      }
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return null;
    const hit = list[0];
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      name: hit.name || hit.display_name?.split(',')[0]?.trim() || query,
      lat: Math.round(lat * 1e5) / 1e5,
      lng: Math.round(lng * 1e5) / 1e5,
      state: '',
      country: 'India',
      source: 'osm-nominatim'
    };
  } catch {
    return null;
  }
}

async function geocode(placeInput) {
  const direct = parseDirectCoordinates(placeInput);
  if (direct) return direct;

  const local = resolveLocal(placeInput);
  if (local) return local;

  const query = String(placeInput || '').trim();
  if (!query || query.length > 120) return null;

  const cacheKeyStr = query.toLowerCase();
  const cached = geocodeCache.get(cacheKeyStr);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  // 1. Try Open-Meteo with full query
  let result = await queryOpenMeteo(query);

  // 2. If query contains commas (e.g. "Pimpalgaon Baswant, Nashik"), try first part
  if (!result && query.includes(',')) {
    const primaryPart = query.split(',')[0].trim();
    if (primaryPart.length >= 3) {
      result = await queryOpenMeteo(primaryPart);
    }
  }

  // 3. Fallback to OpenStreetMap Nominatim (handles Indian villages & talukas well)
  if (!result) {
    result = await queryNominatim(query);
  }

  if (!result && query.includes(',')) {
    const primaryPart = query.split(',')[0].trim();
    if (primaryPart.length >= 3) {
      result = await queryNominatim(primaryPart);
    }
  }

  if (result) {
    geocodeCache.set(cacheKeyStr, { at: Date.now(), value: result });
  }

  return result;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { CITY_COORDS, resolveLocal, parseDirectCoordinates, geocode, haversineDistance };
