"""
Shared route dependencies.
`get_current_user` protects a route: it reads the "Authorization: Bearer <token>"
header and returns the logged-in User, or answers 401 if there is no valid token.
"""
import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.errors import ApiError
from app.database import get_db
from app.models import User
from app.services.security import read_access_token

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    not_logged_in = ApiError(401, "not_authenticated", "Please log in to continue.")
    if credentials is None:
        raise not_logged_in
    user_id = read_access_token(credentials.credentials)
    if user_id is None:
        raise ApiError(401, "invalid_token", "Your session has expired or is invalid. Please log in again.")
    try:
        user = db.get(User, uuid.UUID(user_id))
    except ValueError:
        user = None
    if user is None:
        raise not_logged_in
    return user
