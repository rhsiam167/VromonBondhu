"""Request and response shapes for registration, login and "who am I"."""
import uuid
from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import CamelModel


class RegisterRequest(CamelModel):
    name: str = Field(max_length=100)
    email: EmailStr
    password: str = Field(max_length=128)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Please enter your name.")
        return value

    @field_validator("password")
    @classmethod
    def password_long_enough(cls, value: str) -> str:
        # Same rule as the frontend's registration form.
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return value


class LoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(CamelModel):
    id: uuid.UUID
    name: str
    email: str
    created_at: datetime


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
