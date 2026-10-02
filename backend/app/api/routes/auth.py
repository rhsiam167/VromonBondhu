"""
ACCOUNTS
  POST /api/auth/register – create an account, returns a login token
  POST /api/auth/login    – log in, returns a login token (rate-limited, see services/rate_limit.py)
  GET  /api/auth/me       – the logged-in user (needs the token)
"""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.errors import ApiError
from app.database import get_db
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services import rate_limit
from app.services.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_for(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(str(user.id)), user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise ApiError(409, "email_taken", "An account with this email already exists. Please log in instead.")
    user = User(name=body.name, email=email, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_for(user)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    email = body.email.lower()
    client = request.client.host if request.client else "unknown"
    if rate_limit.is_blocked(email, client):
        raise ApiError(429, "too_many_attempts", "Too many failed login attempts. Please wait a few minutes and try again.")

    user = db.scalar(select(User).where(User.email == email))
    # Same message whether the email or the password is wrong, so attackers
    # can't use it to discover which emails have accounts.
    if user is None or not verify_password(body.password, user.password_hash):
        rate_limit.record_failure(email, client)
        raise ApiError(401, "invalid_credentials", "Incorrect email or password.")
    rate_limit.clear(email, client)
    return _token_for(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)
