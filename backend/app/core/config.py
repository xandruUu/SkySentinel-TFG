from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(alias="DATABASE_URL")
    secret_key: str = Field(alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    opensky_client_id: str = Field(alias="OPENSKY_CLIENT_ID")
    opensky_client_secret: str = Field(alias="OPENSKY_CLIENT_SECRET")
    opensky_token_url: str = Field(alias="OPENSKY_TOKEN_URL")
    opensky_base_url: str = Field(alias="OPENSKY_BASE_URL")
    opensky_http_timeout_seconds: int = Field(
        default=20,
        alias="OPENSKY_HTTP_TIMEOUT_SECONDS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()