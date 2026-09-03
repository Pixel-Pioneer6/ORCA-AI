from typing import Dict, Any
from ..services.imd_service import ImdService

class WeatherHazardAgent:
    """
    Specialized AI Agent for Weather Hazard, Squall Envelope and Cyclone Monitoring.
    """

    @classmethod
    def get_active_hazard_summary(cls, district: str = "Chennai") -> Dict[str, Any]:
        warning = ImdService.get_active_marine_warnings(district)
        return {
            "has_active_hazard": True,
            "hazard_title": warning["warning_type"],
            "bulletin_id": warning["bulletin_id"],
            "urgency": warning["urgency"],
            "valid_until": warning["valid_until"],
            "max_gusts_knots": warning["max_gust_knots"],
            "advisory": warning["advisory_summary"],
            "exclusion_polygon": warning["hazard_polygon_bounds"],
            "source": "IMD Doppler Weather Radar & High Sea Forecast",
        }
