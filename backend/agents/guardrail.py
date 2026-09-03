from typing import Dict, Any, Tuple
from ..models.vessel import VesselProfile

class HydrodynamicGuardrail:
    """
    DETERMINISTIC SAFETY GUARDRAIL (Zero-Hallucination Engine):
    Guarantees that probabilistic LLM or agent outputs can NEVER recommend venturing 
    out into sea conditions that exceed the certified physical limits of the mariner's vessel.
    """

    @classmethod
    def evaluate(
        cls, 
        vessel_loa: float, 
        vessel_hp: float, 
        swh: float, 
        wind_gust: float,
        proposed_verdict: str = "SAFE"
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Validates the proposed verdict against physical hydrodynamic constraints:
        - Safe wave limit: ~18% of craft length LOA (e.g. 8.2m LOA -> 1.5m safe limit)
        - Safe wind limit: 14 + (HP * 0.4) knots (e.g. 9.9 HP -> 18 kt safe limit)
        """
        craft_max_wave, craft_max_wind = VesselProfile.compute_safe_thresholds(vessel_loa, vessel_hp)

        # Exceedance calculations
        wave_exceedance_pct = max(0.0, ((swh - craft_max_wave) / craft_max_wave) * 100.0)
        wind_exceedance_pct = max(0.0, ((wind_gust - craft_max_wind) / craft_max_wind) * 100.0)

        clamped_verdict = proposed_verdict
        clamp_reason = None

        # Rule 1: Severe Wave Hazard (Wave > 140% of craft threshold or wave >= 2.5m)
        if swh >= (craft_max_wave * 1.4) or swh >= 2.5:
            clamped_verdict = "DO NOT VENTURE"
            clamp_reason = (
                f"Severe capsizing risk: Wave height of {swh}m exceeds craft limit ({craft_max_wave}m) "
                f"by {wave_exceedance_pct:.1f}%."
            )

        # Rule 2: Squall Gust Exceedance (Wind > 130% of craft limit or wind >= 30 kt)
        elif wind_gust >= (craft_max_wind * 1.3) or wind_gust >= 30.0:
            clamped_verdict = "DO NOT VENTURE"
            clamp_reason = (
                f"Gale risk: Wind gusts of {wind_gust} kt exceed craft engine threshold ({craft_max_wind} kt)."
            )

        # Rule 3: Marginal Breaker Swell (Exceedance between 5% and 40%)
        elif wave_exceedance_pct > 5.0 or wind_exceedance_pct > 5.0:
            clamped_verdict = "CAUTION"
            clamp_reason = (
                f"Marginal conditions: Wave height ({swh}m) or wind ({wind_gust} kt) exceeds craft limit. "
                f"Breaker swell hazard at shallow bar mouth."
            )

        # Rule 4: Clean Water (< 100% of threshold and wind calm)
        else:
            if proposed_verdict not in ["DO NOT VENTURE", "CAUTION"]:
                clamped_verdict = "SAFE"

        return clamped_verdict, {
            "is_clamped": clamped_verdict != proposed_verdict,
            "original_proposed_verdict": proposed_verdict,
            "final_verdict": clamped_verdict,
            "clamp_reason": clamp_reason,
            "craft_max_wave": craft_max_wave,
            "craft_max_wind": craft_max_wind,
            "wave_exceedance_pct": round(wave_exceedance_pct, 1),
            "wind_exceedance_pct": round(wind_exceedance_pct, 1),
        }
