import re


USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")


def normalize_email(email: str) -> str:
    normalized_email = email.strip().lower()
    return normalized_email


def normalize_username(username: str) -> str:
    normalized_username = username.strip()
    return normalized_username


def is_valid_username(username: str) -> bool:
    return USERNAME_PATTERN.fullmatch(username) is not None