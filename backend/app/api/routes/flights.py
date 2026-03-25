from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Query
from fastapi import status

from app.schemas.flight import LiveFlightsResponse
from app.services.opensky_service import OpenSkyRequestError
from app.services.opensky_service import opensky_service


router = APIRouter(
    prefix="/api/flights",
    tags=["flights"],
)


@router.get(
    "/live",
    response_model=LiveFlightsResponse,
    status_code=status.HTTP_200_OK,
)
def get_live_flights(
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

    return LiveFlightsResponse.model_validate(live_flights_payload)