from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.models.user import User
from app.schemas.flight import LiveFlightsResponse
from app.services.live_flights_cache import live_flights_cache
from app.services.opensky_service import OpenSkyRequestError, opensky_service


router = APIRouter(prefix="/api/flights", tags=["flights"])


def _quantize(value: float) -> float:
    step = settings.live_flights_bbox_quantize_step
    return round(value / step) * step


@router.get("/live", response_model=LiveFlightsResponse, status_code=status.HTTP_200_OK)
def get_live_flights(
    _current_user: User = Depends(get_current_user),
    lamin: float = Query(default=40.0, ge=-90.0, le=90.0),
    lomin: float = Query(default=-4.5, ge=-180.0, le=180.0),
    lamax: float = Query(default=41.5, ge=-90.0, le=90.0),
    lomax: float = Query(default=-2.5, ge=-180.0, le=180.0),
    include_extended_data: bool = Query(default=True),
    time_seconds: int | None = Query(default=None, ge=0),
) -> LiveFlightsResponse:
    if lamin >= lamax:
        raise HTTPException(status_code=400, detail="El valor de lamin debe ser menor que lamax.")
    if lomin >= lomax:
        raise HTTPException(status_code=400, detail="El valor de lomin debe ser menor que lomax.")

    key = (
        f"lamin={_quantize(lamin)}&lomin={_quantize(lomin)}&"
        f"lamax={_quantize(lamax)}&lomax={_quantize(lomax)}&"
        f"extended={int(include_extended_data)}&time={time_seconds or 'now'}"
    )

    cached = live_flights_cache.get_fresh(key)
    if cached is not None:
        return LiveFlightsResponse.model_validate(cached)

    try:
        live_flights_payload = opensky_service.get_live_states(
            lamin=lamin,
            lomin=lomin,
            lamax=lamax,
            lomax=lomax,
            include_extended_data=include_extended_data,
            time_seconds=time_seconds,
        )
        live_flights_cache.set(key, live_flights_payload)
        return LiveFlightsResponse.model_validate(live_flights_payload)

    except OpenSkyRequestError as exc:
        # no quemes créditos insistiendo: devuelve stale si existe
        stale = live_flights_cache.get_any(key)
        if stale is not None:
            return LiveFlightsResponse.model_validate(stale)

        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
