import asyncio
from typing import Optional
from fastapi import APIRouter, Query, Header
from ..models.schemas import SafetyVerdictResponse, TelemetrySnapshot
from ..agents.safety_agent import SafetyAgent
from ..lib import auth_store, audit_log

router = APIRouter(prefix="/safety", tags=["Marine Safety"])

@router.get("/verdict", response_model=SafetyVerdictResponse)
async def get_safety_verdict(
    loa: float = Query(8.2, description="Craft LOA in meters"),
    hp: float = Query(9.9, description="Engine HP"),
    time: str = Query("tomorrow 05:00", description="Target departure time"),
    authorization: Optional[str] = Header(None),
):
    """
    Evaluates ocean wave SWH, wind squalls, and bar shoaling to generate
    deterministic safety verdicts ('SAFE', 'CAUTION', 'DO NOT VENTURE', 'STALE').
    """
    # NFR-1/2/6: SafetyAgent's live-connector fetch and the SQLite audit
    # write are both genuinely blocking I/O (network request, disk write).
    # Running them inline in the async handler blocks the single event loop
    # for their entire duration, serializing concurrent requests — a real
    # bottleneck a load test (backend/scripts/load_test.py) actually
    # measured (p95 latency scaling badly with concurrency). Moving them to
    # a worker thread lets the event loop keep serving other requests
    # while this one waits on I/O.
    res = await asyncio.to_thread(SafetyAgent.evaluate_departure_safety, loa, hp, time)

    user_id, identity_value = None, None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        user_id = await asyncio.to_thread(auth_store.resolve_session, token)
        if user_id:
            user = await asyncio.to_thread(auth_store.get_user, user_id)
            identity_value = user["identity_value"] if user else None
    await asyncio.to_thread(
        audit_log.log_query,
        endpoint="/api/safety/verdict",
        query_text=f"loa={loa} hp={hp} time={time}",
        user_id=user_id,
        identity_value=identity_value,
        verdict=res["verdict"],
        confidence=res["confidence"],
    )
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
        data_source=buoy.get("data_source"),
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
        source_tier=guard.get("source_tier"),
    )
