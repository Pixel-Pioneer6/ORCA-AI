from fastapi import APIRouter, Query
from ..models.schemas import SafetyVerdictResponse, TelemetrySnapshot
from ..agents.safety_agent import SafetyAgent

router = APIRouter(prefix="/safety", tags=["Marine Safety"])

@router.get("/verdict", response_model=SafetyVerdictResponse)
async def get_safety_verdict(
    loa: float = Query(8.2, description="Craft LOA in meters"),
    hp: float = Query(9.9, description="Engine HP"),
    time: str = Query("tomorrow 05:00", description="Target departure time")
):
    """
    Evaluates ocean wave SWH, wind squalls, and bar shoaling to generate
    deterministic safety verdicts ('SAFE', 'CAUTION', 'DO NOT VENTURE', 'STALE').
    """
    res = SafetyAgent.evaluate_departure_safety(loa=loa, hp=hp, target_time=time)
    buoy = res["telemetry"]
    guard = res["guardrail"]

    telemetry_snap = TelemetrySnapshot(
        swh=buoy["swh"],
        wind_speed=buoy["wind_speed"],
        wind_gust=buoy["wind_gust"],
        swell_direction=buoy["swell_direction"],
        swell_period=buoy["wave_period"],
        current_velocity=buoy["surface_current"],
        sst=buoy["sst"],
        timestamp=buoy["timestamp"],
    )

    state_map = {
        "SAFE": "safe",
        "CAUTION": "caution",
        "DO NOT VENTURE": "danger",
        "STALE": "stale"
    }
    state_val = state_map.get(res["verdict"].upper(), "caution")

    return SafetyVerdictResponse(
        state=state_val,
        verdict_title=f"{res['verdict']} — {res['sub_status']}",
        verdict_ta=res["verdict_ta"],
        verdict_hi=res["verdict_hi"],
        sub_status=res["sub_status"],
        confidence=res["confidence"],
        advisory_en=res["advisory_en"],
        advisory_ta=res["advisory_ta"],
        target_window=res["target_window"],
        telemetry=telemetry_snap,
        exceedance_wave_pct=guard["wave_exceedance_pct"],
        exceedance_wind_pct=guard["wind_exceedance_pct"],
        craft_max_wave=guard["craft_max_wave"],
        craft_max_wind=guard["craft_max_wind"],
        sources=res["sources"],
        hourly_forecast=res["hourly_forecast"],
    )
