from fastapi import APIRouter, Depends, Query

from app.services.live_flights_cache import live_flights_cache
from app.services.opensky_service import opensky_client
from app.api.deps import get_current_user


router = APIRouter(prefix="/api/flights", tags=["Flights"])


@router.get("/live")
def get_live_flights(
    lamin: float = Query(...),
    lomin: float = Query(...),
    lamax: float = Query(...),
    lomax: float = Query(...),
    user=Depends(get_current_user),
):
    qbbox = live_flights_cache.quantize_bbox(lamin, lomin, lamax, lomax)

    cached = live_flights_cache.get(qbbox)
    if cached:
      return {
          "states": cached.payload.get("states", []),
          "time": cached.payload.get("time"),
          "aircraft_count": len(cached.payload.get("states", []) or []),
          "credits_remaining": cached.meta.get("credits_remaining"),
          "next_refresh_s": cached.meta.get("next_refresh_s"),
          "bbox": qbbox.__dict__,
          "cached": True,
      }

    payload, meta = opensky_client.get_states_bbox(
        qbbox.lamin,
        qbbox.lomin,
        qbbox.lamax,
        qbbox.lomax,
    )

    retry = meta.retry_after_seconds
    next_refresh_s = max(retry or 0, live_flights_cache.ttl_s)

    live_flights_cache.set(
        qbbox,
        payload=payload,
        meta={
            "credits_remaining": meta.credits_remaining,
            "next_refresh_s": next_refresh_s,
            "retry_after_seconds": retry,
        },
    )

    return {
        "states": payload.get("states", []),
        "time": payload.get("time"),
        "aircraft_count": len(payload.get("states", []) or []),
        "credits_remaining": meta.credits_remaining,
        "next_refresh_s": next_refresh_s,
        "bbox": qbbox.__dict__,
        "cached": False,
    }