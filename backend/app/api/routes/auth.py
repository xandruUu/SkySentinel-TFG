from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.crud.user import create_user, get_user_by_email
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreateRequest, UserLoginRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreateRequest, database_session: Session = Depends(get_db)) -> UserResponse:
    user_with_same_email = get_user_by_email(db_session=database_session, email=user_data.email)
    if user_with_same_email is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")

    hashed_user_password = hash_password(user_data.password)
    created_user = create_user(
    db_session=database_session,
    email=user_data.email,
    password_hash=hashed_user_password,
    role="user",
)
    return UserResponse.model_validate(created_user)

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_user(
    user_credentials: UserLoginRequest,
    response: Response,
    database_session: Session = Depends(get_db),
) -> TokenResponse:
    # Evita cache de respuesta con token
    response.headers["Cache-Control"] = "no-store"

    existing_user = get_user_by_email(db_session=database_session, email=user_credentials.email)
    if existing_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    if not verify_password(user_credentials.password, existing_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    access_token = create_access_token(data={"sub": str(existing_user.user_id)})

    return TokenResponse(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_authenticated_user(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(
    _: User = Depends(get_current_user),
    response: Response = None,
) -> None:
    # Para JWT stateless, el “logout real” es client-side (borrar token).
    # Este endpoint define el contrato y permite evolucionar luego a cookies/blacklist.
    if response is not None:
        response.headers["Cache-Control"] = "no-store"
    return None
