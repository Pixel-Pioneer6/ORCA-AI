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
