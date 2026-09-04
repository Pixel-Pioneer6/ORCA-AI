"""
Real relative time/space resolution — PRD FR-2.3. Previously "tomorrow
morning" / "near me" had no NLU behind them at all: every response used a
hardcoded target window and a hardcoded harbour. This module actually
parses day references (today/tonight/tomorrow/a named weekday), time-of-day
references (morning/afternoon/evening/night) and explicit hours ("5 AM"),
resolving them to a real IST datetime window — and detects "near me"-style
spatial references so the caller knows to prefer a live GPS fix over a
named harbour.
"""
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

IST = timezone(timedelta(hours=5, minutes=30))

WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

# (start_hour, end_hour) — a plain-language window, not a single instant.
TIME_OF_DAY_WINDOWS = {
    "morning": (5, 10),
    "afternoon": (12, 16),
    "evening": (17, 20),
    "tonight": (19, 23),
    "night": (19, 23),
    "midday": (11, 14),
    "noon": (11, 14),
    "dawn": (4, 6),
    "daybreak": (4, 6),
}

DAY_WORDS = {
    "tomorrow": 1, "நாளை": 1, "कल": 1,
    "today": 0, "tonight": 0, "இன்று": 0, "आज": 0,
}

SPATIAL_PHRASES = [
    "near me", "nearby", "around here", "close to me", "close by",
    "my location", "current position", "where i am", "right here",
]

HOUR_RE = re.compile(r"\b(\d{1,2})\s?(am|pm)\b")


def resolve_relative_time(query: str, now: Optional[datetime] = None) -> Dict:
    """Returns {"resolved": False} if the query carries no time reference,
    otherwise a concrete IST date + hour window derived from what was said."""
    now = now or datetime.now(IST)
    q = (query or "").lower()

    day_offset = None
    for word, offset in DAY_WORDS.items():
        if word in q:
            day_offset = offset
            break
    if day_offset is None:
        for i, wd in enumerate(WEEKDAYS):
            if wd in q:
                delta = (i - now.weekday()) % 7
                day_offset = delta if delta != 0 else 7
                break

    part_of_day = None
    for label in TIME_OF_DAY_WINDOWS:
        if label in q:
            part_of_day = label
            break

    hour_match = HOUR_RE.search(q)
    explicit_hour = None
    if hour_match:
        h = int(hour_match.group(1)) % 12
        if hour_match.group(2) == "pm":
            h += 12
        explicit_hour = h

    if day_offset is None and part_of_day is None and explicit_hour is None:
        return {"resolved": False}

    # A bare time-of-day/hour with no day word ("this evening", "at 5 AM")
    # means today; only an explicit day word or weekday shifts the date.
    resolved_day_offset = day_offset if day_offset is not None else 0
    target_date = (now + timedelta(days=resolved_day_offset)).date()

    if explicit_hour is not None:
        start_h, end_h = explicit_hour, min(explicit_hour + 2, 23)
        basis = "explicit_hour"
    elif part_of_day:
        start_h, end_h = TIME_OF_DAY_WINDOWS[part_of_day]
        basis = part_of_day
    else:
        start_h, end_h = TIME_OF_DAY_WINDOWS["morning"]
        basis = "default_morning"

    label = f"{target_date.isoformat()} {start_h:02d}:00–{end_h:02d}:00 IST"
    return {
        "resolved": True,
        "basis": basis,
        "day_offset": resolved_day_offset,
        "date": target_date.isoformat(),
        "start_hour": start_h,
        "end_hour": end_h,
        "label": label,
    }


def resolve_spatial_reference(query: str) -> Dict:
    """Detects "near me"/"nearby"-style phrasing so the caller resolves
    against a live GPS fix rather than a named harbour or stale default."""
    q = (query or "").lower()
    for phrase in SPATIAL_PHRASES:
        if phrase in q:
            return {"resolved": True, "matched_phrase": phrase}
    return {"resolved": False}
