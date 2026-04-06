from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models.favorite_aircraft import FavoriteAircraft


router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


def get_current_user_pk(user) -> int:
    candidate = getattr(user, "id", None)

    if candidate is None:
        candidate = getattr(user, "user_id", None)

    if candidate is None:
        raise HTTPException(
            status_code=500,
            detail="El usuario autenticado no expone un identificador válido.",
        )

    return int(candidate)


@router.get("")
def list_favorites(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    current_user_id = get_current_user_pk(user)

    rows = (
        db.query(FavoriteAircraft)
        .filter(FavoriteAircraft.user_id == current_user_id)
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
    current_user_id = get_current_user_pk(user)

    normalized_icao24 = (icao24 or "").strip().lower()

    if len(normalized_icao24) != 6:
        raise HTTPException(status_code=400, detail="icao24 inválido")

    existing_favorite = (
        db.query(FavoriteAircraft)
        .filter(
            FavoriteAircraft.user_id == current_user_id,
            FavoriteAircraft.icao24 == normalized_icao24,
        )
        .first()
    )

    if existing_favorite:
        return {"ok": True, "icao24": normalized_icao24}

    favorite = FavoriteAircraft(
        user_id=current_user_id,
        icao24=normalized_icao24,
    )
    db.add(favorite)
    db.commit()

    return {"ok": True, "icao24": normalized_icao24}


@router.delete("/{icao24}")
def remove_favorite(
    icao24: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    current_user_id = get_current_user_pk(user)

    normalized_icao24 = (icao24 or "").strip().lower()

    favorite = (
        db.query(FavoriteAircraft)
        .filter(
            FavoriteAircraft.user_id == current_user_id,
            FavoriteAircraft.icao24 == normalized_icao24,
        )
        .first()
    )

    if favorite is not None:
        db.delete(favorite)
        db.commit()

    return {"ok": True, "icao24": normalized_icao24}