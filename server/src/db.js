import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

let schemaReady = false;
export function initSchema() {
  if (schemaReady) return;
  schemaReady = true;
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL CHECK(role IN ('admin','dealer','user')),
      dealer_id     TEXT,                       -- for role=user: owning dealer; for role=dealer: null
      country       TEXT,                        -- ISO country code of the account
      locale        TEXT DEFAULT 'zh',
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id            TEXT PRIMARY KEY,
      serial        TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      type          TEXT NOT NULL,
      owner_user_id TEXT,                        -- end user owning the device
      dealer_id     TEXT,                        -- dealer that sold the device
      country       TEXT NOT NULL,               -- country the device is deployed / sold to
      firmware      TEXT DEFAULT '1.0.0',
      status        TEXT NOT NULL DEFAULT 'offline', -- online | offline
      alarm         TEXT NOT NULL DEFAULT 'normal',  -- normal | warning | critical
      last_seen     INTEGER,
      created_at    INTEGER NOT NULL
    );

    -- rolling telemetry history (capped per device by the writer)
    CREATE TABLE IF NOT EXISTS telemetry (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      ts        INTEGER NOT NULL,
      alarm     TEXT NOT NULL DEFAULT 'normal',
      payload   TEXT NOT NULL,
      FOREIGN KEY(device_id) REFERENCES devices(id)
    );
    CREATE INDEX IF NOT EXISTS idx_tel_device_ts ON telemetry(device_id, ts);

    CREATE TABLE IF NOT EXISTS events (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      ts        INTEGER NOT NULL,
      level     TEXT NOT NULL,            -- info | warning | critical
      code      TEXT NOT NULL,
      message   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_evt_device_ts ON events(device_id, ts);
  `);
}

// Ensure the schema exists as soon as the db module is loaded, so modules that
// prepare statements at import time (e.g. ingest.js) work regardless of import order.
initSchema();
