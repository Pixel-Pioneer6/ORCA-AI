"""
Real server-side role enforcement — PRD NFR-9. Previously "verified DDMO/
Port officer" gating existed only in the React UI (a disabled button, an
openAuth() redirect) — the backend endpoints themselves accepted any
request with no identity check at all, so a direct curl/Postman call to
POST /api/ddmo/sms-broadcast or /api/port/vhf-broadcast succeeded for
anyone, verified or not. This is a real FastAPI dependency that resolves
the bearer session token against the SQLite auth store (backend/lib/
auth_store.py) and rejects the request server-side if the required tier
isn't actually verified for that user — the same enforcement point every
caller goes through, not just the ones the frontend happens to render a
lock icon for.
"""
from typing import Optional
from fastapi import Header, HTTPException

from . import auth_store


def require_verified_role(tier: str):
    """Returns a FastAPI dependency that 401s with no/invalid session and
    403s if the session exists but doesn't hold the verified tier."""

    async def _dependency(authorization: Optional[str] = Header(None)) -> str:
        token = authorization[7:].strip() if authorization and authorization.lower().startswith("bearer ") else None
        user_id = auth_store.resolve_session(token) if token else None
        if not user_id:
            raise HTTPException(status_code=401, detail="Sign in required")
        roles = auth_store.get_roles(user_id)
        if not any(r["tier"] == tier and r["status"] == "verified" for r in roles):
            raise HTTPException(status_code=403, detail=f"Verified '{tier}' role required for this action")
        return user_id

    return _dependency
