import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "availability.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS schedules (
                id           TEXT PRIMARY KEY,
                edit_id      TEXT UNIQUE NOT NULL,
                name         TEXT NOT NULL DEFAULT 'My Availability',
                timezone     TEXT NOT NULL DEFAULT 'UTC',
                accent_color TEXT NOT NULL DEFAULT '#3b82f6',
                created_at   TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS availability_blocks (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
                label       TEXT,
                type        TEXT NOT NULL CHECK(type IN ('recurring', 'oneoff')),
                day_of_week INTEGER,
                date        TEXT,
                start_time  TEXT NOT NULL,
                end_time    TEXT NOT NULL
            );
        """)
