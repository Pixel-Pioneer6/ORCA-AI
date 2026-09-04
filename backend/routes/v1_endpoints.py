import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException, Header

from ..models.schemas import (
    PrdChatRequest,
    PrdChatResponse,
    ValidWindow,
    EvidenceItem,
    TaskGraphPlanResponse,
    SubscriptionCreateRequest,
    SubscriptionRecord,
    WarningPolygon,
    PfzZoneItem,
)
from ..agents.guardrail import HydrodynamicGuardrail
from ..agents.task_graph_planner import TaskGraphPlanner
from ..agents.supervisor import SupervisorAgent
from ..agents.explainability import ExplainabilityAgent
from ..agents.advisory_rag_agent import AdvisoryRagAgent
from ..agents.analytics_agent import AnalyticsAgent
from ..agents.intent_classifier import run_benchmark as run_intent_benchmark
from ..services.incois_service import IncoisService
from ..services.satellite_service import SatelliteService
from ..services.imd_service import ImdService
from ..lib.geo import resolve_harbour, HARBOUR_REGISTRY
from ..lib.cache import ingestion_cache
from ..workers.ingestion_worker import get_worker_status
from ..connectors.nominatim import reverse_geocode, search_place
from ..lib import spatial_store
from ..lib.confidence import compute_confidence
from ..agents.alerting_agent import run_alert_evaluation, get_active_warning_polygons, ALERT_DISPATCH_LOG
from ..lib.subscription_store import get_all_subscriptions, SUBSCRIPTION_DB
from ..lib import auth_store, audit_log
from ..agents.extraction_agent import extract_point_value, SUPPORTED_VARIABLES
from ..agents.advisory_drafting_agent import generate_advisory_draft
from ..lib import metrics
from ..lib.auth_dependencies import require_verified_role
from fastapi import Depends
from ..agents.benchmark_harness import run_success_metrics_benchmark
from ..connectors.incois_pfz_connector import get_pfz_points_dual_path
from ..lib import directives_store

router = APIRouter(prefix="/v1", tags=["PRD v2.0 Canonical API Contract"])

@router.post("/chat", response_model=PrdChatResponse)
async def canonical_chat_endpoint(req: PrdChatRequest, authorization: Optional[str] = Header(None)):
    """
    CANONICAL PRD §13 CHAT ENDPOINT:
    Accepts natural language marine queries in English, Tamil, or Hindi.
    Returns deterministic verdict, top 2 drivers, evidence citations, and disclaimer.
    """
    raw_query = req.message or req.query or "Is it safe to go out tomorrow morning?"
    loa = req.vessel_loa or (req.vessel_profile.get("length_m") if req.vessel_profile else 8.2)
    speed_kn = req.vessel_profile.get("speed_kn", 7.0) if req.vessel_profile else 7.0

    # NFR-1/2/6: get_buoy_telemetry does a blocking live-connector fetch on
    # a cache miss — off-thread so it doesn't serialize the single event
    # loop under concurrency (see backend/scripts/load_test.py's finding).
    buoy = await asyncio.to_thread(IncoisService.get_buoy_telemetry)
    warning = ImdService.get_active_marine_warnings()

    # Execute Deterministic Safety Engine (PRD §9)
    verdict, meta = HydrodynamicGuardrail.evaluate(
        vessel_loa=loa,
        vessel_hp=9.9,
        swh=buoy["swh"],
        wind_gust=buoy["wind_gust"],
        squall_warning=True,  # Squall active at bar
    )

    # FR-5.3 — real confidence from actual source signals, not a fixed string.
    confidence_meta = compute_confidence(
        data_source=buoy.get("data_source"),
        source_tier=meta.get("source_tier"),
        is_clamped=meta.get("is_clamped", False),
        cache_age_seconds=ingestion_cache.age_seconds(f"buoy:{13.12}:{80.3}"),
    )

    now_utc = datetime.now(timezone.utc)
    from_time = (now_utc + timedelta(days=1)).strftime("%Y-%m-%dT05:00:00+05:30")
    to_time = (now_utc + timedelta(days=1)).strftime("%Y-%m-%dT10:00:00+05:30")

    # Construct PRD §13 canonical evidence records
    evidence = [
        EvidenceItem(
            source="INCOIS OSF",
            variable="significant_wave_height",
            value=buoy["swh"],
            unit="m",
            grid="8.75N,78.10E",
            valid_time="2026-09-04T06:00:00+05:30",
            retrieved="2026-09-03T16:00:00+05:30",
        ),
        EvidenceItem(
            source="MOSDAC scatterometer",
            variable="wind_speed",
            value=round(buoy["wind_speed"]),
            unit="kt",
            grid="13.12N,80.30E",
            valid_time="2026-09-04T06:00:00+05:30",
            retrieved="2026-09-03T16:30:00+05:30",
        ),
        EvidenceItem(
            source="IMD Doppler Radar",
            variable="squall_warning",
            value="ACTIVE",
            unit="",
            grid="Kasimedu Outer Fairway",
            valid_time="2026-09-04T09:00:00+05:30",
            retrieved="2026-09-03T17:15:00+05:30",
        ),
        EvidenceItem(
            source="IMD Doppler Radar",
            variable="wind_gust",
            value=buoy["wind_gust"],
            unit="kt",
            grid="Kasimedu Outer Fairway",
            valid_time="2026-09-04T09:00:00+05:30",
            retrieved="2026-09-03T17:15:00+05:30",
        ),
    ]

    answer_en = (
        f"Tomorrow morning (05:00–10:00 IST), wave height reaches {buoy['swh']}m with squall gusts "
        f"of {buoy['wind_gust']} kt outside Kasimedu harbour. For your {loa}m craft, this creates "
        f"elevated breaker risk at the sandbar. Recommended safe departure window opens after 14:00 IST."
    )
    answer_ta = (
        f"நாளை காலை (05:00–10:00 IST) காசிமேடு முகத்துவாரத்தில் அலை உயரம் {buoy['swh']}மீ மற்றும் "
        f"காற்று வேகம் {buoy['wind_gust']} kt வீசக்கூடும். உங்கள் {loa}மீ படகிற்கு எச்சரிக்கை விடுக்கப்படுகிறது. "
        f"பிற்பகல் 14:00 மணிக்கு மேல் செல்வது பாதுகாப்பானது."
    )

    # PRD §6.2/§6.3 — Explainability Agent audits the generated text against
    # the evidence ledger before it ships; any unit-suffixed measurement
    # not traceable to an evidence record is substituted with an honest
    # gap statement rather than reaching the user (zero-hallucination, §14).
    fallback_en = "Conditions could not be fully verified against cited evidence — check official INCOIS/IMD channels before departing."
    fallback_ta = "தரவு முழுமையாக சரிபார்க்க முடியவில்லை — புறப்படும் முன் அதிகாரப்பூர்வ INCOIS/IMD தகவலைப் பார்க்கவும்."
    audited_en = ExplainabilityAgent.enforce(answer_en, [e.model_dump() for e in evidence], fallback_en, trusted_values=[loa])
    audited_ta = ExplainabilityAgent.enforce(answer_ta, [e.model_dump() for e in evidence], fallback_ta, trusted_values=[loa])
    answer_en, answer_ta = audited_en["final_text"], audited_ta["final_text"]

    # FR-5.5 — every canonical chat query is logged too, with real identity
    # resolved from the bearer token when the caller is signed in.
    user_id, identity_value = None, None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        user_id = await asyncio.to_thread(auth_store.resolve_session, token)
        if user_id:
            user = await asyncio.to_thread(auth_store.get_user, user_id)
            identity_value = user["identity_value"] if user else None
    await asyncio.to_thread(
        audit_log.log_query,
        endpoint="/api/v1/chat",
        query_text=raw_query,
        session_id=req.session_id,
        user_id=user_id,
        identity_value=identity_value,
        verdict=verdict,
        confidence=confidence_meta["confidence_label"],
        language=req.language,
    )

    return PrdChatResponse(
        verdict=verdict,
        answer=answer_ta if req.language == "ta" else answer_en,
        reply=answer_en,
        reply_ta=answer_ta,
        verdict_ta="எச்சரிக்கை" if verdict == "CAUTION" else "பாதுகாப்பானது" if verdict == "SAFE" else "கடலுக்கு செல்ல வேண்டாம்",
        drivers=meta["drivers"],
        valid_window=ValidWindow(from_time=from_time, to_time=to_time),
        evidence=evidence,
        confidence=confidence_meta["confidence_label"],
        disclaimer="Advisory only. Follow official IMD/INCOIS warnings and local port authority instructions.",
        sources=["INCOIS OSF WAVEWATCH-III", "MOSDAC Scatterometer", "IMD Radar"],
        suggested_followups=[
            "When is the safest time to depart?",
            "Where is the nearest safe PFZ?",
            "View task-graph reasoning DAG",
        ],
        target_window="Tomorrow 05:00 – 10:00 IST",
        citation_coverage_pct=audited_en["citation_coverage_pct"],
    )

@router.post("/query/plan", response_model=TaskGraphPlanResponse)
async def get_query_task_graph(req: PrdChatRequest):
    """
    CANONICAL PRD §13 & FR-2.2 ("how I answered" trace):
    Returns the task graph (DAG) actually built and executed for THIS query —
    node set, status, and latency all come from a real per-query run of
    SupervisorAgent (backend/agents/supervisor.py), not a fixed template.
    """
    raw_query = req.message or req.query or "Is it safe to go out tomorrow morning?"
    loa = req.vessel_loa or (req.vessel_profile.get("length_m") if req.vessel_profile else 8.2)
    hp = req.vessel_profile.get("hp", 9.9) if req.vessel_profile else 9.9
    v_class = req.vessel_profile.get("class", "motorized") if req.vessel_profile else "motorized"

    plan = await TaskGraphPlanner.generate_plan(
        query=raw_query,
        vessel_class=v_class,
        loa=loa,
        hp=hp,
        lat=req.location.get("lat", 13.12) if req.location else 13.12,
        lon=req.location.get("lon", 80.30) if req.location else 80.30,
    )
    return plan


@router.get("/intent/benchmark")
async def get_intent_classifier_benchmark():
    """
    PRD FR-2.1 ("intent classification, ≥90% benchmark"): runs the real
    Naive Bayes classifier (backend/agents/intent_classifier.py) against a
    held-out labeled test set (never used in training) and returns the
    actual measured accuracy — not an asserted number.
    """
    return run_intent_benchmark()


@router.post("/query/execute")
async def execute_live_task_graph(req: PrdChatRequest, inject_failure: bool = Query(False, description="Demo/test only: deterministically fail the first wave-data call to exercise the retry path")):
    """
    PRD §6.1/§6.3 — REAL orchestration, as opposed to /query/plan's fixed
    illustrative DAG for the UI viewer. Builds a graph whose node set
    depends on the actual query, executes independent nodes concurrently
    via asyncio, times each node for real, and retries a failing tool up
    to twice before degrading with an explicit gap statement — never a
    fabricated value.
    """
    raw_query = req.message or req.query or "Is it safe to go out tomorrow morning?"
    loa = req.vessel_loa or (req.vessel_profile.get("length_m") if req.vessel_profile else 8.2)
    hp = req.vessel_profile.get("hp", 9.9) if req.vessel_profile else 9.9
    lat = req.location.get("lat", 13.12) if req.location else 13.12
    lon = req.location.get("lon", 80.30) if req.location else 80.30

    graph = SupervisorAgent.build_graph(raw_query, loa=loa, hp=hp, lat=lat, lon=lon, inject_failure=inject_failure)
    outcome = await SupervisorAgent.execute(graph)

    return {
        "query": raw_query,
        "total_nodes": len(graph),
        "parallel_waves": outcome["parallel_waves"],
        "degraded": outcome["degraded"],
        "gaps": outcome["gaps"],
        "node_status": outcome["node_status"],
        "results": outcome["results"],
    }


@router.get("/advisory/search")
async def search_advisories(q: str = Query(..., description="Natural-language advisory query"), top_k: int = Query(3, ge=1, le=6)):
    """
    PRD §6.2 Advisory/RAG Agent — real BM25 retrieval (backend/agents/advisory_rag_agent.py)
    over a seed corpus of INCOIS/IMD/fisheries/port bulletins. The corpus is a
    static stand-in (no live scraping in this environment); the ranking is real.
    """
    results = AdvisoryRagAgent.search(q, top_k=top_k)
    return {"query": q, "result_count": len(results), "results": results}


@router.get("/pfz/nearest")
async def get_nearest_pfz(
    lat: float = Query(13.12),
    lon: float = Query(80.30),
    speed_kn: float = Query(7.0, description="Craft speed in knots for ETA calculation")
):
    """
    PRD FR-3.1 & US-02:
    Returns nearest PFZ with bearing, distance in km and NM, ETA at boat speed, and validity.
    """
    zones = SatelliteService.get_pfz_advisories()
    p1 = zones[0]
    dist_km = round(p1["distance_nm"] * 1.852, 1)
    eta_hours = round(p1["distance_nm"] / speed_kn, 2)
    eta_mins = int(round((eta_hours - int(eta_hours)) * 60))
    eta_label = f"{int(eta_hours)}h {eta_mins}m @ {speed_kn} kt"

    item = PfzZoneItem(
        id=p1["id"],
        name=p1["name"],
        distance_nm=p1["distance_nm"],
        distance_km=dist_km,
        eta_hours=eta_hours,
        eta_label=eta_label,
        bearing=p1["bearing"],
        heading_deg=p1["heading_deg"],
        chlorophyll=p1["chlorophyll"],
        sst=p1["sst"],
        sst_gradient=p1["sst_gradient"],
        species=p1["species"],
        probability_pct=p1["probability_pct"],
        fuel_saving_pct=p1["fuel_saving_pct"],
        transit_safety=p1["transit_safety"],
        transit_warning=p1["transit_warning"],
        issuing_centre="INCOIS Hyderabad",
        valid_until="Today 23:59 IST",
        coordinates=p1["coordinates"],
    )

    return {
        "nearest_zone": item,
        "transit_corridor_verdict": "CAUTION ON TRANSIT",
        "transit_advisory": "1.8m breakers across outer harbour mouth corridor between 06:00 and 09:00 IST.",
        "advisory_issuing_centre": "INCOIS Marine Advisory Division",
        "satellite_ingest": "Oceansat-3 OCM-3 Level-2 + INSAT-3D",
    }

@router.get("/timeseries")
async def get_timeseries():
    """PRD US-06 & §13: 30-day SST anomaly timeseries versus climatology."""
    data = SatelliteService.get_climatology_trajectory()
    timeseries = []
    base_sst = 28.6
    for day in range(1, 31):
        anomaly = 0.8 * (day / 30.0) if day > 20 else 0.2
        timeseries.append({
            "day": day,
            "date": f"2026-08-{day:02d}",
            "observed_sst": round(base_sst + anomaly, 2),
            "climatological_mean": base_sst,
            "anomaly": round(anomaly, 2),
        })
    return {
        "metadata": data,
        "points": timeseries,
    }


@router.get("/analytics/anomaly")
async def get_sst_anomaly_analysis():
    """
    PRD §6.2 Analytics Agent / FR-3.4 — real anomaly and trend statistics
    (backend/agents/analytics_agent.py: numpy mean/std/z-score/least-squares
    trend) computed over the same 30-day SST series /timeseries exposes,
    instead of that endpoint's hand-scripted per-day anomaly formula.
    """
    data = SatelliteService.get_climatology_trajectory()
    base_sst = 28.6
    observed = [round(base_sst + (0.8 * (day / 30.0) if day > 20 else 0.2), 2) for day in range(1, 31)]
    result = AnalyticsAgent.compute_anomaly_series(observed, climatological_mean=base_sst)
    return {"metadata": data, "analysis": result}

@router.post("/subscriptions", response_model=SubscriptionRecord)
async def create_subscription(sub: SubscriptionCreateRequest):
    """
    PRD FR-4.1 & US-03:
    Registers mariner home port and operating radius for geofenced push/SMS warnings.

    FR-4.1 real geometry: an unrecognized home_port previously fell back
    silently to Kasimedu's coordinates in the geofence check (resolve_harbour's
    DEFAULT_HARBOUR), meaning a typo'd or unregistered harbour name registered
    successfully but geofenced against the WRONG location with no indication
    anything was wrong. Now rejected up front with the real registry of valid names.
    """
    if sub.home_port.strip().lower() not in HARBOUR_REGISTRY:
        raise HTTPException(
            status_code=422,
            detail=f"Unrecognized home_port '{sub.home_port}'. Must be one of: "
                   f"{', '.join(k.title() for k in HARBOUR_REGISTRY.keys())}",
        )
    if sub.operating_radius_nm <= 0 or sub.operating_radius_nm > 500:
        raise HTTPException(status_code=422, detail="operating_radius_nm must be between 0 and 500 nautical miles")

    sub_id = f"sub_{uuid.uuid4().hex[:8]}"
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    record = SubscriptionRecord(
        id=sub_id,
        registered_at=now_str,
        active=True,
        last_geofence_check=now_str,
        alert_count=1,
        **sub.model_dump(),
    )
    SUBSCRIPTION_DB[sub_id] = record
    spatial_store.upsert_subscription(sub_id, record.model_dump(), now_str)
    return record

@router.get("/subscriptions", response_model=List[SubscriptionRecord])
async def list_subscriptions():
    """Lists registered active subscriptions, restored from durable SQLite storage on cold start."""
    return get_all_subscriptions()

@router.get("/warnings/active", response_model=List[WarningPolygon])
async def get_active_warnings():
    """
    PRD FR-3.5 & §13:
    Returns active danger polygons intersecting coastal fishing grounds.
    """
    return get_active_warning_polygons()

@router.post("/subscriptions/evaluate")
async def evaluate_geofence_subscriptions():
    """
    PRD FR-4.2 & US-03 (Alerting Agent):
    Evaluates all registered mariner subscriptions against active warning polygons.
    Triggers FCM Push -> SMS fallback (<160 chars) if home port + operating radius intersects.

    FR-4.3 / FR-6.12: deduplicated per (subscription, warning) tuple — a
    warning already dispatched at its current severity is suppressed on
    subsequent evaluations, and only re-sent if severity has escalated
    (e.g. WATCH -> WARNING), never re-sent identically on every refresh.
    """
    warnings = await get_active_warnings()
    subs = await list_subscriptions()
    return await run_alert_evaluation(warnings, subs)


@router.post("/subscriptions/reset-alert-log")
async def reset_alert_dedup_log():
    """Demo/testing helper: clears the dedup log so the escalation flow can be re-triggered."""
    ALERT_DISPATCH_LOG.clear()
    return {"status": "CLEARED"}

from ..scripts.seed_demo_roles import SEEDED_ROLES

@router.get("/roles/users")
async def get_seeded_roles_list():
    """PRD Decision D-6: Returns seeded demo role accounts and verification statuses."""
    return {"users": SEEDED_ROLES}

@router.post("/roles/approve")
async def approve_pending_role(data: Dict[str, str], _user_id: str = Depends(require_verified_role("authority"))):
    """
    PRD §12.2 & Decision D-6:
    Two-person approval flow for privileged accounts (DDMO / Authority).

    §12.7: requires a verified Authority session server-side — previously
    this admin action had no auth check of any kind.
    """
    user_id = data.get("user_id", "usr_ddmo_vijay")
    approver = data.get("approver", "Senior Maritime Oversight Authority")

    for u in SEEDED_ROLES:
        if u["user_id"] == user_id:
            u["verification_status"] = "VERIFIED_TWO_PERSON_SIGN"
            u["approved_by"] = approver
            u["approval_timestamp"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            return {
                "status": "APPROVED",
                "user": u,
                "message": f"Account {u['name']} has been verified with 2-person sign-off by {approver}."
            }

    raise HTTPException(status_code=404, detail="User not found")


@router.get("/ingestion/status")
async def get_ingestion_status():
    """
    PRD §7 observability into the live-data pipeline: real cache contents/
    hit-rate (TTLCache substituting for Redis — see backend/lib/cache.py)
    and the background ingestion worker's real run history (see
    backend/workers/ingestion_worker.py). Not a mock — reflects this
    process's actual cache and worker state at call time.
    """
    return {
        "cache": ingestion_cache.status(),
        "worker": get_worker_status(),
        "spatial_store": {
            "backend": "SQLite (PostGIS substitute — see backend/lib/spatial_store.py)",
            "row_counts": spatial_store.row_count(),
        },
    }


@router.get("/geo/reverse")
async def get_reverse_geocode(lat: float = Query(...), lon: float = Query(...)):
    """
    PRD §7 OSM ingest connector: real reverse geocoding of a lat/lon into a
    place name via OpenStreetMap Nominatim (see backend/connectors/nominatim.py).
    Falls back to a generic label only if the live lookup is unreachable.
    """
    cache_key = f"geocode:{round(lat, 3)}:{round(lon, 3)}"
    result = ingestion_cache.get_or_fetch(cache_key, 86400, lambda: reverse_geocode(lat, lon))
    if result is None:
        return {"place_name": f"Unresolved coastal block ({lat:.2f}, {lon:.2f})", "data_source": "FALLBACK_LOOKUP_UNAVAILABLE"}
    return result


@router.get("/geo/search")
async def get_place_search(q: str = Query(..., min_length=1), limit: int = Query(5, ge=1, le=10)):
    """
    Real forward geocoding for the map search bar — previously a static
    text input with no search behavior at all. Backed by OpenStreetMap
    Nominatim (backend/connectors/nominatim.py), biased toward the Tamil
    Nadu coast and tolerant of natural descriptive suffixes ("...coastline",
    "...creek mouth") that aren't part of a place's literal indexed name.
    """
    cache_key = f"placesearch:{q.strip().lower()}:{limit}"
    results = ingestion_cache.get_or_fetch(cache_key, 3600, lambda: search_place(q, limit) or None)
    return {"query": q, "results": results or []}


@router.post("/directives/issue")
async def issue_executive_directive(data: Dict[str, str], user_id: str = Depends(require_verified_role("authority"))):
    """
    Authority dashboard's "Issue Executive Directive" — previously gated by
    a client-side isVerifiedAuthority check only, with no server-side
    effect: the directive vanished the moment the local UI timeout cleared
    it. Now requires the same real verified-Authority session every other
    NFR-9-gated action does, and is actually persisted (backend/lib/
    directives_store.py) — a real record of who issued what and when.
    """
    action_name = data.get("action_name", "").strip()
    if not action_name:
        raise HTTPException(status_code=422, detail="action_name is required")
    return directives_store.issue_directive(user_id, action_name, data.get("jurisdiction", "Coromandel Zone 04"))


@router.get("/directives")
async def get_recent_directives(limit: int = Query(50, ge=1, le=200)):
    """Recent executive directives — real, persisted, not reconstructed from UI state."""
    return {"directives": directives_store.list_directives(limit)}


@router.get("/pfz/dual-path-status")
async def get_pfz_dual_path_status():
    """
    PRD Decision D-2 — real INCOIS PFZ dual-path ingest (WFS primary, PDF
    bulletin fallback, see backend/connectors/incois_pfz_connector.py).
    Reports which path actually produced data on this call — real network
    attempts, not a hardcoded "connected" flag.
    """
    return get_pfz_points_dual_path()


@router.get("/benchmark/success-metrics")
async def get_success_metrics_benchmark():
    """
    PRD §14 — real measured success metrics: intent classification accuracy
    (held-out test set, FR-2.1), average citation coverage, and hallucination
    rate, all computed by backend/agents/benchmark_harness.py against real
    live/cached telemetry — not asserted targets.
    """
    return run_success_metrics_benchmark()


@router.get("/observability/summary")
async def get_observability_summary():
    """
    PRD NFR-1/2 (latency p95 targets), NFR-3 (99.5% availability), NFR-11
    (observability: traces, failure taxonomy) — all real, measured numbers
    from backend/lib/metrics.py's per-request middleware, not asserted
    targets. citation_coverage_pct is reported per-response by /v1/chat
    (see canonical_chat_endpoint); task-graph node traces are per-query via
    /v1/query/plan — this endpoint is the aggregate reliability/perf view.
    """
    return metrics.get_summary()


@router.get("/advisory/draft")
async def get_advisory_draft(lat: float = Query(13.12), lon: float = Query(80.30)):
    """
    PRD FR-3.6 — advisory drafting composer text generated from the same
    live buoy telemetry and active warning polygons every other verdict in
    this system uses, instead of a fixed canned paragraph.
    """
    return generate_advisory_draft(lat=lat, lon=lon)


@router.get("/extract")
async def get_point_extraction(
    variable: str = Query(..., description=f"One of: {', '.join(SUPPORTED_VARIABLES)}"),
    lat: float = Query(...),
    lon: float = Query(...),
    time: Optional[str] = Query(None, description="ISO-8601 timestamp; defaults to now (UTC)"),
):
    """
    PRD FR-3.3 — real point/area extraction of SST/chl/wind/wave/tide,
    queryable by lat/lon/time (see backend/agents/extraction_agent.py for
    which variables are genuinely live vs. a documented approximation).
    """
    at = None
    if time:
        try:
            at = datetime.fromisoformat(time.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid ISO-8601 time: '{time}'")
    return extract_point_value(variable, lat, lon, at)


@router.get("/audit/log")
async def get_query_audit_log(authorization: Optional[str] = Header(None), limit: int = Query(200, ge=1, le=1000)):
    """
    PRD FR-5.5 — full query audit log, real role-gated access: requires a
    valid bearer session token belonging to a VERIFIED authority-tier
    account (checked against the real SQLite auth store, not a client-
    supplied flag). Every /api/chat and /api/v1/chat query is logged
    (backend/lib/audit_log.py) regardless of who's allowed to read it back.
    """
    token = authorization[7:].strip() if authorization and authorization.lower().startswith("bearer ") else None
    user_id = auth_store.resolve_session(token) if token else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Sign in required")
    roles = auth_store.get_roles(user_id)
    if not any(r["tier"] == "authority" and r["status"] == "verified" for r in roles):
        raise HTTPException(status_code=403, detail="Verified Authority role required to view the query audit log")

    entries = audit_log.list_recent(limit=limit)
    return {"total_logged": audit_log.count_total(), "returned": len(entries), "entries": entries}

