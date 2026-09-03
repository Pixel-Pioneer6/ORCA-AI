from fastapi import APIRouter
from ..models.schemas import ChatRequest, ChatResponse
from ..agents.router_agent import OrcaRouterAgent

router = APIRouter(prefix="/chat", tags=["Conversational Assistant"])

@router.post("", response_model=ChatResponse)
async def chat_with_orca(req: ChatRequest):
    """
    Multi-turn conversational AI assistant powered by specialized maritime domain agents
    and bounded by the deterministic hydrodynamic safety guardrail.
    """
    result = OrcaRouterAgent.process_query(
        query=req.query,
        vessel_loa=req.vessel_loa or 8.2,
        vessel_hp=req.vessel_hp or 9.9,
        language=req.language or "en",
    )
    return ChatResponse(**result)
