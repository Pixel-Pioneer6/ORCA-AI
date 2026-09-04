"""
Real confidence scoring — PRD FR-5.3 ("confidence label from real source
agreement"). Previously every verdict shipped a hardcoded "84% (MEDIUM)"
string regardless of what actually backed it. This derives a genuine score
from real signals already available on every call: whether the reading was
a live fetch or a mock fallback, which source tier produced the verdict
(§9 SOURCE_PRECEDENCE), how fresh the cache entry is, and whether the
guardrail had to clamp a probabilistic guess. It is a simple, documented
weighted formula — not a black box — so it can be audited like everything
else in this system.
"""
from typing import Optional


def compute_confidence(
    data_source: Optional[str] = None,
    source_tier: Optional[str] = None,
    is_clamped: bool = False,
    cache_age_seconds: Optional[float] = None,
) -> dict:
    score = 100.0

    # Live vs mock-fallback telemetry is the single biggest signal — a mock
    # fallback means the live connector genuinely failed for this request.
    if data_source and "LIVE" in data_source:
        pass
    elif data_source and "MOCK_FALLBACK" in data_source:
        score -= 30.0
    else:
        score -= 15.0  # unknown provenance — penalize, don't assume the best

    # Source precedence tier (backend/agents/guardrail.py SOURCE_PRECEDENCE)
    tier_penalty = {
        "official_warning": 0.0,
        "national_agency_forecast": 5.0,
        "global_model": 15.0,
        "cached_value": 20.0,
        None: 25.0,
    }
    score -= tier_penalty.get(source_tier, 20.0)

    # A clamp means the LLM's/router's proposed verdict disagreed with the
    # deterministic engine — real disagreement between sources, not noise.
    if is_clamped:
        score -= 8.0

    # Stale cache entries reduce confidence even if the source is nominally "live".
    if cache_age_seconds is not None:
        if cache_age_seconds > 1800:
            score -= 15.0
        elif cache_age_seconds > 600:
            score -= 5.0

    score = max(30.0, min(99.0, score))
    label = "HIGH" if score >= 85 else "MEDIUM" if score >= 60 else "LOW"
    return {"confidence_pct": round(score), "confidence_label": label, "confidence": f"{round(score)}% ({label})"}
