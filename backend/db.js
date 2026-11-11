/**
 * KrishiDrive v2.1.0 - SQLite persistence layer.
 *
 * Replaces the old JSON file store. All critical write paths (registration,
 * booking acceptance, trip completion) run inside SQLite transactions and
 * enforce foreign keys + unique constraints.
 */
'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(DATA_DIR, 'krishidrive.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    db.pragma('busy_timeout = 5000');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      username         TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
      email            TEXT UNIQUE NOT NULL COLLATE NOCASE,
      full_name        TEXT NOT NULL DEFAULT '',
      role             TEXT NOT NULL DEFAULT 'farmer'
                         CHECK(role IN ('farmer','driver','admin')),
      hashed_password  TEXT NOT NULL,
      village          TEXT DEFAULT '',
      state            TEXT DEFAULT '',
      phone            TEXT DEFAULT '',
      farm_size        TEXT DEFAULT '',
      crops_grown      TEXT NOT NULL DEFAULT '[]',
      vehicle_id       TEXT DEFAULT NULL,
      rating           REAL DEFAULT NULL,
      trips_completed  INTEGER NOT NULL DEFAULT 0,
      verified         INTEGER NOT NULL DEFAULT 0,
      license_number   TEXT DEFAULT NULL,
      avatar           TEXT DEFAULT '',
      created_at       TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS crops (
      id                 TEXT PRIMARY KEY NOT NULL,
      farmer             TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      name               TEXT NOT NULL,
      location           TEXT DEFAULT '',
      acreage            REAL NOT NULL DEFAULT 1,
      planting_date      TEXT DEFAULT '',
      expected_harvest   TEXT DEFAULT '',
      expected_qty       REAL NOT NULL DEFAULT 1000,
      unit               TEXT NOT NULL DEFAULT 'kg',
      status             TEXT NOT NULL DEFAULT 'growing'
                            CHECK(status IN ('growing','ready','harvested','failed')),
      soil_type          TEXT DEFAULT 'Loamy',
      estimated_rate_kg  REAL DEFAULT 25,
      created_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_crops_farmer ON crops(farmer);

    CREATE TABLE IF NOT EXISTS vehicles (
      id               TEXT PRIMARY KEY NOT NULL,
      driver           TEXT REFERENCES users(username) ON DELETE SET NULL,
      type             TEXT NOT NULL,
      number           TEXT UNIQUE NOT NULL,
      capacity         REAL NOT NULL DEFAULT 0,
      fuel_type        TEXT DEFAULT 'Diesel',
      mileage          REAL DEFAULT 0,
      insurance_valid  TEXT DEFAULT '',
      status           TEXT NOT NULL DEFAULT 'available'
                         CHECK(status IN ('available','assigned','maintenance')),
      last_service     TEXT DEFAULT '',
      verified         INTEGER NOT NULL DEFAULT 0,
      permit_type      TEXT DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON vehicles(driver);

    CREATE TABLE IF NOT EXISTS transport_requests (
      id              TEXT PRIMARY KEY NOT NULL,
      farmer          TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      farmer_name     TEXT DEFAULT '',
      farmer_phone    TEXT DEFAULT '',
      crop            TEXT NOT NULL DEFAULT 'Produce',
      quantity        REAL NOT NULL DEFAULT 1000,
      unit            TEXT NOT NULL DEFAULT 'kg',
      pickup          TEXT DEFAULT '',
      destination     TEXT DEFAULT '',
      vehicle_type    TEXT DEFAULT 'Truck (10-Ton)',
      pickup_date     TEXT DEFAULT '',
      preferred_time  TEXT DEFAULT '07:00 AM',
      estimated_cost  REAL DEFAULT 0,
      status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','matched','in_transit','delivered','cancelled')),
      driver          TEXT REFERENCES users(username) ON DELETE SET NULL,
      vehicle         TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
      passed_by       TEXT NOT NULL DEFAULT '[]',
      created_at      TEXT NOT NULL DEFAULT (date('now')),
      delivered_at    TEXT DEFAULT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tr_farmer ON transport_requests(farmer);
    CREATE INDEX IF NOT EXISTS idx_tr_status ON transport_requests(status);
    CREATE INDEX IF NOT EXISTS idx_tr_driver ON transport_requests(driver);

    CREATE TABLE IF NOT EXISTS trips (
      id             TEXT PRIMARY KEY NOT NULL,
      request        TEXT NOT NULL UNIQUE REFERENCES transport_requests(id) ON DELETE CASCADE,
      driver         TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      vehicle        TEXT NOT NULL REFERENCES vehicles(id),
      pickup         TEXT DEFAULT '',
      destination    TEXT DEFAULT '',
      cargo          TEXT DEFAULT '',
      status         TEXT NOT NULL DEFAULT 'scheduled'
                       CHECK(status IN ('scheduled','in_transit','completed','cancelled')),
      distance_km    REAL DEFAULT 0,
      fuel_estimate  REAL DEFAULT 0,
      eta_hours      REAL DEFAULT 0,
      earnings       REAL DEFAULT 0,
      started_at     TEXT DEFAULT NULL,
      completed_at   TEXT DEFAULT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver);
    CREATE INDEX IF NOT EXISTS idx_trips_request ON trips(request);

    -- KrishiDrive 3.0: Farms & Plots Table
    CREATE TABLE IF NOT EXISTS farms (
      id                     TEXT PRIMARY KEY NOT NULL,
      farmer                 TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      name                   TEXT NOT NULL,
      village                TEXT DEFAULT '',
      district               TEXT DEFAULT '',
      state                  TEXT DEFAULT '',
      latitude               REAL DEFAULT 0,
      longitude              REAL DEFAULT 0,
      boundary_geojson       TEXT DEFAULT '[]',
      area_acres             REAL DEFAULT 1,
      area_hectares          REAL DEFAULT 0.4,
      soil_type              TEXT DEFAULT 'Loamy',
      soil_ph                REAL DEFAULT 6.5,
      nitrogen               REAL DEFAULT 120,
      phosphorus             REAL DEFAULT 50,
      potassium              REAL DEFAULT 40,
      organic_carbon_percent REAL DEFAULT 0.5,
      is_lab_tested          INTEGER DEFAULT 0,
      irrigation_type        TEXT DEFAULT 'Borewell',
      created_at             TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_farms_farmer ON farms(farmer);

    -- KrishiDrive 3.0: Live Satellite Remote Sensing & Analyses
    CREATE TABLE IF NOT EXISTS satellite_analyses (
      id                         TEXT PRIMARY KEY NOT NULL,
      farm_id                    TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      farmer                     TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      ndvi                       REAL DEFAULT 0.5,
      ndwi                       REAL DEFAULT 0.2,
      evi                        REAL DEFAULT 0.4,
      soil_moisture_m3_m3        REAL DEFAULT 0.25,
      surface_temp_c             REAL DEFAULT 26.5,
      elevation_m                REAL DEFAULT 500,
      slope_deg                  REAL DEFAULT 2.5,
      environmental_summary_json TEXT DEFAULT '{}',
      crop_recommendations_json  TEXT DEFAULT '[]',
      created_at                 TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sat_farm ON satellite_analyses(farm_id);
    CREATE INDEX IF NOT EXISTS idx_sat_farmer ON satellite_analyses(farmer);

    -- KrishiDrive 3.0: Support Tickets & Issues
    CREATE TABLE IF NOT EXISTS support_tickets (
      id          TEXT PRIMARY KEY NOT NULL,
      username    TEXT NOT NULL,
      category    TEXT DEFAULT 'general',
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      status      TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- KrishiDrive 3.0: Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id           TEXT PRIMARY KEY NOT NULL,
      action       TEXT NOT NULL,
      actor        TEXT DEFAULT 'system',
      details_json TEXT DEFAULT '{}',
      ip_address   TEXT DEFAULT '',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const baseline = db.prepare('SELECT 1 FROM schema_migrations WHERE version = 1').get();
  if (!baseline) {
    db.prepare('INSERT INTO schema_migrations (version) VALUES (1)').run();
  }

  // Migration v2: OTP & Proof of Delivery columns
  const v2 = db.prepare('SELECT 1 FROM schema_migrations WHERE version = 2').get();
  if (!v2) {
    try {
      db.prepare('ALTER TABLE transport_requests ADD COLUMN delivery_otp TEXT DEFAULT NULL').run();
    } catch {}
    try {
      db.prepare('ALTER TABLE transport_requests ADD COLUMN proof_of_delivery TEXT DEFAULT NULL').run();
    } catch {}
    try {
      db.prepare('ALTER TABLE trips ADD COLUMN delivery_otp TEXT DEFAULT NULL').run();
    } catch {}
    try {
      db.prepare('ALTER TABLE trips ADD COLUMN proof_of_delivery TEXT DEFAULT NULL').run();
    } catch {}
    db.prepare('INSERT INTO schema_migrations (version) VALUES (2)').run();
  }

  // Migration v3: support ticket conversation threads, escalation & audit indexes
  const v3 = db.prepare('SELECT 1 FROM schema_migrations WHERE version = 3').get();
  if (!v3) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS support_ticket_messages (
        id          TEXT PRIMARY KEY NOT NULL,
        ticket_id   TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        author      TEXT NOT NULL,
        author_role TEXT DEFAULT 'farmer',
        body        TEXT NOT NULL,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON support_ticket_messages(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    `);
    try {
      db.prepare("ALTER TABLE support_tickets ADD COLUMN escalated INTEGER DEFAULT 0").run();
    } catch {}
    try {
      db.prepare("ALTER TABLE support_tickets ADD COLUMN priority TEXT DEFAULT 'normal'").run();
    } catch {}
    try {
      db.prepare('ALTER TABLE support_tickets ADD COLUMN updated_at TEXT DEFAULT NULL').run();
    } catch {}
    db.prepare('INSERT INTO schema_migrations (version) VALUES (3)').run();
  }

  // Migration v4: KrishiDrive v2.2.0 - Role-Based Auth, Driver Permits & Verification
  const v4 = db.prepare('SELECT 1 FROM schema_migrations WHERE version = 4').get();
  if (!v4) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS driver_profiles (
        username            TEXT PRIMARY KEY NOT NULL REFERENCES users(username) ON DELETE CASCADE,
        driving_licence_no  TEXT NOT NULL,
        licence_expiry      TEXT DEFAULT '',
        verification_status TEXT NOT NULL DEFAULT 'pending'
                              CHECK(verification_status IN ('pending','approved','rejected','correction_requested','suspended','deactivated')),
        rejection_reason    TEXT DEFAULT '',
        correction_note     TEXT DEFAULT '',
        reviewed_by         TEXT REFERENCES users(username) ON DELETE SET NULL,
        reviewed_at         TEXT DEFAULT NULL,
        created_at          TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON driver_profiles(verification_status);

      CREATE TABLE IF NOT EXISTS farmer_profiles (
        username            TEXT PRIMARY KEY NOT NULL REFERENCES users(username) ON DELETE CASCADE,
        address             TEXT DEFAULT '',
        land_area_acres     REAL DEFAULT 0,
        main_crops          TEXT NOT NULL DEFAULT '[]',
        created_at          TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS driver_permits (
        id                  TEXT PRIMARY KEY NOT NULL,
        driver_username     TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
        permit_type         TEXT NOT NULL CHECK(permit_type IN ('state','national')),
        permit_number       TEXT NOT NULL,
        issuing_state       TEXT DEFAULT '',
        issuing_authority   TEXT DEFAULT '',
        auth_details        TEXT DEFAULT '',
        issue_date          TEXT NOT NULL,
        expiry_date         TEXT NOT NULL,
        document_filename   TEXT NOT NULL,
        document_path       TEXT NOT NULL,
        document_mimetype   TEXT NOT NULL,
        document_size       INTEGER NOT NULL DEFAULT 0,
        status              TEXT NOT NULL DEFAULT 'pending'
                              CHECK(status IN ('pending','approved','rejected','correction_requested')),
        rejection_reason    TEXT DEFAULT '',
        correction_note     TEXT DEFAULT '',
        reviewed_by         TEXT REFERENCES users(username) ON DELETE SET NULL,
        reviewed_at         TEXT DEFAULT NULL,
        created_at          TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_permits_driver ON driver_permits(driver_username);
      CREATE INDEX IF NOT EXISTS idx_permits_status ON driver_permits(status);
      CREATE INDEX IF NOT EXISTS idx_permits_expiry ON driver_permits(expiry_date);

      CREATE TABLE IF NOT EXISTS verification_records (
        id                  TEXT PRIMARY KEY NOT NULL,
        target_type         TEXT NOT NULL CHECK(target_type IN ('driver','permit','vehicle')),
        target_id           TEXT NOT NULL,
        driver_username     TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
        action              TEXT NOT NULL CHECK(action IN ('register','submit','approve','reject','request_correction','suspend','reinstate','deactivate')),
        reason              TEXT DEFAULT '',
        admin_username      TEXT REFERENCES users(username) ON DELETE SET NULL,
        created_at          TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_vr_driver ON verification_records(driver_username);
      CREATE INDEX IF NOT EXISTS idx_vr_admin ON verification_records(admin_username);
    `);

    try { db.prepare("ALTER TABLE users ADD COLUMN address TEXT DEFAULT ''").run(); } catch {}
    try { db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'").run(); } catch {}
    try { db.prepare("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run(); } catch {}
    try { db.prepare("ALTER TABLE vehicles ADD COLUMN photo_url TEXT DEFAULT ''").run(); } catch {}

    try {
      db.prepare("UPDATE users SET status = 'verified', is_active = 1 WHERE username IN ('admin', 'farmer1', 'farmer2', 'driver1', 'driver2')").run();

      const insertProfile = db.prepare(`
        INSERT OR IGNORE INTO driver_profiles (username, driving_licence_no, licence_expiry, verification_status, reviewed_by, reviewed_at)
        VALUES (?, ?, '2029-12-31', 'approved', 'admin', datetime('now'))
      `);
      insertProfile.run('driver1', 'MH-15-2020-0012345');
      insertProfile.run('driver2', 'MH-12-2019-0098765');

      const insertPermit = db.prepare(`
        INSERT OR IGNORE INTO driver_permits (id, driver_username, permit_type, permit_number, issuing_state, issuing_authority, auth_details, issue_date, expiry_date, document_filename, document_path, document_mimetype, document_size, status, reviewed_by, reviewed_at)
        VALUES (?, ?, 'national', ?, 'Maharashtra', 'RTO Nashik', 'All India Heavy Goods Carrier Authorization', '2024-01-01', '2029-12-31', 'sample_permit.pdf', 'seeded_permit', 'application/pdf', 1024, 'approved', 'admin', datetime('now'))
      `);
      insertPermit.run('PMT-SEED-001', 'driver1', 'NP-MH-2024-8891');
      insertPermit.run('PMT-SEED-002', 'driver2', 'NP-MH-2024-4412');
    } catch {}

    db.prepare('INSERT INTO schema_migrations (version) VALUES (4)').run();
  }
}

/** Atomic per-table ID generation (call inside a transaction). */
function getNextId(table, prefix) {
  const row = getDb().prepare(
    `SELECT MAX(CAST(SUBSTR(id, ?) AS INTEGER)) AS n FROM ${table} WHERE id LIKE ?`
  ).get(prefix.length + 1, `${prefix}%`);
  const next = (row && Number.isFinite(row.n) ? row.n : 0) + 1;
  return prefix + String(next).padStart(3, '0');
}

function parseJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

// --- USERS -----------------------------------------------------------------
const userOps = {
  findByUsername(username) {
    return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
  },
  findByEmail(email) {
    return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
  },
  create(user) {
    const txn = getDb().transaction(() => {
      getDb().prepare(`
        INSERT INTO users (username, email, full_name, role, hashed_password, village, state, phone,
          farm_size, crops_grown, vehicle_id, rating, trips_completed, verified, license_number, avatar, address, status, is_active, created_at)
        VALUES (@username, @email, @full_name, @role, @hashed_password, @village, @state, @phone,
          @farm_size, @crops_grown, @vehicle_id, @rating, @trips_completed, @verified, @license_number, @avatar, @address, @status, @is_active, @created_at)
      `).run({
        username: user.username,
        email: user.email,
        full_name: user.full_name || '',
        role: user.role || 'farmer',
        hashed_password: user.hashed_password,
        village: user.village || '',
        state: user.state || '',
        phone: user.phone || '',
        farm_size: user.farm_size || '',
        crops_grown: JSON.stringify(user.crops_grown || []),
        vehicle_id: user.vehicle_id || null,
        rating: user.rating ?? null,
        trips_completed: user.trips_completed || 0,
        verified: user.verified ? 1 : 0,
        license_number: user.license_number || null,
        avatar: user.avatar || '',
        address: user.address || user.village || '',
        status: user.status || (user.role === 'driver' ? 'pending' : 'verified'),
        is_active: user.is_active !== undefined ? (user.is_active ? 1 : 0) : 1,
        created_at: user.created_at || new Date().toISOString().split('T')[0]
      });
      return this.findByUsername(user.username);
    });
    return txn();
  },
  update(username, fields) {
    const allowed = ['full_name', 'phone', 'village', 'state', 'farm_size', 'avatar',
      'verified', 'rating', 'trips_completed', 'license_number', 'address', 'status', 'is_active'];
    const updates = [];
    const values = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined || !allowed.includes(k)) continue;
      updates.push(`${k} = @${k}`);
      values[k] = (k === 'verified' || k === 'is_active') ? (v ? 1 : 0) : v;
    }
    if (!updates.length) return this.findByUsername(username);
    values.username = username;
    getDb().prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = @username`).run(values);
    return this.findByUsername(username);
  },
  setAccountStatus(username, status, is_active = 1) {
    getDb().prepare('UPDATE users SET status = ?, is_active = ? WHERE username = ?')
      .run(status, is_active ? 1 : 0, username);
    return this.findByUsername(username);
  },
  incrementTrips(username) {
    getDb().prepare('UPDATE users SET trips_completed = trips_completed + 1 WHERE username = ?').run(username);
  },
  listByRole(role) {
    return getDb().prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at').all(role);
  },
  listAll() {
    return getDb().prepare('SELECT * FROM users ORDER BY created_at').all();
  },
  safe(user) {
    if (!user) return null;
    const { hashed_password, ...safe } = user;
    safe.crops_grown = parseJson(safe.crops_grown, []);
    safe.verified = Boolean(safe.verified);
    safe.is_active = safe.is_active !== undefined ? Boolean(safe.is_active) : true;
    safe.status = safe.status || (safe.verified ? 'verified' : 'pending');
    safe.address = safe.address || safe.village || '';
    return safe;
  }
};

// --- DRIVER PROFILES --------------------------------------------------------
const driverProfileOps = {
  findByUsername(username) {
    return getDb().prepare('SELECT * FROM driver_profiles WHERE username = ?').get(username);
  },
  create(profile) {
    getDb().prepare(`
      INSERT INTO driver_profiles (username, driving_licence_no, licence_expiry, verification_status, rejection_reason, correction_note, reviewed_by, reviewed_at)
      VALUES (@username, @driving_licence_no, @licence_expiry, @verification_status, @rejection_reason, @correction_note, @reviewed_by, @reviewed_at)
    `).run({
      username: profile.username,
      driving_licence_no: profile.driving_licence_no,
      licence_expiry: profile.licence_expiry || '',
      verification_status: profile.verification_status || 'pending',
      rejection_reason: profile.rejection_reason || '',
      correction_note: profile.correction_note || '',
      reviewed_by: profile.reviewed_by || null,
      reviewed_at: profile.reviewed_at || null
    });
    return this.findByUsername(profile.username);
  },
  updateVerification(username, status, { reason = '', note = '', admin = 'admin' } = {}) {
    getDb().prepare(`
      UPDATE driver_profiles
      SET verification_status = @status, rejection_reason = @reason, correction_note = @note,
          reviewed_by = @admin, reviewed_at = datetime('now'), updated_at = datetime('now')
      WHERE username = @username
    `).run({ username, status, reason, note, admin });
    return this.findByUsername(username);
  }
};

// --- FARMER PROFILES --------------------------------------------------------
const farmerProfileOps = {
  findByUsername(username) {
    return getDb().prepare('SELECT * FROM farmer_profiles WHERE username = ?').get(username);
  },
  create(profile) {
    getDb().prepare(`
      INSERT INTO farmer_profiles (username, address, land_area_acres, main_crops)
      VALUES (@username, @address, @land_area_acres, @main_crops)
    `).run({
      username: profile.username,
      address: profile.address || '',
      land_area_acres: Number(profile.land_area_acres) || 0,
      main_crops: JSON.stringify(profile.main_crops || [])
    });
    return this.findByUsername(profile.username);
  }
};

// --- DRIVER PERMITS ---------------------------------------------------------
const permitOps = {
  findById(id) {
    return getDb().prepare('SELECT * FROM driver_permits WHERE id = ?').get(id);
  },
  findByDriver(driver_username) {
    return getDb().prepare('SELECT * FROM driver_permits WHERE driver_username = ? ORDER BY created_at DESC').all(driver_username);
  },
  findActiveApprovedByDriver(driver_username) {
    return getDb().prepare(`
      SELECT * FROM driver_permits
      WHERE driver_username = ? AND status = 'approved' AND expiry_date >= date('now')
      ORDER BY expiry_date DESC LIMIT 1
    `).get(driver_username);
  },
  create(permit) {
    const id = permit.id || getNextId('driver_permits', 'PMT-');
    getDb().prepare(`
      INSERT INTO driver_permits (
        id, driver_username, permit_type, permit_number, issuing_state, issuing_authority,
        auth_details, issue_date, expiry_date, document_filename, document_path,
        document_mimetype, document_size, status, rejection_reason, correction_note
      ) VALUES (
        @id, @driver_username, @permit_type, @permit_number, @issuing_state, @issuing_authority,
        @auth_details, @issue_date, @expiry_date, @document_filename, @document_path,
        @document_mimetype, @document_size, @status, @rejection_reason, @correction_note
      )
    `).run({
      id,
      driver_username: permit.driver_username,
      permit_type: permit.permit_type,
      permit_number: permit.permit_number,
      issuing_state: permit.issuing_state || '',
      issuing_authority: permit.issuing_authority || '',
      auth_details: permit.auth_details || '',
      issue_date: permit.issue_date,
      expiry_date: permit.expiry_date,
      document_filename: permit.document_filename,
      document_path: permit.document_path,
      document_mimetype: permit.document_mimetype,
      document_size: permit.document_size || 0,
      status: permit.status || 'pending',
      rejection_reason: permit.rejection_reason || '',
      correction_note: permit.correction_note || ''
    });
    return this.findById(id);
  },
  updateStatus(id, status, { reason = '', note = '', admin = 'admin' } = {}) {
    getDb().prepare(`
      UPDATE driver_permits
      SET status = @status, rejection_reason = @reason, correction_note = @note,
          reviewed_by = @admin, reviewed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = @id
    `).run({ id, status, reason, note, admin });
    return this.findById(id);
  },
  list(filters = {}) {
    const clauses = [];
    const params = {};
    if (filters.status) {
      clauses.push('status = @status');
      params.status = filters.status;
    }
    if (filters.permit_type) {
      clauses.push('permit_type = @permit_type');
      params.permit_type = filters.permit_type;
    }
    if (filters.driver) {
      clauses.push('driver_username = @driver');
      params.driver = filters.driver;
    }
    if (filters.expiring_soon_days) {
      clauses.push("expiry_date BETWEEN date('now') AND date('now', '+' || @days || ' days')");
      params.days = filters.expiring_soon_days;
    }
    if (filters.expired) {
      clauses.push("expiry_date < date('now')");
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Math.max(1, Math.min(500, parseInt(filters.limit, 10) || 100));
    const offset = Math.max(0, parseInt(filters.offset, 10) || 0);
    params.limit = limit;
    params.offset = offset;
    return getDb().prepare(`SELECT * FROM driver_permits ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`).all(params);
  },
  countPending() {
    const row = getDb().prepare("SELECT COUNT(*) AS count FROM driver_permits WHERE status = 'pending'").get();
    return row ? row.count : 0;
  },
  countExpiringSoon(days = 30) {
    const row = getDb().prepare("SELECT COUNT(*) AS count FROM driver_permits WHERE status = 'approved' AND expiry_date BETWEEN date('now') AND date('now', '+' || ? || ' days')").get(days);
    return row ? row.count : 0;
  },
  countExpired() {
    const row = getDb().prepare("SELECT COUNT(*) AS count FROM driver_permits WHERE expiry_date < date('now')").get();
    return row ? row.count : 0;
  }
};

// --- VERIFICATION RECORDS ---------------------------------------------------
const verificationOps = {
  record({ target_type, target_id, driver_username, action, reason = '', admin_username = null }) {
    const id = getNextId('verification_records', 'VR-');
    getDb().prepare(`
      INSERT INTO verification_records (id, target_type, target_id, driver_username, action, reason, admin_username)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, target_type, target_id, driver_username, action, reason, admin_username || null);
    return this.findById(id);
  },
  findById(id) {
    return getDb().prepare('SELECT * FROM verification_records WHERE id = ?').get(id);
  },
  listByDriver(driver_username) {
    return getDb().prepare('SELECT * FROM verification_records WHERE driver_username = ? ORDER BY created_at DESC').all(driver_username);
  },
  listRecent(limit = 100) {
    return getDb().prepare('SELECT * FROM verification_records ORDER BY created_at DESC LIMIT ?').all(limit);
  }
};

// --- CROPS -----------------------------------------------------------------
const cropOps = {
  listAll() {
    return getDb().prepare('SELECT * FROM crops ORDER BY created_at DESC').all();
  },
  listByFarmer(farmer) {
    return getDb().prepare('SELECT * FROM crops WHERE farmer = ? ORDER BY created_at DESC').all(farmer);
  },
  findById(id) {
    return getDb().prepare('SELECT * FROM crops WHERE id = ?').get(id);
  },
  create(crop) {
    const txn = getDb().transaction(() => {
      const id = getNextId('crops', 'C');
      getDb().prepare(`
        INSERT INTO crops (id, farmer, name, location, acreage, planting_date, expected_harvest,
          expected_qty, unit, status, soil_type, estimated_rate_kg, created_at)
        VALUES (@id, @farmer, @name, @location, @acreage, @planting_date, @expected_harvest,
          @expected_qty, @unit, @status, @soil_type, @estimated_rate_kg, @created_at)
      `).run({
        id,
        farmer: crop.farmer,
        name: crop.name,
        location: crop.location || '',
        acreage: crop.acreage ?? 1,
        planting_date: crop.planting_date || '',
        expected_harvest: crop.expected_harvest || '',
        expected_qty: crop.expected_qty ?? 1000,
        unit: crop.unit || 'kg',
        status: crop.status || 'growing',
        soil_type: crop.soil_type || 'Loamy',
        estimated_rate_kg: crop.estimated_rate_kg ?? 25,
        created_at: new Date().toISOString()
      });
      return this.findById(id);
    });
    return txn();
  },
  update(id, fields) {
    const allowed = ['name', 'location', 'acreage', 'planting_date', 'expected_harvest',
      'expected_qty', 'unit', 'status', 'soil_type', 'estimated_rate_kg'];
    const updates = [];
    const values = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined || !allowed.includes(k)) continue;
      updates.push(`${k} = @${k}`);
      values[k] = v;
    }
    if (!updates.length) return this.findById(id);
    values.id = id;
    getDb().prepare(`UPDATE crops SET ${updates.join(', ')} WHERE id = @id`).run(values);
    return this.findById(id);
  },
  delete(id) {
    const crop = this.findById(id);
    getDb().prepare('DELETE FROM crops WHERE id = ?').run(id);
    return crop;
  }
};

// --- VEHICLES --------------------------------------------------------------
const vehicleOps = {
  listAll() {
    return getDb().prepare('SELECT * FROM vehicles ORDER BY id').all()
      .map(v => ({ ...v, verified: Boolean(v.verified) }));
  },
  listByDriver(driver) {
    return getDb().prepare('SELECT * FROM vehicles WHERE driver = ?').all(driver)
      .map(v => ({ ...v, verified: Boolean(v.verified) }));
  },
  findById(id) {
    const v = getDb().prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    return v ? { ...v, verified: Boolean(v.verified) } : null;
  },
  findByDriver(driver) {
    const v = getDb().prepare('SELECT * FROM vehicles WHERE driver = ?').get(driver);
    return v ? { ...v, verified: Boolean(v.verified) } : null;
  },
  setStatus(id, status) {
    getDb().prepare('UPDATE vehicles SET status = ? WHERE id = ?').run(status, id);
  },
  create(vehicle) {
    const id = vehicle.id || getNextId('vehicles', 'V');
    getDb().prepare(`
      INSERT INTO vehicles (id, driver, type, number, capacity, fuel_type, mileage, insurance_valid, status, last_service, verified, permit_type, photo_url)
      VALUES (@id, @driver, @type, @number, @capacity, @fuel_type, @mileage, @insurance_valid, @status, @last_service, @verified, @permit_type, @photo_url)
    `).run({
      id,
      driver: vehicle.driver || null,
      type: vehicle.type || 'Truck (10-Ton)',
      number: vehicle.number,
      capacity: Number(vehicle.capacity) || 0,
      fuel_type: vehicle.fuel_type || 'Diesel',
      mileage: Number(vehicle.mileage) || 0,
      insurance_valid: vehicle.insurance_valid || '',
      status: vehicle.status || 'available',
      last_service: vehicle.last_service || '',
      verified: vehicle.verified ? 1 : 0,
      permit_type: vehicle.permit_type || '',
      photo_url: vehicle.photo_url || ''
    });
    return this.findById(id);
  }
};

// --- TRANSPORT REQUESTS ----------------------------------------------------
function hydrateRequest(row) {
  return row ? { ...row, passed_by: parseJson(row.passed_by, []) } : null;
}

const transportOps = {
  listAll() {
    return getDb().prepare('SELECT * FROM transport_requests ORDER BY created_at DESC, id DESC')
      .all().map(hydrateRequest);
  },
  listByFarmer(farmer) {
    return getDb().prepare('SELECT * FROM transport_requests WHERE farmer = ? ORDER BY created_at DESC, id DESC')
      .all(farmer).map(hydrateRequest);
  },
  listForDriver(driver) {
    // Own jobs, plus pending jobs this driver has not passed.
    return getDb().prepare(`
      SELECT DISTINCT tr.*
      FROM transport_requests tr
      LEFT JOIN json_each(tr.passed_by) passed ON passed.value = ?
      WHERE tr.driver = ?
         OR (tr.status = 'pending' AND passed.value IS NULL)
      ORDER BY tr.created_at DESC, tr.id DESC
    `).all(driver, driver).map(hydrateRequest);
  },
  findById(id) {
    return hydrateRequest(getDb().prepare('SELECT * FROM transport_requests WHERE id = ?').get(id));
  },
  create(req) {
    const txn = getDb().transaction(() => {
      const id = getNextId('transport_requests', 'TR');
      getDb().prepare(`
        INSERT INTO transport_requests (id, farmer, farmer_name, farmer_phone, crop, quantity, unit,
          pickup, destination, vehicle_type, pickup_date, preferred_time, estimated_cost, status, created_at)
        VALUES (@id, @farmer, @farmer_name, @farmer_phone, @crop, @quantity, @unit,
          @pickup, @destination, @vehicle_type, @pickup_date, @preferred_time, @estimated_cost, 'pending', @created_at)
      `).run({
        id,
        farmer: req.farmer,
        farmer_name: req.farmer_name || '',
        farmer_phone: req.farmer_phone || '',
        crop: req.crop,
        quantity: req.quantity,
        unit: req.unit || 'kg',
        pickup: req.pickup || '',
        destination: req.destination || '',
        vehicle_type: req.vehicle_type || 'Truck (10-Ton)',
        pickup_date: req.pickup_date || '',
        preferred_time: req.preferred_time || '07:00 AM',
        estimated_cost: req.estimated_cost || 0,
        created_at: new Date().toISOString().split('T')[0]
      });
      return this.findById(id);
    });
    return txn();
  },
  /**
   * Accept a request atomically.
   * The conditional UPDATE is the concurrency guard: exactly one caller can
   * move a request out of 'pending'. A second caller gets HTTP 409.
   */
  accept(requestId, driverUsername, vehicleId, distanceKm, earnings) {
    const txn = getDb().transaction(() => {
      const req = this.findById(requestId);
      if (!req) throw Object.assign(new Error('Transport request not found'), { status: 404 });
      if (req.status !== 'pending') {
        throw Object.assign(new Error(`Request ${requestId} is already ${req.status}`), { status: 409 });
      }

      const claimed = getDb().prepare(`
        UPDATE transport_requests
        SET status = 'matched', driver = ?, vehicle = ?
        WHERE id = ? AND status = 'pending'
      `).run(driverUsername, vehicleId, requestId);
      if (claimed.changes !== 1) {
        throw Object.assign(new Error(`Request ${requestId} was just accepted by another driver`), { status: 409 });
      }

      const vehicleClaim = getDb().prepare(
        "UPDATE vehicles SET status = 'assigned' WHERE id = ? AND status = 'available'"
      ).run(vehicleId);
      if (vehicleClaim.changes !== 1) {
        throw Object.assign(new Error('Selected vehicle is no longer available'), { status: 409 });
      }

      const tripId = getNextId('trips', 'T');
      const fuelEst = Math.round(distanceKm * 0.22 * 10) / 10;
      const etaHours = Math.round((distanceKm / 48) * 10) / 10;
      const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));

      try {
        getDb().prepare(`
          UPDATE transport_requests SET delivery_otp = ? WHERE id = ?
        `).run(deliveryOtp, requestId);

        getDb().prepare(`
          INSERT INTO trips (id, request, driver, vehicle, pickup, destination, cargo, status,
            distance_km, fuel_estimate, eta_hours, earnings, delivery_otp, started_at)
          VALUES (@id, @request, @driver, @vehicle, @pickup, @destination, @cargo, 'scheduled',
            @distance_km, @fuel_estimate, @eta_hours, @earnings, @delivery_otp, @started_at)
        `).run({
          id: tripId,
          request: requestId,
          driver: driverUsername,
          vehicle: vehicleId,
          pickup: req.pickup,
          destination: req.destination,
          cargo: `${req.crop} (${req.quantity} ${req.unit})`,
          distance_km: distanceKm,
          fuel_estimate: fuelEst,
          eta_hours: etaHours,
          earnings: earnings,
          delivery_otp: deliveryOtp,
          started_at: new Date().toISOString()
        });
      } catch (err) {
        if (String(err.message).includes('UNIQUE')) {
          throw Object.assign(new Error('This request already has a trip'), { status: 409 });
        }
        throw err;
      }

      return { request: this.findById(requestId), tripId };
    });
    return txn();
  },
  pass(requestId, driverUsername) {
    const txn = getDb().transaction(() => {
      const req = this.findById(requestId);
      if (!req) throw Object.assign(new Error('Transport request not found'), { status: 404 });
      const passedBy = new Set(req.passed_by);
      passedBy.add(driverUsername);
      getDb().prepare('UPDATE transport_requests SET passed_by = ? WHERE id = ?')
        .run(JSON.stringify([...passedBy]), requestId);
      return this.findById(requestId);
    });
    return txn();
  },
  updateStatus(id, status, extra = {}) {
    const fields = { status, ...extra };
    const updates = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
    getDb().prepare(`UPDATE transport_requests SET ${updates} WHERE id = @id`).run({ ...fields, id });
    return this.findById(id);
  },
  delete(id) {
    return getDb().transaction(() => {
      const req = this.findById(id);
      getDb().prepare('DELETE FROM transport_requests WHERE id = ?').run(id);
      return req;
    })();
  }
};

// --- TRIPS -----------------------------------------------------------------
const tripOps = {
  listAll() {
    return getDb().prepare('SELECT * FROM trips ORDER BY started_at DESC, id DESC').all();
  },
  listByDriver(driver) {
    return getDb().prepare('SELECT * FROM trips WHERE driver = ? ORDER BY started_at DESC, id DESC').all(driver);
  },
  listByRequestIds(requestIds) {
    if (!requestIds.length) return [];
    const placeholders = requestIds.map(() => '?').join(',');
    return getDb().prepare(`SELECT * FROM trips WHERE request IN (${placeholders}) ORDER BY started_at DESC`)
      .all(...requestIds);
  },
  findById(id) {
    return getDb().prepare('SELECT * FROM trips WHERE id = ?').get(id);
  },
  update(id, fields) {
    const allowed = ['status', 'started_at', 'completed_at', 'distance_km', 'eta_hours', 'earnings'];
    return getDb().transaction(() => {
      const before = this.findById(id);
      if (!before) throw Object.assign(new Error('Trip not found'), { status: 404 });

      const updates = [];
      const values = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v === undefined || !allowed.includes(k)) continue;
        updates.push(`${k} = @${k}`);
        values[k] = v;
      }
      if (updates.length) {
        values.id = id;
        getDb().prepare(`UPDATE trips SET ${updates.join(', ')} WHERE id = @id`).run(values);
      }

      const after = this.findById(id);
      if (fields.status === 'completed' && before.status !== 'completed') {
        getDb().prepare("UPDATE vehicles SET status = 'available' WHERE id = ?").run(after.vehicle);
        getDb().prepare(`
          UPDATE transport_requests SET status = 'delivered', delivered_at = ? WHERE id = ?
        `).run(new Date().toISOString(), after.request);
        userOps.incrementTrips(after.driver);
      }
      if (fields.status === 'cancelled' && before.status !== 'cancelled') {
        getDb().prepare("UPDATE vehicles SET status = 'available' WHERE id = ?").run(after.vehicle);
        getDb().prepare("UPDATE transport_requests SET status = 'cancelled' WHERE id = ?").run(after.request);
      }
      return after;
    })();
  },
  completeWithOtp(tripId, enteredOtp, proofOfDelivery = '') {
    return getDb().transaction(() => {
      const trip = this.findById(tripId);
      if (!trip) throw Object.assign(new Error('Trip not found'), { status: 404 });
      const req = transportOps.findById(trip.request);

      const expectedOtp = trip.delivery_otp || req?.delivery_otp;
      if (expectedOtp && String(enteredOtp || '').trim() !== String(expectedOtp).trim()) {
        throw Object.assign(
          new Error('Invalid Delivery OTP. Please request the 4-digit verification code from the receiving farmer.'),
          { status: 400 }
        );
      }

      getDb().prepare(`
        UPDATE trips SET status = 'completed', completed_at = ?, proof_of_delivery = ? WHERE id = ?
      `).run(new Date().toISOString(), proofOfDelivery || '', tripId);

      getDb().prepare("UPDATE vehicles SET status = 'available' WHERE id = ?").run(trip.vehicle);
      getDb().prepare(`
        UPDATE transport_requests SET status = 'delivered', delivered_at = ?, proof_of_delivery = ? WHERE id = ?
      `).run(new Date().toISOString(), proofOfDelivery || '', trip.request);

      userOps.incrementTrips(trip.driver);
      return this.findById(tripId);
    })();
  }
};

// --- FARMS & PLOTS (KrishiDrive 3.0) ---------------------------------------
const farmOps = {
  listAll() {
    return getDb().prepare('SELECT * FROM farms ORDER BY created_at DESC').all()
      .map(f => ({ ...f, boundary_geojson: parseJson(f.boundary_geojson, []) }));
  },
  listByFarmer(farmer) {
    return getDb().prepare('SELECT * FROM farms WHERE farmer = ? ORDER BY created_at DESC').all(farmer)
      .map(f => ({ ...f, boundary_geojson: parseJson(f.boundary_geojson, []) }));
  },
  findById(id) {
    const f = getDb().prepare('SELECT * FROM farms WHERE id = ?').get(id);
    return f ? { ...f, boundary_geojson: parseJson(f.boundary_geojson, []) } : null;
  },
  create(farm) {
    const id = getNextId('farms', 'F');
    const boundary = typeof farm.boundary_geojson === 'string'
      ? farm.boundary_geojson
      : JSON.stringify(farm.boundary_geojson || []);
    getDb().prepare(`
      INSERT INTO farms (
        id, farmer, name, village, district, state, latitude, longitude,
        boundary_geojson, area_acres, area_hectares, soil_type, soil_ph,
        nitrogen, phosphorus, potassium, organic_carbon_percent, is_lab_tested,
        irrigation_type, created_at, updated_at
      ) VALUES (
        @id, @farmer, @name, @village, @district, @state, @latitude, @longitude,
        @boundary_geojson, @area_acres, @area_hectares, @soil_type, @soil_ph,
        @nitrogen, @phosphorus, @potassium, @organic_carbon_percent, @is_lab_tested,
        @irrigation_type, @created_at, @updated_at
      )
    `).run({
      id,
      farmer: farm.farmer,
      name: farm.name || 'My Farm Plot',
      village: farm.village || '',
      district: farm.district || '',
      state: farm.state || 'Maharashtra',
      latitude: Number(farm.latitude) || 0,
      longitude: Number(farm.longitude) || 0,
      boundary_geojson: boundary,
      area_acres: Number(farm.area_acres) || 1,
      area_hectares: Number(farm.area_hectares) || 0.4,
      soil_type: farm.soil_type || 'Loamy',
      soil_ph: Number(farm.soil_ph) || 6.5,
      nitrogen: Number(farm.nitrogen) || 120,
      phosphorus: Number(farm.phosphorus) || 50,
      potassium: Number(farm.potassium) || 40,
      organic_carbon_percent: Number(farm.organic_carbon_percent) || 0.5,
      is_lab_tested: farm.is_lab_tested ? 1 : 0,
      irrigation_type: farm.irrigation_type || 'Borewell',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return this.findById(id);
  },
  update(id, fields) {
    const allowed = [
      'name', 'village', 'district', 'state', 'latitude', 'longitude',
      'boundary_geojson', 'area_acres', 'area_hectares', 'soil_type', 'soil_ph',
      'nitrogen', 'phosphorus', 'potassium', 'organic_carbon_percent', 'is_lab_tested',
      'irrigation_type'
    ];
    const updates = [];
    const values = {};
    for (const [k, v] of Object.entries(fields)) {
      if (!allowed.includes(k) || v === undefined) continue;
      updates.push(`${k} = @${k}`);
      if (k === 'boundary_geojson') {
        values[k] = typeof v === 'string' ? v : JSON.stringify(v || []);
      } else if (k === 'is_lab_tested') {
        values[k] = v ? 1 : 0;
      } else {
        values[k] = v;
      }
    }
    if (!updates.length) return this.findById(id);
    updates.push("updated_at = datetime('now')");
    values.id = id;
    getDb().prepare(`UPDATE farms SET ${updates.join(', ')} WHERE id = @id`).run(values);
    return this.findById(id);
  },
  delete(id) {
    const farm = this.findById(id);
    if (!farm) return null;
    getDb().prepare('DELETE FROM farms WHERE id = ?').run(id);
    return farm;
  }
};

// --- SATELLITE ANALYSES (KrishiDrive 3.0) -----------------------------------
const satelliteOps = {
  listByFarm(farmId) {
    return getDb().prepare('SELECT * FROM satellite_analyses WHERE farm_id = ? ORDER BY created_at DESC').all(farmId)
      .map(r => ({
        ...r,
        environmental_summary: parseJson(r.environmental_summary_json, {}),
        crop_recommendations: parseJson(r.crop_recommendations_json, [])
      }));
  },
  listByFarmer(farmer) {
    return getDb().prepare('SELECT * FROM satellite_analyses WHERE farmer = ? ORDER BY created_at DESC').all(farmer)
      .map(r => ({
        ...r,
        environmental_summary: parseJson(r.environmental_summary_json, {}),
        crop_recommendations: parseJson(r.crop_recommendations_json, [])
      }));
  },
  create(data) {
    const id = getNextId('satellite_analyses', 'SA');
    getDb().prepare(`
      INSERT INTO satellite_analyses (
        id, farm_id, farmer, ndvi, ndwi, evi, soil_moisture_m3_m3,
        surface_temp_c, elevation_m, slope_deg, environmental_summary_json,
        crop_recommendations_json, created_at
      ) VALUES (
        @id, @farm_id, @farmer, @ndvi, @ndwi, @evi, @soil_moisture_m3_m3,
        @surface_temp_c, @elevation_m, @slope_deg, @environmental_summary_json,
        @crop_recommendations_json, @created_at
      )
    `).run({
      id,
      farm_id: data.farm_id,
      farmer: data.farmer,
      ndvi: Number(data.ndvi) || 0.5,
      ndwi: Number(data.ndwi) || 0.2,
      evi: Number(data.evi) || 0.4,
      soil_moisture_m3_m3: Number(data.soil_moisture_m3_m3) || 0.25,
      surface_temp_c: Number(data.surface_temp_c) || 26.5,
      elevation_m: Number(data.elevation_m) || 500,
      slope_deg: Number(data.slope_deg) || 2.0,
      environmental_summary_json: typeof data.environmental_summary === 'string'
        ? data.environmental_summary
        : JSON.stringify(data.environmental_summary || {}),
      crop_recommendations_json: typeof data.crop_recommendations === 'string'
        ? data.crop_recommendations
        : JSON.stringify(data.crop_recommendations || []),
      created_at: new Date().toISOString()
    });
    return getDb().prepare('SELECT * FROM satellite_analyses WHERE id = ?').get(id);
  }
};

// --- SUPPORT TICKETS & AUDIT (KrishiDrive 3.0) ------------------------------
const SUPPORT_TICKET_STATUSES = ['open', 'in_progress', 'resolved'];
const SENSITIVE_DETAIL_KEY = /(otp|password|token|secret|api[_-]?key)/i;

function redactDetails(value) {
  if (Array.isArray(value)) return value.map(redactDetails);
  if (value && typeof value === 'object') {
    const clean = {};
    for (const [key, inner] of Object.entries(value)) {
      clean[key] = SENSITIVE_DETAIL_KEY.test(key) ? '[redacted]' : redactDetails(inner);
    }
    return clean;
  }
  return value;
}

const supportOps = {
  listAll() {
    return getDb().prepare('SELECT * FROM support_tickets ORDER BY escalated DESC, created_at DESC').all()
      .map(ticket => this.decorate(ticket));
  },
  listByUser(username) {
    return getDb().prepare('SELECT * FROM support_tickets WHERE username = ? ORDER BY escalated DESC, created_at DESC').all(username)
      .map(ticket => this.decorate(ticket));
  },
  findById(id) {
    const ticket = getDb().prepare('SELECT * FROM support_tickets WHERE id = ?').get(id);
    return ticket ? this.decorate(ticket) : null;
  },
  decorate(ticket) {
    if (!ticket) return null;
    const { n } = getDb().prepare('SELECT COUNT(*) AS n FROM support_ticket_messages WHERE ticket_id = ?').get(ticket.id);
    return {
      ...ticket,
      escalated: Boolean(ticket.escalated),
      message_count: n || 0
    };
  },
  listMessages(ticketId) {
    return getDb().prepare(
      'SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC, rowid ASC'
    ).all(ticketId);
  },
  create(ticket) {
    const id = getNextId('support_tickets', 'ST');
    getDb().prepare(`
      INSERT INTO support_tickets (id, username, category, title, description, status, escalated, priority, created_at, updated_at)
      VALUES (@id, @username, @category, @title, @description, 'open', 0, 'normal', @created_at, @created_at)
    `).run({
      id,
      username: ticket.username,
      category: ticket.category || 'general',
      title: ticket.title || 'Support Query',
      description: ticket.description || '',
      created_at: new Date().toISOString()
    });
    return this.findById(id);
  },
  addMessage({ ticket_id, author, author_role = 'farmer', body }) {
    const txn = getDb().transaction(() => {
      const id = getNextId('support_ticket_messages', 'TM');
      getDb().prepare(`
        INSERT INTO support_ticket_messages (id, ticket_id, author, author_role, body, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(id, ticket_id, author, author_role, body);
      // The first admin reply lifts an untouched ticket into active handling.
      getDb().prepare(`
        UPDATE support_tickets
        SET updated_at = datetime('now'),
            status = CASE WHEN status = 'open' AND ? = 'admin' THEN 'in_progress' ELSE status END
        WHERE id = ?
      `).run(author_role, ticket_id);
      return getDb().prepare('SELECT * FROM support_ticket_messages WHERE id = ?').get(id);
    });
    return txn();
  },
  updateStatus(id, status) {
    getDb().prepare("UPDATE support_tickets SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    return this.findById(id);
  },
  setEscalated(id, escalated) {
    getDb().prepare(`
      UPDATE support_tickets
      SET escalated = ?,
          status = CASE WHEN ? = 1 AND status = 'open' THEN 'in_progress' ELSE status END,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(escalated ? 1 : 0, escalated ? 1 : 0, id);
    return this.findById(id);
  }
};

const AUDIT_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function auditBoundary(value, endOfDay) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim();
  if (AUDIT_DATE_ONLY.test(raw)) return `${raw} ${endOfDay ? '23:59:59' : '00:00:00'}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

const auditOps = {
  log(action, actor = 'system', details = {}, ip = '') {
    try {
      const id = getNextId('audit_logs', 'AL');
      getDb().prepare(`
        INSERT INTO audit_logs (id, action, actor, details_json, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(id, action, actor, JSON.stringify(details), ip || '');
    } catch (e) {
      console.warn('Audit logging error:', e.message);
    }
  },
  list({ limit = 50, offset = 0, actor, action, from, to, q } = {}) {
    const clauses = [];
    const params = {};
    if (actor) {
      clauses.push('actor = @actor');
      params.actor = actor;
    }
    if (action) {
      clauses.push('action = @action');
      params.action = action;
    }
    const fromBound = auditBoundary(from, false);
    if (fromBound) {
      clauses.push('created_at >= @from');
      params.from = fromBound;
    }
    const toBound = auditBoundary(to, true);
    if (toBound) {
      clauses.push('created_at <= @to');
      params.to = toBound;
    }
    if (q) {
      clauses.push('(actor LIKE @q OR action LIKE @q OR details_json LIKE @q OR ip_address LIKE @q)');
      params.q = `%${q}%`;
    }
    params.limit = limit;
    params.offset = offset;
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return getDb()
      .prepare(`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC, rowid DESC LIMIT @limit OFFSET @offset`)
      .all(params)
      .map(row => ({
        ...row,
        details: redactDetails(parseJson(row.details_json, {}))
      }));
  },
  listRecent(limit = 100) {
    return this.list({ limit });
  },
  filterOptions() {
    return {
      actions: getDb().prepare('SELECT action, COUNT(*) AS count FROM audit_logs GROUP BY action ORDER BY count DESC, action ASC').all(),
      actors: getDb().prepare('SELECT actor, COUNT(*) AS count FROM audit_logs GROUP BY actor ORDER BY actor ASC').all()
    };
  }
};

module.exports = {
  DB_PATH,
  DATA_DIR,
  getDb,
  userOps,
  driverProfileOps,
  farmerProfileOps,
  permitOps,
  verificationOps,
  cropOps,
  farmOps,
  satelliteOps,
  supportOps,
  auditOps,
  vehicleOps,
  transportOps,
  tripOps,
  getNextId,
  SUPPORT_TICKET_STATUSES
};
