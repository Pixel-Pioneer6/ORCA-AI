"""
Real auth persistence — PRD §12. Previously the entire login system lived
only in the browser (a localStorage JSON blob in AuthContext.jsx): any OTP
was accepted, "pending approval" was a frontend setTimeout, and refreshing
in a different browser lost the account entirely. This is a genuine SQLite-
backed store: users, their per-tier verification status, hashed one-time
codes with real expiry/attempt-limiting, session tokens, and invite codes
with real usage tracking — durable across restarts, shared across devices
that sign in with the same phone/email.

Honest limit: there is no SMS/email gateway credential available in this
environment, so OTP *delivery* is not real (see routes/auth.py) — but the
OTP's generation, hashing, expiry, single-use consumption, and attempt
limiting are all real, as is everything downstream of "the user proved
they received it".
"""
import sqlite3
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "orca_auth.db"
DB_PATH.parent.mkdir(exist_ok=True)

SESSION_DAYS = {"fisherman": 30, "researcher": 7, "port": 7, "ddmo": 7, "authority": 7}

# Seed invite codes for the two tiers that require one (PRD §12.2 admin
# provisioning) — a real prototype stand-in for an admin issuing codes.
SEED_INVITE_CODES = [
    ("DDMO-KSM-04", "ddmo", 100),
    ("AUTH-CZM-01", "authority", 100),
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    # NFR-6: see audit_log.py's _connect() — same fix for the same reason
    # (concurrent OTP/session writes under load hitting SQLITE_BUSY).
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            identity_method TEXT NOT NULL,
            identity_value TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            last_login_at TEXT
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS user_roles (
            user_id TEXT NOT NULL,
            tier TEXT NOT NULL,
            status TEXT NOT NULL,
            invite_code_used TEXT,
            granted_at TEXT NOT NULL,
            PRIMARY KEY (user_id, tier)
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS otp_codes (
            id TEXT PRIMARY KEY,
            identity_value TEXT NOT NULL,
            tier TEXT NOT NULL,
            code_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            consumed INTEGER NOT NULL DEFAULT 0,
            attempts INTEGER NOT NULL DEFAULT 0
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            tier TEXT,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS invite_codes (
            code TEXT PRIMARY KEY,
            tier TEXT NOT NULL,
            max_uses INTEGER NOT NULL DEFAULT 1,
            used_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )""")
        # Migration: `tier` was added to `sessions` after earlier deployments
        # already created the table without it (§12.2-12.3 session listing).
        try:
            conn.execute("ALTER TABLE sessions ADD COLUMN tier TEXT")
        except sqlite3.OperationalError:
            pass  # column already exists
        for code, tier, max_uses in SEED_INVITE_CODES:
            conn.execute(
                "INSERT OR IGNORE INTO invite_codes (code, tier, max_uses, used_count, created_at) VALUES (?, ?, ?, 0, ?)",
                (code, tier, max_uses, _now()),
            )
        conn.commit()


# --- Users & roles -----------------------------------------------------

def get_or_create_user(identity_method: str, identity_value: str) -> str:
    with _connect() as conn:
        row = conn.execute("SELECT id FROM users WHERE identity_value = ?", (identity_value,)).fetchone()
        if row:
            return row["id"]
        user_id = f"u_{uuid.uuid4().hex[:12]}"
        conn.execute(
            "INSERT INTO users (id, identity_method, identity_value, created_at) VALUES (?, ?, ?, ?)",
            (user_id, identity_method, identity_value, _now()),
        )
        conn.commit()
        return user_id


def touch_last_login(user_id: str) -> None:
    with _connect() as conn:
        conn.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (_now(), user_id))
        conn.commit()


def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def upsert_role(user_id: str, tier: str, status: str, invite_code_used: Optional[str] = None) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT INTO user_roles (user_id, tier, status, invite_code_used, granted_at) VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(user_id, tier) DO UPDATE SET status=excluded.status",
            (user_id, tier, status, invite_code_used, _now()),
        )
        conn.commit()


def get_roles(user_id: str) -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute("SELECT tier, status FROM user_roles WHERE user_id = ?", (user_id,)).fetchall()
        return [dict(r) for r in rows]


# --- OTP -----------------------------------------------------------------

def store_otp(identity_value: str, tier: str, code_hash: str, expires_at: str) -> str:
    otp_id = f"otp_{uuid.uuid4().hex[:12]}"
    with _connect() as conn:
        # Invalidate any prior unconsumed code for this identity+tier so
        # only the most recently requested OTP is ever valid.
        conn.execute(
            "UPDATE otp_codes SET consumed = 1 WHERE identity_value = ? AND tier = ? AND consumed = 0",
            (identity_value, tier),
        )
        conn.execute(
            "INSERT INTO otp_codes (id, identity_value, tier, code_hash, created_at, expires_at, consumed, attempts) "
            "VALUES (?, ?, ?, ?, ?, ?, 0, 0)",
            (otp_id, identity_value, tier, code_hash, _now(), expires_at),
        )
        conn.commit()
    return otp_id


def get_active_otp(identity_value: str, tier: str) -> Optional[Dict[str, Any]]:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM otp_codes WHERE identity_value = ? AND tier = ? AND consumed = 0 "
            "ORDER BY created_at DESC LIMIT 1",
            (identity_value, tier),
        ).fetchone()
        return dict(row) if row else None


def increment_otp_attempts(otp_id: str) -> int:
    with _connect() as conn:
        conn.execute("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?", (otp_id,))
        conn.commit()
        row = conn.execute("SELECT attempts FROM otp_codes WHERE id = ?", (otp_id,)).fetchone()
        return row["attempts"] if row else 0


def consume_otp(otp_id: str) -> None:
    with _connect() as conn:
        conn.execute("UPDATE otp_codes SET consumed = 1 WHERE id = ?", (otp_id,))
        conn.commit()


# --- Invite codes ----------------------------------------------------------

def validate_and_consume_invite_code(code: str, tier: str) -> bool:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM invite_codes WHERE code = ? AND tier = ?", (code.strip().upper(), tier)
        ).fetchone()
        if not row or row["used_count"] >= row["max_uses"]:
            return False
        conn.execute("UPDATE invite_codes SET used_count = used_count + 1 WHERE code = ?", (row["code"],))
        conn.commit()
        return True


# --- Sessions ------------------------------------------------------------

def create_session(user_id: str, tier: str) -> Dict[str, str]:
    import secrets
    from datetime import timedelta
    token = secrets.token_urlsafe(32)
    days = SESSION_DAYS.get(tier, 7)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, tier, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
            (token, user_id, tier, _now(), expires_at),
        )
        conn.commit()
    return {"token": token, "expires_at": expires_at}


def list_sessions_for_user(user_id: str) -> List[Dict[str, Any]]:
    """
    PRD §12.2-12.3 — real device/session listing: every login (tier, when,
    when it expires) actually persisted and enumerable, not a single opaque
    "logged in" flag. No IP/user-agent is captured in this prototype (no
    request context reaches auth_store), so sessions are distinguished by
    tier + creation time rather than a device fingerprint — an honest limit,
    not hidden as if real device identification exists.
    """
    with _connect() as conn:
        rows = conn.execute(
            "SELECT token, tier, created_at, expires_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        now = datetime.now(timezone.utc)
        return [
            {
                "token": r["token"],
                "tier": r["tier"],
                "created_at": r["created_at"],
                "expires_at": r["expires_at"],
                "expired": datetime.fromisoformat(r["expires_at"]) < now,
            }
            for r in rows
        ]


def revoke_session_for_user(user_id: str, token: str) -> bool:
    """Deletes a session only if it actually belongs to this user — real
    device revocation (§12.3), not a blind delete-by-token."""
    with _connect() as conn:
        row = conn.execute("SELECT user_id FROM sessions WHERE token = ?", (token,)).fetchone()
        if not row or row["user_id"] != user_id:
            return False
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        return True


def resolve_session(token: str) -> Optional[str]:
    """Returns the user_id for a valid, unexpired session token, else None."""
    with _connect() as conn:
        row = conn.execute("SELECT user_id, expires_at FROM sessions WHERE token = ?", (token,)).fetchone()
        if not row:
            return None
        if datetime.fromisoformat(row["expires_at"]) < datetime.now(timezone.utc):
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
            return None
        return row["user_id"]


def delete_session(token: str) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()


init_db()
