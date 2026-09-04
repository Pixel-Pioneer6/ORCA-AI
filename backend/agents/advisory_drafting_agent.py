"""
Real advisory drafting — PRD FR-3.6 ("advisory drafting for authority
users"). Previously DdmoDashboard's drafting composer opened with a fixed
canned paragraph (hardcoded "3.4m"/"28kt" numbers) regardless of actual
conditions. This synthesizes the draft from the SAME live telemetry and
warning data every other verdict in this system uses — the numbers in the
draft genuinely change when the underlying conditions do.
"""
from datetime import datetime, timezone
from typing import Any, Dict

from ..services.incois_service import IncoisService
from ..services.imd_service import ImdService
from .alerting_agent import get_active_warning_polygons


def generate_advisory_draft(lat: float = 13.12, lon: float = 80.30) -> Dict[str, Any]:
    buoy = IncoisService.get_buoy_telemetry(lat=lat, lon=lon)
    hazard = ImdService.get_active_marine_warnings()
    warnings = get_active_warning_polygons()
    top_warning = max(warnings, key=lambda w: {"WATCH": 1, "ALERT": 2, "WARNING": 3}.get(w.severity, 0)) if warnings else None

    swh = buoy["swh"]
    wind_gust = buoy["wind_gust"]
    bulletin_id = top_warning.id if top_warning else hazard["bulletin_id"]
    hazard_title = top_warning.title if top_warning else hazard["warning_type"]
    valid_until = top_warning.valid_until if top_warning else hazard["valid_until"]
    affected = ", ".join(top_warning.affected_coastal_blocks) if top_warning else "North Chennai coastal sector"

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    advisory_en = (
        f"GOVERNMENT OF TAMIL NADU · DISTRICT DISASTER MANAGEMENT AUTHORITY\n"
        f"COASTAL BULLETIN #{bulletin_id} · {hazard_title}\n\n"
        f"1. SITUATION: Live buoy telemetry ({buoy.get('data_source', 'MOCK_FALLBACK_NO_LIVE_DATA')}) reports "
        f"significant wave height of {swh}m with wind gusts of {wind_gust} kt affecting {affected}. "
        f"Advisory valid until {valid_until}.\n"
        f"2. DIRECTIVE: {'Total suspension of small craft under 10m LOA advised — conditions exceed safe operating thresholds.' if (swh >= 1.8 or wind_gust >= 24) else 'Exercise heightened caution; conditions are within marginal operating limits for experienced crews.'}\n"
        f"3. SOURCED EVIDENCE: INCOIS OSF WAVEWATCH-III / live buoy feed | IMD Doppler Radar Nowcast | "
        f"generated {now_str}."
    )

    advisory_ta = (
        f"தமிழ்நாடு அரசு · மாவட்ட பேரிடர் மேலாண்மை ஆணையம்\n"
        f"கடலோர எச்சரிக்கை அறிக்கை #{bulletin_id}\n\n"
        f"1. நிலைமை: நேரடி தரவு அலை உயரம் {swh}மீ, காற்று வேகம் {wind_gust} நாட்ஸ் ({affected} பகுதியில்). "
        f"{valid_until} வரை செல்லுபடியாகும்.\n"
        f"2. உத்தரவு: {'10 மீட்டருக்கும் குறைவான படகுகள் கடலுக்குள் செல்வது முழுமையாக தடை செய்யப்படுகிறது.' if (swh >= 1.8 or wind_gust >= 24) else 'எச்சரிக்கையுடன் செயல்படவும்; அனுபவமிக்க குழுவினருக்கு நிலைமை கட்டுப்பாட்டுக்குள் உள்ளது.'}\n"
        f"3. ஆதாரங்கள்: INCOIS நேரடி தரவு | IMD ரேடார் எச்சரிக்கை | {now_str} இல் உருவாக்கப்பட்டது."
    )

    return {
        "advisory_en": advisory_en,
        "advisory_ta": advisory_ta,
        "generated_from": {
            "swh": swh,
            "wind_gust": wind_gust,
            "data_source": buoy.get("data_source"),
            "bulletin_id": bulletin_id,
            "hazard_title": hazard_title,
            "valid_until": valid_until,
        },
        "generated_at_utc": now_str,
    }
