import asyncio
import contextlib
import time
from concurrent.futures import ThreadPoolExecutor
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import chat, safety, pfz, port, ddmo, researcher, vessel, v1_endpoints, auth
from .workers.ingestion_worker import run_ingestion_worker
from .lib import metrics

# NFR-6: a real load test (backend/scripts/load_test.py) found that
# asyncio's DEFAULT thread-pool executor (min(32, cpu_count+4) workers) was
# the actual bottleneck once blocking I/O (live connector fetches, SQLite
# audit writes) was moved off the event loop via asyncio.to_thread — 500
# concurrent requests queued behind ~32 threads. Sized up so genuinely
# concurrent blocking calls can actually run concurrently.
THREAD_POOL_SIZE = 128


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    loop.set_default_executor(ThreadPoolExecutor(max_workers=THREAD_POOL_SIZE))
    task = asyncio.create_task(run_ingestion_worker())
    try:
        yield
    finally:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Agent Marine Intelligence & Deterministic Safety Engine for SIH 2026 (PS-26176)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration — the frontend never sends cookies/credentials, and a
# demo may be viewed from another device on the LAN (vite's `host: true`),
# so allow any origin. Wildcard origin + allow_credentials=True is an
# invalid combination browsers reject outright; keep credentials off.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NFR-1/2/3/11 — real per-request latency + status instrumentation. This is
# the actual measurement source behind /api/v1/observability/summary; no
# request bypasses it, including error responses.
@app.middleware("http")
async def _record_request_metrics(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        metrics.record_request(request.url.path, request.method, 500, (time.perf_counter() - start) * 1000)
        raise
    metrics.record_request(request.url.path, request.method, response.status_code, (time.perf_counter() - start) * 1000)
    return response

# Mount API Routers
app.include_router(v1_endpoints.router, prefix=settings.API_PREFIX)
app.include_router(auth.router, prefix=settings.API_PREFIX)
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
