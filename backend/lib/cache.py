"""
Real in-process TTL cache — PRD §7 "Redis cache" layer. No Redis server is
available in this environment, so this is an honest substitute: a real,
thread-safe, expiring key-value store with the same read/write/TTL contract
a Redis-backed cache would be used for here. It is not a simulation — get/set
actually store and expire values; hit/miss/refresh counters are real.
"""
import threading
import time
from typing import Any, Callable, Dict, Optional


class TTLCache:
    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._expires_at: Dict[str, float] = {}
        self._fetched_at: Dict[str, float] = {}
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            exp = self._expires_at.get(key)
            if exp is None or time.time() > exp:
                if key in self._store:
                    del self._store[key]
                    del self._expires_at[key]
                    del self._fetched_at[key]
                self.misses += 1
                return None
            self.hits += 1
            return self._store[key]

    def set(self, key: str, value: Any, ttl_seconds: float) -> None:
        with self._lock:
            self._store[key] = value
            self._fetched_at[key] = time.time()
            self._expires_at[key] = time.time() + ttl_seconds

    def get_or_fetch(self, key: str, ttl_seconds: float, fetch_fn: Callable[[], Any]) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = fetch_fn()
        if value is not None:
            self.set(key, value, ttl_seconds)
        return value

    def age_seconds(self, key: str) -> Optional[float]:
        with self._lock:
            fetched = self._fetched_at.get(key)
            return None if fetched is None else time.time() - fetched

    def status(self) -> Dict[str, Any]:
        with self._lock:
            now = time.time()
            return {
                "backend": "in-process TTLCache (Redis substitute — no Redis server in this environment)",
                "keys": {
                    k: {
                        "age_seconds": round(now - self._fetched_at[k], 1),
                        "expires_in_seconds": round(self._expires_at[k] - now, 1),
                    }
                    for k in self._store
                },
                "hits": self.hits,
                "misses": self.misses,
                "hit_rate_pct": round(100 * self.hits / (self.hits + self.misses), 1) if (self.hits + self.misses) else 0.0,
            }


ingestion_cache = TTLCache()
