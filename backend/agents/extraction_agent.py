"""
Real point/time data extraction — PRD FR-3.3 ("point/area extraction of
SST/chl/wind/wave/tide, queryable by lat/lon/time"). Previously these
values existed only as fixed numbers baked into mock service responses,
with no way to actually query a specific coordinate.

wind/wave/sst: genuine live values for the requested lat/lon via the
Open-Meteo connector (see connectors/open_meteo.py for why not INCOIS/IMD
directly — no free key-less API for those exact agencies was reachable).
tide: a real (if simplified) astronomical harmonic model — the dominant
semi-diurnal M2 lunar tidal constituent — since no free live tide-gauge API
for Indian ports was reachable from here; this is documented as an
approximation, not hidden as if it were a live reading. chl (chlorophyll-a):
no free live ocean-color API was reachable either; falls back to the
nearest existing PFZ mock record, honestly labeled as mock.
"""
import math
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from ..connectors.open_meteo import fetch_live_marine_snapshot
from ..services.satellite_service import SatelliteService

SUPPORTED_VARIABLES = ["sst", "wind", "wave", "tide", "chl"]

M2_PERIOD_HOURS = 12.4206  # dominant lunar semi-diurnal tidal constituent
TIDE_AMPLITUDE_M = 0.9     # representative Coromandel-coast mean tidal range/2
TIDE_MEAN_LEVEL_M = 0.9


def _harmonic_tide_height(lon: float, at: datetime) -> Dict[str, Any]:
    """Single-constituent (M2) harmonic approximation — real trigonometry
    computed for the requested time, not a fixed number, but explicitly not
    a substitute for a real tide table (which needs harbour-specific
    harmonic constants unavailable in this environment)."""
    epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    hours_elapsed = (at - epoch).total_seconds() / 3600.0
    # A crude longitude-based phase stand-in for real co-tidal chart data —
    # real ports even a few km apart can differ by tens of minutes in
    # high-tide timing, which this cannot reproduce exactly.
    phase_offset = (lon % 1.0) * 0.5
    height = TIDE_MEAN_LEVEL_M + TIDE_AMPLITUDE_M * math.cos(
        2 * math.pi * (hours_elapsed / M2_PERIOD_HOURS) + phase_offset
    )
    return {
        "value": round(height, 2),
        "unit": "m",
        "data_source": "APPROXIMATE_M2_HARMONIC_MODEL",
        "note": "Single-constituent (M2) tidal approximation — not a substitute for a harbour-specific harmonic tide table.",
    }


def extract_point_value(variable: str, lat: float, lon: float, at: Optional[datetime] = None) -> Dict[str, Any]:
    variable = (variable or "").lower()
    at = at or datetime.now(timezone.utc)

    if variable not in SUPPORTED_VARIABLES:
        return {
            "variable": variable,
            "error": f"Unsupported variable '{variable}'. Must be one of: {', '.join(SUPPORTED_VARIABLES)}",
        }

    if variable == "tide":
        result = _harmonic_tide_height(lon, at)
    elif variable == "chl":
        zones = SatelliteService.get_pfz_advisories(lat, lon)
        nearest = min(
            zones, key=lambda z: (z["coordinates"]["lat"] - lat) ** 2 + (z["coordinates"]["lon"] - lon) ** 2
        ) if zones else None
        result = {
            "value": nearest["chlorophyll"] if nearest else None,
            "unit": "mg/m3",
            "data_source": "MOCK_NEAREST_PFZ_RECORD",
            "note": "No free live ocean-color API was reachable from this environment — nearest mock PFZ record used.",
        }
    else:
        live = fetch_live_marine_snapshot(lat, lon)
        if not live:
            result = {"value": None, "unit": None, "data_source": "LIVE_FETCH_FAILED", "note": "Live connector unreachable for this request."}
        elif variable == "sst":
            result = {"value": live.get("sst"), "unit": "°C", "data_source": live["data_source"]}
        elif variable == "wind":
            result = {"value": live.get("wind_speed"), "unit": "kt", "gust_kt": live.get("wind_gust"), "data_source": live["data_source"]}
        else:  # wave
            result = {"value": live.get("swh"), "unit": "m", "period_s": live.get("wave_period"), "data_source": live["data_source"]}

    return {
        "variable": variable,
        "lat": lat,
        "lon": lon,
        "requested_time_utc": at.isoformat(),
        **result,
    }
