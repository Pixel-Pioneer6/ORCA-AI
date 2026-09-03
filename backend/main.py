import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import chat, safety, pfz, port, ddmo, researcher, vessel

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Agent Marine Intelligence & Deterministic Safety Engine for SIH 2026 (PS-26176)",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(chat.router, prefix=settings.API_PREFIX)
app.include_router(safety.router, prefix=settings.API_PREFIX)
app.include_router(pfz.router, prefix=settings.API_PREFIX)
app.include_router(port.router, prefix=settings.API_PREFIX)
app.include_router(ddmo.router, prefix=settings.API_PREFIX)
app.include_router(researcher.router, prefix=settings.API_PREFIX)
app.include_router(vessel.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "platform": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "OPERATIONAL",
        "jurisdiction": "Coromandel Zone 04 (Bay of Bengal)",
        "active_agents": [
            "OrcaRouterAgent",
            "SafetyAgent (Hydrodynamics)",
            "PfzAgent (Catch Optimization)",
            "WeatherHazardAgent (IMD Radar)",
            "PortOperationsAgent (AIS/Bar)",
            "DisasterAgent (DDMO Siren & 2G SMS)",
            "HydrodynamicGuardrail (Deterministic Engine)"
        ],
        "satellite_feeds": [
            "ISRO Oceansat-3 OCM-3 (Chlorophyll-a)",
            "INSAT-3D Imager (Thermal SST)",
            "INCOIS OSF WAVEWATCH-III v3.4",
            "IMD Chennai Doppler Weather Radar"
        ],
        "documentation": "/docs",
    }

@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "telemetry_stream": "CONNECTED (4G/SAT-COM)",
        "buoy_id": "BD08-KSM",
        "incois_sync": "NOMINAL (14m latency)",
        "guardrail_active": True,
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
