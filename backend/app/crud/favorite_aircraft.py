from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models.favorite_aircraft import FavoriteAircraft


def list_favorites(db: Session, user_id: int) -> list[FavoriteAircraft]:
    stmt = select(FavoriteAircraft).where(FavoriteAircraft.user_id == user_id)
    return list(db.scalars(stmt).all())


def get_favorite(db: Session, user_id: int, icao24: str) -> FavoriteAircraft | None:
    stmt = select(FavoriteAircraft).where(
        FavoriteAircraft.user_id == user_id,
        FavoriteAircraft.icao24 == icao24,
    )
    return db.scalars(stmt).first()


def add_favorite(
    db: Session,
    user_id: int,
    icao24: str,
    callsign: str | None,
) -> FavoriteAircraft:
    fav = FavoriteAircraft(user_id=user_id, icao24=icao24, callsign=callsign)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


def remove_favorite(db: Session, user_id: int, icao24: str) -> None:
    stmt = delete(FavoriteAircraft).where(
        FavoriteAircraft.user_id == user_id,
        FavoriteAircraft.icao24 == icao24,
    )
    db.execute(stmt)
    db.commit()
