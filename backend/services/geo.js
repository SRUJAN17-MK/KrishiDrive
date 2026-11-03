/**
 * Geocoding helpers. Uses a small built-in Indian city table first, then the
 * free Open-Meteo geocoding API. Results are cached in memory.
 */
'use strict';

const CITY_COORDS = {
  nashik: { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  mumbai: { lat: 18.9220, lng: 72.8347, state: 'Maharashtra' },
  pune: { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  nagpur: { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  aurangabad: { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  ludhiana: { lat: 30.9010, lng: 75.8573, state: 'Punjab' },
  delhi: { lat: 28.6139, lng: 77.2090, state: 'Delhi NCR' },
  chandigarh: { lat: 30.7333, lng: 76.7794, state: 'Haryana' },
  jaipur: { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  surat: { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  bhopal: { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  indore: { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  hyderabad: { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  bangalore: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  bengaluru: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  kolkata: { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  chennai: { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  amritsar: { lat: 31.6340, lng: 74.8723, state: 'Punjab' },
  vashi: { lat: 19.0771, lng: 72.9986, state: 'Maharashtra' },
  patna: { lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  lucknow: { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  kanpur: { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
  varanasi: { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  raipur: { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },
  ranchi: { lat: 23.3441, lng: 85.3096, state: 'Jharkhand' },
  guwahati: { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  kochi: { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  coimbatore: { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  madurai: { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' }
};

const geocodeCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function resolveLocal(placeStr) {
  if (!placeStr) return null;
  const norm = String(placeStr).toLowerCase();
  // Longest match first so "new delhi" does not match a shorter key first.
  const keys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (norm.includes(key)) {
      return {
        name: key.charAt(0).toUpperCase() + key.slice(1),
        lat: CITY_COORDS[key].lat,
        lng: CITY_COORDS[key].lng,
        state: CITY_COORDS[key].state,
        source: 'builtin'
      };
    }
  }
  return null;
}

async function geocode(placeStr) {
  const local = resolveLocal(placeStr);
  if (local) return local;
  const query = String(placeStr || '').trim();
  if (!query || query.length > 120) return null;

  const cached = geocodeCache.get(query.toLowerCase());
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data.results && data.results[0];
    if (!hit) return null;
    const value = {
      name: hit.name,
      lat: hit.latitude,
      lng: hit.longitude,
      state: hit.admin1 || '',
      country: hit.country || '',
      source: 'open-meteo-geocoding'
    };
    geocodeCache.set(query.toLowerCase(), { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { CITY_COORDS, resolveLocal, geocode, haversineDistance };
