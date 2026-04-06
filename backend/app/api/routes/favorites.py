from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models.favorite_aircraft import FavoriteAircraft
from app.db.models.user import User


router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


def normalize_icao24(icao24: str) -> str:
    normalized_value = (icao24 or "").strip().lower()

    if len(normalized_value) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="icao24 inválido",
        )

    return normalized_value


@router.get("", status_code=status.HTTP_200_OK)
def list_favorites(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
) -> list[dict[str, str]]:
    rows = (
        db.query(FavoriteAircraft)
        .filter(FavoriteAircraft.user_id == current_user.user_id)
        .order_by(FavoriteAircraft.id.desc())
        .all()
    )

    return [{"icao24": row.icao24} for row in rows]


@router.post("/{icao24}", status_code=status.HTTP_200_OK)
def add_favorite(
    icao24: str,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
) -> dict[str, str | bool]:
    normalized_icao24 = normalize_icao24(icao24)

    existing_favorite = (
        db.query(FavoriteAircraft)
        .filter(
            FavoriteAircraft.user_id == current_user.user_id,
            FavoriteAircraft.icao24 == normalized_icao24,
        )
        .first()
    )

    if existing_favorite is not None:
        return {"ok": True, "icao24": normalized_icao24}

    favorite = FavoriteAircraft(
        user_id=current_user.user_id,
        icao24=normalized_icao24,
    )
    db.add(favorite)
    db.commit()

    return {"ok": True, "icao24": normalized_icao24}


@router.delete("/{icao24}", status_code=status.HTTP_200_OK)
def remove_favorite(
    icao24: str,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
) -> dict[str, str | bool]:
    normalized_icao24 = normalize_icao24(icao24)

    favorite = (
        db.query(FavoriteAircraft)
        .filter(
            FavoriteAircraft.user_id == current_user.user_id,
            FavoriteAircraft.icao24 == normalized_icao24,
        )
        .first()
    )

    if favorite is not None:
        db.delete(favorite)
        db.commit()

    return {"ok": True, "icao24": normalized_icao24}