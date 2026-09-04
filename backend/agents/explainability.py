"""
Real Explainability Agent — PRD §6.2/§6.3: "Attaches citations, confidence,
data age; blocks uncited operational claims." Previously this was just the
frontend's evidence chip UI; nothing on the backend actually checked that a
numeric claim in generated text was backed by an evidence record. This
module does that check for real: extract every measurement the reply text
asserts (a number followed by a recognized ocean/weather unit), and verify
each one traces back to an evidence item's value.

Only unit-suffixed numbers count as "operational claims" — a schedule time
("14:00") or an echoed vessel spec ("8.2m craft", already known to the
caller, not retrieved) is not a claim about ocean state and would otherwise
cause constant false positives.
"""
import re
from typing import Dict, Any, List, Optional

MEASUREMENT_PATTERN = re.compile(r"(-?\d+(?:\.\d+)?)\s*(m|kt|°C|mg/m³|%)\b")


def _extract_measurements(text: str) -> List[float]:
    if not text:
        return []
    return [float(m[0]) for m in MEASUREMENT_PATTERN.findall(text)]


def _evidence_values(evidence: List[Dict[str, Any]]) -> List[float]:
    values = []
    for item in evidence or []:
        v = item.get("value") if isinstance(item, dict) else getattr(item, "value", None)
        if isinstance(v, (int, float)):
            values.append(float(v))
    return values


class ExplainabilityAgent:
    TOLERANCE = 0.05  # rounding/formatting tolerance

    @classmethod
    def audit(cls, reply_text: str, evidence: List[Dict[str, Any]], trusted_values: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Returns {claimed_measurements, uncited_claims, citation_coverage_pct, blocked}.
        `blocked=True` means the reply asserts a specific ocean/weather
        measurement with no traceable evidence backing it (PRD §14's
        "zero hallucinated numeric value" target) and should not ship as-is.
        """
        claimed = _extract_measurements(reply_text)
        allowed = _evidence_values(evidence) + [float(v) for v in (trusted_values or [])]

        uncited = [c for c in claimed if not any(abs(c - a) <= cls.TOLERANCE for a in allowed)]
        coverage = 100.0 if not claimed else round(100.0 * (len(claimed) - len(uncited)) / len(claimed), 1)

        return {
            "claimed_measurements": claimed,
            "uncited_claims": uncited,
            "citation_coverage_pct": coverage,
            "blocked": len(uncited) > 0,
        }

    @classmethod
    def enforce(cls, reply_text: str, evidence: List[Dict[str, Any]], fallback_text: str,
                trusted_values: Optional[List[float]] = None) -> Dict[str, Any]:
        """Runs audit() and substitutes fallback_text if any measurement is
        uncited — the actual "blocks uncited operational claims" behavior."""
        result = cls.audit(reply_text, evidence, trusted_values)
        final_text = fallback_text if result["blocked"] else reply_text
        return {**result, "final_text": final_text, "was_substituted": result["blocked"]}
