from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud.favorite_aircraft import add_favorite, get_favorite, list_favorites, remove_favorite
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.favorite import FavoriteCreateRequest, FavoritesListResponse, FavoriteResponse


router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=FavoritesListResponse, status_code=status.HTTP_200_OK)
def get_my_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoritesListResponse:
    items = list_favorites(db, current_user.user_id)
    return FavoritesListResponse(items=[FavoriteResponse.model_validate(x) for x in items])


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def create_favorite(
    payload: FavoriteCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoriteResponse:
    existing = get_favorite(db, current_user.user_id, payload.icao24)
    if existing is not None:
        return FavoriteResponse.model_validate(existing)

    created = add_favorite(
        db=db,
        user_id=current_user.user_id,
        icao24=payload.icao24,
        callsign=payload.callsign,
    )
    return FavoriteResponse.model_validate(created)


@router.delete("/{icao24}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(
    icao24: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    normalized = icao24.strip().lower()
    existing = get_favorite(db, current_user.user_id, normalized)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No existe ese favorito.")

    remove_favorite(db, current_user.user_id, normalized)
    return None
