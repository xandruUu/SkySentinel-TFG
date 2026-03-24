from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.core.security import hash_password
from app.core.security import verify_password
from app.crud.user import create_user
from app.crud.user import get_user_by_email
from app.crud.user import get_user_by_username
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreateRequest
from app.schemas.user import UserLoginRequest
from app.schemas.user import UserResponse


router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: UserCreateRequest,
    database_session: Session = Depends(get_db),
) -> UserResponse:
    user_with_same_email = get_user_by_email(
        db_session=database_session,
        email=user_data.email,
    )
    if user_with_same_email is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )

    user_with_same_username = get_user_by_username(
        db_session=database_session,
        username=user_data.username,
    )
    if user_with_same_username is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso",
        )

    hashed_user_password = hash_password(user_data.password)

    created_user = create_user(
        db_session=database_session,
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_user_password,
    )

    return UserResponse.model_validate(created_user)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
def login_user(
    user_credentials: UserLoginRequest,
    database_session: Session = Depends(get_db),
) -> TokenResponse:
    existing_user = get_user_by_email(
        db_session=database_session,
        email=user_credentials.email,
    )

    if existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    is_password_correct = verify_password(
        plain_password=user_credentials.password,
        hashed_password=existing_user.password_hash,
    )
    if not is_password_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    if not existing_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    access_token = create_access_token(
        data={"sub": str(existing_user.id)}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def get_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)