import math
import time
import threading
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

import os


@dataclass(frozen=True)
class QuantizedBBox:
    lamin: float
    lomin: float
    lamax: float
    lomax: float


@dataclass
class CacheEntry:
    created_at: float
    payload: dict
    meta: dict


class LiveFlightsCache:
    """
    Caché TTL para respuestas de OpenSky /states/all (o adaptador equivalente).
    Key = bbox cuantizada + (opcional) flags relevantes.

    Diseñado como "proxy con caché de resultados", patrón Proxy/caching. citeturn10search1
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()  # lock para integridad del dict citeturn6search15
        self._cache: Dict[Tuple[QuantizedBBox, str], CacheEntry] = {}

        self.ttl_s = int(os.environ.get("OPENSKY_CACHE_TTL_SECONDS", "15"))  # citeturn7search0
        self.quant_step = float(os.environ.get("OPENSKY_BBOX_QUANT_STEP_DEG", "0.10"))

        # Modo demo: fuerza área fija si se activa
        self.lock_to_madrid = os.environ.get("OPENSKY_LOCK_TO_MADRID", "0") == "1"

    def _quantize_down(self, x: float) -> float:
        return math.floor(x / self.quant_step) * self.quant_step

    def _quantize_up(self, x: float) -> float:
        return math.ceil(x / self.quant_step) * self.quant_step

    def quantize_bbox(self, lamin: float, lomin: float, lamax: float, lomax: float) -> QuantizedBBox:
        if self.lock_to_madrid:
            lamin, lomin, lamax, lomax = 40.0, -4.5, 41.5, -2.5

        q = QuantizedBBox(
            lamin=round(self._quantize_down(lamin), 4),
            lomin=round(self._quantize_down(lomin), 4),
            lamax=round(self._quantize_up(lamax), 4),
            lomax=round(self._quantize_up(lomax), 4),
        )
        return q

    def get(self, qbbox: QuantizedBBox, key_suffix: str = "") -> Optional[CacheEntry]:
        now = time.time()
        k = (qbbox, key_suffix)

        with self._lock:
            entry = self._cache.get(k)
            if not entry:
                return None
            if now - entry.created_at > self.ttl_s:
                del self._cache[k]
                return None
            return entry

    def set(self, qbbox: QuantizedBBox, payload: dict, meta: dict, key_suffix: str = "") -> None:
        k = (qbbox, key_suffix)
        with self._lock:
          self._cache[k] = CacheEntry(created_at=time.time(), payload=payload, meta=meta)


live_flights_cache = LiveFlightsCache()
