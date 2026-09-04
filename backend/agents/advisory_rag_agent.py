"""
Real Advisory/RAG Agent — PRD §6.2: "Retrieval over INCOIS/IMD bulletins,
PFZ text advisories, fisheries circulars, SOPs." This environment has no
internet access to live-scrape actual bulletins (that's D-2's ingestion
concern, a separate problem), so the corpus below is a small, honestly-
labeled seed set standing in for what a live ingestion worker would
produce. What's real here is the retrieval mechanism itself: a from-scratch
BM25 ranker (the same algorithm behind Elasticsearch/the PRD's "Hybrid
BM25 + dense vector search" §6.2), not a fake keyword-match stub.
"""
import math
import re
from typing import Dict, Any, List

TOKEN_PATTERN = re.compile(r"[a-zA-Z]+")


def _tokenize(text: str) -> List[str]:
    return [t.lower() for t in TOKEN_PATTERN.findall(text or "")]


# Seed corpus — stand-ins for INCOIS PFZ advisories, IMD bulletins, fisheries
# circulars, and port SOPs (PRD §6.2). Each documents its (mock) source.
CORPUS: List[Dict[str, str]] = [
    {
        "id": "incois-pfz-daily-04",
        "source": "INCOIS PFZ Advisory",
        "title": "Daily PFZ Advisory — Chennai Coastal Sector",
        "text": (
            "Potential fishing zones identified along the 18-20 fathom depth contour off Chennai coast "
            "based on chlorophyll-a concentration fronts and thermal boundaries from Oceansat-3 OCM. "
            "Pelagic species including tuna, sardine, and mackerel are expected to aggregate near "
            "convergence zones. Fishermen are advised to verify local sea conditions before departure."
        ),
    },
    {
        "id": "imd-squall-bulletin-ksm04",
        "source": "IMD Marine Bulletin",
        "title": "High Wave and Squall Warning — North Tamil Nadu Coast",
        "text": (
            "A squall warning is in effect for the north Tamil Nadu coast including Chennai, Kasimedu, "
            "and Ennore. Wind speeds of 24 to 28 knots with gusts are expected, along with breaking sea "
            "waves near the coast. Fishermen and small craft are advised not to venture into the sea "
            "until conditions improve. Valid until 1800 hours IST."
        ),
    },
    {
        "id": "fisheries-ban-circular-2026",
        "source": "Tamil Nadu Fisheries Department Circular",
        "title": "Annual Fishing Ban Period — Mechanized Trawlers",
        "text": (
            "In accordance with the annual fishing ban to allow fish stock replenishment, mechanized "
            "trawlers are prohibited from operating in Tamil Nadu waters during the notified ban period. "
            "Traditional and motorized craft below 10 metres LOA using non-mechanized gear are exempt "
            "from this restriction. Violations are subject to penalty under the Marine Fisheries "
            "Regulation Act."
        ),
    },
    {
        "id": "port-sop-bar-crossing",
        "source": "Kasimedu Port Authority SOP",
        "title": "Standard Operating Procedure — Harbour Bar Crossing",
        "text": (
            "Vessels with draft exceeding 2.0 metres must not attempt bar crossing outside the high "
            "tide window. Small craft under 10 metres are advised to cross only during daylight hours "
            "with calm sea state below 1.5 metres significant wave height. VHF channel 16 must be "
            "monitored continuously during approach and departure through the harbour mouth."
        ),
    },
    {
        "id": "incois-tsunami-protocol",
        "source": "INCOIS Tsunami Early Warning Protocol",
        "title": "Tsunami Bulletin Response Protocol for Coastal Communities",
        "text": (
            "Upon receipt of a tsunami warning bulletin, all vessels at sea should move to deeper water "
            "beyond 200 metres depth if time permits, or return to a safe port. Coastal residents should "
            "evacuate to designated shelters above 10 metres elevation immediately. Do not wait for "
            "visual confirmation of wave arrival."
        ),
    },
    {
        "id": "imd-cyclone-preparedness",
        "source": "IMD Cyclone Preparedness Advisory",
        "title": "Pre-Cyclone Season Preparedness for Fishing Communities",
        "text": (
            "Ahead of the cyclone season, fishermen should ensure vessel engines, communication "
            "equipment, and life-saving gear are serviceable. District disaster management authorities "
            "will issue port closure orders when a cyclonic disturbance forms in the Bay of Bengal. "
            "Follow only official IMD and INCOIS channels for storm track updates."
        ),
    },
]

_DOC_TOKENS = [_tokenize(f"{d['title']} {d['text']}") for d in CORPUS]
_DOC_LENGTHS = [len(toks) for toks in _DOC_TOKENS]
_AVG_DOC_LEN = sum(_DOC_LENGTHS) / len(_DOC_LENGTHS) if _DOC_LENGTHS else 0
_N_DOCS = len(CORPUS)


def _idf(term: str) -> float:
    n_containing = sum(1 for toks in _DOC_TOKENS if term in toks)
    return math.log((_N_DOCS - n_containing + 0.5) / (n_containing + 0.5) + 1)


class AdvisoryRagAgent:
    """From-scratch BM25 (k1=1.5, b=0.75 — standard defaults)."""
    K1 = 1.5
    B = 0.75

    @classmethod
    def _bm25_score(cls, query_terms: List[str], doc_idx: int) -> float:
        doc_tokens = _DOC_TOKENS[doc_idx]
        doc_len = _DOC_LENGTHS[doc_idx]
        score = 0.0
        for term in query_terms:
            f = doc_tokens.count(term)
            if f == 0:
                continue
            idf = _idf(term)
            denom = f + cls.K1 * (1 - cls.B + cls.B * doc_len / (_AVG_DOC_LEN or 1))
            score += idf * (f * (cls.K1 + 1)) / (denom or 1)
        return score

    @classmethod
    def search(cls, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_terms = _tokenize(query)
        if not query_terms:
            return []
        scored = [
            {**CORPUS[i], "score": round(cls._bm25_score(query_terms, i), 4)}
            for i in range(_N_DOCS)
        ]
        scored = [r for r in scored if r["score"] > 0]
        scored.sort(key=lambda r: r["score"], reverse=True)
        return scored[:top_k]
