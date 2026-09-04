"""
Real Supervisor orchestrator — PRD §6.1 / §6.3.

Unlike task_graph_planner.py (which returns a fixed, illustrative 9-node
plan for the UI's DAG-transparency viewer, per the demo narrative in §17),
this module actually builds a graph whose node set depends on the query,
executes independent nodes concurrently via asyncio, times them for real,
and on a tool failure retries up to twice before degrading to a partial
answer with an explicit gap statement — never a fabricated value. This is
what makes "replanning on tool failure" (§6.3) real logic instead of a
label with no code behind it.
"""
import asyncio
import time
from typing import Dict, Any, List, Callable

from .guardrail import HydrodynamicGuardrail
from .pfz_agent import PfzAgent
from .weather_agent import WeatherHazardAgent
from .port_agent import PortOperationsAgent
from ..services.incois_service import IncoisService

MAX_RETRIES = 2  # PRD §6.3: "re-planned at most twice on failure"


class ToolExecutionError(Exception):
    pass


def _make_flaky(fn: Callable, fail_times: int) -> Callable:
    """Wraps a tool call so it deterministically fails its first N calls,
    then succeeds — used only when a caller explicitly opts into fault
    injection (inject_failure=True) to prove the retry path actually runs."""
    state = {"calls": 0}

    def wrapped(*args, **kwargs):
        state["calls"] += 1
        if state["calls"] <= fail_times:
            raise ToolExecutionError("Simulated upstream timeout (INCOIS OSF unreachable)")
        return fn(*args, **kwargs)

    return wrapped


class SupervisorAgent:
    @classmethod
    def build_graph(cls, query: str, loa: float = 8.2, hp: float = 9.9,
                     lat: float = 13.12, lon: float = 80.30,
                     inject_failure: bool = False) -> Dict[str, Dict[str, Any]]:
        q = (query or "").lower()
        wants_pfz = any(w in q for w in ["pfz", "fish", "catch", "zone"])
        wants_port = any(w in q for w in ["port", "harbour", "bar", "berth", "vhf"])

        wave_fn = lambda: IncoisService.get_buoy_telemetry(lat, lon)
        if inject_failure:
            wave_fn = _make_flaky(wave_fn, fail_times=1)

        nodes: Dict[str, Dict[str, Any]] = {
            "intent": {
                "agent": "SupervisorAgent", "tool": "parse_intent_and_entities",
                "deps": [], "fn": lambda _: {"intent": "safety_check", "query": query},
            },
            "wave": {
                "agent": "OceanDataAgent", "tool": "get_buoy_telemetry",
                "deps": ["intent"], "fn": lambda _: wave_fn(),
            },
            "hazard": {
                "agent": "WeatherHazardAgent", "tool": "get_active_hazard_summary",
                "deps": ["intent"], "fn": lambda _: WeatherHazardAgent.get_active_hazard_summary(),
            },
        }
        if wants_pfz:
            nodes["pfz"] = {
                "agent": "PfzAgent", "tool": "get_ranked_zones",
                "deps": ["intent"], "fn": lambda _: PfzAgent.get_ranked_zones(loa=loa, hp=hp),
            }
        if wants_port:
            nodes["port"] = {
                "agent": "PortOperationsAgent", "tool": "get_harbour_status",
                "deps": ["intent"], "fn": lambda _: PortOperationsAgent.get_harbour_status(),
            }

        def guardrail_fn(results: Dict[str, Any]):
            buoy = results["wave"]
            verdict, meta = HydrodynamicGuardrail.evaluate(
                vessel_loa=loa, vessel_hp=hp, swh=buoy["swh"], wind_gust=buoy["wind_gust"]
            )
            return {"verdict": verdict, **meta}

        nodes["guardrail"] = {
            "agent": "SafetyRiskAgent", "tool": "evaluate_deterministic_rule_engine",
            "deps": ["wave", "hazard"], "fn": guardrail_fn,
        }
        return nodes

    @classmethod
    async def execute(cls, nodes: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        results: Dict[str, Any] = {}
        node_status: Dict[str, Dict[str, Any]] = {}
        failed: set = set()
        gaps: List[str] = []
        remaining = set(nodes.keys())

        async def run_node(name: str, spec: Dict[str, Any]):
            # A node whose dependency already failed can't run — propagate
            # the gap instead of crashing on missing data.
            if any(d in failed for d in spec["deps"]):
                node_status[name] = {
                    "status": "SKIPPED", "agent": spec["agent"], "tool": spec["tool"],
                    "attempts": 0, "latency_ms": 0.0,
                    "error": f"Upstream dependency failed: {', '.join(d for d in spec['deps'] if d in failed)}",
                }
                failed.add(name)
                gaps.append(f"{spec['agent']}.{spec['tool']} skipped — dependency unavailable")
                return

            start = time.perf_counter()
            attempts = 0
            last_error = None
            while attempts <= MAX_RETRIES:
                attempts += 1
                try:
                    value = await asyncio.to_thread(spec["fn"], results)
                    latency_ms = round((time.perf_counter() - start) * 1000, 2)
                    node_status[name] = {
                        "status": "COMPLETED", "agent": spec["agent"], "tool": spec["tool"],
                        "attempts": attempts, "latency_ms": latency_ms,
                    }
                    results[name] = value
                    return
                except Exception as e:  # noqa: BLE001 — genuinely any tool exception triggers replan
                    last_error = str(e)
                    continue

            # Exhausted MAX_RETRIES retries — degrade with an explicit gap,
            # never a fabricated value (PRD §6.3 / risk table §15).
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            node_status[name] = {
                "status": "FAILED", "agent": spec["agent"], "tool": spec["tool"],
                "attempts": attempts, "latency_ms": latency_ms, "error": last_error,
            }
            failed.add(name)
            gaps.append(f"{spec['agent']}.{spec['tool']} failed after {attempts} attempts ({MAX_RETRIES} retries exhausted): {last_error}")

        # Execute in dependency "waves": everything whose deps are already
        # resolved (or failed) runs concurrently via asyncio.gather — this
        # is the actual parallel dispatch the PRD's task graph promises.
        while remaining:
            ready = [n for n in remaining if all(d not in remaining for d in nodes[n]["deps"])]
            if not ready:
                # Circular or unresolved dependency in a hand-authored graph — surface, don't hang.
                for n in remaining:
                    node_status[n] = {"status": "SKIPPED", "agent": nodes[n]["agent"], "tool": nodes[n]["tool"], "attempts": 0, "latency_ms": 0.0, "error": "Unresolvable dependency"}
                    gaps.append(f"{nodes[n]['agent']}.{nodes[n]['tool']} skipped — unresolvable dependency")
                break
            await asyncio.gather(*(run_node(n, nodes[n]) for n in ready))
            remaining -= set(ready)

        return {
            "results": results,
            "node_status": node_status,
            "gaps": gaps,
            "degraded": len(gaps) > 0,
            "parallel_waves": cls._count_waves(nodes),
        }

    @staticmethod
    def _count_waves(nodes: Dict[str, Dict[str, Any]]) -> int:
        """Counts dependency levels for reporting — a real measure of how
        parallel this specific query's graph actually was, not a hardcoded '4'."""
        depth: Dict[str, int] = {}
        def d(n):
            if n in depth:
                return depth[n]
            deps = nodes[n]["deps"]
            depth[n] = 0 if not deps else 1 + max(d(x) for x in deps)
            return depth[n]
        for n in nodes:
            d(n)
        return max(depth.values()) + 1 if depth else 0
