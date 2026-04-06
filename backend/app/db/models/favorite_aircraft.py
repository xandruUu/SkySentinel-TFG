from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class FavoriteAircraft(Base):
    __tablename__ = "favorite_aircraft"
    __table_args__ = (
        UniqueConstraint("user_id", "icao24", name="uq_favorite_aircraft_user_icao24"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    icao24: Mapped[str] = mapped_column(
        String(6),
        index=True,
        nullable=False,
    )