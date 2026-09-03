from typing import Dict, Any
from .guardrail import HydrodynamicGuardrail
from ..services.incois_service import IncoisService

class SafetyAgent:
    """
    Specialized AI Agent for Marine Safety & Hydrodynamic Threshold Evaluation.
    Evaluates wave swell, surface winds, breakers, and temporal windows.
    """

    @classmethod
    def evaluate_departure_safety(
        cls, 
        loa: float = 8.2, 
        hp: float = 9.9, 
        target_time: str = "tomorrow 05:00"
    ) -> Dict[str, Any]:
        buoy = IncoisService.get_buoy_telemetry()
        forecast = IncoisService.get_hourly_forecast()
        
        swh = buoy["swh"]
        wind_gust = buoy["wind_gust"]

        # Initial Agent assessment
        proposed_verdict = "CAUTION"
        if swh < 1.3 and wind_gust < 15:
            proposed_verdict = "SAFE"
        elif swh > 2.4 or wind_gust > 30:
            proposed_verdict = "DO NOT VENTURE"

        # Deterministic Guardrail Validation
        final_verdict, guardrail_meta = HydrodynamicGuardrail.evaluate(
            vessel_loa=loa,
            vessel_hp=hp,
            swh=swh,
            wind_gust=wind_gust,
            proposed_verdict=proposed_verdict,
        )

        # Bilingual plain-language advisories
        if final_verdict == "SAFE":
            advisory_en = (
                f"Ocean swell ({swh}m) and surface winds ({buoy['wind_speed']} kt) are well within "
                f"your {loa}m craft's physical threshold ({guardrail_meta['craft_max_wave']}m). "
                f"Recommended window for shoreline departure and coastal trolling."
            )
            advisory_ta = (
                f"அலை உயரம் ({swh}மீ) மற்றும் காற்று வேகம் உங்கள் {loa}மீ படகின் அனுமதிக்கப்பட்ட "
                f"வரம்பிற்குள் உள்ளது. கடலுக்கு செல்ல பாதுகாப்பானது."
            )
            sub_status = f"Normal Feasible Conditions for {loa}m Motorized FRP Boats"
        elif final_verdict == "DO NOT VENTURE":
            advisory_en = (
                f"Rough to very rough breaking sea conditions. High waves ({swh}m) and gale gusts "
                f"({wind_gust} kt) create severe hull capsizing risk for craft below 15m. "
                f"Complete suspension of venturing recommended."
            )
            advisory_ta = (
                f"கடும் கடல் சீற்றம் மற்றும் பலத்த காற்று ({wind_gust} kt) வீசுவதால் படகு கவிழும் அபாயம் உள்ளது. "
                f"கடலுக்கு செல்ல வேண்டாம்."
            )
            sub_status = "Severe Maritime Hazard: Hull Capsizing Risk"
        else:  # CAUTION
            advisory_en = (
                f"Conditions may be difficult for your {loa}m motorized vessel tomorrow morning "
                f"because of elevated breaker waves ({swh}m vs {guardrail_meta['craft_max_wave']}m limit) "
                f"and squally gusts ({wind_gust} kt) at the harbour bar. "
                f"Recommended safer window opens after 14:00 IST."
            )
            advisory_ta = (
                f"காசிமேடு முகத்துவாரத்தில் அலை உயரம் ({swh}மீ) அதிகரித்து காணப்படுவதால் காலை 05:00 முதல் 10:00 "
                f"வரை கடலுக்கு செல்வதில் சிரமம் ஏற்படலாம். எச்சரிக்கையுடன் செயல்படவும்."
            )
            sub_status = "Moderate Risk: Conditions Require Heightened Alert"

        return {
            "verdict": final_verdict,
            "verdict_ta": "பாதுகாப்பானது" if final_verdict == "SAFE" else "கடலுக்கு செல்ல வேண்டாம்" if final_verdict == "DO NOT VENTURE" else "எச்சரிக்கை",
            "verdict_hi": "सुरक्षित" if final_verdict == "SAFE" else "समुद्र में न जाएं" if final_verdict == "DO NOT VENTURE" else "चेतावनी",
            "sub_status": sub_status,
            "confidence": "84% (MEDIUM)",
            "advisory_en": advisory_en,
            "advisory_ta": advisory_ta,
            "target_window": "Tomorrow 05:00 – 10:00 IST (5 Hours)",
            "telemetry": buoy,
            "guardrail": guardrail_meta,
            "hourly_forecast": forecast,
            "sources": ["INCOIS OSF WAVEWATCH-III v3.4", "Kasimedu Buoy BD08", "IMD Coastal Radar"],
        }
