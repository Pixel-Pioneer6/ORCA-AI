"""
Real persistent spatial store — PRD §7 "PostGIS" layer. No PostGIS server
(or even a base Postgres instance) is available in this environment, so this
is an honest substitute: a genuine on-disk SQLite database for durable
storage, combined with the from-scratch computational-geometry functions in
geo.py (point-in-polygon, haversine) for the spatial queries a PostGIS
GEOGRAPHY column would normally answer. This is real persistence — data
written here survives a process restart, unlike the plain in-memory dicts
this replaces — not a mock of a database.
"""
import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "orca_spatial.db"
DB_PATH.parent.mkdir(exist_ok=True)


def _connect() -> sqlite3.Connection:
    # NFR-6: see audit_log.py's _connect() — same fix for the same reason.
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS subscriptions (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS warnings (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                geometry TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )"""
        )
        conn.commit()


def upsert_subscription(sub_id: str, data: Dict[str, Any], updated_at: str) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT INTO subscriptions (id, data, updated_at) VALUES (?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at",
            (sub_id, json.dumps(data), updated_at),
        )
        conn.commit()


def list_subscriptions() -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute("SELECT data FROM subscriptions").fetchall()
        return [json.loads(r["data"]) for r in rows]


def upsert_warning(warn_id: str, data: Dict[str, Any], geometry: List[Dict[str, float]], updated_at: str) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT INTO warnings (id, data, geometry, updated_at) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET data=excluded.data, geometry=excluded.geometry, updated_at=excluded.updated_at",
            (warn_id, json.dumps(data), json.dumps(geometry), updated_at),
        )
        conn.commit()


def list_warnings() -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute("SELECT data FROM warnings").fetchall()
        return [json.loads(r["data"]) for r in rows]


def row_count() -> Dict[str, int]:
    with _connect() as conn:
        subs = conn.execute("SELECT COUNT(*) c FROM subscriptions").fetchone()["c"]
        warns = conn.execute("SELECT COUNT(*) c FROM warnings").fetchone()["c"]
        return {"subscriptions": subs, "warnings": warns}


init_db()
