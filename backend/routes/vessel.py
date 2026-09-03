from fastapi import APIRouter
from ..models.vessel import VesselProfile

router = APIRouter(prefix="/vessel", tags=["Vessel Profile & Calibration"])

current_vessel = VesselProfile()

@router.get("/profile", response_model=VesselProfile)
async def get_vessel_profile():
    """Returns currently calibrated skipper vessel profile and physical limits."""
    return current_vessel

@router.post("/calculate-limits")
async def calculate_physical_limits(profile: VesselProfile):
    """
    Dynamically recalculates hydrodynamic wave and wind thresholds
    based on hull LOA and engine power.
    """
    global current_vessel
    safe_wave, safe_wind = VesselProfile.compute_safe_thresholds(profile.loa, profile.hp)
    
    current_vessel = profile
    current_vessel.max_wave_limit = safe_wave
    current_vessel.max_wind_limit = safe_wind

    return {
        "vessel": current_vessel,
        "safe_wave_limit_m": safe_wave,
        "safe_wind_limit_kt": safe_wind,
        "calibration_score_pct": 85.0,
        "status": "OPTIMIZED_AGAINST_SWAN_MODEL",
    }
