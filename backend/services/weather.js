/**
 * Live weather from Open-Meteo (current conditions + 7-day forecast).
 * Open-Meteo is free for non-commercial use and does not require an API key.
 * Set OPENMETEO_API_KEY for commercial deployments (https://open-meteo.com/).
 */
'use strict';

const { geocode } = require('./geo');

const OPENMETEO_API_KEY = process.env.OPENMETEO_API_KEY || '';
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const WMO = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
};

function describe(code) {
  return { code, text: WMO[code] || `Weather code ${code}` };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getWeather(location) {
  const key = String(location || '').trim().toLowerCase();
  if (!key) throw Object.assign(new Error('Location is required'), { status: 400 });
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...cached.value, cached: true };
  }

  const place = await geocode(location);
  if (!place) throw Object.assign(new Error(`Could not locate "${location}"`), { status: 404 });

  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lng),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '7'
  });
  if (OPENMETEO_API_KEY) params.set('apikey', OPENMETEO_API_KEY);

  let data;
  try {
    data = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  } catch (err) {
    throw Object.assign(new Error(`Weather service unavailable: ${err.message}`), { status: 502 });
  }

  const cur = data.current || {};
  const daily = data.daily || {};
  const forecast = (daily.time || []).map((date, i) => ({
    date,
    condition: describe(daily.weather_code?.[i]),
    temp_max_c: daily.temperature_2m_max?.[i] ?? null,
    temp_min_c: daily.temperature_2m_min?.[i] ?? null,
    rainfall_mm: daily.precipitation_sum?.[i] ?? null,
    rain_probability_percent: daily.precipitation_probability_max?.[i] ?? null,
    sunrise: daily.sunrise?.[i] || null,
    sunset: daily.sunset?.[i] || null
  }));

  const value = {
    available: true,
    source: 'Open-Meteo',
    provider_url: 'https://open-meteo.com/',
    fetched_at: new Date().toISOString(),
    location: {
      name: place.name,
      state: place.state || '',
      country: place.country || 'India',
      latitude: place.lat,
      longitude: place.lng,
      geocoder: place.source
    },
    timezone: data.timezone || 'auto',
    current: {
      temperature_c: cur.temperature_2m ?? null,
      feels_like_c: cur.apparent_temperature ?? null,
      humidity_percent: cur.relative_humidity_2m ?? null,
      rainfall_mm: cur.rain ?? 0,
      precipitation_mm: cur.precipitation ?? 0,
      wind_kmh: cur.wind_speed_10m ?? null,
      condition: describe(cur.weather_code),
      is_day: cur.is_day === 1
    },
    forecast_days: forecast.length,
    forecast,
    note: OPENMETEO_API_KEY
      ? 'Live data from Open-Meteo.'
      : 'Live data from Open-Meteo (free non-commercial endpoint, no API key configured).'
  };

  cache.set(key, { at: Date.now(), value });
  return { ...value, cached: false };
}

module.exports = { getWeather, WMO };
