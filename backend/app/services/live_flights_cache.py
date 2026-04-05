from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from time import monotonic
from typing import Any

from app.core.config import settings


@dataclass
class CacheEntry:
    created_at_monotonic: float
    payload: dict[str, Any]


class LiveFlightsCache:
    def __init__(self, ttl_seconds: int) -> None:
        self._ttl_seconds = ttl_seconds
        self._lock = Lock()
        self._store: dict[str, CacheEntry] = {}

    def get_fresh(self, key: str) -> dict[str, Any] | None:
        now = monotonic()
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if (now - entry.created_at_monotonic) > self._ttl_seconds:
                return None
            return entry.payload

    def get_any(self, key: str) -> dict[str, Any] | None:
        with self._lock:
            entry = self._store.get(key)
            return None if entry is None else entry.payload

    def set(self, key: str, payload: dict[str, Any]) -> None:
        with self._lock:
            self._store[key] = CacheEntry(created_at_monotonic=monotonic(), payload=payload)


live_flights_cache = LiveFlightsCache(ttl_seconds=settings.live_flights_cache_ttl_seconds)
