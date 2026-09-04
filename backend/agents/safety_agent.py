from typing import Dict, Any
from .guardrail import HydrodynamicGuardrail
from ..services.incois_service import IncoisService
from ..lib.confidence import compute_confidence
from ..lib.cache import ingestion_cache

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
        target_time: str = "tomorrow 05:00",
        lat: float = 13.12,
        lon: float = 80.30,
    ) -> Dict[str, Any]:
        buoy = IncoisService.get_buoy_telemetry(lat=lat, lon=lon)
        forecast = IncoisService.get_hourly_forecast(lat=lat, lon=lon)
        
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

        # Real advisories in all four supported languages (EN/TA/HI/ML) —
        # previously only EN/TA were generated, so a Hindi- or Malayalam-
        # selected session always silently fell back to English regardless
        # of what the user actually asked for (FR-1.1/FR-1.5).
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
            advisory_hi = (
                f"समुद्री लहरें ({swh}मी) और सतही हवा ({buoy['wind_speed']} नॉट) आपकी {loa}मी नाव की "
                f"सीमा ({guardrail_meta['craft_max_wave']}मी) के भीतर हैं। तटीय प्रस्थान और मछली पकड़ने के लिए अनुशंसित समय।"
            )
            advisory_ml = (
                f"കടൽ തിരമാല ({swh}മീ) കൂടാതെ ഉപരിതല കാറ്റ് ({buoy['wind_speed']} നോട്ട്) നിങ്ങളുടെ {loa}മീ "
                f"ബോട്ടിന്റെ പരിധിക്കുള്ളിലാണ് ({guardrail_meta['craft_max_wave']}മീ). തീരദേശ യാത്രയ്ക്കും "
                f"മീൻപിടിത്തത്തിനും അനുയോജ്യമായ സമയം."
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
            advisory_hi = (
                f"गंभीर समुद्री स्थिति। ऊंची लहरें ({swh}मी) और तेज़ आंधी वाली हवाएं ({wind_gust} नॉट) 15मी से "
                f"छोटी नावों के लिए पलटने का गंभीर खतरा पैदा करती हैं। समुद्र में जाना पूरी तरह वर्जित है।"
            )
            advisory_ml = (
                f"കടുത്ത കടൽ സാഹചര്യം. ഉയർന്ന തിരമാലകൾ ({swh}മീ) കൂടാതെ ശക്തമായ കാറ്റ് ({wind_gust} നോട്ട്) "
                f"15 മീറ്ററിൽ താഴെയുള്ള ബോട്ടുകൾക്ക് മറിഞ്ഞുവീഴാനുള്ള ഗുരുതരമായ അപകടസാധ്യത സൃഷ്ടിക്കുന്നു. "
                f"കടലിൽ പോകുന്നത് പൂർണ്ണമായും ഒഴിവാക്കാൻ ശുപാർശ ചെയ്യുന്നു."
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
            advisory_hi = (
                f"कासिमेडु बंदरगाह मुहाने पर ऊंची टूटती लहरों ({swh}मी बनाम {guardrail_meta['craft_max_wave']}मी सीमा) "
                f"और तेज़ झोंकेदार हवाओं ({wind_gust} नॉट) के कारण आपकी {loa}मी नाव के लिए कल सुबह स्थिति कठिन "
                f"हो सकती है। दोपहर 14:00 बजे के बाद सुरक्षित समय खुलेगा।"
            )
            advisory_ml = (
                f"കാസിമേഡു തുറമുഖ വാതിലിൽ ഉയർന്ന തിരമാലകൾ ({swh}മീ vs {guardrail_meta['craft_max_wave']}മീ പരിധി) "
                f"കൂടാതെ ശക്തമായ കാറ്റിന്റെ കുതിപ്പുകൾ ({wind_gust} നോട്ട്) കാരണം നിങ്ങളുടെ {loa}മീ ബോട്ടിന് "
                f"നാളെ രാവിലെ സാഹചര്യം ബുദ്ധിമുട്ടായിരിക്കാം. ഉച്ചയ്ക്ക് 14:00-ന് ശേഷം സുരക്ഷിതമായ സമയം ലഭ്യമാകും."
            )
            sub_status = "Moderate Risk: Conditions Require Heightened Alert"

        cache_key = f"buoy:{round(lat, 2)}:{round(lon, 2)}"
        confidence_meta = compute_confidence(
            data_source=buoy.get("data_source"),
            source_tier=guardrail_meta.get("source_tier"),
            is_clamped=guardrail_meta.get("is_clamped", False),
            cache_age_seconds=ingestion_cache.age_seconds(cache_key),
        )

        return {
            "verdict": final_verdict,
            "verdict_ta": "பாதுகாப்பானது" if final_verdict == "SAFE" else "கடலுக்கு செல்ல வேண்டாம்" if final_verdict == "DO NOT VENTURE" else "எச்சரிக்கை",
            "verdict_hi": "सुरक्षित" if final_verdict == "SAFE" else "समुद्र में न जाएं" if final_verdict == "DO NOT VENTURE" else "चेतावनी",
            "verdict_ml": "സുരക്ഷിതം" if final_verdict == "SAFE" else "കടലിൽ പോകരുത്" if final_verdict == "DO NOT VENTURE" else "ജാഗ്രത",
            "sub_status": sub_status,
            "confidence": confidence_meta["confidence"],
            "confidence_pct": confidence_meta["confidence_pct"],
            "confidence_label": confidence_meta["confidence_label"],
            "advisory_en": advisory_en,
            "advisory_ta": advisory_ta,
            "advisory_hi": advisory_hi,
            "advisory_ml": advisory_ml,
            "target_window": "Tomorrow 05:00 – 10:00 IST (5 Hours)",
            "telemetry": buoy,
            "guardrail": guardrail_meta,
            "hourly_forecast": forecast,
            "sources": ["INCOIS OSF WAVEWATCH-III v3.4", "Kasimedu Buoy BD08", "IMD Coastal Radar"],
        }
