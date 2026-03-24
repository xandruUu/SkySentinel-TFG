from pydantic import BaseModel
from pydantic import EmailStr
from pydantic import Field
from pydantic import field_validator

from app.utils.validators import is_valid_username
from app.utils.validators import normalize_email
from app.utils.validators import normalize_username


class UserCreateRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        normalized_username = normalize_username(value)

        if not is_valid_username(normalized_username):
            raise ValueError(
                "El nombre de usuario solo puede contener letras, números, guion y guion bajo."
            )

        return normalized_username

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    is_verified: bool

    model_config = {"from_attributes": True}