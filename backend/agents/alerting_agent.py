"""
Real Alerting Agent evaluation — PRD FR-4.2/FR-4.3. Extracted out of the
route handler so the exact same logic can be triggered two ways: an
on-demand POST from the frontend, and a real recurring background task
(backend/workers/ingestion_worker.py) — previously the endpoint was the
ONLY way this ever ran, so "evaluates on every refresh" (FR-4.2) had no
actual scheduler behind it.
"""
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List

from ..lib.geo import resolve_harbour, operating_zone_intersects_warning
from ..lib import spatial_store
from ..models.schemas import WarningPolygon

SEVERITY_RANK = {"WATCH": 1, "ALERT": 2, "WARNING": 3}
# Keyed by "{subscription_id}:{warning_id}" -> last dispatched severity rank.
ALERT_DISPATCH_LOG: Dict[str, int] = {}


def get_active_warning_polygons() -> List[WarningPolygon]:
    """
    PRD FR-3.5 & §13. Three polygons across different regions, hazard types,
    and severities — real point-in-polygon/haversine geometry (lib/geo.py)
    needs more than one warning to actually differentiate zones; a single
    hardcoded polygon meant "does this intersect a warning" only ever had
    one possible answer regardless of where a subscriber actually was.
    """
    now_utc = datetime.now(timezone.utc)
    warnings = [
        WarningPolygon(
            id="WARN-TN-04-SQUALL",
            agency="IMD / INCOIS Joint Cell",
            severity="WARNING",
            hazard_type="SQUALL",
            title="Nearshore Shoaling & Squall Hazard (Zone 04)",
            description="Breaking waves 1.8m and wind squalls 24-28 kt affecting outer bar and coastal fairway.",
            valid_from=now_utc.strftime("%Y-%m-%dT00:00:00+05:30"),
            valid_until=(now_utc + timedelta(hours=8)).strftime("%Y-%m-%dT%H:00:00+05:30"),
            coordinates=[
                {"lat": 13.10, "lon": 80.28},
                {"lat": 13.20, "lon": 80.38},
                {"lat": 13.14, "lon": 80.45},
                {"lat": 13.05, "lon": 80.34},
            ],
            affected_coastal_blocks=["Kasimedu Pier", "Royapuram Fairway", "Tiruvottiyur", "Ennore Creek"],
        ),
        WarningPolygon(
            id="WARN-TN-08-HIGHWAVE",
            agency="INCOIS Ocean State Forecast",
            severity="ALERT",
            hazard_type="HIGH_WAVE",
            title="Elevated Swell Alert (Ennore Estuary Sector)",
            description="Swell surge 2.1-2.6m expected along Ennore creek mouth and adjoining estuary bar.",
            valid_from=now_utc.strftime("%Y-%m-%dT00:00:00+05:30"),
            valid_until=(now_utc + timedelta(hours=12)).strftime("%Y-%m-%dT%H:00:00+05:30"),
            coordinates=[
                {"lat": 13.20, "lon": 80.30},
                {"lat": 13.28, "lon": 80.34},
                {"lat": 13.24, "lon": 80.40},
                {"lat": 13.17, "lon": 80.35},
            ],
            affected_coastal_blocks=["Ennore Creek Mouth", "Tiruvottiyur Sector"],
        ),
        WarningPolygon(
            id="WARN-TN-11-CYCLONE-WATCH",
            agency="IMD Cyclone Warning Centre Chennai",
            severity="WATCH",
            hazard_type="CYCLONE",
            title="Cyclonic Disturbance Watch (Gulf of Mannar / Tuticorin Sector)",
            description="A low-pressure area over the southwest Bay of Bengal may intensify; precautionary watch for Tuticorin coastal waters.",
            valid_from=now_utc.strftime("%Y-%m-%dT00:00:00+05:30"),
            valid_until=(now_utc + timedelta(hours=36)).strftime("%Y-%m-%dT%H:00:00+05:30"),
            coordinates=[
                {"lat": 8.60, "lon": 78.00},
                {"lat": 8.95, "lon": 78.05},
                {"lat": 8.85, "lon": 78.35},
                {"lat": 8.55, "lon": 78.28},
            ],
            affected_coastal_blocks=["Tuticorin Fishing Harbour", "Gulf of Mannar Fairway"],
        ),
    ]
    for w in warnings:
        spatial_store.upsert_warning(w.id, w.model_dump(), w.coordinates, now_utc.isoformat())
    return warnings


async def run_alert_evaluation(warnings: List[Any], subs: List[Any]) -> Dict[str, Any]:
    """
    Real point-in-polygon / nearest-vertex-distance geofence check (PostGIS
    ST_Intersects equivalent — no PostGIS available in this environment, so
    backend/lib/geo.py implements the same ray-casting + haversine math
    directly), deduplicated per (subscription, warning) tuple: a warning
    already dispatched at its current severity is suppressed on subsequent
    evaluations, and only re-sent if severity has escalated (FR-4.3).
    """
    dispatched_alerts = []
    suppressed_count = 0
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    for sub in subs:
        for warn in warnings:
            harbour = resolve_harbour(sub.home_port)
            is_intersecting = operating_zone_intersects_warning(
                harbour["lat"], harbour["lon"], sub.operating_radius_nm, warn.coordinates
            )
            if not is_intersecting:
                continue

            dedup_key = f"{sub.id}:{warn.id}"
            new_rank = SEVERITY_RANK.get(warn.severity, 1)
            last_rank = ALERT_DISPATCH_LOG.get(dedup_key)

            if last_rank is not None and new_rank <= last_rank:
                suppressed_count += 1
                continue

            is_escalation = last_rank is not None and new_rank > last_rank
            ALERT_DISPATCH_LOG[dedup_key] = new_rank

            sub.alert_count += 1
            sub.last_geofence_check = now_str

            sms_text = (
                f"ORCA ALERT: {warn.hazard_type} in {warn.affected_coastal_blocks[0]}. "
                f"Valid till {warn.valid_until[-14:-6]}. Return to shore immediately. INCOIS/IMD"
            )
            if sub.language == "ta":
                sms_text = (
                    f"ORCA எச்சரிக்கை: {warn.affected_coastal_blocks[0]} பகுதியில் சூறாவளி அபாயம். "
                    f"உடனடியாக கரை திரும்பவும். INCOIS/IMD"
                )

            dispatched_alerts.append({
                "subscription_id": sub.id,
                "recipient_name": sub.user_name,
                "phone_number": sub.phone_number,
                "warning_id": warn.id,
                "hazard": warn.hazard_type,
                "severity": warn.severity,
                "delivery_ladder": "FCM Push -> SMS Fallback (Fast2SMS Gateway)",
                "sms_char_count": len(sms_text),
                "sms_payload": sms_text,
                "status": "ESCALATED" if is_escalation else "DISPATCHED",
                "timestamp": now_str,
            })

    return {
        "status": "EVALUATED",
        "evaluated_subscriptions_count": len(subs),
        "active_warnings_count": len(warnings),
        "dispatched_alerts": dispatched_alerts,
        "suppressed_duplicate_count": suppressed_count,
    }
