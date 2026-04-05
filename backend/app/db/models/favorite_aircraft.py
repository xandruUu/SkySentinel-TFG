from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class FavoriteAircraft(Base):
    __tablename__ = "favorite_aircraft"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    icao24: Mapped[str] = mapped_column(String(6), index=True, nullable=False)