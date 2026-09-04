"""
Real query audit log — PRD FR-5.5 ("full query audit log for authority
accounts"). Every chat/safety query is now actually recorded — who asked
(session + resolved user identity when authenticated), what was asked, what
verdict/confidence came back, and when — persisted to SQLite so it survives
a restart, and readable only by an authenticated, verified authority-tier
account (see routes/audit.py's role gate).
"""
import sqlite3
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "orca_audit.db"
DB_PATH.parent.mkdir(exist_ok=True)


def _connect() -> sqlite3.Connection:
    # NFR-6: a real load test found concurrent writers hitting "database is
    # locked" under load — the `timeout` sets SQLite's busy_timeout so a
    # writer waits (up to 30s) for a lock instead of failing immediately,
    # and WAL mode lets readers proceed without blocking on a writer.
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS query_audit_log (
            id TEXT PRIMARY KEY,
            timestamp_utc TEXT NOT NULL,
            session_id TEXT,
            user_id TEXT,
            identity_value TEXT,
            endpoint TEXT NOT NULL,
            query_text TEXT,
            verdict TEXT,
            confidence TEXT,
            language TEXT
        )""")
        conn.commit()


def log_query(
    endpoint: str,
    query_text: Optional[str] = None,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
    identity_value: Optional[str] = None,
    verdict: Optional[str] = None,
    confidence: Optional[str] = None,
    language: Optional[str] = None,
) -> None:
    entry_id = f"audit_{uuid.uuid4().hex[:12]}"
    with _connect() as conn:
        conn.execute(
            "INSERT INTO query_audit_log "
            "(id, timestamp_utc, session_id, user_id, identity_value, endpoint, query_text, verdict, confidence, language) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                entry_id, datetime.now(timezone.utc).isoformat(), session_id, user_id,
                identity_value, endpoint, query_text, verdict, confidence, language,
            ),
        )
        conn.commit()


def list_recent(limit: int = 200) -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM query_audit_log ORDER BY timestamp_utc DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def count_total() -> int:
    with _connect() as conn:
        return conn.execute("SELECT COUNT(*) c FROM query_audit_log").fetchone()["c"]


init_db()
