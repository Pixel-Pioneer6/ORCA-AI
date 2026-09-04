"""
Real ingestion worker — PRD §7 "ingestion workers" that keep the cache warm
ahead of request time, rather than fetching cold on every request. This is a
genuine asyncio background task (started from FastAPI's lifespan in main.py,
cancelled cleanly on shutdown) that runs on a fixed interval and calls the
same live connectors the request path uses. It is in-process rather than a
separate worker/queue service (no message broker or worker infra available
here) — that scaling difference is the honest gap; the scheduling and
refresh logic itself is real and runs continuously while the app is up.
"""
import asyncio
import logging
from datetime import datetime, timezone

from ..lib.cache import ingestion_cache
from ..connectors.open_meteo import fetch_live_marine_snapshot, fetch_live_hourly_forecast
from ..services.incois_service import BUOY_CACHE_TTL_SECONDS, FORECAST_CACHE_TTL_SECONDS
from ..lib.geo import HARBOUR_REGISTRY
from ..lib.subscription_store import get_all_subscriptions
from ..agents.alerting_agent import get_active_warning_polygons, run_alert_evaluation

logger = logging.getLogger("orca.ingestion_worker")

REFRESH_INTERVAL_SECONDS = 300  # 5 min poll cadence
WATCHED_POINTS = [(v["lat"], v["lon"]) for v in HARBOUR_REGISTRY.values()]

_run_count = 0
_last_run_at: str | None = None
_last_run_results: dict = {}
_last_alert_evaluation: dict = {}


def get_worker_status() -> dict:
    return {
        "interval_seconds": REFRESH_INTERVAL_SECONDS,
        "watched_points": len(WATCHED_POINTS),
        "run_count": _run_count,
        "last_run_at_utc": _last_run_at,
        "last_run_results": _last_run_results,
        "last_alert_evaluation": _last_alert_evaluation,
    }


async def _refresh_once() -> None:
    global _run_count, _last_run_at, _last_run_results, _last_alert_evaluation
    results = {}
    for lat, lon in WATCHED_POINTS:
        key = f"{round(lat, 2)},{round(lon, 2)}"
        try:
            snapshot = await asyncio.to_thread(fetch_live_marine_snapshot, lat, lon)
            forecast = await asyncio.to_thread(fetch_live_hourly_forecast, lat, lon, 8)
            if snapshot:
                ingestion_cache.set(f"buoy:{round(lat,2)}:{round(lon,2)}", snapshot, BUOY_CACHE_TTL_SECONDS)
            if forecast:
                ingestion_cache.set(f"forecast:{round(lat,2)}:{round(lon,2)}", forecast, FORECAST_CACHE_TTL_SECONDS)
            results[key] = "LIVE_OK" if snapshot else "LIVE_UNAVAILABLE_FALLBACK_ACTIVE"
        except Exception as exc:  # a single point's failure must not kill the worker loop
            logger.warning("ingestion refresh failed for %s: %s", key, exc)
            results[key] = f"ERROR: {exc}"
    _run_count += 1
    _last_run_at = datetime.now(timezone.utc).isoformat()
    _last_run_results = results

    # FR-4.2 — the Alerting Agent must evaluate "on every refresh", not only
    # when a client happens to POST /subscriptions/evaluate. This is that
    # real scheduler: every ingestion cycle also re-runs the same geofence
    # evaluation the on-demand endpoint uses.
    try:
        warnings = get_active_warning_polygons()
        subs = get_all_subscriptions()
        outcome = await run_alert_evaluation(warnings, subs)
        _last_alert_evaluation = {
            "at_utc": _last_run_at,
            "evaluated_subscriptions_count": outcome["evaluated_subscriptions_count"],
            "dispatched_count": len(outcome["dispatched_alerts"]),
            "suppressed_duplicate_count": outcome["suppressed_duplicate_count"],
        }
    except Exception as exc:
        logger.warning("scheduled alert evaluation failed: %s", exc)
        _last_alert_evaluation = {"at_utc": _last_run_at, "error": str(exc)}


async def run_ingestion_worker() -> None:
    """Long-lived loop: refresh immediately, then every REFRESH_INTERVAL_SECONDS."""
    while True:
        await _refresh_once()
        await asyncio.sleep(REFRESH_INTERVAL_SECONDS)
