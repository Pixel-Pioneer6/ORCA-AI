"""
Shared subscription registry — extracted from routes/v1_endpoints.py so
both the HTTP route and the background ingestion worker (FR-4.2's real
scheduler) can read the same live subscription list without the worker
having to import a route module (which would create a circular import,
since v1_endpoints already imports from the worker for /ingestion/status).
"""
from datetime import datetime, timezone
from typing import Dict

from ..models.schemas import SubscriptionRecord
from . import spatial_store

SUBSCRIPTION_DB: Dict[str, SubscriptionRecord] = {}


def get_all_subscriptions() -> list:
    """Restores from durable SQLite storage on cold start, and always
    ensures the default demo subscription exists (checked by id, not by
    "dict is empty" — any other subscription created first must not
    prevent this one from ever being seeded)."""
    if not SUBSCRIPTION_DB:
        for row in spatial_store.list_subscriptions():
            SUBSCRIPTION_DB[row["id"]] = SubscriptionRecord(**row)

    if "sub_arumugam_01" not in SUBSCRIPTION_DB:
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        default_sub = SubscriptionRecord(
            id="sub_arumugam_01",
            user_name="K. Arumugam",
            phone_number="+91-98401-44910",
            home_port="Kasimedu Fishing Harbour",
            operating_radius_nm=25.0,
            vessel_class="motorized",
            vessel_reg_no="IND-TN-02-MM-4491",
            language="ta",
            notification_channels=["push", "sms"],
            registered_at=now_str,
            active=True,
            last_geofence_check=now_str,
            alert_count=1,
        )
        SUBSCRIPTION_DB[default_sub.id] = default_sub
        spatial_store.upsert_subscription(default_sub.id, default_sub.model_dump(), now_str)

    return list(SUBSCRIPTION_DB.values())
