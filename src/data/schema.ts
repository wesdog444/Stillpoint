export const TABLE_NAMES = [
  'sessions',
  'presets',
  'blocklists',
  'blocklist_sites',
  'intentions',
  'streak_days',
  'cheat_passes',
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

export const CREATE_TABLE_SQL: Record<TableName, string> = {
  sessions: `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_planned INTEGER NOT NULL,
    preset_id INTEGER,
    completed INTEGER NOT NULL DEFAULT 0
  );`,

  presets: `CREATE TABLE IF NOT EXISTS presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    blocklist_id INTEGER,
    friction_mode TEXT NOT NULL DEFAULT 'soft',
    schedule_enabled INTEGER NOT NULL DEFAULT 0,
    schedule_start TEXT,
    schedule_end TEXT,
    schedule_weekdays TEXT
  );`,

  blocklists: `CREATE TABLE IF NOT EXISTS blocklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    always_gated INTEGER NOT NULL DEFAULT 0
  );`,

  blocklist_sites: `CREATE TABLE IF NOT EXISTS blocklist_sites (
    blocklist_id INTEGER NOT NULL,
    site_key TEXT NOT NULL,
    PRIMARY KEY (blocklist_id, site_key)
  );`,

  intentions: `CREATE TABLE IF NOT EXISTS intentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    text TEXT NOT NULL,
    site_key TEXT,
    session_id INTEGER
  );`,

  streak_days: `CREATE TABLE IF NOT EXISTS streak_days (
    date TEXT UNIQUE NOT NULL,
    session_count INTEGER NOT NULL DEFAULT 0
  );`,

  cheat_passes: `CREATE TABLE IF NOT EXISTS cheat_passes (
    date TEXT NOT NULL,
    site_key TEXT NOT NULL,
    used_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (date, site_key)
  );`,
};
