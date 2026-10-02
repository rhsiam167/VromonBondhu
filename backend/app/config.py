"""
SETTINGS
--------
All configuration comes from environment variables, normally stored in
backend/.env (copy .env.example to .env and edit it). Secrets such as the
database password and SECRET_KEY live ONLY there — never in the code.
"""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    # postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
    database_url: str
    # Secret used to sign login tokens (JWT)
    secret_key: str
    access_token_expire_minutes: int = 60
    # Comma-separated list of frontend addresses allowed to call the API
    cors_origins: str = "http://localhost:5173"
    # Largest request body accepted, in bytes (a saved trip is usually 20–40 KB)
    max_request_bytes: int = 262_144
    # Login protection: this many failed logins per email + address within the window → wait
    login_max_failures: int = 5
    login_window_seconds: int = 900

    @field_validator("secret_key")
    @classmethod
    def secret_key_must_be_strong(cls, value: str) -> str:
        if value.startswith("change-me") or len(value) < 32:
            raise ValueError(
                "SECRET_KEY in .env must be a long random value (at least 32 characters). "
                'Generate one with: python -c "import secrets; print(secrets.token_urlsafe(48))"'
            )
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Read the settings once and reuse them."""
    return Settings()
