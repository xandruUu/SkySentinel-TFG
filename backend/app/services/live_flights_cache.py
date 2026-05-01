import math
import os
import threading
import time
from dataclasses import dataclass
from typing import Dict, Optional, Tuple


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
    Caché TTL en memoria para respuestas recientes de vuelos en directo.

    La caché reduce llamadas repetidas a OpenSky mediante dos mecanismos:
    - TTL: una respuesta solo es válida durante un número limitado de segundos.
    - Cuantización del bounding box: zonas muy parecidas reutilizan la misma clave.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._cache: Dict[Tuple[QuantizedBBox, str], CacheEntry] = {}

        self.ttl_s = int(os.environ.get("OPENSKY_CACHE_TTL_SECONDS", "15"))
        self.quant_step = float(os.environ.get("OPENSKY_BBOX_QUANT_STEP_DEG", "0.10"))

        # Modo demo: fuerza área fija si se activa desde variables de entorno.
        self.lock_to_madrid = os.environ.get("OPENSKY_LOCK_TO_MADRID", "0") == "1"

    def _quantize_down(self, value: float) -> float:
        return math.floor(value / self.quant_step) * self.quant_step

    def _quantize_up(self, value: float) -> float:
        return math.ceil(value / self.quant_step) * self.quant_step

    def quantize_bbox(
        self,
        lamin: float,
        lomin: float,
        lamax: float,
        lomax: float,
    ) -> QuantizedBBox:
        if self.lock_to_madrid:
            lamin, lomin, lamax, lomax = 40.0, -4.5, 41.5, -2.5

        return QuantizedBBox(
            lamin=round(self._quantize_down(lamin), 4),
            lomin=round(self._quantize_down(lomin), 4),
            lamax=round(self._quantize_up(lamax), 4),
            lomax=round(self._quantize_up(lomax), 4),
        )

    def get(self, qbbox: QuantizedBBox, key_suffix: str = "") -> Optional[CacheEntry]:
        current_time = time.time()
        cache_key = (qbbox, key_suffix)

        with self._lock:
            entry = self._cache.get(cache_key)

            if entry is None:
                return None

            if current_time - entry.created_at > self.ttl_s:
                del self._cache[cache_key]
                return None

            return entry

    def set(
        self,
        qbbox: QuantizedBBox,
        payload: dict,
        meta: dict,
        key_suffix: str = "",
    ) -> None:
        cache_key = (qbbox, key_suffix)

        with self._lock:
            self._cache[cache_key] = CacheEntry(
                created_at=time.time(),
                payload=payload,
                meta=meta,
            )


live_flights_cache = LiveFlightsCache()