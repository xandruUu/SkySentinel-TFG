from datetime import datetime
from datetime import timedelta
from datetime import timezone
from typing import Any

from jose import JWTError
from jose import jwt
from pwdlib import PasswordHash

from app.core.config import settings


password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hasher.verify(plain_password, hashed_password)


def create_access_token(data: dict[str, Any]) -> str:
    payload_to_encode = data.copy()
    expiration_datetime = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload_to_encode["exp"] = expiration_datetime

    encoded_jwt = jwt.encode(
        payload_to_encode,
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        decoded_payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        return decoded_payload
    except JWTError:
        return None