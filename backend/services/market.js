/**
 * Agmarknet mandi prices via the official data.gov.in API.
 *
 * Requires a data.gov.in API key (AGMARKNET_API_KEY). Without a key this
 * module reports that the integration is not configured. It never generates
 * or caches fake prices.
 *
 * Dataset: "Current Daily Price of Various Commodities from Various Markets
 * (Mandi)" - resource 9ef84268-d588-465a-a308-a864a43d0070.
 */
'use strict';

const RESOURCE_ID = process.env.AGMARKNET_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';
const API_KEY = process.env.AGMARKNET_API_KEY || process.env.DATA_GOV_IN_API_KEY || '';
const BASE_URL = 'https://api.data.gov.in/resource';
const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function normaliseRecord(row) {
  const min = numberOrNull(row.min_price);
  const max = numberOrNull(row.max_price);
  const modal = numberOrNull(row.modal_price);
  return {
    commodity: row.commodity || '',
    commodity_group: row.commodity_group || '',
    variety: row.variety || '',
    grade: row.grade || '',
    market: row.market || '',
    district: row.district || '',
    state: row.state || '',
    arrival_date: row.arrival_date || '',
    min_price: min,
    max_price: max,
    modal_price: modal,
    unit: 'INR per quintal',
    price_range: min !== null && max !== null ? max - min : null
  };
}

function isConfigured() {
  return Boolean(API_KEY);
}

async function getPrices({ commodity, state, district, market, limit = 50, offset = 0 } = {}) {
  if (!isConfigured()) {
    return {
      available: false,
      configured: false,
      source: 'Agmarknet (data.gov.in)',
      reason: 'AGMARKNET_API_KEY is not configured. Live mandi prices are not shown rather than displaying simulated data.',
      setup: {
        url: 'https://data.gov.in/',
        steps: [
          'Create an account at data.gov.in.',
          'Request an API key from your profile.',
          'Set AGMARKNET_API_KEY in backend/.env and restart the server.'
        ],
        dataset: `https://api.data.gov.in/resource/${RESOURCE_ID}`
      },
      records: []
    };
  }

  const lim = Math.max(1, Math.min(500, Number(limit) || 50));
  const off = Math.max(0, Number(offset) || 0);
  const key = JSON.stringify({ commodity, state, district, market, lim, off });
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...cached.value, cached: true };
  }

  const params = new URLSearchParams({
    'api-key': API_KEY,
    format: 'json',
    limit: String(lim),
    offset: String(off)
  });
  if (commodity) params.set('filters[commodity]', commodity);
  if (state) params.set('filters[state]', state);
  if (district) params.set('filters[district]', district);
  if (market) params.set('filters[market]', market);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let res;
  try {
    res = await fetch(`${BASE_URL}/${RESOURCE_ID}?${params.toString()}`, { signal: controller.signal });
  } catch (err) {
    return {
      available: false,
      configured: true,
      source: 'Agmarknet (data.gov.in)',
      reason: `Upstream request failed: ${err.message}`,
      records: []
    };
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      available: false,
      configured: true,
      source: 'Agmarknet (data.gov.in)',
      reason: `data.gov.in returned HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
      records: []
    };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return {
      available: false,
      configured: true,
      source: 'Agmarknet (data.gov.in)',
      reason: 'data.gov.in returned a non-JSON response.',
      records: []
    };
  }

  const rawRecords = Array.isArray(data.records) ? data.records : [];
  const value = {
    available: true,
    configured: true,
    source: 'Agmarknet (data.gov.in)',
    dataset: `https://api.data.gov.in/resource/${RESOURCE_ID}`,
    fetched_at: new Date().toISOString(),
    last_updated: rawRecords[0]?.arrival_date || null,
    count: rawRecords.length,
    total: numberOrNull(data.total) ?? rawRecords.length,
    offset: off,
    limit: lim,
    filters: { commodity: commodity || null, state: state || null, district: district || null, market: market || null },
    records: rawRecords.map(normaliseRecord),
    note: 'Prices are as reported by APMC markets to Agmarknet. Modal price is the most common traded price, not a guaranteed rate.'
  };
  cache.set(key, { at: Date.now(), value });
  return { ...value, cached: false };
}

module.exports = { getPrices, isConfigured, RESOURCE_ID };
