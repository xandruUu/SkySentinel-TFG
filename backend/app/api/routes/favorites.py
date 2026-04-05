from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.favorite_aircraft import FavoriteAircraft
from app.api.deps import get_current_user


router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


@router.get("")
def list_favorites(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    rows = (
        db.query(FavoriteAircraft)
        .filter(FavoriteAircraft.user_id == user.id)
        .order_by(FavoriteAircraft.id.desc())
        .all()
    )
    return [{"icao24": row.icao24} for row in rows]


@router.post("/{icao24}")
def add_favorite(
    icao24: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    icao24 = (icao24 or "").lower().strip()

    if len(icao24) != 6:
        raise HTTPException(status_code=400, detail="icao24 inválido")

    existing_row = (
        db.query(FavoriteAircraft)
        .filter(
            FavoriteAircraft.user_id == user.id,
            FavoriteAircraft.icao24 == icao24,
        )
        .first()
    )

    if existing_row:
        return {"ok": True, "icao24": icao24}

    favorite = FavoriteAircraft(user_id=user.id, icao24=icao24)
    db.add(favorite)
    db.commit()

    return {"ok": True, "icao24": icao24}


@router.delete("/{icao24}")
def remove_favorite(
    icao24: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    icao24 = (icao24 or "").lower().strip()

    row = (
        db.query(FavoriteAircraft)
        .filter(
            FavoriteAircraft.user_id == user.id,
            FavoriteAircraft.icao24 == icao24,
        )
        .first()
    )

    if not row:
        return {"ok": True, "icao24": icao24}

    db.delete(row)
    db.commit()

    return {"ok": True, "icao24": icao24}