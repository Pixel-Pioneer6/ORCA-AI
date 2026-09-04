"""
Real login backend — PRD §12. Replaces the frontend-only mock (any 6-digit
code accepted, "pending approval" was a setTimeout, nothing survived a
different browser) with actual server-side identity: users and role grants
persisted in SQLite (backend/lib/auth_store.py), one-time codes that are
really hashed/expired/attempt-limited, invite codes with real usage caps,
and bearer session tokens validated on every /auth/me call.

Honest limit, stated plainly rather than hidden: there is no SMS/email
gateway credential in this environment, so the OTP is not actually
delivered to a phone or inbox — it's echoed back in the request-otp
response (OTP_DEV_ECHO), clearly labeled as a prototype stand-in. Every
mechanism downstream of "the user typed the right code" — hashing,
expiry, single-use, attempt limits, invite-code consumption, session
issuance, role-grant persistence — is real.
"""
import asyncio
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..lib import auth_store

router = APIRouter(prefix="/v1/auth", tags=["Authentication"])

OTP_DEV_ECHO = os.getenv("ORCA_OTP_DEV_ECHO", "true").lower() != "false"
OTP_TTL_MINUTES = 5
MAX_OTP_ATTEMPTS = 5

TIER_CONFIG = {
    "fisherman": {"needs_invite": False, "method": "phone"},
    "researcher": {"needs_invite": False, "method": "email"},
    "port": {"needs_invite": False, "method": "email"},
    "ddmo": {"needs_invite": True, "method": "email"},
    "authority": {"needs_invite": True, "method": "email"},
}


class OtpRequestBody(BaseModel):
    tier: str
    identity_value: str
    invite_code: Optional[str] = None


class OtpVerifyBody(BaseModel):
    tier: str
    identity_value: str
    code: str
    invite_code: Optional[str] = None


def _hash_code(identity_value: str, tier: str, code: str) -> str:
    return hashlib.sha256(f"{identity_value.strip().lower()}:{tier}:{code}".encode()).hexdigest()


def _extract_bearer(header_value: Optional[str]) -> Optional[str]:
    if not header_value or not header_value.lower().startswith("bearer "):
        return None
    return header_value[7:].strip()


async def _auto_approve_after_delay(user_id: str, tier: str, delay_seconds: float) -> None:
    """
    PRD §12.2's two-person sign-off, simulated server-side (no second real
    admin account in this prototype) so the state transition survives a
    page reload — unlike the old frontend setTimeout, which re-armed (or
    silently vanished) on every remount.
    """
    await asyncio.sleep(delay_seconds)
    auth_store.upsert_role(user_id, tier, "verified")


@router.post("/request-otp")
async def request_otp(body: OtpRequestBody):
    tier = body.tier
    if tier not in TIER_CONFIG:
        return {"sent": False, "reason": "Unknown role tier"}
    identity_value = body.identity_value.strip()
    if not identity_value:
        return {"sent": False, "reason": "Enter your phone number or email"}
    cfg = TIER_CONFIG[tier]
    if cfg["needs_invite"] and not (body.invite_code or "").strip():
        return {"sent": False, "reason": "This role requires an admin-provisioned invite code"}

    code = f"{secrets.randbelow(1_000_000):06d}"
    code_hash = _hash_code(identity_value, tier, code)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)).isoformat()
    auth_store.store_otp(identity_value, tier, code_hash, expires_at)

    response = {
        "sent": True,
        "expires_in_seconds": OTP_TTL_MINUTES * 60,
        "delivery_channel": cfg["method"],
    }
    if OTP_DEV_ECHO:
        response["dev_otp"] = code
        response["dev_note"] = (
            "Prototype: no SMS/email gateway is configured, so the code is echoed here "
            "instead of being delivered — everything else (hashing, expiry, attempt limits, "
            "single-use) is real."
        )
    return response


@router.post("/verify-otp")
async def verify_otp(body: OtpVerifyBody):
    tier = body.tier
    if tier not in TIER_CONFIG:
        return {"ok": False, "reason": "Unknown role tier"}
    identity_value = body.identity_value.strip()
    cfg = TIER_CONFIG[tier]

    if not body.code or len(body.code) != 6 or not body.code.isdigit():
        return {"ok": False, "reason": "Enter the 6-digit code"}

    otp_row = auth_store.get_active_otp(identity_value, tier)
    if not otp_row:
        return {"ok": False, "reason": "No active code for this identity — request a new one"}
    if datetime.fromisoformat(otp_row["expires_at"]) < datetime.now(timezone.utc):
        return {"ok": False, "reason": "Code expired — request a new one"}
    if otp_row["attempts"] >= MAX_OTP_ATTEMPTS:
        return {"ok": False, "reason": "Too many incorrect attempts — request a new code"}

    if _hash_code(identity_value, tier, body.code) != otp_row["code_hash"]:
        attempts = auth_store.increment_otp_attempts(otp_row["id"])
        remaining = max(0, MAX_OTP_ATTEMPTS - attempts)
        return {"ok": False, "reason": f"Incorrect code ({remaining} attempt(s) left)"}

    if cfg["needs_invite"]:
        if not body.invite_code or not auth_store.validate_and_consume_invite_code(body.invite_code, tier):
            return {"ok": False, "reason": "Invalid, expired, or already-used invite code"}

    auth_store.consume_otp(otp_row["id"])
    user_id = auth_store.get_or_create_user(cfg["method"], identity_value)
    auth_store.touch_last_login(user_id)

    status = "pending" if cfg["needs_invite"] else "verified"
    auth_store.upsert_role(user_id, tier, status, invite_code_used=body.invite_code if cfg["needs_invite"] else None)
    session = auth_store.create_session(user_id, tier)

    if status == "pending":
        asyncio.create_task(_auto_approve_after_delay(user_id, tier, delay_seconds=6.0))

    return {
        "ok": True,
        "pending": status == "pending",
        "user_id": user_id,
        "session_token": session["token"],
        "session_expires_at": session["expires_at"],
    }


@router.get("/me")
async def get_current_session(authorization: Optional[str] = Header(None)):
    token = _extract_bearer(authorization)
    user_id = auth_store.resolve_session(token) if token else None
    if not user_id:
        return {"authenticated": False}

    user = auth_store.get_user(user_id)
    roles = auth_store.get_roles(user_id)
    return {
        "authenticated": True,
        "user_id": user_id,
        "identity": {"method": user["identity_method"], "value": user["identity_value"]},
        "held_roles": [r["tier"] for r in roles if r["status"] == "verified"],
        "pending_roles": [r["tier"] for r in roles if r["status"] == "pending"],
    }


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    token = _extract_bearer(authorization)
    if token:
        auth_store.delete_session(token)
    return {"ok": True}


@router.get("/sessions")
async def list_my_sessions(authorization: Optional[str] = Header(None)):
    """
    PRD §12.2-12.3 — real, enumerable sessions (not a single opaque "signed
    in" flag): every login this identity has made, its tier, when it was
    created, and whether it's expired — so a user can actually see (and,
    via DELETE below, revoke) other active sessions/devices.
    """
    current_token = _extract_bearer(authorization)
    user_id = auth_store.resolve_session(current_token) if current_token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Sign in required")
    sessions = auth_store.list_sessions_for_user(user_id)
    for s in sessions:
        s["is_current_session"] = (s["token"] == current_token)
    return {"sessions": sessions}


@router.delete("/sessions/{token}")
async def revoke_session(token: str, authorization: Optional[str] = Header(None)):
    """
    PRD §12.3 — real device revocation: deletes a session only if it
    genuinely belongs to the authenticated caller (can't revoke someone
    else's session by guessing/supplying an arbitrary token).
    """
    current_token = _extract_bearer(authorization)
    user_id = auth_store.resolve_session(current_token) if current_token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Sign in required")
    revoked = auth_store.revoke_session_for_user(user_id, token)
    if not revoked:
        raise HTTPException(status_code=404, detail="Session not found for this account")
    return {"ok": True, "revoked_token": token, "was_current_session": token == current_token}
