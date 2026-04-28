from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.user import User


def get_user_by_email(
    db_session: Session,
    email: str,
) -> User | None:
    statement = select(User).where(User.email == email)
    query_result = db_session.execute(statement)
    return query_result.scalar_one_or_none()


def get_user_by_id(
    db_session: Session,
    user_id: int,
) -> User | None:
    statement = select(User).where(User.user_id == user_id)
    query_result = db_session.execute(statement)
    return query_result.scalar_one_or_none()


def create_user(
    db_session: Session,
    email: str,
    password_hash: str,
    role: str = "user",
) -> User:
    new_user = User(
        email=email,
        password_hash=password_hash,
        role=role,
    )

    db_session.add(new_user)
    db_session.commit()
    db_session.refresh(new_user)

    return new_user