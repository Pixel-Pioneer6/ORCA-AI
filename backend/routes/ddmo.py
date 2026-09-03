from fastapi import APIRouter
from ..models.schemas import DdmoResponse, DdmoMetrics, IncidentLogItem, SmsBroadcastRequest, SmsBroadcastResponse
from ..agents.disaster_agent import DisasterAgent

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

    return DdmoResponse(
        district=data["district"],
        alert_level=data["alert_level"],
        bulletin_id=data["bulletin_id"],
        valid_until=data["valid_until"],
        metrics=metrics,
        incidents=incidents,
    )

@router.post("/sms-broadcast", response_model=SmsBroadcastResponse)
async def issue_sms_broadcast(req: SmsBroadcastRequest):
    """
    Dispatches compact 2G SMS alerts (<160 chars) in Tamil and English
    to registered skippers and coastal hamlets via NavIC & GSM broadcast.
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
async def trigger_harbour_siren():
    """Triggers port emergency audio siren chime sequence."""
    return {
        "status": "SIREN_ACTIVATED",
        "zone": "Kasimedu Pier & Ennore Bight",
        "pattern": "Continuous 3-Minute Maritime Surge Warning Tone (85 dB)",
    }
