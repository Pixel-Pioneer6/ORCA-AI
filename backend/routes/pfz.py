from fastapi import APIRouter, Query
from ..models.schemas import PfzResponse, PfzZoneItem
from ..agents.pfz_agent import PfzAgent

router = APIRouter(prefix="/pfz", tags=["Potential Fishing Zones"])

@router.get("/zones", response_model=PfzResponse)
async def get_pfz_advisories(
    loa: float = Query(8.2, description="Craft length in meters"),
    hp: float = Query(9.9, description="Engine HP")
):
    """
    Returns ranked Potential Fishing Zones computed from Oceansat-3 chlorophyll fronts
    and INSAT-3D thermal SST boundaries, coupled with separated transit safety evaluations.
    """
    data = PfzAgent.get_ranked_zones(loa=loa, hp=hp)
    
    zone_items = [
        PfzZoneItem(**z) for z in data["all_zones"]
    ]

    return PfzResponse(
        zones=zone_items,
        transit_corridor_verdict=data["transit_verdict"],
        transit_advisory=data["transit_advisory"],
        satellite_timestamp="Oceansat-3 Pass 2026-09-03 10:30 UTC",
        sensor_origin="ISRO SAC / MOSDAC Level-3 OCM & SST Ingest",
    )
