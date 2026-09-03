from typing import Dict, Any, List

class PortOperationsAgent:
    """
    Specialized AI Agent for Port & Harbour Authority Operations:
    Monitors outer approach bar shoaling, tidal curves, AIS fleet queue, and VHF Ch-16 broadcasts.
    """

    @classmethod
    def get_harbour_status(cls, port_id: str = "kasimedu") -> Dict[str, Any]:
        vessels = [
            {"name": "MV Ocean Star", "mmsi": "419001284", "vessel_type": "Mechanized Trawler (18m)", "draft_m": 2.1, "status": "Bar Hold", "status_level": "caution", "berth": "Outer Anchorage", "action_required": "Hold Clearance"},
            {"name": "Sea Fisher IV", "mmsi": "419002931", "vessel_type": "Traditional FRP (9m)", "draft_m": 0.9, "status": "Caution Inbound", "status_level": "caution", "berth": "Jetty B-04", "action_required": "Escort Pilot"},
            {"name": "Coromandel Pearl", "mmsi": "419003884", "vessel_type": "Gillnetter (14m)", "draft_m": 1.6, "status": "Cleared Exit", "status_level": "safe", "berth": "Channel Out", "action_required": "VHF-16 Log"},
            {"name": "Harbour Tug 02", "mmsi": "419004112", "vessel_type": "Port Assist Tug", "draft_m": 2.8, "status": "Stationary Watch", "status_level": "safe", "berth": "Pier 1 Standby", "action_required": "Direct Dispatch"},
            {"name": "Blue Fin 08", "mmsi": "419005009", "vessel_type": "Longliner (16m)", "draft_m": 1.8, "status": "Shoal Risk", "status_level": "danger", "berth": "Approach Bar", "action_required": "Immediate Alert"},
        ]

        return {
            "port_name": "Kasimedu Fishing Harbour & Approach Channel (Chennai)",
            "status_verdict": "CAUTION - Approach Bar Shoaling Surge",
            "tide_phase": "Rising Tide (+1.4m Crest at 14:30 IST)",
            "current_depth_datum": -0.4,
            "next_high_tide": "14:30 IST (+1.4m)",
            "visibility_nm": 6.2,
            "vessels_in_perimeter": 42,
            "active_warnings_count": 2,
            "direct_vhf_channel": "VHF Marine Channel 16 / 12",
            "vessels": vessels,
            "directives": [
                "Vessels with draft > 2.0m prohibited from outer bar crossing until 14:00 IST tide crest.",
                "Mandatory tug escort for inbound cargo barges through Dredged Fairway #02.",
                "Maintain radio listening watch on Port VHF Ch-16 at 15-minute intervals.",
            ],
        }

    @classmethod
    def generate_vhf_broadcast_script(cls) -> Dict[str, str]:
        return {
            "en": "SECURITE, SECURITE, SECURITE. All stations, this is Kasimedu Port Control. Outer approach bar experiencing 1.9m breaking swells. Craft LOA under 12m prohibited from crossing. Next update 16:00 IST. Kasimedu Control OUT.",
            "ta": "அனைத்து படகுகளுக்கும் காசிமேடு துறைமுக எச்சரிக்கை: முகத்துவாரத்தில் அலை 1.9 மீ சீற்றமாக உள்ளதால் 12 மீ குறைவான படகுகள் துறைமுகத்தை விட்டு வெளியேற தடை விதிக்கப்பட்டுள்ளது.",
        }
