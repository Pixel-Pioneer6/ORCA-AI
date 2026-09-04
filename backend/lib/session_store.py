"""
Real multi-turn conversation memory — PRD FR-1.3. Session state (last known
location, vessel profile, a pending clarification, and a bounded turn
history) is genuinely written on one turn and read back on the next, keyed
by session_id. This is process-local (no external session DB in this
environment), which is an honest limit for horizontal scaling, but the
memory contract itself — a later turn actually seeing an earlier turn's
state without the client re-sending it — is real, not simulated.
"""
import time
from typing import Any, Dict, Optional

MAX_HISTORY_TURNS = 20


class SessionStore:
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def get(self, session_id: str) -> Dict[str, Any]:
        return self._sessions.setdefault(session_id, {
            "location": None,          # {"lat":.., "lon":.., "name":..} once resolved
            "vessel_loa": None,
            "vessel_hp": None,
            "history": [],
            "pending_clarification": None,  # original query text awaiting a location answer
        })

    def update(self, session_id: str, **kwargs) -> None:
        self.get(session_id).update(kwargs)

    def append_turn(self, session_id: str, role: str, text: str) -> None:
        session = self.get(session_id)
        session["history"].append({"role": role, "text": text, "ts": time.time()})
        session["history"] = session["history"][-MAX_HISTORY_TURNS:]

    def reset(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)


session_store = SessionStore()
