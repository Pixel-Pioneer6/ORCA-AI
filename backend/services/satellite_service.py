from typing import List, Dict, Any

class SatelliteService:
    """
    Simulates ISRO SAC / MOSDAC Earth Observation Satellite Ingest:
    - Oceansat-3 OCM-3 (Ocean Color Monitor: Chlorophyll-a fronts)
    - INSAT-3D/3DR (Thermal Infrared Sea Surface Temperature)
    """

    @classmethod
    def get_pfz_advisories(cls, harbour_lat: float = 13.12, harbour_lon: float = 80.30) -> List[Dict[str, Any]]:
        """Returns detected Potential Fishing Zones calculated from ocean color & thermal fronts."""
        return [
            {
                "id": "pfz-1",
                "name": "PFZ #01 (SE Kasimedu)",
                "distance_nm": 18.4,
                "bearing": "135° SE",
                "heading_deg": 135,
                "chlorophyll": 0.88,
                "sst": 28.2,
                "sst_gradient": 0.6,
                "species": "Pelagic Tuna, Mackerel & Sardine",
                "probability_pct": 88,
                "fuel_saving_pct": 28,
                "transit_safety": "CAUTION ON TRANSIT",
                "transit_warning": "1.8m swell crossing Kasimedu bar mouth corridor",
                "coordinates": {"lat": 13.04, "lon": 80.48},
            },
            {
                "id": "pfz-2",
                "name": "PFZ #02 (East Ennore Shoal)",
                "distance_nm": 24.2,
                "bearing": "110° ESE",
                "heading_deg": 110,
                "chlorophyll": 0.72,
                "sst": 28.5,
                "sst_gradient": 0.4,
                "species": "Mackerel & Anchovy",
                "probability_pct": 76,
                "fuel_saving_pct": 21,
                "transit_safety": "SAFE TRANSIT",
                "transit_warning": None,
                "coordinates": {"lat": 13.22, "lon": 80.52},
            },
            {
                "id": "pfz-3",
                "name": "PFZ #03 (Covelong Deep Trench)",
                "distance_nm": 31.0,
                "bearing": "090° E",
                "heading_deg": 90,
                "chlorophyll": 0.94,
                "sst": 27.8,
                "sst_gradient": 0.8,
                "species": "Skipjack Tuna & Trevally",
                "probability_pct": 92,
                "fuel_saving_pct": 34,
                "transit_safety": "CAUTION ON TRANSIT",
                "transit_warning": "Strong northerly surface drift (2.1 kt)",
                "coordinates": {"lat": 12.80, "lon": 80.60},
            },
        ]

    @classmethod
    def get_climatology_trajectory(cls) -> Dict[str, Any]:
        """Provides 30-day daily SST trajectory vs 30-year climatological normal."""
        return {
            "parameter": "Sea Surface Temperature (°C)",
            "domain": "Coromandel Coast (Zone 04)",
            "observed_current_sst": 29.4,
            "climatological_mean": 28.6,
            "thermal_anomaly": +0.8,
            "upwelling_anomaly": -1.2,
            "r_squared": 0.942,
            "sensor_sources": ["INSAT-3D Imager", "Oceansat-3 OCM", "Sentinel-3 SLSTR", "INCOIS BD08"],
        }
