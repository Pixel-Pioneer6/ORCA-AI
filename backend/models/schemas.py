from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- Chat & Assistant Schemas (Screen 05) ---
class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str
    language: Optional[str] = "en"  # 'en' | 'ta' | 'hi'

class ChatRequest(BaseModel):
    query: str
    language: Optional[str] = "en"
    vessel_loa: Optional[float] = 8.2
    vessel_hp: Optional[float] = 9.9
    location: Optional[str] = "Kasimedu (13.12°N, 80.30°E)"
    history: Optional[List[ChatMessage]] = []

class AgentReasoningStep(BaseModel):
    step: int
    agent: str
    finding: str

class ChatResponse(BaseModel):
    reply: str
    reply_ta: Optional[str] = None
    verdict: str  # 'SAFE' | 'CAUTION' | 'DO NOT VENTURE' | 'STALE'
    verdict_ta: str
    confidence: str
    sources: List[str]
    reasoning_chain: List[AgentReasoningStep]
    suggested_followups: List[str]
    target_window: Optional[str] = None

# --- Safety Schemas (Screens 01 & 02) ---
class SafetyEvaluationRequest(BaseModel):
    loa: float = 8.2
    hp: float = 9.9
    lat: float = 13.12
    lon: float = 80.30
    departure_time: Optional[str] = "tomorrow 05:00"

class TelemetrySnapshot(BaseModel):
    swh: float = Field(..., description="Significant wave height in meters")
    wind_speed: float = Field(..., description="Wind speed in knots")
    wind_gust: float
    swell_direction: str
    swell_period: float
    current_velocity: float
    sst: float
    timestamp: str

class SafetyVerdictResponse(BaseModel):
    state: str  # 'caution' | 'safe' | 'danger' | 'stale'
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

# --- Potential Fishing Zone (PFZ) Schemas (Screen 03) ---
class PfzZoneItem(BaseModel):
    id: str
    name: str
    distance_nm: float
    bearing: str
    heading_deg: int
    chlorophyll: float  # mg/m3
    sst: float  # °C
    sst_gradient: float
    species: str
    probability_pct: int
    fuel_saving_pct: int
    transit_safety: str
    transit_warning: Optional[str] = None
    coordinates: Dict[str, float]

class PfzResponse(BaseModel):
    zones: List[PfzZoneItem]
    transit_corridor_verdict: str
    transit_advisory: str
    satellite_timestamp: str
    sensor_origin: str

# --- Port Operations Schemas (Screen 09) ---
class AisVesselItem(BaseModel):
    name: str
    mmsi: str
    vessel_type: str
    draft_m: float
    status: str
    status_level: str  # 'safe' | 'caution' | 'danger'
    berth: str
    action_required: str

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

# --- DDMO & Disaster Management Schemas (Screen 08) ---
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

class DdmoResponse(BaseModel):
    district: str
    alert_level: str
    bulletin_id: str
    valid_until: str
    metrics: DdmoMetrics
    incidents: List[IncidentLogItem]

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
    delivery_channel: str  # 'NavIC Transponder & 2G GSM Cell Broadcast'
