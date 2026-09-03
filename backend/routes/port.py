from fastapi import APIRouter
from ..models.schemas import PortStatusResponse, AisVesselItem
from ..agents.port_agent import PortOperationsAgent

router = APIRouter(prefix="/port", tags=["Port Operations"])

@router.get("/status", response_model=PortStatusResponse)
async def get_port_status():
    """
    Returns real-time harbour bar shoaling depth, tide stage, active navigational warnings,
    and AIS vessel queue for Kasimedu Fishing Harbour.
    """
    data = PortOperationsAgent.get_harbour_status()
    vessels = [AisVesselItem(**v) for v in data["vessels"]]

    return PortStatusResponse(
        port_name=data["port_name"],
        status_verdict=data["status_verdict"],
        tide_phase=data["tide_phase"],
        current_depth_datum=data["current_depth_datum"],
        next_high_tide=data["next_high_tide"],
        visibility_nm=data["visibility_nm"],
        vessels_in_perimeter=data["vessels_in_perimeter"],
        active_warnings_count=data["active_warnings_count"],
        direct_vhf_channel=data["direct_vhf_channel"],
        vessels=vessels,
        warnings=data["directives"],
    )

@router.post("/vhf-broadcast")
async def broadcast_vhf_alert():
    """Simulates broadcasting official port warning over marine VHF Channel 16."""
    script = PortOperationsAgent.generate_vhf_broadcast_script()
    return {
        "status": "TRANSMITTED",
        "channel": "VHF Marine Channel 16 (156.800 MHz)",
        "signal_strength": "5/5 OPTIMAL",
        "script": script,
    }
