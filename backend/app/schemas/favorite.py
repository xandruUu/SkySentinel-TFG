from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class FavoriteCreateRequest(BaseModel):
    icao24: str = Field(min_length=3, max_length=12)
    callsign: str | None = Field(default=None, max_length=16)

    @field_validator("icao24")
    @classmethod
    def normalize_icao24(cls, value: str) -> str:
        return value.strip().lower()


class FavoriteResponse(BaseModel):
    icao24: str
    callsign: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FavoritesListResponse(BaseModel):
    items: list[FavoriteResponse]
