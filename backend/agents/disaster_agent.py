from typing import Dict, Any
from ..services.sms_service import SmsService

class DisasterAgent:
    """
    Specialized AI Agent for District Disaster Management (DDMO) & Coastal Resilience:
    Tracks hazard mitigation KPIs, triggers emergency sirens, and generates 2G SMS fallback alerts.
    """

    @classmethod
    def get_ddmo_status(cls, district: str = "Chennai") -> Dict[str, Any]:
        return {
            "district": "Chennai Coastal District (Kasimedu - Ennore - Covelong)",
            "alert_level": "TIER-1 AMBER ADVISORY",
            "bulletin_id": "DDMO-INCOIS-2026-04",
            "valid_until": "18:00 IST",
            "metrics": {
                "at_risk_population": 142500,
                "coastal_villages_count": 8,
                "active_craft_at_sea": 28,
                "sheltered_craft": 418,
                "shelters_ready": 6,
                "shelter_capacity": 12000,
                "response_teams_deployed": 4,
            },
            "incidents": [
                {"time": "15:38 IST", "type": "WARNING", "title": "Nearshore Bar Breaking Surge", "desc": "Waves reaching 1.8m at Kasimedu harbour mouth. Non-decked craft prohibited.", "status": "ACTIVE"},
                {"time": "15:12 IST", "type": "INFO", "title": "Coast Guard Hovercraft Sortie", "desc": "ICG-H02 deployed to shepherd 28 returnee artisanal craft inside breaker line.", "status": "DEPLOYED"},
                {"time": "14:45 IST", "type": "SMS", "title": "Mass SMS Dissemination", "desc": "14,200 broadcast alerts delivered across North Chennai & Ennore fishing hamlets.", "status": "SENT"},
                {"time": "13:30 IST", "type": "ADVISORY", "title": "INCOIS Model Convergence", "desc": "WAVEWATCH-III confirms squall peak between 06:00 and 09:00 IST tomorrow.", "status": "VERIFIED"},
            ],
            # lat/lon are each block's real approximate coordinate (these
            # are genuine named localities along the Chennai coast, not
            # invented points) — what the map's "Disaster Hazard" mode plots.
            "coastal_blocks": [
                {"block_name": "Kasimedu Pier & Beach", "risk_level": "HIGH", "projected_max_wave": 3.4, "population_exposed": 4200, "shelter_status": "Community Hall 01 (Ready)", "alert_action": "Prohibit Launch & Beach Evacuation", "lat": 13.120, "lon": 80.298},
                {"block_name": "Ennore Creek Mouth", "risk_level": "HIGH", "projected_max_wave": 3.1, "population_exposed": 2800, "shelter_status": "Ennore Cyclone Shelter (Open)", "alert_action": "Halt Estuary Bar Transit", "lat": 13.232, "lon": 80.332},
                {"block_name": "Tiruvottiyur Sector", "risk_level": "MODERATE", "projected_max_wave": 2.8, "population_exposed": 1900, "shelter_status": "Tiruvottiyur High School (Standby)", "alert_action": "Haul Catamarans Above HTL", "lat": 13.163, "lon": 80.317},
                {"block_name": "Royapuram Fairway", "risk_level": "MODERATE", "projected_max_wave": 2.5, "population_exposed": 1400, "shelter_status": "Harbour Transit Shed (Open)", "alert_action": "VHF Warning Broadcast", "lat": 13.111, "lon": 80.297},
                {"block_name": "Kovalam Bay Sector", "risk_level": "LOW", "projected_max_wave": 1.9, "population_exposed": 800, "shelter_status": "Local Centre (Monitoring)", "alert_action": "Routine Safety Watch", "lat": 12.790, "lon": 80.251},
            ],
        }

    @classmethod
    def generate_emergency_broadcast(cls, verdict: str = "CAUTION", swh: float = 1.8, wind: float = 24.0) -> Dict[str, Any]:
        sms_data = SmsService.format_sms_alert(verdict=verdict, swh=swh, wind=wind)
        return {
            "status": "DISPATCH_READY",
            "recipients_estimated": 14200,
            "sms_payload": sms_data,
            "channels": ["NavIC DAT-SG Transponder", "2G Coastal GSM Cell Broadcast", "Harbour VHF Ch-16"],
            "siren_trigger_ready": True,
        }
