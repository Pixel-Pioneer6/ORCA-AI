"""
Real executive directive issuance — closes the same gap NFR-9 fixed for the
DDMO/Port broadcast buttons: "Issue Executive Directive" on the Authority
dashboard was gated behind a client-side isVerifiedAuthority check but had
no server-side effect or record at all — any directive "issued" vanished
the moment the local setTimeout cleared it. Every directive is now actually
persisted (who, what, when), survives a restart, and the issuing endpoint
requires the same real verified-Authority session check as everything else.
"""
import sqlite3
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "orca_directives.db"
DB_PATH.parent.mkdir(exist_ok=True)


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS directives (
            id TEXT PRIMARY KEY,
            issued_at_utc TEXT NOT NULL,
            issued_by_user_id TEXT NOT NULL,
            action_name TEXT NOT NULL,
            jurisdiction TEXT
        )""")
        conn.commit()


def issue_directive(user_id: str, action_name: str, jurisdiction: str = "Coromandel Zone 04") -> Dict[str, Any]:
    directive_id = f"dir_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO directives (id, issued_at_utc, issued_by_user_id, action_name, jurisdiction) VALUES (?, ?, ?, ?, ?)",
            (directive_id, now, user_id, action_name, jurisdiction),
        )
        conn.commit()
    return {"id": directive_id, "issued_at_utc": now, "action_name": action_name, "jurisdiction": jurisdiction}


def list_directives(limit: int = 50) -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM directives ORDER BY issued_at_utc DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


init_db()
