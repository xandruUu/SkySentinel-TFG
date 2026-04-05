from fastapi import APIRouter, Depends
from fastapi import HTTPException
from fastapi import Query
from fastapi import status

from app.api.deps import get_current_user
from app.db.models.user import User
from app.schemas.flight import LiveFlightsResponse
from app.services.live_flights_cache import live_flights_cache
from app.services.opensky_service import OpenSkyRequestError
from app.services.opensky_service import opensky_service


router = APIRouter(
    prefix="/api/flights",
    tags=["flights"],
)


def _quantize(value: float, step: float = 0.05) -> float:
    # 0.05 grados ~ 5-6km aprox (varía con latitud), suficiente para cachear sin perder utilidad.
    return round(value / step) * step


@router.get(
    "/live",
    response_model=LiveFlightsResponse,
    status_code=status.HTTP_200_OK,
)
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El valor de lamin debe ser menor que lamax.",
        )

    if lomin >= lomax:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El valor de lomin debe ser menor que lomax.",
        )

    key = (
        f"lamin={_quantize(lamin)}&lomin={_quantize(lomin)}&"
        f"lamax={_quantize(lamax)}&lomax={_quantize(lomax)}&"
        f"extended={int(include_extended_data)}&time={time_seconds or 'now'}"
    )

    cached = live_flights_cache.get(key)
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
    except OpenSkyRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    live_flights_cache.set(key, live_flights_payload)
    return LiveFlightsResponse.model_validate(live_flights_payload)
