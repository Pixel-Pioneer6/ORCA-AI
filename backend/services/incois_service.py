from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

class IncoisService:
    """
    Simulates high-resolution INCOIS Ocean State Forecast (OSF) numerical model 
    (WAVEWATCH-III & SWAN) and in-situ wave rider buoy (BD08) telemetry.
    """
    
    @classmethod
    def get_buoy_telemetry(cls, lat: float = 13.12, lon: float = 80.30) -> Dict[str, Any]:
        """Returns live observation snapshot from Kasimedu coastal buoy BD08."""
        now_utc = datetime.now(timezone.utc)
        ist_time = now_utc + timedelta(hours=5, minutes=30)
        
        return {
            "buoy_id": "BD08-KSM",
            "location_name": "Kasimedu Pier (13.12°N, 80.30°E)",
            "swh": 1.8,  # Significant Wave Height in meters
            "wave_max": 2.4,
            "wave_period": 8.4,  # seconds
            "swell_direction": "142° SE",
            "wind_speed": 24.0,  # knots
            "wind_gust": 28.0,
            "wind_direction": "NE (045°)",
            "surface_current": 1.2,  # knots
            "sst": 28.2,  # °C
            "water_depth_bar": 2.8,  # meters at harbour bar
            "tide_height": 0.9,  # meters
            "timestamp": ist_time.strftime("%Y-%m-%d %H:%M:%S IST"),
            "latency_minutes": 14,
            "qc_status": "QC-PASSED (Level 2B)",
        }

    @classmethod
    def get_hourly_forecast(cls, hours: int = 8) -> List[Dict[str, Any]]:
        """Generates 8-hour consecutive forecast curve starting from 05:00 IST."""
        base_forecast = [
            {"time": "05:00", "wave": 1.4, "wind": 16, "status": "safe"},
            {"time": "06:00", "wave": 1.6, "wind": 20, "status": "caution"},
            {"time": "07:00", "wave": 1.8, "wind": 24, "status": "caution"},
            {"time": "08:00", "wave": 1.7, "wind": 22, "status": "caution"},
            {"time": "09:00", "wave": 1.5, "wind": 18, "status": "caution"},
            {"time": "10:00", "wave": 1.3, "wind": 15, "status": "safe"},
            {"time": "11:00", "wave": 1.2, "wind": 13, "status": "safe"},
            {"time": "12:00", "wave": 1.1, "wind": 10, "status": "safe"},
        ]
        return base_forecast[:hours]
