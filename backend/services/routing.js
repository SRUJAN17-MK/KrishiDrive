/**
 * Road routing with OSRM (real road network) and an explicitly labelled
 * Haversine fallback when OSRM is unavailable.
 *
 * Supports single-destination and multi-stop agricultural dispatch routes.
 * The public OSRM demo server is rate-limited and suitable for staging/demo.
 * Set OSRM_BASE_URL to a self-hosted instance for production.
 */
'use strict';

const { geocode, resolveLocal, haversineDistance } = require('./geo');

const OSRM_BASE_URL = (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
const OSRM_PROFILE = process.env.OSRM_PROFILE || 'driving';
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function cacheKey(points) {
  return points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('->');
}

function decodePolyline(encoded) {
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

async function fetchOsrmRoute(points) {
  const isMultiStop = points.length > 2;
  const coordPath = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const alternativesParam = isMultiStop ? 'false' : '3';
  const url = `${OSRM_BASE_URL}/route/v1/${OSRM_PROFILE}/${coordPath}` +
    `?overview=full&geometries=geojson&alternatives=${alternativesParam}&steps=false&annotations=false`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7500);
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

  return data.routes.map((route, index) => {
    const legs = Array.isArray(route.legs)
      ? route.legs.map((leg, legIdx) => ({
          step: legIdx + 1,
          distance_km: Math.round(leg.distance / 100) / 10,
          duration_minutes: Math.round(leg.duration / 60)
        }))
      : [];

    return {
      id: index,
      distance_km: Math.round(route.distance / 100) / 10,
      duration_hours: Math.round((route.duration / 3600) * 100) / 100,
      duration_minutes: Math.round(route.duration / 60),
      legs,
      geometry: (route.geometry && route.geometry.coordinates || []).map(([lng, lat]) => ({
        lat: Math.round(lat * 1e5) / 1e5,
        lng: Math.round(lng * 1e5) / 1e5
      })),
      is_primary: index === 0
    };
  });
}

function fallbackRouteMulti(points, reason) {
  let totalDistance = 0;
  const legs = [];
  const geometry = [];

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const legDist = Math.max(1, Math.round(haversineDistance(from.lat, from.lng, to.lat, to.lng) * 1.28 * 10) / 10);
    totalDistance += legDist;
    legs.push({
      step: i + 1,
      from: from.name || `Point ${i + 1}`,
      to: to.name || `Point ${i + 2}`,
      distance_km: legDist,
      duration_minutes: Math.round((legDist / 48) * 60)
    });
    if (i === 0) geometry.push({ lat: from.lat, lng: from.lng });
    geometry.push({ lat: to.lat, lng: to.lng });
  }

  totalDistance = Math.round(totalDistance * 10) / 10;
  const durationHours = Math.round((totalDistance / 48) * 100) / 100;
  const durationMinutes = Math.round((totalDistance / 48) * 60);

  return {
    source: 'haversine_fallback',
    is_estimate: true,
    warning: `OSRM unavailable (${reason}). Distance is a straight-line estimate multiplied by 1.28, not actual road distance.`,
    routes: [{
      id: 0,
      distance_km: totalDistance,
      duration_hours: durationHours,
      duration_minutes: durationMinutes,
      legs,
      geometry,
      is_primary: true,
      is_estimate: true
    }]
  };
}

/**
 * Route between two place names or {lat,lng} objects, with optional intermediate waypoints.
 * Never throws for a routing failure: returns a labelled fallback instead.
 */
async function routePlaces(fromPlace, toPlace, waypoints = []) {
  const rawWaypoints = Array.isArray(waypoints) ? waypoints : [];

  const [from, to, ...resolvedWaypoints] = await Promise.all([
    typeof fromPlace === 'object' && fromPlace !== null ? fromPlace : geocode(fromPlace),
    typeof toPlace === 'object' && toPlace !== null ? toPlace : geocode(toPlace),
    ...rawWaypoints.map((w) => (typeof w === 'object' && w !== null ? w : geocode(w)))
  ]);

  if (!from || !to) {
    return {
      available: false,
      source: 'unavailable',
      reason: 'Could not geocode one or both locations. Use a known city name or coordinates.',
      routes: []
    };
  }

  // Filter out any waypoints that failed to geocode, but keep valid ones
  const validWaypoints = resolvedWaypoints.filter((w) => w && Number.isFinite(w.lat) && Number.isFinite(w.lng));
  const allPoints = [from, ...validWaypoints, to];

  const key = cacheKey(allPoints);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...cached.value, cached: true, from, to, waypoints: validWaypoints };
  }

  try {
    const routes = await fetchOsrmRoute(allPoints);
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
    return { ...value, cached: false, from, to, waypoints: validWaypoints };
  } catch (err) {
    return {
      ...fallbackRouteMulti(allPoints, err.message),
      available: true,
      from,
      to,
      waypoints: validWaypoints,
      fetched_at: new Date().toISOString(),
      cached: false
    };
  }
}

module.exports = { routePlaces, resolveLocal, decodePolyline, OSRM_BASE_URL };
