import asyncio
from typing import Optional
from fastapi import APIRouter, Header
from ..models.schemas import ChatRequest, ChatResponse
from ..agents.router_agent import OrcaRouterAgent
from ..lib import auth_store, audit_log

router = APIRouter(prefix="/chat", tags=["Conversational Assistant"])

@router.post("", response_model=ChatResponse)
async def chat_with_orca(req: ChatRequest, authorization: Optional[str] = Header(None)):
    """
    Multi-turn conversational AI assistant powered by specialized maritime domain agents
    and bounded by the deterministic hydrodynamic safety guardrail.
    """
    query_text = req.message or req.query or "Is it safe to go out tomorrow morning?"
    # NFR-1/2/6: process_query does blocking I/O (live connector fetch,
    # SQLite session/geocode reads) — run off the event loop so concurrent
    # requests aren't serialized behind it (see safety.py for the load-test
    # finding this responds to).
    result = await asyncio.to_thread(
        OrcaRouterAgent.process_query,
        query_text,
        req.vessel_loa,
        req.vessel_hp,
        req.language or "en",
        req.session_id or "s_default",
        req.location,
    )

    # FR-5.5 — every query is logged, real identity resolved from the
    # bearer token when the caller is signed in (guest queries log with no
    # user_id, which is itself meaningful audit information).
    user_id, identity_value = None, None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        user_id = await asyncio.to_thread(auth_store.resolve_session, token)
        if user_id:
            user = await asyncio.to_thread(auth_store.get_user, user_id)
            identity_value = user["identity_value"] if user else None
    await asyncio.to_thread(
        audit_log.log_query,
        endpoint="/api/chat",
        query_text=query_text,
        session_id=req.session_id,
        user_id=user_id,
        identity_value=identity_value,
        verdict=result.get("verdict"),
        confidence=str(result.get("confidence")),
        language=req.language,
    )

    return ChatResponse(**result)
