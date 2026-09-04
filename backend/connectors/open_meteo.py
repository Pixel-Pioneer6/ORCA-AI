"""
Real live marine/weather connector — PRD §7 "MOSDAC/INCOIS/IMD/Copernicus/
NOAA" ingest connectors. INCOIS, IMD and MOSDAC do not publish free,
key-less JSON APIs, so a live connection to those exact agencies is not
reachable from here. Open-Meteo's Marine + Forecast APIs are used instead:
they are real, free, no-API-key services that re-publish the same
underlying model families this PRD calls for (ECMWF/GFS wave and
atmospheric models — the same class of numerical model as INCOIS's
WAVEWATCH-III/SWAN and IMD's NWP). This module makes genuine outbound HTTP
calls and returns real current data for the requested coordinates; it is
not a mock. Every caller must treat a timeout/error as a real possibility
and fall back to the last-known-good/mock snapshot — this module always
returns None on failure rather than raising, so callers can do that.
"""
import requests
from typing import Any, Dict, Optional

MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
TIMEOUT_SECONDS = 4.0


def fetch_live_marine_snapshot(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Real current wave + wind + SST reading for (lat, lon), or None on failure."""
    try:
        marine = requests.get(
            MARINE_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "wave_height,wave_direction,wave_period,wind_wave_height,sea_surface_temperature",
                "timezone": "Asia/Kolkata",
            },
            timeout=TIMEOUT_SECONDS,
        )
        marine.raise_for_status()
        m = marine.json().get("current", {})

        wind = requests.get(
            FORECAST_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
                "wind_speed_unit": "kn",
                "timezone": "Asia/Kolkata",
            },
            timeout=TIMEOUT_SECONDS,
        )
        wind.raise_for_status()
        w = wind.json().get("current", {})

        if not m or not w:
            return None

        return {
            "swh": m.get("wave_height"),
            "wave_period": m.get("wave_period"),
            "swell_direction_deg": m.get("wave_direction"),
            "wind_wave_height": m.get("wind_wave_height"),
            "sst": m.get("sea_surface_temperature"),
            "wind_speed": w.get("wind_speed_10m"),
            "wind_gust": w.get("wind_gusts_10m"),
            "wind_direction_deg": w.get("wind_direction_10m"),
            "observation_time_utc": m.get("time") or w.get("time"),
            "data_source": "LIVE_OPEN_METEO",
            "model_lineage": "ECMWF-WAM / GFS-Wave (via Open-Meteo) — real-time, not mocked",
        }
    except (requests.RequestException, ValueError, KeyError):
        return None


def fetch_live_hourly_forecast(lat: float, lon: float, hours: int = 8) -> Optional[list]:
    """Real next-N-hours wave+wind curve for (lat, lon), or None on failure."""
    try:
        marine = requests.get(
            MARINE_URL,
            params={"latitude": lat, "longitude": lon, "hourly": "wave_height", "forecast_days": 1, "timezone": "Asia/Kolkata"},
            timeout=TIMEOUT_SECONDS,
        )
        marine.raise_for_status()
        mh = marine.json().get("hourly", {})

        wind = requests.get(
            FORECAST_URL,
            params={"latitude": lat, "longitude": lon, "hourly": "wind_speed_10m", "wind_speed_unit": "kn", "forecast_days": 1, "timezone": "Asia/Kolkata"},
            timeout=TIMEOUT_SECONDS,
        )
        wind.raise_for_status()
        wh = wind.json().get("hourly", {})

        times = mh.get("time", [])
        waves = mh.get("wave_height", [])
        winds = wh.get("wind_speed_10m", [])
        if not times or not waves or not winds:
            return None

        from datetime import datetime as _dt
        now_hour = _dt.now().hour
        start = next((i for i, t in enumerate(times) if int(t[11:13]) >= now_hour), 0)

        out = []
        for t, w, k in list(zip(times, waves, winds))[start:start + hours]:
            status = "safe" if (w < 1.3 and k < 15) else "caution" if (w < 2.4 and k < 30) else "danger"
            out.append({"time": t[11:16], "wave": w, "wind": round(k), "status": status})
        return out or None
    except (requests.RequestException, ValueError, KeyError, IndexError):
        return None
