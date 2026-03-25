from pydantic import BaseModel
from pydantic import Field


class AircraftStateResponse(BaseModel):
    icao24: str | None = None
    callsign: str | None = None
    origin_country: str | None = None
    time_position: int | None = None
    last_contact: int | None = None
    longitude: float | None = None
    latitude: float | None = None
    baro_altitude: float | None = None
    on_ground: bool | None = None
    velocity: float | None = None
    true_track: float | None = None
    vertical_rate: float | None = None
    geo_altitude: float | None = None
    squawk: str | None = None
    spi: bool | None = None
    position_source: int | None = None
    category: int | None = None


class LiveFlightsResponse(BaseModel):
    source_time: int | None = None
    credits_remaining: int | None = None
    aircraft_count: int = Field(ge=0)
    states: list[AircraftStateResponse]