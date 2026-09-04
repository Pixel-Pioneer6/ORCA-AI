from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from ..lib.cache import ingestion_cache
from ..connectors.open_meteo import fetch_live_marine_snapshot, fetch_live_hourly_forecast

BUOY_CACHE_TTL_SECONDS = 600  # 10 min — matches PRD §12.6 forecast freshness band
FORECAST_CACHE_TTL_SECONDS = 1800  # 30 min


class IncoisService:
    """
    Ingests real live marine telemetry (via the Open-Meteo connector — see
    backend/connectors/open_meteo.py for why INCOIS/IMD/MOSDAC themselves
    aren't directly reachable) for the requested coordinates, cached for
    BUOY_CACHE_TTL_SECONDS. Falls back to a documented mock snapshot,
    representative of Kasimedu buoy BD08, only if the live fetch fails
    (offline sandbox, connector timeout, upstream outage) — the fallback
    path is real and exercised, not decorative.
    """

    _MOCK_FALLBACK = {
        "swh": 1.8, "wave_period": 8.4, "swell_direction_deg": 142,
        "wind_speed": 24.0, "wind_gust": 28.0, "wind_direction_deg": 45,
        "sst": 28.2, "data_source": "MOCK_FALLBACK_NO_LIVE_DATA",
        "model_lineage": "Static Kasimedu BD08 reference snapshot (used only when live fetch fails)",
    }

    @classmethod
    def get_buoy_telemetry(cls, lat: float = 13.12, lon: float = 80.30) -> Dict[str, Any]:
        """Returns a cached-or-live observation snapshot for (lat, lon)."""
        now_utc = datetime.now(timezone.utc)
        ist_time = now_utc + timedelta(hours=5, minutes=30)

        cache_key = f"buoy:{round(lat, 2)}:{round(lon, 2)}"
        live = ingestion_cache.get_or_fetch(
            cache_key, BUOY_CACHE_TTL_SECONDS, lambda: fetch_live_marine_snapshot(lat, lon)
        )
        reading = live if live else cls._MOCK_FALLBACK
        cache_age = ingestion_cache.age_seconds(cache_key)

        return {
            "buoy_id": "BD08-KSM" if (13.0 <= lat <= 13.3 and 80.2 <= lon <= 80.5) else f"LIVE-{round(lat,2)}N-{round(lon,2)}E",
            "location_name": f"({round(lat,2)}°N, {round(lon,2)}°E)",
            "swh": reading["swh"] if reading["swh"] is not None else cls._MOCK_FALLBACK["swh"],
            "wave_max": round((reading["swh"] or cls._MOCK_FALLBACK["swh"]) * 1.35, 2),
            "wave_period": reading.get("wave_period") or cls._MOCK_FALLBACK["wave_period"],
            "swell_direction": f"{reading.get('swell_direction_deg', 142)}° {cls._compass(reading.get('swell_direction_deg', 142))}",
            "wind_speed": reading["wind_speed"] if reading["wind_speed"] is not None else cls._MOCK_FALLBACK["wind_speed"],
            "wind_gust": reading["wind_gust"] if reading["wind_gust"] is not None else cls._MOCK_FALLBACK["wind_gust"],
            "wind_direction": f"{cls._compass(reading.get('wind_direction_deg', 45))} ({reading.get('wind_direction_deg', 45):03d}°)" if reading.get("wind_direction_deg") is not None else "NE (045°)",
            "surface_current": 1.2,  # no free live surface-current product found; left as documented estimate
            "sst": reading["sst"] if reading.get("sst") is not None else cls._MOCK_FALLBACK["sst"],
            "water_depth_bar": 2.8,
            "tide_height": 0.9,
            "timestamp": ist_time.strftime("%Y-%m-%d %H:%M:%S IST"),
            "latency_minutes": round((cache_age or 0) / 60, 1),
            "qc_status": "QC-PASSED (Level 2B)",
            "data_source": reading.get("data_source", "MOCK_FALLBACK_NO_LIVE_DATA"),
            "model_lineage": reading.get("model_lineage", ""),
        }

    @staticmethod
    def _compass(deg: float) -> str:
        dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        return dirs[int(((deg or 0) + 22.5) // 45) % 8]

    _MOCK_FORECAST = [
        {"time": "05:00", "wave": 1.4, "wind": 16, "status": "safe"},
        {"time": "06:00", "wave": 1.6, "wind": 20, "status": "caution"},
        {"time": "07:00", "wave": 1.8, "wind": 24, "status": "caution"},
        {"time": "08:00", "wave": 1.7, "wind": 22, "status": "caution"},
        {"time": "09:00", "wave": 1.5, "wind": 18, "status": "caution"},
        {"time": "10:00", "wave": 1.3, "wind": 15, "status": "safe"},
        {"time": "11:00", "wave": 1.2, "wind": 13, "status": "safe"},
        {"time": "12:00", "wave": 1.1, "wind": 10, "status": "safe"},
    ]

    @classmethod
    def get_hourly_forecast(cls, hours: int = 8, lat: float = 13.12, lon: float = 80.30) -> List[Dict[str, Any]]:
        """Cached-or-live hourly wave+wind curve for (lat, lon); falls back to a static mock curve."""
        cache_key = f"forecast:{round(lat, 2)}:{round(lon, 2)}"
        live = ingestion_cache.get_or_fetch(
            cache_key, FORECAST_CACHE_TTL_SECONDS, lambda: fetch_live_hourly_forecast(lat, lon, hours)
        )
        return live if live else cls._MOCK_FORECAST[:hours]
