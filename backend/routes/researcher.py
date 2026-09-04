from fastapi import APIRouter
from ..services.satellite_service import SatelliteService
from ..agents.analytics_agent import AnalyticsAgent

router = APIRouter(prefix="/researcher", tags=["Marine Climatology & Analytics"])

@router.get("/climatology")
async def get_climatology_metrics():
    """
    Returns 30-day SST climatological trajectory vs 30-year normal,
    upwelling thermal anomalies, and satellite model concordance.

    FR-3.4 — the summary's anomaly/trend/R² figures are now the real
    output of AnalyticsAgent's numpy computation over this same series,
    not independently hand-picked constants that happened to look similar.
    """
    data = SatelliteService.get_climatology_trajectory()

    base_sst = 28.6
    observed = [round(base_sst + (0.8 * (day / 30.0) if day > 20 else 0.2), 2) for day in range(1, 31)]
    analysis = AnalyticsAgent.compute_anomaly_series(observed, climatological_mean=base_sst)

    timeseries = []
    for point in analysis["series"]:
        day = point["index"] + 1
        timeseries.append({
            "day": day,
            "observed_sst": point["value"],
            "normal_mean": base_sst,
            "z_score": point["z_score"],
            "chlorophyll_proxy": round(0.5 + (0.02 * day), 2),
        })

    data["thermal_anomaly"] = analysis["mean_anomaly"]
    data["r_squared"] = analysis["trend_r_squared"]

    return {
        "summary": data,
        "timeseries": timeseries,
        "analysis": analysis,
    }

@router.get("/sensors")
async def get_sensor_matrix():
    """
    Returns multi-sensor calibration, ingest latency, and quality control metrics.
    """
    return {
        "sensors": [
            {"sensor": "INCOIS WAVEWATCH-III", "type": "Hydrodynamic Model", "latency": "14 min", "qc_score": "98.4%", "status": "NOMINAL"},
            {"sensor": "Kasimedu Buoy BD08", "type": "In-situ Waverider", "latency": "18 min", "qc_score": "99.1%", "status": "NOMINAL"},
            {"sensor": "Oceansat-3 OCM-3", "type": "Ocean Color (Chl-a)", "latency": "28 min", "qc_score": "94.0%", "status": "NOMINAL"},
            {"sensor": "INSAT-3D Thermal", "type": "Geostationary SST", "latency": "12 min", "qc_score": "96.5%", "status": "NOMINAL"},
            {"sensor": "IMD Doppler Radar", "type": "S-Band Radar", "latency": "8 min", "qc_score": "97.2%", "status": "NOMINAL"},
        ]
    }

@router.get("/export")
async def export_dataset(format: str = "netcdf"):
    """Generates synthetic dataset download manifest in NetCDF-4 or CSV format."""
    return {
        "format": format.upper(),
        "filename": f"ORCA_COROMANDEL_SST_CHL_{format.lower()}.dat",
        "records_count": 8640,
        "coordinate_crs": "EPSG:4326 (WGS84)",
        "download_ready": True,
    }
