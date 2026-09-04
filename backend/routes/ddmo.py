from fastapi import APIRouter, Depends
from ..models.schemas import DdmoResponse, DdmoMetrics, IncidentLogItem, CoastalBlockExposure, SmsBroadcastRequest, SmsBroadcastResponse
from ..agents.disaster_agent import DisasterAgent
from ..lib.auth_dependencies import require_verified_role

router = APIRouter(prefix="/ddmo", tags=["Disaster Management (DDMO)"])

@router.get("/status", response_model=DdmoResponse)
async def get_ddmo_status():
    """
    Returns coastal disaster situation brief, vulnerable population metrics,
    cyclone shelters readiness, and real-time dispatch logs.
    """
    data = DisasterAgent.get_ddmo_status()
    metrics = DdmoMetrics(**data["metrics"])
    incidents = [IncidentLogItem(**inc) for inc in data["incidents"]]
    coastal_blocks = [CoastalBlockExposure(**b) for b in data["coastal_blocks"]]

    return DdmoResponse(
        district=data["district"],
        alert_level=data["alert_level"],
        bulletin_id=data["bulletin_id"],
        valid_until=data["valid_until"],
        metrics=metrics,
        incidents=incidents,
        coastal_blocks=coastal_blocks,
    )

@router.post("/sms-broadcast", response_model=SmsBroadcastResponse)
async def issue_sms_broadcast(req: SmsBroadcastRequest, _user_id: str = Depends(require_verified_role("ddmo"))):
    """
    Dispatches compact 2G SMS alerts (<160 chars) in Tamil and English
    to registered skippers and coastal hamlets via NavIC & GSM broadcast.

    NFR-9: requires a verified DDMO session server-side (not just a
    disabled button in the UI) — an unauthenticated or wrong-role caller
    gets a real 401/403, not a dispatched broadcast.
    """
    res = DisasterAgent.generate_emergency_broadcast(verdict="CAUTION", swh=1.8, wind=24.0)
    sms = res["sms_payload"]

    return SmsBroadcastResponse(
        status="DISPATCHED",
        recipients_count=res["recipients_estimated"],
        payload_en=sms["en"],
        payload_ta=sms["ta"],
        char_count=sms["char_count_ta"],
        delivery_channel="NavIC DAT-SG Transponder & 2G GSM Cell Broadcast",
    )

@router.post("/trigger-siren")
async def trigger_harbour_siren(_user_id: str = Depends(require_verified_role("ddmo"))):
    """Triggers port emergency audio siren chime sequence. NFR-9-gated (see sms-broadcast)."""
    return {
        "status": "SIREN_ACTIVATED",
        "zone": "Kasimedu Pier & Ennore Bight",
        "pattern": "Continuous 3-Minute Maritime Surge Warning Tone (85 dB)",
    }
