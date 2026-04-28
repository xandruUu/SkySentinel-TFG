from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class AircraftAlertCreateRequest(BaseModel):
    aircraft_model: str | None = Field(default=None, max_length=64)
    operator_company: str | None = Field(default=None, max_length=80)

    @field_validator("aircraft_model", "operator_company")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized_value = value.strip().upper()
        return normalized_value or None


class AircraftAlertResponse(BaseModel):
    alert_id: int
    user_id: int
    aircraft_model: str | None = None
    operator_company: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AircraftAlertsListResponse(BaseModel):
    items: list[AircraftAlertResponse]