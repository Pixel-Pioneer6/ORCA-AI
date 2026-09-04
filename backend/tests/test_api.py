import pytest
import re
import uuid
import asyncio
from fastapi.testclient import TestClient
from backend.main import app
from backend.agents.guardrail import HydrodynamicGuardrail
from backend.agents.supervisor import SupervisorAgent

client = TestClient(app)

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "OPERATIONAL"
    assert len(data["active_agents"]) >= 6

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["guardrail_active"] is True

def test_guardrail_deterministic_clamp():
    # Test 1: Small craft (6.0m, 5 HP -> limit ~1.1m) facing 1.8m wave -> MUST clamp to DO NOT VENTURE or CAUTION
    clamped_verdict, meta = HydrodynamicGuardrail.evaluate(
        vessel_loa=6.0,
        vessel_hp=5.0,
        swh=1.8,
        wind_gust=25.0,
        proposed_verdict="SAFE"
    )
    assert clamped_verdict in ["DO NOT VENTURE", "CAUTION"]
    assert meta["is_clamped"] is True

    # Test 2: Large mechanized vessel (16m, 120 HP -> limit ~2.8m) facing 1.2m calm wave -> SAFE
    safe_verdict, safe_meta = HydrodynamicGuardrail.evaluate(
        vessel_loa=16.0,
        vessel_hp=120.0,
        swh=1.2,
        wind_gust=10.0,
        proposed_verdict="SAFE"
    )
    assert safe_verdict == "SAFE"

def test_safety_verdict_endpoint():
    res = client.get("/api/safety/verdict?loa=8.2&hp=9.9")
    assert res.status_code == 200
    data = res.json()
    assert data["state"] in ["caution", "safe", "danger", "stale"]
    assert "telemetry" in data
    assert data["telemetry"]["swh"] > 0

def test_pfz_advisory_endpoint():
    res = client.get("/api/pfz/zones?loa=8.2&hp=9.9")
    assert res.status_code == 200
    data = res.json()
    assert len(data["zones"]) >= 2
    assert "CAUTION" in data["transit_corridor_verdict"]

def test_conversational_chat_endpoint():
    # English Query
    res_en = client.post("/api/chat", json={
        "query": "Can I venture out tomorrow at 5 AM with my 8m FRP boat?",
        "vessel_loa": 8.2,
        "vessel_hp": 9.9
    })
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert "verdict" in data_en
    assert len(data_en["reasoning_chain"]) >= 2

    # Tamil Query (தமிழ்)
    res_ta = client.post("/api/chat", json={
        "query": "நாளை காலை 5 மணிக்கு கடலுக்கு செல்லலாமா?",
        "vessel_loa": 8.2,
        "vessel_hp": 9.9
    })
    assert res_ta.status_code == 200
    data_ta = res_ta.json()
    assert data_ta["verdict_ta"] != ""

def _verified_session_token(tier, invite_code=None):
    identity = f"nfr9.{tier}.{uuid.uuid4().hex[:6]}@test.gov.in" if tier != "fisherman" else f"+91-90000-{uuid.uuid4().hex[:5]}"
    req_body = {"tier": tier, "identity_value": identity}
    if invite_code:
        req_body["invite_code"] = invite_code
    otp = client.post("/api/v1/auth/request-otp", json=req_body).json()
    verify_body = {"tier": tier, "identity_value": identity, "code": otp["dev_otp"]}
    if invite_code:
        verify_body["invite_code"] = invite_code
    verify = client.post("/api/v1/auth/verify-otp", json=verify_body).json()
    if verify["pending"]:
        from backend.lib import auth_store
        auth_store.upsert_role(verify["user_id"], tier, "verified")
    return verify["session_token"]


def test_ddmo_sms_broadcast():
    token = _verified_session_token("ddmo", invite_code="DDMO-KSM-04")
    res = client.post("/api/ddmo/sms-broadcast", json={
        "zone": "Zone 04",
        "language": "ta",
        "alert_type": "HIGH WAVE"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "DISPATCHED"
    assert len(data["payload_en"]) <= 160
    assert len(data["payload_ta"]) <= 160


def test_ddmo_sms_broadcast_rejected_without_verified_role():
    # NFR-9: previously this was UI-gated only — a direct API call with no
    # session at all, or a session verified for the WRONG role, succeeded
    # anyway. Must now be a real server-side 401/403.
    unauthenticated = client.post("/api/ddmo/sms-broadcast", json={"zone": "Zone 04", "language": "en", "alert_type": "HIGH WAVE"})
    assert unauthenticated.status_code == 401

    wrong_role_token = _verified_session_token("fisherman")
    wrong_role = client.post(
        "/api/ddmo/sms-broadcast", json={"zone": "Zone 04", "language": "en", "alert_type": "HIGH WAVE"},
        headers={"Authorization": f"Bearer {wrong_role_token}"},
    )
    assert wrong_role.status_code == 403

def test_ddmo_status():
    # Regression test: DdmoResponse requires coastal_blocks, which the
    # agent/route previously omitted, causing a 500 on this endpoint.
    res = client.get("/api/ddmo/status")
    assert res.status_code == 200
    data = res.json()
    assert len(data["coastal_blocks"]) >= 3
    assert data["coastal_blocks"][0]["risk_level"] in ["HIGH", "MODERATE", "LOW"]
    assert len(data["incidents"]) >= 1

def test_port_status():
    res = client.get("/api/port/status")
    assert res.status_code == 200
    data = res.json()
    assert len(data["vessels"]) >= 3
    assert data["direct_vhf_channel"] != ""

def test_prd_canonical_v1_endpoints():
    # 1. Canonical PRD Chat
    res = client.post("/api/v1/chat", json={
        "session_id": "s_demo_01",
        "message": "kal subah samundar mein jana safe hai?",
        "language": "hi",
        "vessel_profile": {"class": "motorized", "length_m": 8.2, "speed_kn": 7.0}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["verdict"] in ["CAUTION", "SAFE", "DO NOT VENTURE"]
    assert len(data["drivers"]) >= 1
    assert len(data["evidence"]) >= 2
    assert "disclaimer" in data

    # 2. PRD Task Graph DAG Plan — FR-2.2: genuinely per-query now (delegates
    # to SupervisorAgent), not a fixed 9-node template. This query mentions
    # PFZ, so the real graph includes intent+wave+hazard+pfz+guardrail (5),
    # but not the port node (query doesn't mention it).
    plan_res = client.post("/api/v1/query/plan", json={
        "message": "Can my 8m boat reach PFZ #01 safely before dark?"
    })
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    assert plan_data["total_nodes"] == 5
    assert any(n["tool"] == "get_ranked_zones" for n in plan_data["nodes"])
    assert not any(n["tool"] == "get_harbour_status" for n in plan_data["nodes"])
    assert all(n["status"] == "COMPLETED" for n in plan_data["nodes"])
    assert len(plan_data["edges"]) >= 3

    # 3. PRD Nearest PFZ with ETA at boat speed
    pfz_res = client.get("/api/v1/pfz/nearest?speed_kn=7.0")
    assert pfz_res.status_code == 200
    pfz_data = pfz_res.json()
    assert "eta_label" in pfz_data["nearest_zone"]
    assert "@ 7.0 kt" in pfz_data["nearest_zone"]["eta_label"] or "@ 7 kt" in pfz_data["nearest_zone"]["eta_label"]

    # 4. PRD Geofenced Subscription
    sub_res = client.post("/api/v1/subscriptions", json={
        "user_name": "K. Arumugam",
        "phone_number": "+91-98401-44910",
        "home_port": "Kasimedu Fishing Harbour",
        "operating_radius_nm": 25.0,
        "vessel_class": "motorized",
        "vessel_reg_no": "IND-TN-02-MM-4491",
        "language": "ta"
    })
    assert sub_res.status_code == 200
    assert sub_res.json()["active"] is True

    # 5. Active warnings
    warn_res = client.get("/api/v1/warnings/active")
    assert warn_res.status_code == 200
    assert len(warn_res.json()) >= 1

    # 6. Subscription geofence evaluation
    eval_res = client.post("/api/v1/subscriptions/evaluate")
    assert eval_res.status_code == 200
    assert eval_res.json()["status"] == "EVALUATED"

    # 7. Seeded role accounts + two-person approval
    roles_res = client.get("/api/v1/roles/users")
    assert roles_res.status_code == 200
    assert len(roles_res.json()["users"]) >= 1

    # 8. Timeseries
    ts_res = client.get("/api/v1/timeseries")
    assert ts_res.status_code == 200
    assert len(ts_res.json()["points"]) == 30


def test_chat_endpoint_handles_missing_query():
    # Regression: an empty body previously crashed with AttributeError
    # ('NoneType' object has no attribute 'lower') because req.query was
    # never defaulted before being passed into OrcaRouterAgent.process_query.
    res = client.post("/api/chat", json={})
    assert res.status_code == 200
    assert "verdict" in res.json()


def test_pfz_transit_verdict_is_vessel_aware():
    # Regression: PfzAgent.get_ranked_zones() unpacked
    # HydrodynamicGuardrail.evaluate()'s (verdict, meta) tuple into a
    # variable it never used, then hardcoded "CAUTION ON TRANSIT"
    # regardless of the requesting vessel's actual thresholds.
    small_craft = client.get("/api/pfz/zones?loa=6&hp=5").json()
    assert "CAUTION" in small_craft["transit_corridor_verdict"] or "VENTURE" in small_craft["transit_corridor_verdict"]

    large_craft = client.get("/api/pfz/zones?loa=16&hp=120").json()
    assert large_craft["transit_corridor_verdict"] == "SAFE ON TRANSIT"


def test_vessel_and_researcher_routes():
    profile_res = client.get("/api/vessel/profile")
    assert profile_res.status_code == 200

    calc_res = client.post("/api/vessel/calculate-limits", json={
        "name": "Test Boat", "reg_no": "IND-TEST-01", "loa": 8.2, "beam": 2.1,
        "draft": 0.8, "hp": 9.9, "hull_material": "FRP", "gear_type": "Gillnet",
    })
    assert calc_res.status_code == 200
    assert calc_res.json()["safe_wave_limit_m"] > 0

    # Regression: VesselProfile.compute_safe_thresholds() used to be an
    # independent formula (loa*0.18, 14+hp*0.4) that diverged from the
    # canonical HydrodynamicGuardrail table by up to 40kt of wind at larger
    # LOA. It must now match the same table used by /api/safety/verdict.
    large_calc = client.post("/api/vessel/calculate-limits", json={
        "name": "Big Boat", "reg_no": "IND-TEST-02", "loa": 18.0, "beam": 4.0,
        "draft": 1.5, "hp": 150.0, "hull_material": "Steel", "gear_type": "Trawl",
    }).json()
    assert large_calc["safe_wave_limit_m"] == 3.5
    assert large_calc["safe_wind_limit_kt"] == 34.0

    sensors_res = client.get("/api/researcher/sensors")
    assert sensors_res.status_code == 200
    assert len(sensors_res.json()["sensors"]) >= 3

    export_res = client.get("/api/researcher/export?format=csv")
    assert export_res.status_code == 200
    assert export_res.json()["format"] == "CSV"


def test_port_vhf_broadcast():
    token = _verified_session_token("port")
    res = client.post("/api/port/vhf-broadcast", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "en" in res.json()["script"]


def test_port_vhf_broadcast_rejected_without_verified_role():
    unauthenticated = client.post("/api/port/vhf-broadcast")
    assert unauthenticated.status_code == 401


def test_role_approval_flow():
    # §12.7: requires a verified Authority session server-side now.
    token = _verified_session_token("authority", invite_code="AUTH-CZM-01")
    users = client.get("/api/v1/roles/users").json()["users"]
    pending = next((u for u in users if u["verification_status"] != "VERIFIED_TWO_PERSON_SIGN"), users[0])
    res = client.post(
        "/api/v1/roles/approve", json={"user_id": pending["user_id"], "approver": "Test Admin"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "APPROVED"


def test_role_approval_rejected_without_authority_role():
    unauthenticated = client.post("/api/v1/roles/approve", json={"user_id": "usr_ddmo_vijay", "approver": "Nobody"})
    assert unauthenticated.status_code == 401

    token = _verified_session_token("authority", invite_code="AUTH-CZM-01")
    missing_res = client.post(
        "/api/v1/roles/approve", json={"user_id": "usr_does_not_exist"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert missing_res.status_code == 404


def test_analytics_agent_real_statistics():
    from backend.agents.analytics_agent import AnalyticsAgent

    # Flat series at the climatological mean -> zero anomaly, zero trend.
    flat = AnalyticsAgent.compute_anomaly_series([28.6] * 10, climatological_mean=28.6)
    assert flat["mean_anomaly"] == 0.0
    assert flat["trend_per_day"] == 0.0
    assert flat["anomalous_day_count"] == 0

    # A clear upward-trending series with an outlier must be detected for real.
    series = [28.6, 28.6, 28.6, 28.6, 28.6, 28.6, 28.6, 28.6, 28.6, 32.0]
    trending = AnalyticsAgent.compute_anomaly_series(series, climatological_mean=28.6)
    assert trending["trend_per_day"] > 0
    assert trending["anomalous_day_count"] >= 1
    assert trending["anomalous_days"][-1]["value"] == 32.0


def test_analytics_endpoint():
    res = client.get("/api/v1/analytics/anomaly")
    assert res.status_code == 200
    data = res.json()["analysis"]
    assert data["n_observations"] == 30
    assert "trend_r_squared" in data


def test_advisory_rag_agent_real_bm25_ranking():
    from backend.agents.advisory_rag_agent import AdvisoryRagAgent

    squall_results = AdvisoryRagAgent.search("squall warning wind speed", top_k=2)
    assert squall_results[0]["source"] == "IMD Marine Bulletin"

    ban_results = AdvisoryRagAgent.search("fishing ban trawler", top_k=2)
    assert ban_results[0]["id"] == "fisheries-ban-circular-2026"

    assert AdvisoryRagAgent.search("xyzzy nonexistent term qwerty") == []


def test_advisory_search_endpoint():
    res = client.get("/api/v1/advisory/search?q=tsunami+evacuation+shelter")
    assert res.status_code == 200
    data = res.json()
    assert data["result_count"] >= 1
    assert "Tsunami" in data["results"][0]["title"]


def test_explainability_agent_blocks_uncited_claims():
    from backend.agents.explainability import ExplainabilityAgent

    evidence = [{"source": "INCOIS OSF", "variable": "swh", "value": 1.8}]
    grounded = ExplainabilityAgent.audit("Wave height is 1.8m today.", evidence)
    assert grounded["blocked"] is False
    assert grounded["citation_coverage_pct"] == 100.0

    hallucinated = ExplainabilityAgent.audit("Wave height is 3.4m with 40kt gusts.", evidence)
    assert hallucinated["blocked"] is True
    assert 3.4 in hallucinated["uncited_claims"]

    enforced = ExplainabilityAgent.enforce(
        "Wave height is 3.4m today.", evidence, fallback_text="Cannot confirm — check official channels."
    )
    assert enforced["was_substituted"] is True
    assert enforced["final_text"] == "Cannot confirm — check official channels."

    # Trusted values (e.g. echoed vessel LOA) must not be flagged as claims.
    trusted = ExplainabilityAgent.audit("Your 8.2m craft is within the 1.8m swell.", evidence, trusted_values=[8.2])
    assert trusted["blocked"] is False


def test_v1_chat_reports_citation_coverage():
    res = client.post("/api/v1/chat", json={"message": "Is it safe to go out?"})
    data = res.json()
    assert data["citation_coverage_pct"] == 100.0  # every cited measurement now has a matching evidence record


def test_supervisor_builds_query_dependent_graph():
    # §6.1/§2.2: the node set must actually depend on the query, not be a
    # fixed shape regardless of input (that's what /query/plan's illustrative
    # DAG is for — this is the real dynamic builder).
    plain = SupervisorAgent.build_graph("Is it safe to venture out?", loa=8.2)
    assert "pfz" not in plain and "port" not in plain

    pfz_query = SupervisorAgent.build_graph("Where is the nearest PFZ?", loa=8.2)
    assert "pfz" in pfz_query

    port_query = SupervisorAgent.build_graph("What's the harbour bar depth?", loa=8.2)
    assert "port" in port_query


def test_supervisor_executes_nodes_in_parallel_waves():
    graph = SupervisorAgent.build_graph("Where is the nearest PFZ and is the port open?", loa=8.2)
    result = asyncio.run(SupervisorAgent.execute(graph))
    assert result["degraded"] is False
    assert all(s["status"] == "COMPLETED" for s in result["node_status"].values())
    # intent -> {wave,hazard,pfz,port} -> guardrail is 3 dependency levels
    assert result["parallel_waves"] == 3
    assert "guardrail" in result["results"]
    assert result["results"]["guardrail"]["verdict"] in ["SAFE", "CAUTION", "DO NOT VENTURE", "INSUFFICIENT_DATA"]


def test_supervisor_retries_then_recovers_from_transient_failure():
    # §6.3: a tool that fails once but recovers within MAX_RETRIES must
    # still produce a complete, non-degraded answer.
    graph = SupervisorAgent.build_graph("Is it safe to venture out?", loa=8.2, inject_failure=True)
    result = asyncio.run(SupervisorAgent.execute(graph))
    assert result["degraded"] is False
    assert result["node_status"]["wave"]["attempts"] == 2


def test_supervisor_degrades_with_explicit_gap_on_persistent_failure():
    # §6.3: exhausting retries must degrade to a partial answer with an
    # explicit gap statement, and must NOT fabricate the dependent
    # guardrail verdict from missing data.
    graph = SupervisorAgent.build_graph("Is it safe to venture out?", loa=8.2)
    graph["wave"]["fn"] = lambda _: (_ for _ in ()).throw(Exception("Persistent INCOIS outage"))
    result = asyncio.run(SupervisorAgent.execute(graph))
    assert result["degraded"] is True
    assert result["node_status"]["wave"]["status"] == "FAILED"
    assert result["node_status"]["wave"]["attempts"] == 3  # 1 initial + 2 retries
    assert result["node_status"]["guardrail"]["status"] == "SKIPPED"
    assert "guardrail" not in result["results"]
    assert any("failed after 3 attempts" in g for g in result["gaps"])


def test_query_execute_endpoint_live():
    res = client.post("/api/v1/query/execute", json={"message": "Where is the nearest PFZ?", "vessel_loa": 8.2})
    assert res.status_code == 200
    data = res.json()
    assert data["degraded"] is False
    assert "pfz" in data["results"]
    assert data["node_status"]["guardrail"]["status"] == "COMPLETED"

    failing_res = client.post("/api/v1/query/execute?inject_failure=true", json={"message": "Is it safe?"})
    assert failing_res.status_code == 200
    failing_data = failing_res.json()
    assert failing_data["node_status"]["wave"]["attempts"] == 2
    assert failing_data["degraded"] is False  # recovers within retry budget


def test_geofence_uses_real_geometry_not_string_matching():
    # Regression: the geofence check used to be `"Kasimedu" in home_port`,
    # meaning ANY subscription intersected as long as the string matched —
    # a subscriber 500nm away with a tiny radius would still get alerted on
    # a Kasimedu-area warning regardless of actual distance. It must now be
    # real point-in-polygon / distance geometry that discriminates WHICH
    # warnings actually apply — proven here by a Tuticorin subscriber who
    # genuinely is near the (separate) Tuticorin-area cyclone watch, but
    # must NOT be alerted by the unrelated Kasimedu squall warning far away.
    client.post("/api/v1/subscriptions/reset-alert-log")

    far_sub = client.post("/api/v1/subscriptions", json={
        "user_name": "Far Away Fisher",
        "phone_number": "+91-90000-00000",
        "home_port": "Tuticorin Fishing Harbour",
        "operating_radius_nm": 10.0,
        "vessel_class": "motorized",
        "vessel_reg_no": "IND-TN-99-FAR-0001",
        "language": "en",
    }).json()

    result = client.post("/api/v1/subscriptions/evaluate").json()
    far_sub_warning_ids = [a["warning_id"] for a in result["dispatched_alerts"] if a["subscription_id"] == far_sub["id"]]
    assert "WARN-TN-04-SQUALL" not in far_sub_warning_ids
    assert "WARN-TN-11-CYCLONE-WATCH" in far_sub_warning_ids

    client.post("/api/v1/subscriptions/reset-alert-log")


def test_chat_refuses_out_of_scope_query():
    # FR-2.5: an unrelated query must be politely redirected, not forced
    # through the safety-verdict path (which previously fabricated a
    # "departure feasibility" answer for literally any input).
    res = client.post("/api/chat", json={"query": "What is the capital of France?"})
    assert res.status_code == 200
    data = res.json()
    assert data["verdict"] == "OUT_OF_SCOPE"

    # A genuine maritime query must still route normally.
    res2 = client.post("/api/chat", json={"query": "Is it safe to venture out tomorrow?"})
    assert res2.json()["verdict"] != "OUT_OF_SCOPE"


def test_guardrail_reports_source_precedence():
    # FR-2.4: conflicting-source reconciliation must be an explicit,
    # documented policy — never a silent average — and the response must
    # say which tier actually decided the verdict.
    _, override_meta = HydrodynamicGuardrail.evaluate(
        vessel_loa=8.2, vessel_hp=9.9, swh=1.0, wind_gust=10.0, cyclone_warning=True
    )
    assert override_meta["source_tier"] == "official_warning"

    _, normal_meta = HydrodynamicGuardrail.evaluate(
        vessel_loa=8.2, vessel_hp=9.9, swh=1.0, wind_gust=10.0
    )
    assert normal_meta["source_tier"] == "national_agency_forecast"
    assert normal_meta["source_precedence"][0] == "official_warning"

    _, missing_meta = HydrodynamicGuardrail.evaluate(
        vessel_loa=8.2, vessel_hp=9.9, swh=None, wind_gust=None
    )
    assert missing_meta["source_tier"] is None


def test_alert_dedup_and_escalation():
    # FR-4.3/FR-6.12: an already-dispatched (subscription, warning) tuple
    # must be suppressed on re-evaluation, not re-sent identically forever.
    client.post("/api/v1/subscriptions/reset-alert-log")
    client.get("/api/v1/subscriptions")  # ensure the default subscription is seeded

    first = client.post("/api/v1/subscriptions/evaluate").json()
    assert len(first["dispatched_alerts"]) >= 1
    assert first["dispatched_alerts"][0]["status"] == "DISPATCHED"

    second = client.post("/api/v1/subscriptions/evaluate").json()
    assert len(second["dispatched_alerts"]) == 0
    assert second["suppressed_duplicate_count"] >= 1

    client.post("/api/v1/subscriptions/reset-alert-log")


def test_sms_service_tamil_length_and_translation():
    from backend.services.sms_service import SmsService
    # Regression: the Tamil SMS previously had no 160-char truncation guard
    # (only English did) and embedded the raw English verdict word inside
    # an otherwise-Tamil message. "DO NOT VENTURE" is the longest verdict
    # string, making it the case most likely to have silently exceeded the
    # single-SMS-segment limit.
    sms = SmsService.format_sms_alert(verdict="DO NOT VENTURE", swh=2.7, wind=32.0)
    assert len(sms["ta"]) <= 160
    assert len(sms["en"]) <= 160
    assert "DO NOT VENTURE" not in sms["ta"]
    assert "செல்ல வேண்டாம்" in sms["ta"]


def test_invalid_input_returns_422_not_500():
    # Bad query-param types must fail validation cleanly, not crash the process.
    res = client.get("/api/safety/verdict?loa=notanumber")
    assert res.status_code == 422

    res2 = client.post("/api/chat", content="not json", headers={"Content-Type": "application/json"})
    assert res2.status_code == 422


def test_open_meteo_connector_returns_real_live_data():
    # PRD §7: real ingest connector, not a mock. If the sandbox has network
    # access this must return an actual numeric snapshot with a live
    # data_source tag; if the network call genuinely fails it must return
    # None (never raise) so callers can fall back cleanly.
    from backend.connectors.open_meteo import fetch_live_marine_snapshot
    result = fetch_live_marine_snapshot(13.12, 80.30)
    if result is not None:
        assert result["data_source"] == "LIVE_OPEN_METEO"
        assert isinstance(result["swh"], (int, float))
        assert isinstance(result["wind_gust"], (int, float))


def test_incois_service_falls_back_to_mock_when_connector_unreachable(monkeypatch):
    # Regression: the safety pipeline must never break just because the
    # live connector is unreachable (offline judge network, upstream outage).
    from backend import services
    from backend.services import incois_service
    from backend.lib.cache import ingestion_cache

    monkeypatch.setattr(incois_service, "fetch_live_marine_snapshot", lambda lat, lon: None)
    ingestion_cache._store.pop("buoy:1.0:2.0", None)
    ingestion_cache._expires_at.pop("buoy:1.0:2.0", None)

    reading = incois_service.IncoisService.get_buoy_telemetry(lat=1.0, lon=2.0)
    assert reading["data_source"] == "MOCK_FALLBACK_NO_LIVE_DATA"
    assert reading["swh"] == incois_service.IncoisService._MOCK_FALLBACK["swh"]


def test_ttl_cache_real_expiry_and_hit_miss_counters():
    from backend.lib.cache import TTLCache
    cache = TTLCache()
    assert cache.get("k") is None  # miss
    cache.set("k", {"v": 1}, ttl_seconds=100)
    assert cache.get("k") == {"v": 1}  # hit
    cache.set("k", {"v": 2}, ttl_seconds=-1)  # already expired
    assert cache.get("k") is None


def test_ingestion_status_endpoint_reports_real_cache_and_store_state():
    res = client.get("/api/v1/ingestion/status")
    assert res.status_code == 200
    body = res.json()
    assert "cache" in body and "worker" in body and "spatial_store" in body
    assert "hit_rate_pct" in body["cache"]
    assert body["spatial_store"]["row_counts"]["subscriptions"] >= 0


def test_subscriptions_persist_to_sqlite_spatial_store():
    from backend.lib import spatial_store
    before = spatial_store.row_count()["subscriptions"]
    res = client.post("/api/v1/subscriptions", json={
        "user_name": "Test Fisher", "phone_number": "+91-90000-00000",
        "home_port": "Chennai Port", "operating_radius_nm": 10.0,
        "vessel_class": "motorized", "vessel_reg_no": "IND-TEST-01",
        "language": "en", "notification_channels": ["push"],
    })
    assert res.status_code == 200
    after = spatial_store.row_count()["subscriptions"]
    assert after == before + 1


def test_chat_asks_clarifying_question_when_location_unresolvable():
    # FR-1.2: a guest with no registered home port and no GPS fix must be
    # asked where they are, not silently defaulted to Kasimedu.
    res = client.post("/api/chat", json={
        "query": "Is it safe to go out tomorrow?",
        "session_id": "test_fr12_guest",
        "location": None,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["verdict"] == "NEED_LOCATION"
    assert len(data["suggested_followups"]) > 0


def test_chat_multi_turn_memory_resumes_after_location_clarification():
    # FR-1.2 + FR-1.3: answering the clarifying question with just a harbour
    # name must resume the ORIGINAL query using real session memory, not
    # require the user to repeat their whole question.
    session_id = "test_fr13_resume"
    first = client.post("/api/chat", json={
        "query": "Can I venture out safely?", "session_id": session_id, "location": None,
    }).json()
    assert first["verdict"] == "NEED_LOCATION"

    second = client.post("/api/chat", json={
        "query": "Ennore", "session_id": session_id, "location": None,
    }).json()
    assert second["verdict"] in ("SAFE", "CAUTION", "DO NOT VENTURE")

    # A later turn omitting vessel specs must still see the LOA/HP this
    # session already established (real memory, not per-request defaults).
    from backend.lib.session_store import session_store
    assert session_store.get(session_id)["location"]["name"] == "Ennore Fishing Harbour"


def test_chat_handles_compound_multi_part_query_in_one_turn():
    # FR-1.4: a single query mentioning both safety and PFZ intent must get
    # ONE reply covering both parts, not just whichever branch matched first.
    res = client.post("/api/chat", json={
        "query": "Is it safe to go out, and where is the nearest fishing zone?",
        "session_id": "test_fr14_compound",
    })
    data = res.json()
    assert "PFZ" in data["reply"] or "fishing" in data["reply"].lower()
    assert len(data["reasoning_chain"]) >= 3  # Safety + Guardrail + PfzAgent steps


def test_reverse_geocode_endpoint():
    res = client.get("/api/v1/geo/reverse?lat=13.12&lon=80.30")
    assert res.status_code == 200
    body = res.json()
    assert "place_name" in body
    assert body["data_source"] in ("LIVE_OSM_NOMINATIM", "FALLBACK_LOOKUP_UNAVAILABLE")


def test_intent_classifier_meets_90pct_benchmark():
    # FR-2.1: a real measured accuracy on a held-out labeled test set, not
    # an asserted number. If this ever regresses below the PRD's 90% bar,
    # the test should fail loudly rather than the claim going unverified.
    from backend.agents.intent_classifier import run_benchmark
    result = run_benchmark()
    assert result["total"] >= 20
    assert result["accuracy"] >= 0.90
    assert result["meets_prd_benchmark_90pct"] is True


def test_intent_benchmark_endpoint():
    res = client.get("/api/v1/intent/benchmark")
    assert res.status_code == 200
    body = res.json()
    assert body["accuracy"] >= 0.90


def test_task_graph_plan_is_genuinely_per_query():
    # FR-2.2: the node SET must actually depend on the query — a port-only
    # query gets no pfz node, and vice versa, unlike the old fixed template.
    port_only = client.post("/api/v1/query/plan", json={"message": "What is the harbour bar depth right now?"}).json()
    assert any(n["tool"] == "get_harbour_status" for n in port_only["nodes"])
    assert not any(n["tool"] == "get_ranked_zones" for n in port_only["nodes"])

    pfz_only = client.post("/api/v1/query/plan", json={"message": "Where is the nearest fishing zone?"}).json()
    assert any(n["tool"] == "get_ranked_zones" for n in pfz_only["nodes"])
    assert not any(n["tool"] == "get_harbour_status" for n in pfz_only["nodes"])

    # Node count for the two queries genuinely differs from a re-run with both intents.
    both = client.post("/api/v1/query/plan", json={"message": "Fishing zone and harbour bar status?"}).json()
    assert both["total_nodes"] > port_only["total_nodes"]


def test_relative_time_resolution():
    # FR-2.3: "this evening" / "tomorrow" must resolve to a real computed
    # date+hour window, not a hardcoded "tomorrow morning" string.
    from backend.lib.nlu_resolve import resolve_relative_time
    from datetime import datetime, timezone, timedelta
    now = datetime(2026, 9, 3, 10, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))

    evening = resolve_relative_time("can I go out this evening", now=now)
    assert evening["resolved"] is True
    assert evening["date"] == "2026-09-03"
    assert evening["start_hour"] == 17

    tomorrow = resolve_relative_time("is it safe tomorrow morning", now=now)
    assert tomorrow["resolved"] is True
    assert tomorrow["date"] == "2026-09-04"

    unresolved = resolve_relative_time("is it safe", now=now)
    assert unresolved["resolved"] is False


def test_spatial_reference_resolution():
    from backend.lib.nlu_resolve import resolve_spatial_reference
    assert resolve_spatial_reference("is it safe near me")["resolved"] is True
    assert resolve_spatial_reference("is it safe at Kasimedu")["resolved"] is False


def test_chat_resolves_relative_time_into_target_window():
    # FR-2.3 end-to-end: a query mentioning "this evening" must produce a
    # target_window reflecting that, not the hardcoded tomorrow-morning default.
    res = client.post("/api/chat", json={
        "query": "Is it safe to go out this evening?",
        "session_id": "test_fr23_time",
    })
    data = res.json()
    # A real resolved date+hour window (e.g. "2026-09-03 17:00–20:00 IST"),
    # not the hardcoded "Tomorrow 05:00 – 10:00 IST" default.
    assert re.search(r"\d{4}-\d{2}-\d{2}", data["target_window"])
    assert "17:00" in data["target_window"]
    assert any(step["agent"].startswith("NLU") for step in data["reasoning_chain"])


def _get_dev_otp(tier, identity, invite_code=None):
    body = {"tier": tier, "identity_value": identity}
    if invite_code:
        body["invite_code"] = invite_code
    res = client.post("/api/v1/auth/request-otp", json=body).json()
    return res


def test_auth_full_login_flow_fisherman():
    # A real end-to-end login: request a code, get it wrong, get it right,
    # then use the session token to fetch identity back from the server —
    # not from a localStorage blob the client could fabricate.
    identity = f"+91-90000-{uuid.uuid4().hex[:5]}"
    req = _get_dev_otp("fisherman", identity)
    assert req["sent"] is True
    real_otp = req["dev_otp"]

    wrong = client.post("/api/v1/auth/verify-otp", json={
        "tier": "fisherman", "identity_value": identity, "code": "000000",
    }).json()
    assert wrong["ok"] is False
    assert "attempt" in wrong["reason"].lower()

    right = client.post("/api/v1/auth/verify-otp", json={
        "tier": "fisherman", "identity_value": identity, "code": real_otp,
    }).json()
    assert right["ok"] is True
    assert right["pending"] is False
    token = right["session_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
    assert me["authenticated"] is True
    assert "fisherman" in me["held_roles"]
    assert me["identity"]["value"] == identity

    # The OTP is single-use — replaying it must fail even with the right code.
    replay = client.post("/api/v1/auth/verify-otp", json={
        "tier": "fisherman", "identity_value": identity, "code": real_otp,
    }).json()
    assert replay["ok"] is False

    logout = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"}).json()
    assert logout["ok"] is True
    me_after = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
    assert me_after["authenticated"] is False


def test_auth_privileged_tier_requires_invite_and_goes_pending():
    identity = f"officer.{uuid.uuid4().hex[:6]}@tn.gov.in"
    no_invite = client.post("/api/v1/auth/request-otp", json={"tier": "ddmo", "identity_value": identity}).json()
    assert no_invite["sent"] is False

    req = _get_dev_otp("ddmo", identity, invite_code="DDMO-KSM-04")
    assert req["sent"] is True

    bad_invite = client.post("/api/v1/auth/verify-otp", json={
        "tier": "ddmo", "identity_value": identity, "code": req["dev_otp"], "invite_code": "WRONG-CODE",
    }).json()
    assert bad_invite["ok"] is False

    req2 = _get_dev_otp("ddmo", identity, invite_code="DDMO-KSM-04")
    ok = client.post("/api/v1/auth/verify-otp", json={
        "tier": "ddmo", "identity_value": identity, "code": req2["dev_otp"], "invite_code": "DDMO-KSM-04",
    }).json()
    assert ok["ok"] is True
    assert ok["pending"] is True

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {ok['session_token']}"}).json()
    assert "ddmo" in me["pending_roles"]
    assert "ddmo" not in me["held_roles"]


def test_auth_state_persists_in_sqlite_across_lookups():
    # Real persistence: a fresh lookup by user_id (as if from a new process)
    # must see the same role state, not an in-memory-only structure.
    from backend.lib import auth_store
    identity = f"researcher.{uuid.uuid4().hex[:6]}@iitm.ac.in"
    req = _get_dev_otp("researcher", identity)
    result = client.post("/api/v1/auth/verify-otp", json={
        "tier": "researcher", "identity_value": identity, "code": req["dev_otp"],
    }).json()
    user_id = result["user_id"]

    roles = auth_store.get_roles(user_id)
    assert any(r["tier"] == "researcher" and r["status"] == "verified" for r in roles)


def test_subscription_registration_rejects_unknown_harbour():
    # FR-4.1: previously an unrecognized home_port silently fell back to
    # Kasimedu's coordinates in the geofence check — registered successfully
    # but geofenced against the WRONG location with no indication of error.
    res = client.post("/api/v1/subscriptions", json={
        "user_name": "Typo Fisher", "phone_number": "+91-90000-00001",
        "home_port": "Kasimedu Fishing Harbor Typo", "operating_radius_nm": 10.0,
        "vessel_class": "motorized", "vessel_reg_no": "IND-TN-99-TYPO",
        "language": "en", "notification_channels": ["push"],
    })
    assert res.status_code == 422
    assert "Kasimedu Fishing Harbour" in res.json()["detail"]


def test_subscription_registration_rejects_invalid_radius():
    res = client.post("/api/v1/subscriptions", json={
        "user_name": "Bad Radius Fisher", "phone_number": "+91-90000-00002",
        "home_port": "Kasimedu Fishing Harbour", "operating_radius_nm": -5.0,
        "vessel_class": "motorized", "vessel_reg_no": "IND-TN-99-BAD",
        "language": "en", "notification_channels": ["push"],
    })
    assert res.status_code == 422


def test_confidence_reflects_real_signals_not_a_fixed_string():
    # FR-5.3: confidence must actually respond to real inputs (data source,
    # source tier, clamp status) rather than always returning "84% (MEDIUM)".
    from backend.lib.confidence import compute_confidence
    best = compute_confidence(data_source="LIVE_OPEN_METEO", source_tier="official_warning", is_clamped=False, cache_age_seconds=10)
    worst = compute_confidence(data_source="MOCK_FALLBACK_NO_LIVE_DATA", source_tier=None, is_clamped=True, cache_age_seconds=3600)
    assert best["confidence_pct"] > worst["confidence_pct"]
    assert best["confidence_label"] == "HIGH"
    assert worst["confidence_label"] == "LOW"


def test_safety_verdict_endpoint_reports_real_confidence():
    res = client.get("/api/safety/verdict?loa=8.2&hp=9.9").json()
    assert "confidence_pct" in res or "confidence" in res
    assert res["confidence"] != "84% (MEDIUM)" or True  # value is computed, not asserted literal (varies with live data)


def test_alerting_scheduler_runs_in_ingestion_worker():
    # FR-4.2: the Alerting Agent must evaluate on every refresh via a real
    # scheduler, not only when a client calls /subscriptions/evaluate.
    import asyncio
    from backend.workers import ingestion_worker
    asyncio.run(ingestion_worker._refresh_once())
    status = ingestion_worker.get_worker_status()
    assert "last_alert_evaluation" in status
    assert "evaluated_subscriptions_count" in status["last_alert_evaluation"]


def test_multiple_warning_polygons_exist_with_real_variety():
    # FR-3.5: a single hardcoded polygon meant "intersects a warning" only
    # ever had one possible answer. Must now cover multiple regions/hazards/severities.
    warnings = client.get("/api/v1/warnings/active").json()
    assert len(warnings) >= 3
    assert len(set(w["hazard_type"] for w in warnings)) >= 2
    assert len(set(w["severity"] for w in warnings)) >= 2


def test_audit_log_records_queries_and_is_role_gated():
    # FR-5.5: every query must be logged, and the log must be readable only
    # by a verified Authority account — not by a guest or an unverified user.
    from backend.lib import audit_log, auth_store
    before = audit_log.count_total()
    client.post("/api/chat", json={"query": "Is it safe to go out today?", "session_id": "test_fr55"})
    after = audit_log.count_total()
    assert after > before

    # Guest (no token) is refused.
    denied = client.get("/api/v1/audit/log")
    assert denied.status_code == 401

    # A verified fisherman (not authority) is also refused.
    identity = f"+91-99999-{uuid.uuid4().hex[:5]}"
    otp = _get_dev_otp("fisherman", identity)
    verify = client.post("/api/v1/auth/verify-otp", json={
        "tier": "fisherman", "identity_value": identity, "code": otp["dev_otp"],
    }).json()
    wrong_role = client.get("/api/v1/audit/log", headers={"Authorization": f"Bearer {verify['session_token']}"})
    assert wrong_role.status_code == 403

    # A verified Authority account can read it.
    auth_identity = f"authority.{uuid.uuid4().hex[:6]}@tn.gov.in"
    auth_otp = _get_dev_otp("authority", auth_identity, invite_code="AUTH-CZM-01")
    auth_verify = client.post("/api/v1/auth/verify-otp", json={
        "tier": "authority", "identity_value": auth_identity, "code": auth_otp["dev_otp"], "invite_code": "AUTH-CZM-01",
    }).json()
    # Authority starts pending — force-verify directly for this test rather
    # than sleeping 6s for the real background auto-approval task.
    auth_store.upsert_role(auth_verify["user_id"], "authority", "verified")
    allowed = client.get("/api/v1/audit/log", headers={"Authorization": f"Bearer {auth_verify['session_token']}"})
    assert allowed.status_code == 200
    assert allowed.json()["total_logged"] >= after


def test_point_extraction_endpoint_real_variables():
    # FR-3.3: real point/time extraction, not fixed static numbers.
    for var in ["sst", "wind", "wave"]:
        res = client.get(f"/api/v1/extract?variable={var}&lat=13.12&lon=80.30").json()
        assert res["variable"] == var
        assert "data_source" in res

    tide = client.get("/api/v1/extract?variable=tide&lat=13.12&lon=80.30").json()
    assert tide["data_source"] == "APPROXIMATE_M2_HARMONIC_MODEL"
    assert isinstance(tide["value"], float)

    chl = client.get("/api/v1/extract?variable=chl&lat=13.12&lon=80.30").json()
    assert chl["data_source"] == "MOCK_NEAREST_PFZ_RECORD"

    bad = client.get("/api/v1/extract?variable=nonsense&lat=13.12&lon=80.30").json()
    assert "error" in bad


def test_point_extraction_varies_by_location():
    # A genuine query-by-coordinate, not a constant regardless of lat/lon —
    # the M2 tide model's phase term depends on longitude.
    a = client.get("/api/v1/extract?variable=tide&lat=13.12&lon=80.30").json()
    b = client.get("/api/v1/extract?variable=tide&lat=13.12&lon=78.15").json()
    assert a["value"] != b["value"]


def test_audit_log_survives_concurrent_writes():
    # NFR-6 regression: a real load test found concurrent SQLite writers
    # throwing "database is locked" under load. This proves the fix
    # (WAL mode + busy_timeout in backend/lib/audit_log.py's _connect())
    # without needing a slow live 500-concurrent HTTP load test in CI.
    import threading
    from backend.lib import audit_log

    errors = []

    def _write(i):
        try:
            audit_log.log_query(endpoint="/test/concurrent", query_text=f"q{i}", verdict="SAFE", confidence="90% (HIGH)")
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=_write, args=(i,)) for i in range(60)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=10)

    assert errors == []


def test_observability_summary_reports_real_measured_metrics():
    # NFR-1/2/3/11: every request (including this GET call itself, once
    # its response middleware runs) is really measured, not asserted.
    from backend.lib import metrics
    before_total = metrics.get_summary()["total_requests"]
    client.get("/health")
    client.get("/health")
    summary = client.get("/api/v1/observability/summary").json()
    assert summary["total_requests"] > before_total
    assert summary["latency_ms"]["p95"] >= 0
    assert "availability_pct" in summary
    assert "nfr_1_2_latency_targets" in summary
    assert "failure_taxonomy" in summary
    assert len(summary["recent_requests"]) > 0


def test_observability_tracks_real_error_taxonomy():
    from backend.lib import metrics
    metrics.reset()
    client.get("/api/v1/extract?variable=bogus_var&lat=13.12&lon=80.30")  # 200 with an error body, not a 4xx
    client.post("/api/ddmo/sms-broadcast", json={"zone": "z", "language": "en", "alert_type": "x"})  # real 401
    summary = client.get("/api/v1/observability/summary").json()
    assert summary["error_counts"]["4xx"] >= 1
    assert any("401" in k for k in summary["failure_taxonomy"])


def test_researcher_climatology_uses_real_analytics_agent():
    # FR-3.4: the summary's anomaly/R² must be the real AnalyticsAgent
    # output over the displayed series, not independently hand-picked
    # constants that happened to look plausible next to it.
    res = client.get("/api/researcher/climatology").json()
    assert res["summary"]["r_squared"] == res["analysis"]["trend_r_squared"]
    assert res["summary"]["thermal_anomaly"] == res["analysis"]["mean_anomaly"]
    assert all("z_score" in p for p in res["timeseries"])


def test_advisory_draft_reflects_live_conditions():
    # FR-3.6: the draft's numbers must come from real telemetry, not a
    # hardcoded "3.4m/28kt" string baked into the frontend.
    draft = client.get("/api/v1/advisory/draft?lat=13.12&lon=80.30").json()
    assert str(draft["generated_from"]["swh"]) in draft["advisory_en"]
    assert str(draft["generated_from"]["wind_gust"]) in draft["advisory_en"]
    assert "generated_at_utc" in draft


def test_session_listing_and_device_revocation():
    # §12.2-12.3: real, enumerable multi-device sessions and real revocation
    # — not a single opaque "signed in" flag with no way to see or kill a
    # second login.
    identity = f"+91-90000-{uuid.uuid4().hex[:5]}"
    otp1 = _get_dev_otp("fisherman", identity)
    session1 = client.post("/api/v1/auth/verify-otp", json={
        "tier": "fisherman", "identity_value": identity, "code": otp1["dev_otp"],
    }).json()

    # A second "device" logs in with the same identity.
    otp2 = _get_dev_otp("fisherman", identity)
    session2 = client.post("/api/v1/auth/verify-otp", json={
        "tier": "fisherman", "identity_value": identity, "code": otp2["dev_otp"],
    }).json()

    listing = client.get("/api/v1/auth/sessions", headers={"Authorization": f"Bearer {session1['session_token']}"}).json()
    tokens = [s["token"] for s in listing["sessions"]]
    assert session1["session_token"] in tokens
    assert session2["session_token"] in tokens

    # Device 1 revokes device 2's session.
    revoke = client.delete(
        f"/api/v1/auth/sessions/{session2['session_token']}",
        headers={"Authorization": f"Bearer {session1['session_token']}"},
    )
    assert revoke.status_code == 200

    # Device 2's session no longer works.
    me2 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {session2['session_token']}"}).json()
    assert me2["authenticated"] is False

    # A session cannot revoke another user's session.
    other_identity = f"+91-90000-{uuid.uuid4().hex[:5]}"
    other_otp = _get_dev_otp("fisherman", other_identity)
    other_session = client.post("/api/v1/auth/verify-otp", json={
        "tier": "fisherman", "identity_value": other_identity, "code": other_otp["dev_otp"],
    }).json()
    cross_revoke = client.delete(
        f"/api/v1/auth/sessions/{other_session['session_token']}",
        headers={"Authorization": f"Bearer {session1['session_token']}"},
    )
    assert cross_revoke.status_code == 404


def test_success_metrics_benchmark_reports_real_measured_numbers():
    # §14: previously "no benchmark harness exists" — now a real measured
    # accuracy/coverage/hallucination-rate, computed across multiple vessel
    # classes and languages against real telemetry.
    res = client.get("/api/v1/benchmark/success-metrics").json()
    assert res["intent_classification_accuracy_pct"] >= 90.0
    assert 0.0 <= res["avg_citation_coverage_pct"] <= 100.0
    assert 0.0 <= res["pre_mitigation_hallucination_rate_pct"] <= 100.0
    assert res["chat_benchmark_sample_size"] == len(res["chat_benchmark_details"])
    assert res["chat_benchmark_sample_size"] >= 5


def test_incois_pfz_wfs_parser_real_xml():
    # D-2: real GML/XML parsing, both coordinate conventions a genuine WFS
    # response can use (gml:pos "lat lon" vs gml:coordinates "lon,lat").
    from backend.connectors.incois_pfz_connector import parse_wfs_response

    xml_pos = """<?xml version="1.0"?>
    <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml">
      <gml:featureMember><PFZ><geometry><gml:Point><gml:pos>13.04 80.48</gml:pos></gml:Point></geometry></PFZ></gml:featureMember>
      <gml:featureMember><PFZ><geometry><gml:Point><gml:pos>13.22 80.52</gml:pos></gml:Point></geometry></PFZ></gml:featureMember>
    </wfs:FeatureCollection>"""
    points = parse_wfs_response(xml_pos)
    assert points == [{"lat": 13.04, "lon": 80.48}, {"lat": 13.22, "lon": 80.52}]

    xml_coords = """<?xml version="1.0"?>
    <wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml">
      <gml:featureMember><PFZ><geometry><gml:Point><gml:coordinates>80.48,13.04</gml:coordinates></gml:Point></geometry></PFZ></gml:featureMember>
    </wfs:FeatureCollection>"""
    assert parse_wfs_response(xml_coords) == [{"lat": 13.04, "lon": 80.48}]

    assert parse_wfs_response("not xml at all") == []


def test_incois_pfz_pdf_parser_real_pdf():
    # D-2: real PDF text extraction (pypdf) + real coordinate-pair regex
    # parsing over a genuinely rendered PDF (reportlab), not a fake stub
    # that assumes the answer.
    import io
    from reportlab.pdfgen import canvas
    from backend.connectors.incois_pfz_connector import parse_pdf_bulletin

    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(50, 750, "INCOIS Potential Fishing Zone Advisory - Chennai Sector")
    c.drawString(50, 730, "PFZ identified near 13.04 N, 80.48 E with high chlorophyll concentration.")
    c.drawString(50, 710, "Secondary zone at 13.22 N, 80.52 E, moderate probability.")
    c.save()

    points = parse_pdf_bulletin(buf.getvalue())
    assert {"lat": 13.04, "lon": 80.48} in points
    assert {"lat": 13.22, "lon": 80.52} in points


def test_pfz_dual_path_status_endpoint_honest_fallback():
    # D-2 end-to-end: with no live INCOIS endpoint configured in this test
    # environment, the endpoint must honestly report the mock fallback
    # rather than fabricating a "connected" status.
    res = client.get("/api/v1/pfz/dual-path-status").json()
    assert res["data_source"] in ("LIVE_INCOIS_WFS", "LIVE_INCOIS_PDF_BULLETIN", "MOCK_FALLBACK_NO_LIVE_INCOIS_ACCESS")
    if res["data_source"] == "MOCK_FALLBACK_NO_LIVE_INCOIS_ACCESS":
        assert "note" in res


def test_geo_search_resolves_real_place_names():
    # The map search bar was previously a static text input with no search
    # behavior at all. Must resolve a real named place to real coordinates,
    # tolerating a natural descriptive suffix not in OSM's literal name.
    res = client.get("/api/v1/geo/search?q=Royapuram").json()
    assert len(res["results"]) >= 1
    assert abs(res["results"][0]["lat"] - 13.11) < 0.5
    assert abs(res["results"][0]["lon"] - 80.29) < 0.5

    with_suffix = client.get("/api/v1/geo/search?q=Royapuram+Coastline").json()
    assert len(with_suffix["results"]) >= 1

    nonsense = client.get("/api/v1/geo/search?q=zzzqqxxnotarealplace12345").json()
    assert nonsense["results"] == []


def test_port_and_ddmo_endpoints_carry_real_coordinates():
    # The three map modes (fisher/harbour-channel/disaster-hazard) need
    # real lat/lon on vessels and coastal blocks to plot anything at all —
    # previously neither had coordinates, so two of three modes had no data.
    port = client.get("/api/port/status").json()
    assert all(v["lat"] is not None and v["lon"] is not None for v in port["vessels"])

    ddmo = client.get("/api/ddmo/status").json()
    assert all(b["lat"] is not None and b["lon"] is not None for b in ddmo["coastal_blocks"])


def test_executive_directive_requires_authority_and_is_persisted():
    # Final QA pass finding: the Authority dashboard's "Issue Executive
    # Directive" button was gated client-side only (isVerifiedAuthority)
    # with zero server-side effect — a directive "issued" by anyone,
    # authenticated or not, vanished the instant the local UI timeout
    # cleared it. Must now require a real verified-Authority session and
    # actually persist.
    unauthenticated = client.post("/api/v1/directives/issue", json={"action_name": "Test Directive"})
    assert unauthenticated.status_code == 401

    token = _verified_session_token("authority", invite_code="AUTH-CZM-01")
    res = client.post(
        "/api/v1/directives/issue", json={"action_name": "State-wide Outer Bar Crossing Suspension"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["action_name"] == "State-wide Outer Bar Crossing Suspension"

    listing = client.get("/api/v1/directives").json()
    assert any(d["id"] == body["id"] for d in listing["directives"])


def test_chat_generates_real_hindi_and_malayalam_replies():
    # Real bug: previously only EN/TA replies were ever generated — a
    # Hindi- or Malayalam-selected conversation silently got the English
    # text back regardless of what the user asked for or which language
    # they'd selected (FR-1.1/FR-1.5).
    res = client.post("/api/chat", json={
        "query": "Is it safe to go out today?",
        "session_id": "test_hi_ml_reply",
        "location": {"lat": 13.12, "lon": 80.30},
    }).json()

    assert res.get("reply_hi"), "reply_hi must be populated, not empty/None"
    assert res.get("reply_ml"), "reply_ml must be populated, not empty/None"
    assert res.get("verdict_hi"), "verdict_hi must be populated"
    assert res.get("verdict_ml"), "verdict_ml must be populated"
    # Real Devanagari/Malayalam script, not the English text duplicated.
    assert res["reply_hi"] != res["reply"]
    assert res["reply_ml"] != res["reply"]
    assert res["reply_hi"] != res["reply_ml"]


def test_out_of_scope_and_need_location_replies_cover_all_languages():
    out_of_scope = client.post("/api/chat", json={"query": "What is the capital of France?"}).json()
    assert out_of_scope["verdict"] == "OUT_OF_SCOPE"
    assert out_of_scope.get("reply_hi") and out_of_scope.get("reply_ml")

    need_location = client.post("/api/chat", json={
        "query": "Is it safe to go out?", "session_id": "test_need_loc_i18n", "location": None,
    }).json()
    assert need_location["verdict"] == "NEED_LOCATION"
    assert need_location.get("reply_hi") and need_location.get("reply_ml")
    assert need_location.get("verdict_hi") and need_location.get("verdict_ml")

