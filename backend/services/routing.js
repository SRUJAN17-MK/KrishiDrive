/**
 * Road routing with OSRM (real road network) and an explicitly labelled
 * Haversine fallback when OSRM is unavailable.
 *
 * The public OSRM demo server is rate-limited and not suitable for production.
 * Set OSRM_BASE_URL to a self-hosted instance for deployment.
 */
'use strict';

const { geocode, resolveLocal, haversineDistance } = require('./geo');

const OSRM_BASE_URL = (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
const OSRM_PROFILE = process.env.OSRM_PROFILE || 'driving';
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function cacheKey(a, b) {
  return `${a.lat.toFixed(4)},${a.lng.toFixed(4)}->${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
}

function decodePolyline(encoded) {
  // Not used for GeoJSON responses, kept for providers that return polyline5.
  let index = 0, lat = 0, lng = 0;
  const points = [];
  while (index < encoded.length) {
    let shift = 0, result = 0, byte;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

async function fetchOsrm(from, to) {
  const url = `${OSRM_BASE_URL}/route/v1/${OSRM_PROFILE}/${from.lng},${from.lat};${to.lng},${to.lat}` +
    '?overview=full&geometries=geojson&alternatives=3&steps=false&annotations=false';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(`OSRM returned ${data.code || 'no routes'}`);
  }
  return data.routes.map((route, index) => ({
    id: index,
    distance_km: Math.round(route.distance / 100) / 10,
    duration_hours: Math.round((route.duration / 3600) * 100) / 100,
    duration_minutes: Math.round(route.duration / 60),
    geometry: (route.geometry && route.geometry.coordinates || []).map(([lng, lat]) => ({
      lat: Math.round(lat * 1e5) / 1e5,
      lng: Math.round(lng * 1e5) / 1e5
    })),
    is_primary: index === 0
  }));
}

function fallbackRoute(from, to, reason) {
  const straight = haversineDistance(from.lat, from.lng, to.lat, to.lng);
  const distance = Math.max(1, Math.round(straight * 1.28 * 10) / 10);
  return {
    source: 'haversine_fallback',
    is_estimate: true,
    warning: `OSRM unavailable (${reason}). Distance is a straight-line estimate multiplied by 1.28, not actual road distance.`,
    routes: [{
      id: 0,
      distance_km: distance,
      duration_hours: Math.round((distance / 48) * 100) / 100,
      duration_minutes: Math.round((distance / 48) * 60),
      geometry: [
        { lat: from.lat, lng: from.lng },
        { lat: to.lat, lng: to.lng }
      ],
      is_primary: true,
      is_estimate: true
    }]
  };
}

/**
 * Route between two place names or {lat,lng} objects.
 * Never throws for a routing failure: returns a labelled fallback instead.
 */
async function routePlaces(fromPlace, toPlace) {
  const [from, to] = await Promise.all([
    typeof fromPlace === 'object' ? fromPlace : geocode(fromPlace),
    typeof toPlace === 'object' ? toPlace : geocode(toPlace)
  ]);

  if (!from || !to) {
    return {
      available: false,
      source: 'unavailable',
      reason: 'Could not geocode one or both locations. Use a known city name or coordinates.',
      routes: []
    };
  }

  const key = cacheKey(from, to);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...cached.value, cached: true, from, to };
  }

  try {
    const routes = await fetchOsrm(from, to);
    const value = {
      available: true,
      source: 'osrm',
      provider: 'OSRM (OpenStreetMap road network)',
      is_estimate: false,
      base_url: OSRM_BASE_URL,
      fetched_at: new Date().toISOString(),
      routes
    };
    cache.set(key, { at: Date.now(), value });
    return { ...value, cached: false, from, to };
  } catch (err) {
    return { ...fallbackRoute(from, to, err.message), available: true, from, to, fetched_at: new Date().toISOString(), cached: false };
  }
}

module.exports = { routePlaces, resolveLocal, decodePolyline, OSRM_BASE_URL };
