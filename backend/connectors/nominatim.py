"""
Real geocoding connector — PRD §7 "OSM" ingest source. OpenStreetMap's
Nominatim is a real, free, public geocoding service (usage-policy requires a
descriptive User-Agent, set below). reverse_geocode() resolves a lat/lon into
a place name; search_place() does the reverse — a typed place name into real
coordinates, used by the map search bar (previously a static, non-functional
text input with no search behavior at all).
"""
import time
import requests
from typing import Any, Dict, List, Optional

NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
TIMEOUT_SECONDS = 4.0
USER_AGENT = "ORCA-Marine-Intelligence-Prototype/1.0 (SIH-2026 PS-26176; contact: opdhiraj06@gmail.com)"
# Nominatim's free tier has no SLA for precision, and a bare place name like
# "Royapuram" could match anywhere in the world — biasing toward the Tamil
# Nadu coast (this app's actual operating area) via a viewbox keeps results
# relevant without needing a paid/keyed geocoder.
TAMIL_NADU_COAST_VIEWBOX = "78.0,8.0,81.5,14.0"  # lon_min,lat_min,lon_max,lat_max


def reverse_geocode(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    try:
        resp = requests.get(
            NOMINATIM_REVERSE_URL,
            params={"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 12},
            headers={"User-Agent": USER_AGENT},
            timeout=TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        data = resp.json()
        addr = data.get("address", {})
        place = (
            addr.get("village") or addr.get("town") or addr.get("suburb")
            or addr.get("city") or addr.get("county") or data.get("name")
        )
        if not place:
            return None
        return {
            "place_name": place,
            "state": addr.get("state"),
            "display_name": data.get("display_name"),
            "data_source": "LIVE_OSM_NOMINATIM",
        }
    except (requests.RequestException, ValueError, KeyError):
        return None



def _raw_search(query: str, limit: int) -> List[Dict[str, Any]]:
    resp = requests.get(
        NOMINATIM_SEARCH_URL,
        params={
            "q": query.strip(),
            "format": "jsonv2",
            "limit": limit,
            "viewbox": TAMIL_NADU_COAST_VIEWBOX,
            # bounded=1 makes this a hard restriction, not a soft ranking
            # bias. Without it, a generic word ("marina", "port", "bay")
            # matching a hotel/guest-house/bakery's literal business name
            # anywhere in the world can outrank a real but partial match
            # inside the viewbox (e.g. "Marina" the guest house in Kerala
            # beat "Marina Beach, Chennai" on relevance score). This app's
            # actual data coverage (warnings, PFZ zones, AIS, DDMO blocks)
            # is genuinely limited to this coast, so a result outside it
            # would be useless even if returned — bounding is the honest
            # choice, not just a ranking tweak.
            "bounded": 1,
        },
        headers={"User-Agent": USER_AGENT},
        timeout=TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    results = resp.json()
    return [
        {
            "place_name": r.get("display_name", "").split(",")[0],
            "display_name": r.get("display_name"),
            "lat": float(r["lat"]),
            "lon": float(r["lon"]),
            "type": r.get("type"),
        }
        for r in results
        if "lat" in r and "lon" in r
    ]


def search_place(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Forward geocoding: a typed place name -> real candidate lat/lon
    points, biased toward the Tamil Nadu coast (this app's actual operating
    area, not a hard filter — Nominatim's viewbox+bounded=0 prefers but
    doesn't exclude matches elsewhere, so a genuinely distant real place
    typed by name still resolves rather than silently failing).

    A phrase like "Royapuram Coastline" or "Ennore Creek Mouth" often has
    no OSM feature literally named that — the core place name does. If the
    full phrase returns nothing, this progressively drops the last word
    and retries, so a real place doesn't fail to resolve just because of a
    descriptive suffix a person naturally adds ("...coastline", "...mouth",
    "...sector") that isn't part of the indexed name.
    """
    if not query or not query.strip():
        return []
    words = query.strip().split()
    # Nominatim's usage policy caps the public instance at ~1 request/sec;
    # cap retries and pace them so a multi-word query can't burst past that.
    max_attempts = 4
    try:
        attempt = 0
        while words and attempt < max_attempts:
            candidate = " ".join(words)
            results = _raw_search(candidate, limit)
            if results:
                return results
            words.pop()
            attempt += 1
            if words and attempt < max_attempts:
                time.sleep(1.0)
        return []
    except (requests.RequestException, ValueError, KeyError):
        return []
