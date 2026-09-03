from pydantic import BaseModel, Field

class VesselProfile(BaseModel):
    name: str = "Meenavan-01"
    reg_no: str = "IND-TN-02-MM-4491"
    loa: float = Field(default=8.2, description="Length Overall in meters")
    beam: float = Field(default=2.1, description="Beam width in meters")
    draft: float = Field(default=0.8, description="Draft depth in meters")
    hp: float = Field(default=9.9, description="Outboard Engine Horsepower")
    hull_material: str = "FRP (Fibre Reinforced Plastic)"
    gear_type: str = "Gillnet (Pelagic Drift)"
    max_wave_limit: float = Field(default=1.5, description="Maximum safe SWH in meters")
    max_wind_limit: float = Field(default=18.0, description="Maximum safe wind gusts in knots")

    @classmethod
    def compute_safe_thresholds(cls, loa: float, hp: float) -> tuple[float, float]:
        """
        Dynamically computes physical hydrodynamic safe thresholds:
        - Wave limit (SWH): ~18% of craft length LOA for open FRP hulls
        - Wind limit: 14 + (HP * 0.4) knots
        """
        safe_wave = round(loa * 0.18, 1)
        safe_wind = round(14.0 + hp * 0.4, 1)
        return safe_wave, safe_wind
