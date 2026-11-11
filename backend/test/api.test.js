/**
 * End-to-end API tests for the KrishiDrive v2.1.0 backend.
 *
 * Boots the real Express server against a throwaway SQLite database imported
 * from the JSON fixtures. No production data, uploads, or .env values are
 * touched.
 *
 *   npm test
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SERVER_ENTRY = path.join(__dirname, '..', 'server.js');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const LEAF_EARLY_BLIGHT = path.join(FIXTURES_DIR, 'leaf_tomato_early_blight.jpg');
const LEAF_HEALTHY = path.join(FIXTURES_DIR, 'leaf_tomato_healthy.jpg');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'krishidrive-test-'));
const dataDir = path.join(tmpRoot, 'data');
const uploadsDir = path.join(tmpRoot, 'uploads');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
for (const file of fs.readdirSync(FIXTURES_DIR)) {
  if (file.endsWith('.json')) fs.copyFileSync(path.join(FIXTURES_DIR, file), path.join(dataDir, file));
}

const port = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${port}`;
let server;

async function request(method, route, { token, body, form, headers: extraHeaders } = {}) {
  const headers = { ...(extraHeaders || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + route, { method, headers, body: payload });
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  return { status: res.status, data, headers: res.headers };
}

const tokens = {};
async function tokenFor(username) {
  if (!tokens[username]) {
    const res = await request('POST', '/api/auth/login', {
      body: { username, password: 'demo123' },
    });
    assert.equal(res.status, 200, `login failed for ${username}`);
    tokens[username] = res.data.access_token;
  }
  return tokens[username];
}

function imageForm(filePath, cropType) {
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(filePath)], { type: 'image/jpeg' }), path.basename(filePath));
  if (cropType) form.append('crop_type', cropType);
  return form;
}

before(async () => {
  server = spawn(process.execPath, [SERVER_ENTRY], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      DATA_DIR: dataDir,
      UPLOADS_DIR: uploadsDir,
      JWT_SECRET: 'krishidrive-test-secret',
      AGMARKNET_API_KEY: '',
      DATA_GOV_IN_API_KEY: '',
      SERVE_FRONTEND: '0'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/ready`);
      if (res.ok) return;
    } catch {
      // Server not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Backend did not become ready in time');
});

after(async () => {
  if (server) {
    server.kill();
    await new Promise((resolve) => {
      server.once('exit', resolve);
      setTimeout(resolve, 3000);
    });
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

test('health and readiness expose real subsystem state', async () => {
  const health = await request('GET', '/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.status, 'healthy');
  assert.equal(health.headers.get('x-powered-by'), null, 'Express fingerprint should be removed');
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');

  const ready = await request('GET', '/ready');
  assert.equal(ready.status, 200);
  assert.equal(ready.data.checks.database, 'ok');
  assert.equal(ready.data.checks.disease_model, 'ok');

  const detailed = await request('GET', '/api/health/detailed');
  assert.equal(detailed.status, 200);
  assert.equal(detailed.data.services.disease_model.classes, 38);
  assert.equal(detailed.data.services.disease_runtime.execution_provider, 'cpu');
  assert.equal(detailed.data.services.disease_runtime.npu_verified, false);
});

test('legacy JSON was migrated into SQLite', async () => {
  const Database = require('better-sqlite3');
  const file = path.join(dataDir, 'krishidrive.db');
  assert.ok(fs.existsSync(file), 'SQLite database should exist');
  const db = new Database(file, { readonly: true });
  try {
    const users = db.prepare('SELECT COUNT(*) AS n FROM users').get();
    const crops = db.prepare('SELECT COUNT(*) AS n FROM crops').get();
    const migrations = db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get();
    assert.ok(users.n >= 5, `expected migrated users, got ${users.n}`);
    assert.ok(crops.n >= 2, `expected migrated crops, got ${crops.n}`);
    assert.ok(migrations.n >= 1);
    const fk = db.pragma('foreign_keys', { simple: true });
    assert.equal(fk, 1);
  } finally {
    db.close();
  }
});

test('authentication and public registration', async (t) => {
  await t.test('accepts seeded credentials without leaking hashes', async () => {
    const res = await request('POST', '/api/auth/login', {
      body: { username: 'farmer1', password: 'demo123' },
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.access_token);
    assert.equal(res.data.user.role, 'farmer');
    assert.equal(JSON.stringify(res.data).includes('hashed_password'), false);
  });

  await t.test('rejects wrong password', async () => {
    const res = await request('POST', '/api/auth/login', {
      body: { username: 'farmer1', password: 'nope' },
    });
    assert.equal(res.status, 401);
  });

  await t.test('rejects short passwords', async () => {
    const res = await request('POST', '/api/auth/register', {
      body: { username: 'shortpass', email: 'short@test.in', password: '123' },
    });
    assert.equal(res.status, 400);
  });

  await t.test('never grants admin through public registration', async () => {
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const res = await request('POST', '/api/auth/register', {
      body: {
        username: `escalate_${suffix}`,
        email: `escalate_${suffix}@test.in`,
        password: 'demo123',
        role: 'admin',
      },
    });
    if (res.status === 200) {
      assert.equal(res.data.user.role, 'farmer');
    } else {
      assert.equal(res.status, 400, 'admin self-registration must be rejected or downgraded');
    }
  });

  await t.test('rejects duplicate registration with 409 or 400', async () => {
    const res = await request('POST', '/api/auth/register', {
      body: { username: 'farmer1', email: 'other@test.in', password: 'demo123' },
    });
    assert.ok([400, 409].includes(res.status));
  });
});

test('crop lifecycle and ownership', async (t) => {
  const farmer = await tokenFor('farmer1');
  const outsider = await tokenFor('farmer2');
  let cropId;

  await t.test('validates required crop fields', async () => {
    const res = await request('POST', '/api/crops', {
      token: farmer,
      body: { crop_name: 'Tomato', acreage: 2 },
    });
    assert.equal(res.status, 400);
  });

  await t.test('creates a crop with the v2 schema', async () => {
    const res = await request('POST', '/api/crops', {
      token: farmer,
      body: {
        name: 'Tomato',
        acreage: 4,
        expected_qty: 8000,
        soil_type: 'Black',
        planting_date: '2026-06-01',
        location: 'Nashik',
      },
    });
    assert.equal(res.status, 200);
    cropId = res.data.id;
    assert.match(cropId, /^C\d+$/);
    assert.equal(res.data.farmer, 'farmer1');
  });

  await t.test('lists only the owner crops', async () => {
    const res = await request('GET', '/api/crops', { token: farmer });
    assert.equal(res.status, 200);
    assert.ok(res.data.length >= 1);
    assert.ok(res.data.every((crop) => crop.farmer === 'farmer1'));
  });

  await t.test('blocks edits from another farmer', async () => {
    const res = await request('PUT', `/api/crops/${cropId}`, {
      token: outsider,
      body: { acreage: 99 },
    });
    assert.equal(res.status, 403);
  });

  await t.test('deletes the crop', async () => {
    const res = await request('DELETE', `/api/crops/${cropId}`, { token: farmer });
    assert.equal(res.status, 200);
    assert.equal((await request('GET', `/api/crops/${cropId}`, { token: farmer })).status, 404);
  });
});

test('transport, atomic acceptance, and trip lifecycle', async (t) => {
  const farmer = await tokenFor('farmer1');
  const farmer2 = await tokenFor('farmer2');
  const driver1 = await tokenFor('driver1');
  const driver2 = await tokenFor('driver2');
  let requestId;
  let otherId;

  await t.test('creates a dispatch request', async () => {
    const res = await request('POST', '/api/transport/request', {
      token: farmer,
      body: {
        crop: 'Tomato',
        quantity: 2500,
        pickup: 'Nashik',
        destination: 'Vashi APMC, Mumbai',
        pickup_date: '2026-11-10',
      },
    });
    assert.equal(res.status, 200);
    requestId = res.data.id;
    assert.match(requestId, /^TR\d+$/);
    assert.equal(res.data.status, 'pending');
    assert.ok(res.data.estimated_cost > 0);
  });

  await t.test('a passed job is hidden from that driver only', async () => {
    const created = await request('POST', '/api/transport/request', {
      token: farmer,
      body: { crop: 'Rice', quantity: 1000, pickup: 'Nashik', destination: 'Pune' },
    });
    otherId = created.data.id;

    const passed = await request('POST', '/api/transport/reject', {
      token: driver2,
      body: { request_id: otherId },
    });
    assert.equal(passed.status, 200);

    const driverView = await request('GET', '/api/transport/requests', { token: driver2 });
    assert.equal(driverView.data.some((job) => job.id === otherId), false);

    const ownerView = await request('GET', '/api/transport/requests', { token: farmer });
    assert.equal(ownerView.data.some((job) => job.id === otherId), true);
  });

  await t.test('a farmer cannot accept another farmer dispatch', async () => {
    const res = await request('POST', '/api/transport/accept', {
      token: farmer2,
      body: { request_id: otherId, driver_username: 'driver1' },
    });
    assert.equal(res.status, 403);
  });

  await t.test('a driver accepts a pending request', async () => {
    const res = await request('POST', '/api/transport/accept', {
      token: driver1,
      body: { request_id: requestId },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.request.status, 'matched');
    assert.equal(res.data.request.driver, 'driver1');
    assert.equal(res.data.trip.driver, 'driver1');
    assert.ok(['osrm', 'haversine_fallback'].includes(res.data.route.source));
  });

  await t.test('the same request cannot be accepted twice', async () => {
    const res = await request('POST', '/api/transport/accept', {
      token: driver2,
      body: { request_id: requestId },
    });
    assert.equal(res.status, 409);
  });

  await t.test('concurrent acceptance produces exactly one winner', async () => {
    const created = await request('POST', '/api/transport/request', {
      token: farmer,
      body: { crop: 'Grapes', quantity: 1800, pickup: 'Nashik', destination: 'Pune' },
    });
    assert.equal(created.status, 200);

    const [a, b] = await Promise.all([
      request('POST', '/api/transport/accept', { token: driver1, body: { request_id: created.data.id } }),
      request('POST', '/api/transport/accept', { token: driver2, body: { request_id: created.data.id } })
    ]);
    const statuses = [a.status, b.status].sort((x, y) => x - y);
    assert.deepEqual(statuses, [200, 409], 'exactly one accept must succeed');
  });

  await t.test('completing a trip marks the dispatch delivered', async () => {
    const trips = await request('GET', '/api/trips', { token: driver1 });
    const trip = trips.data.find((item) => item.request === requestId);
    assert.ok(trip, 'trip should exist after acceptance');

    const updated = await request('PUT', `/api/trips/${trip.id}`, {
      token: driver1,
      body: { status: 'completed' },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.status, 'completed');

    const requests = await request('GET', '/api/transport/requests', { token: farmer });
    const dispatch = requests.data.find((item) => item.id === requestId);
    assert.equal(dispatch.status, 'delivered');
  });

  await t.test('a farmer cannot change trip status', async () => {
    const trips = await request('GET', '/api/trips', { token: driver1 });
    const trip = trips.data.find((item) => item.request === requestId);
    const res = await request('PUT', `/api/trips/${trip.id}`, {
      token: farmer,
      body: { status: 'in_transit' },
    });
    assert.equal(res.status, 403);
  });
});

test('admin governance is role guarded and revenue is not padded', async (t) => {
  const admin = await tokenFor('admin');
  const farmer = await tokenFor('farmer1');
  const driver = await tokenFor('driver1');

  await t.test('admin can read stats and users', async () => {
    const stats = await request('GET', '/api/admin/stats', { token: admin });
    assert.equal(stats.status, 200);
    assert.ok(stats.data.total_users >= 5);
    assert.equal(stats.data.revenue.this_month >= 0, true);
    assert.equal(stats.data.revenue.this_month <= stats.data.revenue.total, true);

    const users = await request('GET', '/api/admin/users', { token: admin });
    assert.equal(users.status, 200);
    assert.ok(users.data.every((user) => user.hashed_password === undefined));
  });

  await t.test('farmer and driver see 403', async () => {
    assert.equal((await request('GET', '/api/admin/stats', { token: farmer })).status, 403);
    assert.equal((await request('GET', '/api/admin/users', { token: driver })).status, 403);
    assert.equal(
      (await request('POST', '/api/admin/drivers/driver1/verify', { token: farmer, body: { verified: true } })).status,
      403
    );
  });

  await t.test('admin can verify a driver', async () => {
    const res = await request('POST', '/api/admin/drivers/driver1/verify', {
      token: admin,
      body: { verified: true },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.driver.verified, true);
  });
});

test('deterministic agronomic scoring engines', async (t) => {
  const farmer = await tokenFor('farmer1');
  const driver = await tokenFor('driver1');

  await t.test('crop recommendation is labelled as rule-based', async () => {
    const res = await request('POST', '/api/ai/crop-recommendation', {
      token: farmer,
      body: {
        soil_type: 'Black', nitrogen: 280, phosphorus: 24, potassium: 320,
        ph: 7.2, temperature: 29, humidity: 65, rainfall: 750,
      },
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.recommended_crops));
    assert.ok(res.data.recommended_crops.length > 0);
    assert.match(res.data.engine_info.name, /Agronomic Scoring Engine/);
  });

  await t.test('harvest prediction returns a positive yield and honest method', async () => {
    const res = await request('POST', '/api/ai/harvest-prediction', {
      token: farmer,
      body: { crop_name: 'Tomato', acreage: 5, planting_date: '2026-06-01', soil_type: 'Black', location: 'Nashik' },
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.predicted_yield > 0);
    assert.ok(res.data.economic_forecast.projected_gross_revenue);
  });

  await t.test('route optimization returns real geometry or a labelled fallback', async () => {
    const res = await request('POST', '/api/ai/route-optimization', {
      token: driver,
      body: { pickup: 'Nashik', destination: 'Vashi APMC, Mumbai', vehicle_type: 'Truck (10-Ton)', load: 5000 },
    });
    assert.equal(res.status, 200);
    assert.ok(['osrm', 'haversine_fallback'].includes(res.data.route_source));
    assert.ok(res.data.route.distance_km > 0);
    assert.ok(Array.isArray(res.data.geometry));
    assert.ok(res.data.geometry.length >= 2);
    assert.ok(res.data.alternatives.length >= 1);
    assert.equal(res.data.is_estimate, res.data.route_source !== 'osrm');
  });

  await t.test('transport matching ranks available haulers', async () => {
    const res = await request('POST', '/api/ai/transport-matching', {
      token: farmer,
      body: { crop_type: 'Tomato', quantity: 2500, pickup: 'Nashik', destination: 'Vashi APMC' },
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.matches));
    assert.ok(['osrm', 'haversine_fallback'].includes(res.data.distance_source));
  });

  await t.test('assistants answer with deterministic templates', async () => {
    const crop = await request('POST', '/api/ai/crop-assistant', {
      token: farmer,
      body: { question: 'How do I control aphids on tomato?', crop_name: 'Tomato' },
    });
    assert.equal(crop.status, 200);
    assert.ok(crop.data.answer);
    assert.match(crop.data.engine_info.type, /rule engine/i);

    const transit = await request('POST', '/api/ai/driver-assistant', {
      token: driver,
      body: { question: 'Best route to Mumbai?' },
    });
    assert.equal(transit.status, 200);
    assert.ok(transit.data.answer);
  });
});

test('real ONNX disease classification', async (t) => {
  const farmer = await tokenFor('farmer1');

  await t.test('publishes model metadata and measured benchmark', async () => {
    const res = await request('GET', '/api/ai/disease-model');
    assert.equal(res.status, 200);
    assert.equal(res.data.model.available, true);
    assert.equal(res.data.model.classes, 38);
    assert.equal(res.data.model.architecture, 'MobileNetV2 (float32)');
    assert.equal(res.data.runtime.execution_provider, 'cpu');
    assert.ok(res.data.benchmark.latency_ms.inference.p95 > 0);
    assert.ok(res.data.benchmark.methodology.measured_runs >= 1);
  });

  await t.test('requires authentication', async () => {
    const res = await request('POST', '/api/ai/crop-disease-detection', { form: imageForm(LEAF_EARLY_BLIGHT) });
    assert.equal(res.status, 401);
  });

  await t.test('classifies a real early-blight leaf', async () => {
    const res = await request('POST', '/api/ai/crop-disease-detection', {
      token: farmer,
      form: imageForm(LEAF_EARLY_BLIGHT, 'Tomato'),
    });
    assert.equal(res.status, 200);
    assert.match(res.data.prediction.label, /Tomato/i);
    assert.ok(res.data.prediction.confidence_percent > 50);
    assert.equal(res.data.top_predictions.length, 5);
    assert.equal(res.data.model.classes, 38);
    assert.equal(res.data.engine_info.type, 'ML inference (ONNX Runtime)');
    assert.match(res.data.agronomic_guidance.pathogen, /Alternaria/i);
    assert.equal(res.data.crop_mismatch, false);
  });

  await t.test('classifies a real healthy leaf', async () => {
    const res = await request('POST', '/api/ai/crop-disease-detection', {
      token: farmer,
      form: imageForm(LEAF_HEALTHY, 'Tomato'),
    });
    assert.equal(res.status, 200);
    assert.match(res.data.prediction.label, /Healthy Tomato/i);
    assert.ok(res.data.prediction.confidence_percent > 90);
    assert.equal(res.data.prediction.is_healthy, true);
  });

  await t.test('rejects a non-image upload', async () => {
    const form = new FormData();
    form.append('file', new Blob([Buffer.from('not an image at all')], { type: 'image/jpeg' }), 'fake.jpg');
    const res = await request('POST', '/api/ai/crop-disease-detection', { token: farmer, form });
    assert.equal(res.status, 400);
    assert.match(res.data.detail, /not a decodable image/i);
  });

  await t.test('document OCR remains explicitly unimplemented', async () => {
    const res = await request('POST', '/api/ai/document-analysis', { token: farmer });
    assert.equal(res.status, 501);
    assert.match(res.data.detail, /not implemented/i);
  });
});

test('live integrations report real state', async (t) => {
  await t.test('weather returns live Open-Meteo data when reachable', async () => {
    const res = await request('GET', '/api/weather?location=Nashik');
    if (res.status === 502) {
      t.skip(`Open-Meteo unreachable in this environment: ${res.data.reason}`);
      return;
    }
    assert.equal(res.status, 200);
    assert.equal(res.data.source, 'Open-Meteo');
    assert.equal(typeof res.data.current.temperature_c, 'number');
    assert.ok(res.data.forecast.length >= 1);
    assert.equal(res.data.location.name, 'Nashik');
  });

  await t.test('mandi prices do not fake data when no key is configured', async () => {
    const token = await tokenFor('farmer1');
    const status = await request('GET', '/api/market/status');
    assert.equal(status.status, 200);
    assert.equal(status.data.configured, false);

    const prices = await request('GET', '/api/market/prices?commodity=Tomato', { token });
    assert.equal(prices.status, 200);
    assert.equal(prices.data.available, false);
    assert.equal(prices.data.configured, false);
    assert.match(prices.data.reason, /AGMARKNET_API_KEY/);
    assert.deepEqual(prices.data.records, []);
  });

  await t.test('GET /api/mandi-prices supports guest access and filter parameters', async () => {
    const guestRes = await request('GET', '/api/mandi-prices?commodity=Tomato&state=Maharashtra&district=Nashik&market=Lasalgaon&limit=10&offset=0');
    assert.equal(guestRes.status, 200);
    assert.equal(guestRes.data.source, 'Agmarknet via data.gov.in');
    assert.equal(guestRes.data.configured, false);
    assert.equal(guestRes.data.available, false);
    assert.deepEqual(guestRes.data.records, []);

    // Filter validation: rejects excessive length
    const longParam = 'X'.repeat(85);
    const badRes = await request('GET', `/api/mandi-prices?commodity=${longParam}`);
    assert.equal(badRes.status, 400);
  });

  await t.test('normaliseRecord accurately parses Agmarknet data.gov.in format', () => {
    const { normaliseRecord, normalizeDate } = require('../services/market');

    // Date normalization (DD/MM/YYYY to YYYY-MM-DD)
    assert.equal(normalizeDate('09/11/2026'), '2026-11-09');
    assert.equal(normalizeDate('2026-11-09'), '2026-11-09');

    // Sample payload matching data.gov.in Agmarknet resource 9ef84268-d588-465a-a308-a864a43d0070
    const raw = {
      State: 'Maharashtra',
      District: 'Nashik',
      Market: 'Lasalgaon',
      Commodity: 'Tomato',
      Variety: 'Hybrid',
      Grade: 'FAQ',
      Arrival_Date: '09/11/2026',
      Min_Price: '1,500',
      Max_Price: '2,800',
      Modal_Price: '2,200'
    };

    const parsed = normaliseRecord(raw);
    assert.equal(parsed.commodity, 'Tomato');
    assert.equal(parsed.market, 'Lasalgaon');
    assert.equal(parsed.district, 'Nashik');
    assert.equal(parsed.state, 'Maharashtra');
    assert.equal(parsed.variety, 'Hybrid');
    assert.equal(parsed.min_price, 1500);
    assert.equal(parsed.max_price, 2800);
    assert.equal(parsed.modal_price, 2200);
    assert.equal(parsed.price_range, 1300);
    assert.equal(parsed.arrival_date, '2026-11-09');
    assert.equal(parsed.unit, 'INR per quintal');
  });

  await t.test('POST /api/mandi/where-to-sell handles missing market data honestly', async () => {
    const res = await request('POST', '/api/mandi/where-to-sell', {
      body: {
        commodity: 'Tomato',
        quantity_kg: 3000,
        origin_location: 'Nashik'
      }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.available, false);
    assert.equal(res.data.commodity, 'Tomato');
    assert.match(res.data.reason, /AGMARKNET_API_KEY/);
    assert.deepEqual(res.data.markets, []);
  });

  await t.test('decision intelligence compares actual modal prices and derives net profit realization', async () => {
    const originalApiKey = process.env.AGMARKNET_API_KEY;
    const originalFetch = global.fetch;
    process.env.AGMARKNET_API_KEY = 'test_regression_key';

    const sampleGovRecords = [
      { Market: 'Lasalgaon', District: 'Nashik', State: 'Maharashtra', Commodity: 'Tomato', Modal_Price: '2200', Min_Price: '1600', Max_Price: '2600', Arrival_Date: '09/11/2026' },
      { Market: 'Vashi APMC', District: 'Thane', State: 'Maharashtra', Commodity: 'Tomato', Modal_Price: '2900', Min_Price: '2200', Max_Price: '3400', Arrival_Date: '09/11/2026' }
    ];

    global.fetch = async (url) => {
      if (String(url).includes('data.gov.in')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ records: sampleGovRecords, total: 2 })
        };
      }
      return originalFetch(url);
    };

    try {
      const { recommendMandiForSale, clearCache } = require('../services/market');
      clearCache();
      const rec = await recommendMandiForSale({ commodity: 'Tomato', quantityKg: 5000, originLocation: 'Nashik' });
      assert.equal(rec.success, true);
      assert.equal(rec.winner.name, 'Vashi APMC');
      assert.ok(rec.winner.modal_price >= 2900);
      assert.ok(rec.winner.advantage > 0);
      assert.equal(rec.markets.length, 2);
      assert.ok(rec.net_advantage_explanation.includes('Vashi APMC'));
    } finally {
      process.env.AGMARKNET_API_KEY = originalApiKey;
      global.fetch = originalFetch;
      const { clearCache } = require('../services/market');
      clearCache();
    }
  });
});

test('support ticket lifecycle is owner-scoped and admin-governed', async (t) => {
  const farmer = await tokenFor('farmer1');
  const otherFarmer = await tokenFor('farmer2');
  const driver = await tokenFor('driver1');
  const admin = await tokenFor('admin');
  let ticketId;

  await t.test('farmer opens a ticket', async () => {
    const res = await request('POST', '/api/support/tickets', {
      token: farmer,
      body: {
        title: 'Canal water not reaching the plot',
        description: 'The distribution channel has been dry for three days.',
        category: 'irrigation',
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.status, 'open');
    assert.equal(res.data.escalated, false);
    assert.equal(res.data.message_count, 0);
    assert.ok(res.data.id);
    ticketId = res.data.id;
  });

  await t.test('validates required fields and rejects unknown statuses', async () => {
    const missing = await request('POST', '/api/support/tickets', {
      token: farmer,
      body: { title: '   ' },
    });
    assert.equal(missing.status, 400);

    const badStatus = await request('PUT', `/api/support/tickets/${ticketId}/status`, {
      token: admin,
      body: { status: 'escalated' },
    });
    assert.equal(badStatus.status, 400, 'escalation is a flag, not a status enum value');
  });

  await t.test('owner sees the ticket and another farmer is denied', async () => {
    const mine = await request('GET', `/api/support/tickets/${ticketId}`, { token: farmer });
    assert.equal(mine.status, 200);
    assert.deepEqual(mine.data.messages, []);

    const other = await request('GET', `/api/support/tickets/${ticketId}`, { token: otherFarmer });
    assert.equal(other.status, 403);
  });

  await t.test('admin reply moves an open ticket to in_progress', async () => {
    const reply = await request('POST', `/api/support/tickets/${ticketId}/messages`, {
      token: admin,
      body: { body: 'An extension officer will visit the plot tomorrow morning.' },
    });
    assert.equal(reply.status, 201);
    assert.equal(reply.data.ticket.status, 'in_progress');
    assert.equal(reply.data.ticket.messages.length, 1);
    assert.equal(reply.data.ticket.messages[0].author_role, 'admin');

    const ownerView = await request('GET', `/api/support/tickets/${ticketId}`, { token: farmer });
    assert.equal(ownerView.data.messages.length, 1);
  });

  await t.test('driver cannot read, reply to, or govern a farmer ticket', async () => {
    const reply = await request('POST', `/api/support/tickets/${ticketId}/messages`, {
      token: driver,
      body: { body: 'Wrong account' },
    });
    assert.equal(reply.status, 403);

    const status = await request('PUT', `/api/support/tickets/${ticketId}/status`, {
      token: driver,
      body: { status: 'resolved' },
    });
    assert.equal(status.status, 403);

    const escalate = await request('POST', `/api/support/tickets/${ticketId}/escalate`, {
      token: driver,
      body: {},
    });
    assert.equal(escalate.status, 403);
  });

  await t.test('admin escalates, resolves and reopens the ticket', async () => {
    const escalated = await request('POST', `/api/support/tickets/${ticketId}/escalate`, {
      token: admin,
      body: { escalated: true },
    });
    assert.equal(escalated.status, 200);
    assert.equal(escalated.data.ticket.escalated, true);

    const resolved = await request('PUT', `/api/support/tickets/${ticketId}/status`, {
      token: admin,
      body: { status: 'resolved' },
    });
    assert.equal(resolved.status, 200);
    assert.equal(resolved.data.ticket.status, 'resolved');

    const reopened = await request('PUT', `/api/support/tickets/${ticketId}/status`, {
      token: admin,
      body: { status: 'open' },
    });
    assert.equal(reopened.status, 200);
    assert.equal(reopened.data.ticket.status, 'open');
  });

  await t.test('farmer cannot reply to a resolved ticket', async () => {
    await request('PUT', `/api/support/tickets/${ticketId}/status`, {
      token: admin,
      body: { status: 'resolved' },
    });
    const res = await request('POST', `/api/support/tickets/${ticketId}/messages`, {
      token: farmer,
      body: { body: 'Thank you' },
    });
    assert.equal(res.status, 409);
  });

  await t.test('ticket list is scoped by role', async () => {
    const adminList = await request('GET', '/api/support/tickets', { token: admin });
    assert.equal(adminList.status, 200);
    assert.ok(adminList.data.some((ticket) => ticket.id === ticketId));

    const otherList = await request('GET', '/api/support/tickets', { token: otherFarmer });
    assert.equal(otherList.status, 200);
    assert.equal(otherList.data.some((ticket) => ticket.id === ticketId), false);
  });
});

test('admin audit trail is filterable, structured and redacted', async (t) => {
  const admin = await tokenFor('admin');
  const farmer = await tokenFor('farmer1');

  await t.test('records farm creation and filters by actor, action and date', async () => {
    const name = `Audit Plot ${Date.now()}`;
    const created = await request('POST', '/api/farms', {
      token: farmer,
      body: { name, latitude: 19.9975, longitude: 73.7898, area_acres: 2 },
    });
    assert.equal(created.status, 201);

    const byActor = await request('GET', '/api/admin/audit-logs?actor=farmer1&action=create_farm&limit=200', { token: admin });
    assert.equal(byActor.status, 200);
    assert.ok(byActor.data.some((log) => log.details?.farm_id === created.data.id));
    assert.ok(byActor.data.every((log) => log.actor === 'farmer1' && log.action === 'create_farm'));
    assert.equal(typeof byActor.data[0].details, 'object', 'details_json should be parsed for the UI');

    const today = new Date().toISOString().slice(0, 10);
    const byDate = await request('GET', `/api/admin/audit-logs?from=${today}&to=${today}&q=${encodeURIComponent(name)}&limit=200`, { token: admin });
    assert.equal(byDate.status, 200);
    assert.ok(byDate.data.length >= 1, 'same-day filter should include the new farm event');

    const filters = await request('GET', '/api/admin/audit-logs/filters', { token: admin });
    assert.equal(filters.status, 200);
    assert.ok(filters.data.actions.some((item) => item.action === 'create_farm'));
    assert.ok(filters.data.actors.some((item) => item.actor === 'farmer1'));
  });

  await t.test('admin-only access is enforced', async () => {
    const driver = await tokenFor('driver1');
    assert.equal((await request('GET', '/api/admin/audit-logs', { token: farmer })).status, 403);
    assert.equal((await request('GET', '/api/admin/audit-logs/filters', { token: driver })).status, 403);
    assert.equal((await request('GET', '/api/admin/audit-logs')).status, 401);
  });

  await t.test('never leaks OTPs, tokens or API keys in audit details', async () => {
    const logs = await request('GET', '/api/admin/audit-logs?limit=200', { token: admin });
    assert.equal(logs.status, 200);
    const payload = JSON.stringify(logs.data);
    assert.equal(payload.includes('delivery_otp'), false);
    assert.equal(payload.includes('"password"'), false);
    assert.equal(payload.includes('"token"'), false);
  });
});

test('KrishiDrive v2.2.0 - Role-Based Auth and Driver Permit Verification', async (t) => {
  const admin = await tokenFor('admin');
  const farmer = await tokenFor('farmer1');
  const driver = await tokenFor('driver1');
  const ts = Date.now();

  await t.test('farmer registration validates fields and redirects to farmer dashboard', async () => {
    const res = await request('POST', '/api/auth/register-farmer', {
      body: {
        full_name: 'Rameshwar Patil',
        phone: '9876543210',
        email: `ramesh_${ts}@krishidrive.in`,
        password: 'securePassword123',
        address: 'Dindori, Nashik, Maharashtra'
      }
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.user.role, 'farmer');
    assert.equal(res.data.user.status, 'verified');
    assert.equal(res.data.redirect_to, '/farmer');
    assert.ok(res.data.access_token);

    // Rejects duplicate email
    const dupRes = await request('POST', '/api/auth/register-farmer', {
      body: {
        full_name: 'Duplicate Patil',
        phone: '9876543210',
        email: `ramesh_${ts}@krishidrive.in`,
        password: 'securePassword123',
        address: 'Dindori, Nashik'
      }
    });
    assert.ok([400, 409].includes(dupRes.status));

    // Rejects missing required address
    const missingRes = await request('POST', '/api/auth/register-farmer', {
      body: {
        full_name: 'Patil Incomplete',
        phone: '9876543210',
        email: `incomplete_${ts}@krishidrive.in`,
        password: 'securePassword123'
      }
    });
    assert.equal(missingRes.status, 400);
  });

  await t.test('driver registration collects permit, validates expiry, and defaults to pending verification', async () => {
    // 1. Rejects permit with expiry date <= issue date
    const badDateRes = await request('POST', '/api/auth/register-driver', {
      body: {
        full_name: 'Vikas Shinde',
        phone: '9123456789',
        email: `vikas_bad_${ts}@krishidrive.in`,
        password: 'driverPass123',
        address: 'Pimpalgaon, Nashik',
        vehicle_reg_number: `MH-15-TK-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicle_type: 'Truck (10-Ton)',
        vehicle_capacity: 10000,
        driving_licence_number: `DL-MH-15-${ts}`,
        permit_type: 'state',
        issuing_state: 'Maharashtra',
        permit_number: `ST-MH-${ts}`,
        issuing_authority: 'RTO Nashik',
        issue_date: '2026-01-01',
        expiry_date: '2025-12-31' // EXPIRED / INVALID
      }
    });
    assert.equal(badDateRes.status, 400);
    assert.match(badDateRes.data.detail, /expiry_date/);

    // 2. Rejects state permit without issuing_state
    const noStateRes = await request('POST', '/api/auth/register-driver', {
      body: {
        full_name: 'Vikas Shinde',
        phone: '9123456789',
        email: `vikas_nostate_${ts}@krishidrive.in`,
        password: 'driverPass123',
        address: 'Pimpalgaon, Nashik',
        vehicle_reg_number: `MH-15-TK-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicle_type: 'Truck (10-Ton)',
        vehicle_capacity: 10000,
        driving_licence_number: `DL-MH-15-${ts}`,
        permit_type: 'state',
        permit_number: `ST-MH-${ts}`,
        issuing_authority: 'RTO Nashik',
        issue_date: '2026-01-01',
        expiry_date: '2029-01-01'
      }
    });
    assert.equal(noStateRes.status, 400);
    assert.match(noStateRes.data.detail, /Issuing state is required/);

    // 3. Valid State Permit Driver Registration
    const validStateRes = await request('POST', '/api/auth/register-driver', {
      body: {
        full_name: 'Vikas Shinde',
        phone: '9123456789',
        email: `vikas_state_${ts}@krishidrive.in`,
        password: 'driverPass123',
        address: 'Pimpalgaon, Nashik',
        vehicle_reg_number: `MH-15-TK-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicle_type: 'Truck (10-Ton)',
        vehicle_capacity: 10000,
        driving_licence_number: `DL-MH-15-${ts}`,
        permit_type: 'state',
        issuing_state: 'Maharashtra',
        permit_number: `ST-MH-${ts}`,
        issuing_authority: 'RTO Nashik',
        issue_date: '2026-01-01',
        expiry_date: '2029-01-01',
        document_base64: 'data:application/pdf;base64,JVBERi0xLjQKJVRlc3QgRG9jdW1lbnQ='
      }
    });
    assert.equal(validStateRes.status, 201);
    assert.equal(validStateRes.data.user.role, 'driver');
    assert.equal(validStateRes.data.verification_status, 'pending');
    assert.equal(validStateRes.data.user.verified, false);
    assert.ok(validStateRes.data.permit_id);

    // 4. Valid National Permit Driver Registration
    const validNationalRes = await request('POST', '/api/auth/register-driver', {
      body: {
        full_name: 'Harpreet Singh',
        phone: '9811122233',
        email: `harpreet_${ts}@krishidrive.in`,
        password: 'driverPass123',
        address: 'Ludhiana, Punjab',
        vehicle_reg_number: `PB-10-TR-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicle_type: 'Truck (10-Ton)',
        vehicle_capacity: 12000,
        driving_licence_number: `DL-PB-10-${ts}`,
        permit_type: 'national',
        permit_number: `NP-IND-${ts}`,
        issuing_authority: 'Transport Dept Punjab',
        auth_details: 'All India Goods Carrier Permit Form 47 Valid across all States',
        issue_date: '2026-01-01',
        expiry_date: '2031-01-01'
      }
    });
    assert.equal(validNationalRes.status, 201);
    assert.equal(validNationalRes.data.user.role, 'driver');
    assert.equal(validNationalRes.data.verification_status, 'pending');
  });

  await t.test('dedicated admin login allows admin and strictly blocks farmers and drivers with 403', async () => {
    // 1. Admin login succeeds
    const adminRes = await request('POST', '/api/auth/admin-login', {
      body: { username: 'admin', password: 'demo123' }
    });
    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.data.user.role, 'admin');
    assert.equal(adminRes.data.redirect_to, '/admin');

    // 2. Farmer trying to log into admin portal is blocked with 403
    const farmerTryAdmin = await request('POST', '/api/auth/admin-login', {
      body: { username: 'farmer1', password: 'demo123' }
    });
    assert.equal(farmerTryAdmin.status, 403);
    assert.match(farmerTryAdmin.data.detail, /Administrator privileges required/);

    // 3. Driver trying to log into admin portal is blocked with 403
    const driverTryAdmin = await request('POST', '/api/auth/admin-login', {
      body: { username: 'driver1', password: 'demo123' }
    });
    assert.equal(driverTryAdmin.status, 403);
    assert.match(driverTryAdmin.data.detail, /Administrator privileges required/);

    // 4. Wrong password returns 401
    const badPass = await request('POST', '/api/auth/admin-login', {
      body: { username: 'admin', password: 'wrongPassword' }
    });
    assert.equal(badPass.status, 401);
  });

  await t.test('role-scoped logins enforce role boundaries', async () => {
    // Farmer portal allows farmer
    const farmerRes = await request('POST', '/api/auth/farmer-login', {
      body: { username: 'farmer1', password: 'demo123' }
    });
    assert.equal(farmerRes.status, 200);
    assert.equal(farmerRes.data.redirect_to, '/farmer');

    // Farmer portal rejects driver with 403
    const driverOnFarmer = await request('POST', '/api/auth/farmer-login', {
      body: { username: 'driver1', password: 'demo123' }
    });
    assert.equal(driverOnFarmer.status, 403);

    // Driver portal allows driver
    const driverRes = await request('POST', '/api/auth/driver-login', {
      body: { username: 'driver1', password: 'demo123' }
    });
    assert.equal(driverRes.status, 200);
    assert.equal(driverRes.data.redirect_to, '/driver');
    assert.equal(driverRes.data.verification_status, 'approved');

    // Driver portal rejects farmer with 403
    const farmerOnDriver = await request('POST', '/api/auth/driver-login', {
      body: { username: 'farmer1', password: 'demo123' }
    });
    assert.equal(farmerOnDriver.status, 403);
  });

  await t.test('admin driver verification: review, documents, correction, rejection and approval', async () => {
    // Register a new driver specifically for verification lifecycle testing
    const driverUser = `verify_target_${ts}`;
    const regRes = await request('POST', '/api/auth/register-driver', {
      body: {
        username: driverUser,
        full_name: 'Verification Target Driver',
        phone: '9844455566',
        email: `${driverUser}@krishidrive.in`,
        password: 'password123',
        address: 'Nashik Industrial Area',
        vehicle_reg_number: `MH-15-VF-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicle_type: 'Tempo (3-Ton)',
        vehicle_capacity: 3000,
        driving_licence_number: `DL-VF-${ts}`,
        permit_type: 'state',
        issuing_state: 'Maharashtra',
        permit_number: `PMT-VF-${ts}`,
        issuing_authority: 'RTO Nashik',
        issue_date: '2026-01-10',
        expiry_date: '2028-01-10'
      }
    });
    assert.equal(regRes.status, 201);
    const permitId = regRes.data.permit_id;
    const targetDriverToken = regRes.data.access_token;

    // 1. Admin lists driver verifications and sees the new pending driver
    const verifList = await request('GET', '/api/admin/driver-verifications?status=pending', { token: admin });
    assert.equal(verifList.status, 200);
    const found = verifList.data.find(d => d.username === driverUser);
    assert.ok(found, 'New driver should be listed in pending verifications');
    assert.equal(found.verification_status, 'pending');

    // 2. Private permit document access: admin and owner driver can access, other farmer gets 403
    const adminDoc = await request('GET', `/api/admin/driver-permits/${permitId}/document`, { token: admin });
    assert.equal(adminDoc.status, 200);

    const ownerDoc = await request('GET', `/api/admin/driver-permits/${permitId}/document`, { token: targetDriverToken });
    assert.equal(ownerDoc.status, 200);

    const strangerDoc = await request('GET', `/api/admin/driver-permits/${permitId}/document`, { token: farmer });
    assert.equal(strangerDoc.status, 403);

    // 3. Admin requests correction
    const correctRes = await request('POST', `/api/admin/driver-verifications/${permitId}/request-correction`, {
      token: admin,
      body: { note: 'Front page of permit stamp is blurred. Please upload clear scan.' }
    });
    assert.equal(correctRes.status, 200);
    assert.equal(correctRes.data.status, 'correction_requested');

    // 4. Driver checks self-service permit status
    const driverPermitStatus = await request('GET', '/api/driver/my-permit', { token: targetDriverToken });
    assert.equal(driverPermitStatus.status, 200);
    assert.equal(driverPermitStatus.data.profile.verification_status, 'correction_requested');
    assert.equal(driverPermitStatus.data.profile.correction_note, 'Front page of permit stamp is blurred. Please upload clear scan.');

    // 5. Driver submits corrected permit
    const reuploadRes = await request('POST', '/api/driver/permit-correction', {
      token: targetDriverToken,
      body: {
        permit_number: `PMT-VF-${ts}-REV`,
        permit_type: 'state',
        issuing_state: 'Maharashtra',
        issuing_authority: 'RTO Nashik',
        issue_date: '2026-01-10',
        expiry_date: '2028-01-10',
        document_base64: 'data:application/pdf;base64,JVBERi0xLjQKJVRlc3QgUmVzdWJtaXR0ZWQ='
      }
    });
    assert.equal(reuploadRes.status, 200);
    assert.equal(reuploadRes.data.permit.status, 'pending');
    const newPermitId = reuploadRes.data.permit.id;

    // 6. Admin rejects with reason
    const rejectRes = await request('POST', `/api/admin/driver-verifications/${newPermitId}/reject`, {
      token: admin,
      body: { reason: 'Permit number does not match Parivahan Vahan records.' }
    });
    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.data.status, 'rejected');

    // 7. Admin approves permit and driver account
    const approveRes = await request('POST', `/api/admin/driver-verifications/${newPermitId}/approve`, {
      token: admin,
      body: { notes: 'Verified manually through Parivahan portal.' }
    });
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.data.status, 'approved');

    // 8. Admin suspends driver account
    const suspendRes = await request('POST', `/api/admin/drivers/${driverUser}/status`, {
      token: admin,
      body: { status: 'suspended', is_active: false, reason: 'Pending annual insurance renewal' }
    });
    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.data.status, 'suspended');
    assert.equal(suspendRes.data.is_active, false);

    // 9. Admin reinstates driver account
    const reinstateRes = await request('POST', `/api/admin/drivers/${driverUser}/status`, {
      token: admin,
      body: { status: 'approved', is_active: true, reason: 'Insurance renewed' }
    });
    assert.equal(reinstateRes.status, 200);
    assert.equal(reinstateRes.data.status, 'approved');
  });

  await t.test('job acceptance blocks pending and expired drivers and allows verified drivers', async () => {
    // 1. Create a transport dispatch request
    const reqRes = await request('POST', '/api/transport/request', {
      token: farmer,
      body: {
        crop: 'Fresh Cauliflower',
        quantity: 2500,
        unit: 'kg',
        pickup: 'Nashik, Maharashtra',
        destination: 'Vashi APMC, Mumbai',
        vehicle_type: 'Tempo (3-Ton)',
        pickup_date: '2026-03-30',
        preferred_time: '06:00 AM'
      }
    });
    assert.equal(reqRes.status, 200);
    const transportId = reqRes.data.id;

    // 2. Register an unverified pending driver
    const pendingDriverName = `driver_pending_${ts}`;
    const regRes = await request('POST', '/api/auth/register-driver', {
      body: {
        username: pendingDriverName,
        full_name: 'Pending Driver Hauler',
        phone: '9855566677',
        email: `${pendingDriverName}@krishidrive.in`,
        password: 'password123',
        address: 'Nashik Rural',
        vehicle_reg_number: `MH-15-PD-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicle_type: 'Tempo (3-Ton)',
        vehicle_capacity: 3000,
        driving_licence_number: `DL-PD-${ts}`,
        permit_type: 'state',
        issuing_state: 'Maharashtra',
        permit_number: `ST-PD-${ts}`,
        issuing_authority: 'RTO Nashik',
        issue_date: '2026-01-01',
        expiry_date: '2028-01-01'
      }
    });
    assert.equal(regRes.status, 201);
    const pendingToken = regRes.data.access_token;

    // 3. Pending driver attempts to accept transport job -> 403 Forbidden!
    const pendingAccept = await request('POST', '/api/transport/accept', {
      token: pendingToken,
      body: { request_id: transportId }
    });
    assert.equal(pendingAccept.status, 403);
    assert.match(pendingAccept.data.detail, /pending admin verification/);

    // 4. Verified driver1 with approved permit accepts job -> 200 OK
    const verifiedAccept = await request('POST', '/api/transport/accept', {
      token: driver,
      body: { request_id: transportId }
    });
    assert.equal(verifiedAccept.status, 200);
    assert.equal(verifiedAccept.data.request.status, 'matched');
    assert.equal(verifiedAccept.data.trip.driver, 'driver1');
  });
});

test('unknown API routes return JSON 404', async () => {
  const res = await request('GET', '/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.data.detail, 'API route not found');
});
