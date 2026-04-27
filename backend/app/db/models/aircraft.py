from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Aircraft(Base):
    __tablename__ = "aircraft"

    aircraft_id: Mapped[int] = mapped_column(primary_key=True, index=True)

    icao24: Mapped[str] = mapped_column(String(12), unique=True, index=True, nullable=False)
    callsign: Mapped[str | None] = mapped_column(String(32), nullable=True)
    origin_country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    registration: Mapped[str | None] = mapped_column(String(32), nullable=True)
    aircraft_model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    aircraft_type_id: Mapped[int | None] = mapped_column(nullable=True)
    operator_company: Mapped[str | None] = mapped_column(String(80), nullable=True)

    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )