/**
 * KrishiDrive v2.1.0 - one-way JSON to SQLite importer.
 *
 * The JSON files that shipped with KrishiDrive v2.0 remain the legacy source
 * of truth until the first v2.1 start. This importer copies them into SQLite
 * inside a single transaction, keeps the originals in place, and writes a
 * timestamped backup under data/json_backup/.
 *
 * Run manually:  npm run migrate
 * Automatically: server.js calls migrateFromJson() when the users table is empty.
 */
'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { getDb, DATA_DIR } = require('./db');

function readJson(file, fallback) {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (err) {
    console.warn(`  [migrate] Could not parse ${file}: ${err.message}`);
    return fallback;
  }
}

function migrateFromJson({ archive = true, quiet = false } = {}) {
  const db = getDb();
  const existing = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (existing.n > 0) {
    if (!quiet) console.log('  [migrate] Users already present - JSON import skipped.');
    return { skipped: true, users: 0, vehicles: 0, crops: 0, requests: 0, trips: 0 };
  }

  const users = readJson('users.json', {});
  const vehiclesRaw = readJson('vehicles.json', []);
  const cropsRaw = readJson('crops.json', []);
  const requestsRaw = readJson('transport_requests.json', []);
  const tripsRaw = readJson('trips.json', []);

  const hasAny = (Array.isArray(users) ? users.length : Object.keys(users || {}).length) > 0;
  if (!hasAny) {
    if (!quiet) console.log('  [migrate] No legacy JSON data found - nothing to import.');
    return { skipped: true, users: 0, vehicles: 0, crops: 0, requests: 0, trips: 0 };
  }

  const counts = { skipped: false, users: 0, vehicles: 0, crops: 0, requests: 0, trips: 0 };

  const run = db.transaction(() => {
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users
        (username, email, full_name, role, hashed_password, village, state, phone,
         farm_size, crops_grown, vehicle_id, rating, trips_completed, verified,
         license_number, avatar, created_at)
      VALUES
        (@username, @email, @full_name, @role, @hashed_password, @village, @state, @phone,
         @farm_size, @crops_grown, @vehicle_id, @rating, @trips_completed, @verified,
         @license_number, @avatar, @created_at)
    `);

    const userEntries = Array.isArray(users)
      ? users.map(u => [u.username, u])
      : Object.entries(users);
    for (const [key, u] of userEntries) {
      const username = u.username || key;
      const result = insertUser.run({
        username,
        email: u.email || `${username}@krishidrive.local`,
        full_name: u.full_name || username,
        role: ['farmer', 'driver', 'admin'].includes(u.role) ? u.role : 'farmer',
        hashed_password: u.hashed_password || '',
        village: u.village || '',
        state: u.state || '',
        phone: u.phone || '',
        farm_size: u.farm_size || '',
        crops_grown: JSON.stringify(u.crops_grown || []),
        vehicle_id: u.vehicle_id || null,
        rating: u.rating ?? null,
        trips_completed: u.trips_completed || 0,
        verified: u.verified ? 1 : 0,
        license_number: u.license_number || null,
        avatar: u.avatar || '',
        created_at: u.created_at || new Date().toISOString().split('T')[0]
      });
      counts.users += result.changes;
    }

    const insertVehicle = db.prepare(`
      INSERT OR IGNORE INTO vehicles
        (id, driver, type, number, capacity, fuel_type, mileage, insurance_valid,
         status, last_service, verified, permit_type)
      VALUES
        (@id, @driver, @type, @number, @capacity, @fuel_type, @mileage, @insurance_valid,
         @status, @last_service, @verified, @permit_type)
    `);
    for (const v of Array.isArray(vehiclesRaw) ? vehiclesRaw : []) {
      const result = insertVehicle.run({
        id: v.id,
        driver: v.driver || null,
        type: v.type || 'Truck',
        number: v.number || v.id,
        capacity: v.capacity || 0,
        fuel_type: v.fuel_type || 'Diesel',
        mileage: v.mileage || 0,
        insurance_valid: v.insurance_valid || '',
        status: ['available', 'assigned', 'maintenance'].includes(v.status) ? v.status : 'available',
        last_service: v.last_service || '',
        verified: v.verified ? 1 : 0,
        permit_type: v.permit_type || ''
      });
      counts.vehicles += result.changes;
    }

    const insertCrop = db.prepare(`
      INSERT OR IGNORE INTO crops
        (id, farmer, name, location, acreage, planting_date, expected_harvest,
         expected_qty, unit, status, soil_type, estimated_rate_kg, created_at)
      VALUES
        (@id, @farmer, @name, @location, @acreage, @planting_date, @expected_harvest,
         @expected_qty, @unit, @status, @soil_type, @estimated_rate_kg, @created_at)
    `);
    for (const c of Array.isArray(cropsRaw) ? cropsRaw : []) {
      const result = insertCrop.run({
        id: c.id,
        farmer: c.farmer,
        name: c.name || 'Crop',
        location: c.location || '',
        acreage: c.acreage ?? 1,
        planting_date: c.planting_date || '',
        expected_harvest: c.expected_harvest || '',
        expected_qty: c.expected_qty ?? 1000,
        unit: c.unit || 'kg',
        status: ['growing', 'ready', 'harvested', 'failed'].includes(c.status) ? c.status : 'growing',
        soil_type: c.soil_type || 'Loamy',
        estimated_rate_kg: c.estimated_rate_kg ?? 25,
        created_at: c.created_at || new Date().toISOString()
      });
      counts.crops += result.changes;
    }

    const insertReq = db.prepare(`
      INSERT OR IGNORE INTO transport_requests
        (id, farmer, farmer_name, farmer_phone, crop, quantity, unit,
         pickup, destination, vehicle_type, pickup_date, preferred_time,
         estimated_cost, status, driver, vehicle, passed_by, created_at, delivered_at)
      VALUES
        (@id, @farmer, @farmer_name, @farmer_phone, @crop, @quantity, @unit,
         @pickup, @destination, @vehicle_type, @pickup_date, @preferred_time,
         @estimated_cost, @status, @driver, @vehicle, @passed_by, @created_at, @delivered_at)
    `);
    for (const r of Array.isArray(requestsRaw) ? requestsRaw : []) {
      const result = insertReq.run({
        id: r.id,
        farmer: r.farmer,
        farmer_name: r.farmer_name || '',
        farmer_phone: r.farmer_phone || '',
        crop: r.crop || 'Produce',
        quantity: r.quantity ?? 1000,
        unit: r.unit || 'kg',
        pickup: r.pickup || '',
        destination: r.destination || '',
        vehicle_type: r.vehicle_type || 'Truck (10-Ton)',
        pickup_date: r.pickup_date || '',
        preferred_time: r.preferred_time || '07:00 AM',
        estimated_cost: r.estimated_cost || 0,
        status: ['pending', 'matched', 'in_transit', 'delivered', 'cancelled'].includes(r.status) ? r.status : 'pending',
        driver: r.driver || null,
        vehicle: r.vehicle || null,
        passed_by: JSON.stringify(r.passed_by || []),
        created_at: r.created_at || new Date().toISOString().split('T')[0],
        delivered_at: r.delivered_at || null
      });
      counts.requests += result.changes;
    }

    const insertTrip = db.prepare(`
      INSERT OR IGNORE INTO trips
        (id, request, driver, vehicle, pickup, destination, cargo, status,
         distance_km, fuel_estimate, eta_hours, earnings, started_at, completed_at)
      VALUES
        (@id, @request, @driver, @vehicle, @pickup, @destination, @cargo, @status,
         @distance_km, @fuel_estimate, @eta_hours, @earnings, @started_at, @completed_at)
    `);
    for (const t of Array.isArray(tripsRaw) ? tripsRaw : []) {
      const result = insertTrip.run({
        id: t.id,
        request: t.request,
        driver: t.driver,
        vehicle: t.vehicle,
        pickup: t.pickup || '',
        destination: t.destination || '',
        cargo: t.cargo || '',
        status: ['scheduled', 'in_transit', 'completed', 'cancelled'].includes(t.status) ? t.status : 'scheduled',
        distance_km: t.distance_km || 0,
        fuel_estimate: t.fuel_estimate || 0,
        eta_hours: t.eta_hours || 0,
        earnings: t.earnings || 0,
        started_at: t.started_at || null,
        completed_at: t.completed_at || null
      });
      counts.trips += result.changes;
    }
  });

  run();

  if (archive) {
    const archiveDir = path.join(DATA_DIR, 'json_backup');
    fs.mkdirSync(archiveDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    for (const f of ['users.json', 'crops.json', 'vehicles.json', 'transport_requests.json', 'trips.json']) {
      const src = path.join(DATA_DIR, f);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(archiveDir, `${stamp}-${f}`));
    }
  }

  if (!quiet) {
    console.log(`  [migrate] Imported ${counts.users} users, ${counts.vehicles} vehicles, ` +
      `${counts.crops} crops, ${counts.requests} requests, ${counts.trips} trips.`);
    console.log(`  [migrate] Database: ${require('./db').DB_PATH}`);
  }
  return counts;
}

if (require.main === module) {
  console.log('\nKrishiDrive v2.1.0 - JSON to SQLite migration\n');
  migrateFromJson();
  console.log('Done. JSON files were left untouched; backups are in data/json_backup/.\n');
}

module.exports = { migrateFromJson };
