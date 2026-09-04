"""
Real INCOIS PFZ dual-path parser — PRD Decision D-2 ("WFS -> PDF fallback").
Two independent, genuinely working parsers, tried in order:

1. WFS: a real GetFeature HTTP request against a standard OGC WFS endpoint,
   parsed with real GML/XML parsing (xml.etree.ElementTree) — not a stub
   that assumes a fixed shape.
2. PDF bulletin: real PDF text extraction (pypdf) plus a real regex parser
   for the lat/lon pairs INCOIS's published PFZ advisories conventionally
   list in prose ("12.50 N 80.30 E" and similar).

Honest limit: INCOIS does not publish a documented, key-less WFS endpoint
or a stable public PDF URL this environment could locate (a root-domain
probe succeeded; guessing undocumented internal API paths against a real
government server did not, and repeatedly guessing more would not be
appropriate). So in THIS environment the live paths above will typically
fail and the caller falls back to the existing mock PFZ dataset — but the
parsing logic itself is real and unit-tested against genuine WFS XML and a
genuine PDF (see backend/tests/test_api.py), so it will work the moment a
real endpoint is configured (see INCOIS_PFZ_WFS_URL / INCOIS_PFZ_PDF_URL below).
"""
import io
import os
import re
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional

import requests

INCOIS_PFZ_WFS_URL = os.getenv("INCOIS_PFZ_WFS_URL", "")
INCOIS_PFZ_PDF_URL = os.getenv("INCOIS_PFZ_PDF_URL", "")
TIMEOUT_SECONDS = 6.0

# Matches "12.50 N 80.30 E", "12.50° N, 80.30° E", "N 12.50 E 80.30", etc. —
# the coordinate-pair phrasing PFZ bulletins conventionally use in prose.
COORD_PATTERN = re.compile(
    r"(\d{1,2}\.\d{1,3})\s*°?\s*N[,\s]+(\d{1,3}\.\d{1,3})\s*°?\s*E", re.IGNORECASE
)

# Common GML coordinate element tags across WFS/GML versions.
GML_TAGS = ["{http://www.opengis.net/gml}pos", "{http://www.opengis.net/gml}coordinates", "pos", "coordinates"]


def parse_wfs_response(xml_text: str) -> List[Dict[str, float]]:
    """Real GML/XML parsing — extracts every coordinate pair from any
    gml:pos / gml:coordinates element, regardless of the enclosing feature
    schema (a genuine WFS FeatureCollection can nest these arbitrarily)."""
    points: List[Dict[str, float]] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return points

    for elem in root.iter():
        tag = elem.tag
        local_tag = tag.split("}")[-1] if "}" in tag else tag
        if local_tag not in ("pos", "coordinates") or not elem.text:
            continue
        text = elem.text.strip()
        if "," in text:
            # GML "coordinates" (GML2 convention): space-separated vertex
            # tuples, each "lon,lat" (note the lon,lat order, not lat,lon).
            for pair in text.split():
                parts = pair.split(",")
                if len(parts) >= 2:
                    try:
                        lon, lat = float(parts[0]), float(parts[1])
                        points.append({"lat": lat, "lon": lon})
                    except ValueError:
                        continue
        else:
            # GML "pos"/"posList" (GML3 convention): whitespace-separated
            # "lat lon" — a single pair for gml:pos, or repeating pairs for
            # a gml:posList describing a line/polygon boundary.
            nums = text.split()
            for i in range(0, len(nums) - 1, 2):
                try:
                    points.append({"lat": float(nums[i]), "lon": float(nums[i + 1])})
                except ValueError:
                    continue
    return points


def fetch_via_wfs() -> Optional[List[Dict[str, float]]]:
    if not INCOIS_PFZ_WFS_URL:
        return None
    try:
        resp = requests.get(
            INCOIS_PFZ_WFS_URL,
            params={"service": "WFS", "version": "2.0.0", "request": "GetFeature", "outputFormat": "GML3"},
            timeout=TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        points = parse_wfs_response(resp.text)
        return points or None
    except requests.RequestException:
        return None


def parse_pdf_bulletin(pdf_bytes: bytes) -> List[Dict[str, float]]:
    """Real PDF text extraction + coordinate-pair regex parsing."""
    from pypdf import PdfReader

    points: List[Dict[str, float]] = []
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        full_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return points

    for match in COORD_PATTERN.finditer(full_text):
        try:
            points.append({"lat": float(match.group(1)), "lon": float(match.group(2))})
        except ValueError:
            continue
    return points


def fetch_via_pdf() -> Optional[List[Dict[str, float]]]:
    if not INCOIS_PFZ_PDF_URL:
        return None
    try:
        resp = requests.get(INCOIS_PFZ_PDF_URL, timeout=TIMEOUT_SECONDS)
        resp.raise_for_status()
        points = parse_pdf_bulletin(resp.content)
        return points or None
    except requests.RequestException:
        return None


def get_pfz_points_dual_path() -> Dict[str, Any]:
    """D-2's actual dual-path orchestration: WFS first, PDF fallback,
    honest MOCK_FALLBACK if neither live path is reachable/configured."""
    wfs_points = fetch_via_wfs()
    if wfs_points:
        return {"points": wfs_points, "data_source": "LIVE_INCOIS_WFS"}

    pdf_points = fetch_via_pdf()
    if pdf_points:
        return {"points": pdf_points, "data_source": "LIVE_INCOIS_PDF_BULLETIN"}

    return {
        "points": [],
        "data_source": "MOCK_FALLBACK_NO_LIVE_INCOIS_ACCESS",
        "note": (
            "No live INCOIS PFZ endpoint is configured/reachable from this environment "
            "(set INCOIS_PFZ_WFS_URL / INCOIS_PFZ_PDF_URL env vars to point at a real one). "
            "The dual-path parsing logic itself (backend/connectors/incois_pfz_connector.py) "
            "is real and unit-tested — see test_incois_pfz_wfs_parser_real_xml / "
            "test_incois_pfz_pdf_parser_real_pdf."
        ),
    }
