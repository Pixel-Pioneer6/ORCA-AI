import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.agents.guardrail import HydrodynamicGuardrail

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

def test_ddmo_sms_broadcast():
    res = client.post("/api/ddmo/sms-broadcast", json={
        "zone": "Zone 04",
        "language": "ta",
        "alert_type": "HIGH WAVE"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "DISPATCHED"
    assert len(data["payload_en"]) <= 160
    assert len(data["payload_ta"]) <= 160

def test_port_status():
    res = client.get("/api/port/status")
    assert res.status_code == 200
    data = res.json()
    assert len(data["vessels"]) >= 3
    assert data["direct_vhf_channel"] != ""
