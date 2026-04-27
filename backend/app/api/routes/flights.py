from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models.aircraft import Aircraft
from app.db.models.flight_state import FlightState
from app.services.live_flights_cache import live_flights_cache
from app.services.opensky_service import opensky_client


router = APIRouter(prefix="/api/flights", tags=["Flights"])


def normalize_icao24(value: str | None) -> str | None:
    if not value:
        return None

    return value.strip().lower()


def normalize_callsign(value: str | None) -> str | None:
    if not value:
        return None

    cleaned_value = value.strip()
    return cleaned_value or None


def get_or_create_aircraft(
    db: Session,
    icao24: str,
    callsign: str | None,
    origin_country: str | None,
) -> Aircraft:
    statement = select(Aircraft).where(Aircraft.icao24 == icao24)
    existing_aircraft = db.execute(statement).scalar_one_or_none()

    if existing_aircraft is not None:
        if callsign and existing_aircraft.callsign != callsign:
            existing_aircraft.callsign = callsign

        if origin_country and existing_aircraft.origin_country != origin_country:
            existing_aircraft.origin_country = origin_country

        return existing_aircraft

    new_aircraft = Aircraft(
        icao24=icao24,
        callsign=callsign,
        origin_country=origin_country,
    )

    db.add(new_aircraft)
    db.flush()

    return new_aircraft


def state_to_response_item(state: list, aircraft: Aircraft | None) -> dict:
    return {
        "icao24": normalize_icao24(state[0] if len(state) > 0 else None),
        "callsign": normalize_callsign(state[1] if len(state) > 1 else None),
        "origin_country": state[2] if len(state) > 2 else None,
        "time_position": state[3] if len(state) > 3 else None,
        "last_contact": state[4] if len(state) > 4 else None,
        "longitude": state[5] if len(state) > 5 else None,
        "latitude": state[6] if len(state) > 6 else None,
        "baro_altitude": state[7] if len(state) > 7 else None,
        "on_ground": state[8] if len(state) > 8 else None,
        "velocity": state[9] if len(state) > 9 else None,
        "true_track": state[10] if len(state) > 10 else None,
        "vertical_rate": state[11] if len(state) > 11 else None,
        "geo_altitude": state[13] if len(state) > 13 else None,
        "aircraft_id": aircraft.aircraft_id if aircraft else None,
        "registration": aircraft.registration if aircraft else None,
        "model": aircraft.aircraft_model if aircraft else None,
        "aircraft_model": aircraft.aircraft_model if aircraft else None,
        "operator_company": aircraft.operator_company if aircraft else None,
    }


def save_flight_states(
    db: Session,
    states: list,
    source_time: int | None,
) -> list[dict]:
    response_states: list[dict] = []

    for state in states:
        if not isinstance(state, list):
            continue

        try:
            icao24 = normalize_icao24(state[0])
            if not icao24:
                continue

            callsign = normalize_callsign(state[1])
            origin_country = state[2]

            aircraft = get_or_create_aircraft(
                db=db,
                icao24=icao24,
                callsign=callsign,
                origin_country=origin_country,
            )

            flight_state = FlightState(
                aircraft_id=aircraft.aircraft_id,
                icao24=icao24,
                callsign=callsign,
                origin_country=origin_country,
                longitude=state[5],
                latitude=state[6],
                baro_altitude=state[7],
                on_ground=state[8],
                velocity=state[9],
                true_track=state[10],
                vertical_rate=state[11],
                geo_altitude=state[13],
                source_time=source_time,
            )

            db.add(flight_state)

            response_states.append(
                state_to_response_item(
                    state=state,
                    aircraft=aircraft,
                )
            )

        except (IndexError, TypeError):
            continue

    db.commit()

    return response_states


@router.get("/live")
def get_live_flights(
    lamin: float = Query(...),
    lomin: float = Query(...),
    lamax: float = Query(...),
    lomax: float = Query(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
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

    raw_states = payload.get("states", []) or []
    source_time = payload.get("time")

    enriched_states = save_flight_states(
        db=db,
        states=raw_states,
        source_time=source_time,
    )

    retry = meta.retry_after_seconds
    next_refresh_s = max(retry or 0, live_flights_cache.ttl_s)

    enriched_payload = {
        "states": enriched_states,
        "time": source_time,
    }

    live_flights_cache.set(
        qbbox,
        payload=enriched_payload,
        meta={
            "credits_remaining": meta.credits_remaining,
            "next_refresh_s": next_refresh_s,
            "retry_after_seconds": retry,
        },
    )

    return {
        "states": enriched_states,
        "time": source_time,
        "aircraft_count": len(enriched_states),
        "credits_remaining": meta.credits_remaining,
        "next_refresh_s": next_refresh_s,
        "bbox": qbbox.__dict__,
        "cached": False,
    }