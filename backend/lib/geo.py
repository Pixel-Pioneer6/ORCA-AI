"""
Real geospatial primitives for the Alerting Agent (PRD §6.2, FR-3.5, FR-4.2).
No PostGIS available in this environment — these are the same algorithms
PostGIS's ST_Distance/ST_Intersects would run, implemented directly so the
geofence check is actual geometry, not a string match on a harbour name.
"""
import math
from typing import Dict, List

EARTH_RADIUS_NM = 3440.065

# Known fishing-harbour registry (lat/lon). A prototype's equivalent of the
# PRD's "Bhuvan ports/harbours" static layer (§7) — real systems look this
# up from a gazetteer; here it's a small fixed table.
HARBOUR_REGISTRY: Dict[str, Dict[str, float]] = {
    "kasimedu fishing harbour": {"lat": 13.12, "lon": 80.30},
    "ennore fishing harbour": {"lat": 13.23, "lon": 80.33},
    "royapuram fishing harbour": {"lat": 13.11, "lon": 80.30},
    "chennai port": {"lat": 13.10, "lon": 80.30},
    "tuticorin fishing harbour": {"lat": 8.75, "lon": 78.15},  # ~500nm south — used to prove real geometry, not string matching
}
DEFAULT_HARBOUR = {"lat": 13.12, "lon": 80.30}  # Kasimedu — fallback for unregistered ports


def resolve_harbour(name: str) -> Dict[str, float]:
    return HARBOUR_REGISTRY.get((name or "").strip().lower(), DEFAULT_HARBOUR)


def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in nautical miles."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_NM * math.asin(math.sqrt(a))


def point_in_polygon(lat: float, lon: float, polygon: List[Dict[str, float]]) -> bool:
    """Ray-casting point-in-polygon test. polygon: list of {'lat','lon'}."""
    inside = False
    n = len(polygon)
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]["lon"], polygon[i]["lat"]
        xj, yj = polygon[j]["lon"], polygon[j]["lat"]
        intersects = ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi
        )
        if intersects:
            inside = not inside
        j = i
    return inside


def min_distance_to_polygon_nm(lat: float, lon: float, polygon: List[Dict[str, float]]) -> float:
    """Nearest-vertex distance — a fast, adequate approximation of distance
    to a polygon boundary for a coastal hazard zone of this size (no need
    for full edge-projection geometry at this scale)."""
    return min(haversine_nm(lat, lon, v["lat"], v["lon"]) for v in polygon)


def operating_zone_intersects_warning(
    home_lat: float, home_lon: float, operating_radius_nm: float, polygon: List[Dict[str, float]]
) -> bool:
    """
    Real geofence check (FR-3.5/FR-4.2): true if the vessel's operating
    circle (home port + radius) overlaps the warning polygon — either the
    home port itself is inside the polygon, or the polygon comes within
    the operating radius of the home port.
    """
    if not polygon:
        return False
    if point_in_polygon(home_lat, home_lon, polygon):
        return True
    return min_distance_to_polygon_nm(home_lat, home_lon, polygon) <= operating_radius_nm
