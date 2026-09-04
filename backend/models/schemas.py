from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- PRD §13 Canonical Evidence & Chat Schemas ---
class EvidenceItem(BaseModel):
    source: str
    variable: str
    value: Any
    unit: str = ""
    grid: str = ""
    valid_time: str
    retrieved: str

class ValidWindow(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    from_time: str = Field(..., alias="from")
    to_time: str = Field(..., alias="to")

class PrdChatRequest(BaseModel):
    session_id: Optional[str] = "s_default"
    message: Optional[str] = None
    query: Optional[str] = None  # alias for backward compat
    location: Optional[Dict[str, float]] = Field(default_factory=lambda: {"lat": 13.12, "lon": 80.30})
    language: Optional[str] = "en"  # 'en' | 'ta' | 'hi'
    vessel_profile: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {"class": "motorized", "length_m": 8.2, "speed_kn": 7.0}
    )
    vessel_loa: Optional[float] = None
    vessel_hp: Optional[float] = None

class PrdChatResponse(BaseModel):
    verdict: str  # 'SAFE' | 'CAUTION' | 'DO NOT VENTURE' | 'INSUFFICIENT_DATA'
    answer: Optional[str] = None
    reply: Optional[str] = None  # alias for frontend compat
    reply_ta: Optional[str] = None
    reply_hi: Optional[str] = None
    reply_ml: Optional[str] = None
    verdict_ta: Optional[str] = None
    verdict_hi: Optional[str] = None
    verdict_ml: Optional[str] = None
    drivers: Optional[List[str]] = Field(default_factory=list)
    valid_window: Optional[ValidWindow] = None
    evidence: Optional[List[EvidenceItem]] = Field(default_factory=list)
    confidence: str = "MEDIUM"  # 'HIGH' | 'MEDIUM' | 'LOW'
    disclaimer: str = "Advisory only. Follow official IMD/INCOIS warnings and local port authority instructions."
    sources: Optional[List[str]] = None
    reasoning_chain: Optional[List[Dict[str, Any]]] = None
    suggested_followups: Optional[List[str]] = None
    target_window: Optional[str] = None
    citation_coverage_pct: Optional[float] = None

# --- PRD §13 Task Graph (DAG) Schemas ---
class TaskGraphNode(BaseModel):
    id: str
    agent: str
    tool: str
    description: str
    args: Dict[str, Any]
    status: str = "COMPLETED"  # 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
    latency_ms: int = 120
    retrieved_source: Optional[str] = None
    timestamp: Optional[str] = None

class TaskGraphEdge(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")

# Aliases for backward compatibility
ChatRequest = PrdChatRequest
ChatResponse = PrdChatResponse

class TaskGraphPlanResponse(BaseModel):
    query: str
    intent: str
    total_nodes: int
    parallel_branches: int
    estimated_latency_ms: int
    nodes: List[TaskGraphNode]
    edges: List[TaskGraphEdge]
    evidence_leaf_count: int

# --- Subscriptions Schema (FR-4.1) ---
class SubscriptionCreateRequest(BaseModel):
    user_name: str = "K. Arumugam"
    phone_number: str = "+91-98401-44910"
    home_port: str = "Kasimedu Fishing Harbour"
    operating_radius_nm: float = 25.0
    vessel_class: str = "motorized"  # 'nonMotorized' | 'motorized' | 'mechanized'
    vessel_reg_no: str = "IND-TN-02-MM-4491"
    language: str = "ta"
    notification_channels: List[str] = ["push", "sms"]

class SubscriptionRecord(SubscriptionCreateRequest):
    id: str
    registered_at: str
    active: bool = True
    last_geofence_check: str
    alert_count: int = 0

# --- Active Warnings Schema ---
class WarningPolygon(BaseModel):
    id: str
    agency: str = "IMD / INCOIS"
    severity: str  # 'WATCH' | 'ALERT' | 'WARNING'
    hazard_type: str  # 'SQUALL' | 'HIGH_WAVE' | 'CYCLONE'
    title: str
    description: str
    valid_from: str
    valid_until: str
    coordinates: List[Dict[str, float]]
    affected_coastal_blocks: List[str]

# --- Legacy & Screen Compatibility Schemas ---
class TelemetrySnapshot(BaseModel):
    swh: float
    wind_speed: float
    wind_gust: float
    swell_direction: str
    swell_period: float
    current_velocity: float
    sst: float
    timestamp: str
    data_source: Optional[str] = None

class SafetyVerdictResponse(BaseModel):
    state: str
    verdict_title: str
    verdict_ta: str
    verdict_hi: str
    sub_status: str
    confidence: str
    advisory_en: str
    advisory_ta: str
    target_window: str
    telemetry: TelemetrySnapshot
    exceedance_wave_pct: float
    exceedance_wind_pct: float
    craft_max_wave: float
    craft_max_wind: float
    sources: List[str]
    hourly_forecast: List[Dict[str, Any]]
    source_tier: Optional[str] = None

class PfzZoneItem(BaseModel):
    id: str
    name: str
    distance_nm: float
    distance_km: float = 34.1
    eta_hours: float = 2.6  # ETA at registered speed
    eta_label: str = "2h 38m @ 7 kt"
    bearing: str
    heading_deg: int
    chlorophyll: float
    sst: float
    sst_gradient: float
    species: str
    probability_pct: int
    fuel_saving_pct: int
    transit_safety: str
    transit_warning: Optional[str] = None
    issuing_centre: str = "INCOIS Hyderabad"
    valid_until: str = "Today 23:59 IST"
    coordinates: Dict[str, float]

class PfzResponse(BaseModel):
    zones: List[PfzZoneItem]
    transit_corridor_verdict: str
    transit_advisory: str
    satellite_timestamp: str
    sensor_origin: str

class AisVesselItem(BaseModel):
    name: str
    mmsi: str
    vessel_type: str
    draft_m: float
    status: str
    status_level: str
    berth: str
    action_required: str
    lat: Optional[float] = None
    lon: Optional[float] = None

class PortStatusResponse(BaseModel):
    port_name: str
    status_verdict: str
    tide_phase: str
    current_depth_datum: float
    next_high_tide: str
    visibility_nm: float
    vessels_in_perimeter: int
    active_warnings_count: int
    direct_vhf_channel: str
    vessels: List[AisVesselItem]
    warnings: List[str]

class DdmoMetrics(BaseModel):
    at_risk_population: int
    coastal_villages_count: int
    active_craft_at_sea: int
    sheltered_craft: int
    shelters_ready: int
    shelter_capacity: int
    response_teams_deployed: int

class IncidentLogItem(BaseModel):
    time: str
    type: str
    title: str
    desc: str
    status: str

class CoastalBlockExposure(BaseModel):
    block_name: str
    risk_level: str  # 'HIGH' | 'MODERATE' | 'LOW'
    projected_max_wave: float
    population_exposed: int
    shelter_status: str
    alert_action: str
    lat: Optional[float] = None
    lon: Optional[float] = None

class DdmoResponse(BaseModel):
    district: str
    alert_level: str
    bulletin_id: str
    valid_until: str
    metrics: DdmoMetrics
    incidents: List[IncidentLogItem]
    coastal_blocks: List[CoastalBlockExposure]

class SmsBroadcastRequest(BaseModel):
    zone: str = "Coromandel Zone 04"
    language: str = "ta"
    alert_type: str = "HIGH WAVE & SQUALL"

class SmsBroadcastResponse(BaseModel):
    status: str
    recipients_count: int
    payload_en: str
    payload_ta: str
    char_count: int
    delivery_channel: str
