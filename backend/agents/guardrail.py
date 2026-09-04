from typing import Dict, Any, Tuple, List, Optional

class HydrodynamicGuardrail:
    """
    DETERMINISTIC SAFETY RULE ENGINE — PRD §9 (Zero-Hallucination Core):
    The Safety verdict is strictly computed from physical thresholds, not from generation.
    The LLM may explain the verdict; it may NOT change it.
    """

    # PRD FR-2.4 — documented precedence rule for reconciling conflicting
    # sources. Never silently averaged: the highest-precedence source that
    # is actually available for this call decides the verdict, and the
    # response says which tier that was.
    SOURCE_PRECEDENCE = [
        "official_warning",           # IMD/INCOIS/Tsunami bulletin (absolute override)
        "national_agency_forecast",   # INCOIS OSF / MOSDAC buoy+scatterometer
        "global_model",               # Copernicus/NOAA gap-fill (not yet wired — placeholder tier)
        "cached_value",               # last-known-good, degrades freshness not availability
    ]

    VESSEL_CLASSES = {
        "nonMotorized": {
            "label": "Non-motorized / Catamaran (< 6m)",
            "doNotVenture": {"wave": 1.5, "wind": 20.0},
            "caution": {"wave": 1.0, "wind": 15.0},
        },
        "motorized": {
            "label": "Motorized (< 10m)",
            "doNotVenture": {"wave": 2.5, "wind": 25.0},
            "caution": {"wave": 1.5, "wind": 18.0},
        },
        "mechanized": {
            "label": "Mechanized (10–20m)",
            "doNotVenture": {"wave": 3.5, "wind": 34.0},
            "caution": {"wave": 2.5, "wind": 25.0},
        },
    }

    @classmethod
    def classify_vessel(cls, loa: float) -> str:
        """Classifies vessel into canonical PRD §9 classes."""
        if loa >= 10.0:
            return "mechanized"
        elif loa >= 6.0:
            return "motorized"
        return "nonMotorized"

    @classmethod
    def evaluate(
        cls,
        vessel_loa: float,
        vessel_hp: float,
        swh: Optional[float],
        wind_gust: Optional[float],
        cyclone_warning: bool = False,
        squall_warning: bool = False,
        swell_surge_alert: bool = False,
        tsunami_bulletin: bool = False,
        data_missing: bool = False,
        proposed_verdict: str = "SAFE",
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Evaluates sea state against PRD §9 canonical thresholds and absolute overrides.
        Returns (final_verdict, metadata_dict).
        """
        vessel_class = cls.classify_vessel(vessel_loa)
        thresholds = cls.VESSEL_CLASSES[vessel_class]

        # PRD §9 Absolute Override 4: Required forecast variables unavailable
        if data_missing or swh is None or wind_gust is None:
            return "INSUFFICIENT_DATA", {
                "is_clamped": True,
                "original_proposed_verdict": proposed_verdict,
                "final_verdict": "INSUFFICIENT_DATA",
                "drivers": ["Required oceanographic variables unavailable — no acceptable fallback"],
                "vessel_class": vessel_class,
                "thresholds": thresholds,
                "wave_exceedance_pct": 0.0,
                "wind_exceedance_pct": 0.0,
                "clamp_reason": "Missing telemetry: Deterministic engine refuses to guess ocean conditions.",
                "source_tier": None,
                "source_precedence": cls.SOURCE_PRECEDENCE,
            }

        override_drivers = []
        if cyclone_warning:
            override_drivers.append("Active IMD cyclone warning covering this sector/time")
        if squall_warning:
            override_drivers.append("Active IMD squall warning covering nearshore fairway")
        if swell_surge_alert:
            override_drivers.append("INCOIS high-wave / swell-surge alert for this coastal segment")
        if tsunami_bulletin:
            override_drivers.append("National Tsunami Early Warning Centre bulletin in effect")

        # PRD §9 Absolute Overrides: Any active forces DO NOT VENTURE
        if override_drivers:
            return "DO NOT VENTURE", {
                "is_clamped": True,
                "original_proposed_verdict": proposed_verdict,
                "final_verdict": "DO NOT VENTURE",
                "drivers": override_drivers[:2],
                "vessel_class": vessel_class,
                "thresholds": thresholds,
                "wave_exceedance_pct": 100.0,
                "wind_exceedance_pct": 100.0,
                "clamp_reason": f"Absolute Override Enforced: {override_drivers[0]}",
                "source_tier": "official_warning",
                "source_precedence": cls.SOURCE_PRECEDENCE,
            }

        dnv_wave = thresholds["doNotVenture"]["wave"]
        dnv_wind = thresholds["doNotVenture"]["wind"]
        caut_wave = thresholds["caution"]["wave"]
        caut_wind = thresholds["caution"]["wind"]

        wave_exceedance = round(max(0.0, ((swh - caut_wave) / caut_wave) * 100.0), 1)
        wind_exceedance = round(max(0.0, ((wind_gust - caut_wind) / caut_wind) * 100.0), 1)

        drivers = []
        if swh >= caut_wave:
            drivers.append(f"Wave height {swh:.1f}m exceeds {caut_wave}m craft caution threshold")
        if wind_gust >= caut_wind:
            drivers.append(f"Wind gusts {round(wind_gust)}kt exceed {round(caut_wind)}kt craft caution threshold")

        final_verdict = "SAFE"
        if swh >= dnv_wave or wind_gust >= dnv_wind:
            final_verdict = "DO NOT VENTURE"
            if not drivers:
                drivers.append(f"Significant wave height {swh:.1f}m exceeds {dnv_wave}m danger threshold")
        elif swh >= caut_wave or wind_gust >= caut_wind:
            final_verdict = "CAUTION"

        return final_verdict, {
            "is_clamped": final_verdict != proposed_verdict,
            "original_proposed_verdict": proposed_verdict,
            "final_verdict": final_verdict,
            "drivers": drivers[:2] if drivers else ["Wave and wind within safe operating envelope"],
            "vessel_class": vessel_class,
            "thresholds": thresholds,
            "wave_exceedance_pct": wave_exceedance,
            "wind_exceedance_pct": wind_exceedance,
            "craft_max_wave": dnv_wave,
            "craft_max_wind": dnv_wind,
            "clamp_reason": drivers[0] if drivers else None,
            "source_tier": "national_agency_forecast",
            "source_precedence": cls.SOURCE_PRECEDENCE,
        }
