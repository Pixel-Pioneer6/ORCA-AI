from typing import Dict, Any

class ImdService:
    """
    Simulates IMD (India Meteorological Department) Marine Coastal Weather Warnings
    and Doppler Radar Ingest.
    """

    @classmethod
    def get_active_marine_warnings(cls, district: str = "Chennai") -> Dict[str, Any]:
        return {
            "bulletin_id": "IMD-KSM-SQUALL-04",
            "warning_type": "HIGH WAVE & SQUALLY WIND ADVISORY",
            "urgency": "CAUTION",
            "valid_until": "18:00 IST",
            "max_gust_knots": 28,
            "wind_direction": "North-Easterly",
            "hazard_polygon_bounds": [
                {"lat": 13.10, "lon": 80.28},
                {"lat": 13.18, "lon": 80.38},
                {"lat": 13.14, "lon": 80.44},
                {"lat": 13.06, "lon": 80.32},
            ],
            "advisory_summary": "Wind gusts 24-28 kt along Tamil Nadu north coast. Nearshore breaking swells. Non-mechanized craft advised not to venture.",
        }
