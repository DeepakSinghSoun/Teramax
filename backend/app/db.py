"""SQLite storage for users, devices, sessions, agent reports, command journal, alerts."""
import sqlite3
from contextlib import contextmanager
from .config import DB_PATH, DATA_DIR, DEFAULT_SETTINGS

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL, department TEXT DEFAULT '',
  pc_number TEXT DEFAULT '', password_hash TEXT NOT NULL, role TEXT DEFAULT 'user',
  member_since REAL, verified INTEGER DEFAULT 0, blocked INTEGER DEFAULT 0,
  created_at REAL NOT NULL, signup_ip TEXT);
CREATE TABLE IF NOT EXISTS devices(
  id INTEGER PRIMARY KEY AUTOINCREMENT, key_hash TEXT UNIQUE NOT NULL,
  mac TEXT, ip TEXT, hostname TEXT, os TEXT, first_seen REAL, last_seen REAL,
  usb INTEGER DEFAULT 0, usb_names TEXT DEFAULT '[]', user_id INTEGER,
  category TEXT DEFAULT 'normal', level INTEGER DEFAULT 1, risk REAL DEFAULT 0,
  reasons TEXT DEFAULT '[]', probs TEXT DEFAULT '{}', features TEXT DEFAULT '{}',
  classified_at REAL DEFAULT 0, cleared_at REAL DEFAULT 0,
  blocked INTEGER DEFAULT 0, access INTEGER DEFAULT 0, access_reason TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS sessions(
  token TEXT PRIMARY KEY, user_id INTEGER, role TEXT, ip TEXT, device_id INTEGER,
  created REAL, expires REAL);
CREATE TABLE IF NOT EXISTS reports(
  id INTEGER PRIMARY KEY AUTOINCREMENT, device_id INTEGER, user_id INTEGER, ts REAL,
  usb INTEGER, usb_events INTEGER, cmd_count INTEGER, sudo_count INTEGER,
  danger_count INTEGER, net_count INTEGER, tamper_count INTEGER);
CREATE INDEX IF NOT EXISTS ix_reports ON reports(device_id, ts);
CREATE TABLE IF NOT EXISTS commands(
  id INTEGER PRIMARY KEY AUTOINCREMENT, device_id INTEGER, user_id INTEGER,
  ts REAL, command TEXT, flags TEXT);
CREATE INDEX IF NOT EXISTS ix_commands ON commands(device_id, ts);
CREATE TABLE IF NOT EXISTS alerts(
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts REAL, device_id INTEGER, user_id INTEGER,
  level INTEGER, message TEXT, kind TEXT DEFAULT 'category', command TEXT, flags TEXT);
CREATE TABLE IF NOT EXISTS incidents(
  user_id INTEGER, day TEXT, level INTEGER, PRIMARY KEY(user_id, day));
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
"""


@contextmanager
def conn():
    c = sqlite3.connect(DB_PATH, timeout=15)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL")
    try:
        yield c
        c.commit()
    finally:
        c.close()


def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with conn() as c:
        c.executescript(SCHEMA)
        for col, ddl in (("kind", "TEXT DEFAULT 'category'"), ("command", "TEXT"), ("flags", "TEXT")):
            try:                      # upgrade databases created by an older version
                c.execute(f"ALTER TABLE alerts ADD COLUMN {col} {ddl}")
            except sqlite3.OperationalError:
                pass
        for k, v in DEFAULT_SETTINGS.items():
            c.execute("INSERT OR IGNORE INTO settings VALUES(?,?)", (k, str(v)))


def get_settings(c):
    s = {k: int(v) for k, v in DEFAULT_SETTINGS.items()}
    for r in c.execute("SELECT key,value FROM settings"):
        if r["key"] in s:
            s[r["key"]] = int(r["value"])
    return s
