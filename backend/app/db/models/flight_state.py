from datetime import datetime

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class FlightState(Base):
    __tablename__ = "flight_states"

    state_id: Mapped[int] = mapped_column(primary_key=True, index=True)

    aircraft_id: Mapped[int | None] = mapped_column(
        ForeignKey("aircraft.aircraft_id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    icao24: Mapped[str | None] = mapped_column(String(12), index=True)
    callsign: Mapped[str | None] = mapped_column(String(32))
    origin_country: Mapped[str | None] = mapped_column(String(120))

    longitude: Mapped[float | None] = mapped_column(Float)
    latitude: Mapped[float | None] = mapped_column(Float)

    velocity: Mapped[float | None] = mapped_column(Float)
    true_track: Mapped[float | None] = mapped_column(Float)
    vertical_rate: Mapped[float | None] = mapped_column(Float)

    baro_altitude: Mapped[float | None] = mapped_column(Float)
    geo_altitude: Mapped[float | None] = mapped_column(Float)

    on_ground: Mapped[bool | None] = mapped_column(Boolean)

    source_time: Mapped[int | None] = mapped_column(Integer)

    detected_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)