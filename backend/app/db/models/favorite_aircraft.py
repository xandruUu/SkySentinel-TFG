from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class FavoriteAircraft(Base):
    __tablename__ = "favorite_aircraft"

    favorite_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # OpenSky icao24 es un hex string (normalmente 6 chars), pero guardamos margen.
    icao24: Mapped[str] = mapped_column(String(12), nullable=False)
    callsign: Mapped[str | None] = mapped_column(String(16), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "icao24", name="uq_favorite_user_icao24"),
    )
