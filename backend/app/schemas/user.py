from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.validators import normalize_email


class UserCreateRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)
    username: str | None = Field(default=None, min_length=3, max_length=50)
    first_name: str | None = Field(default=None, min_length=2, max_length=80)
    last_name: str | None = Field(default=None, max_length=120)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized_value = value.strip()

        if not normalized_value:
            return None

        if not normalized_value.replace("_", "").replace("-", "").isalnum():
            raise ValueError("El nombre de usuario solo puede contener letras, números, guiones y guiones bajos.")

        return normalized_value

    @field_validator("first_name", "last_name")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized_value = " ".join(value.strip().split())
        return normalized_value or None


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class UserResponse(BaseModel):
    user_id: int
    email: EmailStr
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}