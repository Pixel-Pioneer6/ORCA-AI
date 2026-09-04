"""
Real concurrency/load test — PRD NFR-6 ("500 concurrent sessions"). Fires
genuine concurrent HTTP requests at a running server and reports MEASURED
results (success rate, latency percentiles, errors) — not an untested
claim. Run against an already-running uvicorn instance:

    python -m backend.scripts.load_test --concurrency 500 --url http://127.0.0.1:8000
"""
import argparse
import asyncio
import time
from typing import List

import httpx


async def _one_request(client: httpx.AsyncClient, base_url: str, path: str) -> dict:
    start = time.perf_counter()
    try:
        resp = await client.get(f"{base_url}{path}", timeout=30.0)
        return {"ok": resp.status_code < 400, "status": resp.status_code, "latency_ms": (time.perf_counter() - start) * 1000}
    except Exception as exc:
        return {"ok": False, "status": None, "error": str(exc), "latency_ms": (time.perf_counter() - start) * 1000}


def _percentile(values: List[float], pct: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    idx = min(len(s) - 1, int(round(pct / 100 * (len(s) - 1))))
    return s[idx]


async def run_load_test(base_url: str, concurrency: int, path: str) -> dict:
    # httpx.AsyncClient defaults to a 100-connection pool — with real
    # concurrency above that, the CLIENT queues requests, and the resulting
    # "latency" measures client-side queueing, not server processing time.
    # Size the pool to the requested concurrency so the server is the only
    # bottleneck being measured.
    limits = httpx.Limits(max_connections=concurrency + 10, max_keepalive_connections=concurrency + 10)
    async with httpx.AsyncClient(limits=limits) as client:
        start = time.perf_counter()
        results = await asyncio.gather(*(_one_request(client, base_url, path) for _ in range(concurrency)))
        wall_clock_s = time.perf_counter() - start

    latencies = [r["latency_ms"] for r in results]
    ok_count = sum(1 for r in results if r["ok"])
    return {
        "path": path,
        "concurrency": concurrency,
        "wall_clock_seconds": round(wall_clock_s, 2),
        "success_count": ok_count,
        "failure_count": concurrency - ok_count,
        "success_rate_pct": round(100 * ok_count / concurrency, 2),
        "latency_ms": {
            "min": round(min(latencies), 1) if latencies else 0,
            "p50": round(_percentile(latencies, 50), 1),
            "p95": round(_percentile(latencies, 95), 1),
            "max": round(max(latencies), 1) if latencies else 0,
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    parser.add_argument("--concurrency", type=int, default=500)
    parser.add_argument("--path", default="/api/safety/verdict")
    args = parser.parse_args()

    result = asyncio.run(run_load_test(args.url, args.concurrency, args.path))
    import json
    print(json.dumps(result, indent=2))
