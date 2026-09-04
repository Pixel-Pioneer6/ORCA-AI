from pydantic import BaseModel, Field
from ..agents.guardrail import HydrodynamicGuardrail

class VesselProfile(BaseModel):
    name: str = "Meenavan-01"
    reg_no: str = "IND-TN-02-MM-4491"
    loa: float = Field(default=8.2, description="Length Overall in meters")
    beam: float = Field(default=2.1, description="Beam width in meters")
    draft: float = Field(default=0.8, description="Draft depth in meters")
    hp: float = Field(default=9.9, description="Outboard Engine Horsepower")
    hull_material: str = "FRP (Fibre Reinforced Plastic)"
    gear_type: str = "Gillnet (Pelagic Drift)"
    # Defaults match the canonical do-not-venture threshold for an 8.2m
    # motorized craft (HydrodynamicGuardrail.VESSEL_CLASSES['motorized']),
    # so the field's stated meaning ("maximum safe") is true before the
    # first /calculate-limits call too, not just after.
    max_wave_limit: float = Field(default=2.5, description="Maximum safe SWH in meters (do-not-venture threshold)")
    max_wind_limit: float = Field(default=25.0, description="Maximum safe wind gusts in knots (do-not-venture threshold)")

    @classmethod
    def compute_safe_thresholds(cls, loa: float, hp: float) -> tuple[float, float]:
        """
        Computes physical hydrodynamic safe thresholds from the SAME
        canonical PRD §9 vessel-class table the deterministic safety engine
        uses (HydrodynamicGuardrail.VESSEL_CLASSES) — engine HP does not
        change the §9 threshold band, only LOA does. This used to be an
        independent ad-hoc formula (loa*0.18, 14+hp*0.4) that silently
        diverged from the canonical table by as much as 40kt of wind at
        larger LOA, which would have been actively dangerous if ever
        surfaced as the operative safety limit.
        """
        vessel_class = HydrodynamicGuardrail.classify_vessel(loa)
        thresholds = HydrodynamicGuardrail.VESSEL_CLASSES[vessel_class]
        safe_wave = thresholds["doNotVenture"]["wave"]
        safe_wind = thresholds["doNotVenture"]["wind"]
        return safe_wave, safe_wind
