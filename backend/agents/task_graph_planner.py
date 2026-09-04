from typing import Dict, Any
from datetime import datetime, timezone
from ..models.schemas import TaskGraphPlanResponse, TaskGraphNode, TaskGraphEdge
from .supervisor import SupervisorAgent
from .intent_classifier import intent_classifier

NODE_DESCRIPTIONS = {
    "intent": "Classifies query intent (Naive Bayes classifier, FR-2.1) and extracts entities.",
    "wave": "Retrieves live/cached significant wave height, wind, and SST for the resolved position.",
    "hazard": "Checks IMD Doppler radar for active squall/cyclone warning bulletins.",
    "pfz": "Queries chlorophyll-a/thermal fronts for potential fishing zones and transit safety.",
    "port": "Evaluates harbour approach-bar depth, tide phase, and AIS vessel queue.",
    "guardrail": "Executes the PRD §9 deterministic vessel-threshold rule engine — overrides any probabilistic verdict.",
}
STATIC_NODE_SOURCES = {
    "intent": "Naive-Bayes Intent Classifier (backend/agents/intent_classifier.py)",
    "hazard": "IMD Doppler Weather Radar (mock bulletin)",
    "pfz": "Oceansat-3 OCM-3 / INCOIS PFZ Model (mock)",
    "port": "Kasimedu Port AIS + Hydrographic Survey (mock)",
    "guardrail": "Deterministic Rule Engine (PRD §9 Ground Truth)",
}


class TaskGraphPlanner:
    """
    SUPERVISOR TASK GRAPH (DAG) PLANNER — PRD §6.1, §6.3, FR-2.2:
    Genuinely per-query. Delegates graph construction and execution to
    SupervisorAgent (backend/agents/supervisor.py) — the query's actual
    wording determines which nodes exist (PFZ/port nodes only appear if
    the query asks about them), and every node's status/latency/source
    reflects a real execution, not a fixed illustrative template.
    """

    @classmethod
    async def generate_plan(
        cls,
        query: str,
        vessel_class: str = "motorized",
        loa: float = 8.2,
        hp: float = 9.9,
        lat: float = 13.12,
        lon: float = 80.30,
    ) -> TaskGraphPlanResponse:
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        graph = SupervisorAgent.build_graph(query, loa=loa, hp=hp, lat=lat, lon=lon)
        outcome = await SupervisorAgent.execute(graph)
        top_intent, _probs = intent_classifier.classify(query)

        nodes = []
        for name, spec in graph.items():
            status_info = outcome["node_status"].get(name, {})
            result = outcome["results"].get(name)
            source = STATIC_NODE_SOURCES.get(name, "N/A")
            if name == "wave" and isinstance(result, dict):
                source = result.get("data_source", source) or "INCOIS OSF WAVEWATCH-III (mock fallback)"

            if name == "intent":
                args: Dict[str, Any] = {"raw_query": query}
            elif name in ("wave", "pfz", "port"):
                args = {"lat": lat, "lon": lon}
            elif name == "guardrail":
                args = {"vessel_class": vessel_class, "loa_m": loa, "hp": hp}
            else:
                args = {}

            nodes.append(TaskGraphNode(
                id=f"node-{name}",
                agent=spec["agent"],
                tool=spec["tool"],
                description=NODE_DESCRIPTIONS.get(name, spec["tool"]),
                args=args,
                status=status_info.get("status", "PENDING"),
                latency_ms=int(round(status_info.get("latency_ms", 0))),
                retrieved_source=source,
                timestamp=now_str,
            ))

        edges = [
            TaskGraphEdge(from_node=f"node-{dep}", to_node=f"node-{name}")
            for name, spec in graph.items() for dep in spec["deps"]
        ]

        node_latency = {name: outcome["node_status"].get(name, {}).get("latency_ms", 0) for name in graph}

        def critical_path(node_name: str) -> float:
            deps = graph[node_name]["deps"]
            upstream = max((critical_path(d) for d in deps), default=0.0)
            return node_latency[node_name] + upstream

        estimated_latency_ms = int(round(max((critical_path(n) for n in graph), default=0.0)))
        evidence_leaf_count = sum(1 for s in outcome["node_status"].values() if s.get("status") == "COMPLETED")

        return TaskGraphPlanResponse(
            query=query,
            intent=top_intent,
            total_nodes=len(nodes),
            parallel_branches=outcome["parallel_waves"],
            estimated_latency_ms=estimated_latency_ms,
            nodes=nodes,
            edges=edges,
            evidence_leaf_count=evidence_leaf_count,
        )
