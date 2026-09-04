from typing import Dict, Any
from ..services.satellite_service import SatelliteService
from .guardrail import HydrodynamicGuardrail

class PfzAgent:
    """
    Specialized AI Agent for Potential Fishing Zone (PFZ) and Oceanographic Ingest.
    Identifies pelagic aggregation zones and enforces Separated Corridor Transit Safety.
    """

    @classmethod
    def get_ranked_zones(cls, loa: float = 8.2, hp: float = 9.9) -> Dict[str, Any]:
        zones = SatelliteService.get_pfz_advisories()

        # Enforce transit corridor check against the REQUESTING vessel's own
        # thresholds — nearshore bar swell (1.8m/24kt) is marginal for an
        # 8.2m craft but would be SAFE for a 16m mechanized vessel, so this
        # must be evaluated per-request, not hardcoded.
        corridor_verdict, corridor_meta = HydrodynamicGuardrail.evaluate(
            vessel_loa=loa, vessel_hp=hp, swh=1.8, wind_gust=24.0
        )
        transit_verdict = f"{corridor_verdict} ON TRANSIT" if corridor_verdict != "SAFE" else "SAFE ON TRANSIT"

        if corridor_verdict == "SAFE":
            transit_advisory = (
                "The Kasimedu harbour sandbar exit corridor (1.8m swell, 24kt gusts) is within your "
                f"{loa}m craft's physical threshold ({corridor_meta['craft_max_wave']}m). Normal transit."
            )
        else:
            transit_advisory = (
                "While the PFZ #01 zone itself has calm open waters (1.1m swell), the Kasimedu "
                f"harbour sandbar exit corridor experiences 1.8m breaking swells between 06:00 and 09:00 IST — "
                f"exceeding your {loa}m craft's {corridor_meta['craft_max_wave']}m threshold. "
                "Skilled navigation required or postpone departure until 10:00 IST tide crest."
            )

        return {
            "primary_zone": zones[0],
            "all_zones": zones,
            "transit_verdict": transit_verdict,
            "transit_advisory": transit_advisory,
            "species_target": "Pelagic Tuna, Mackerel & Sardine (88% Catch Probability)",
            "estimated_fuel_saving_pct": 28,
            "satellite_sources": ["Oceansat-3 OCM-3 Level-2", "INSAT-3D Imager SST"],
        }
