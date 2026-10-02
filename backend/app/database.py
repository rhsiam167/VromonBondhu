"""
DATABASE CONNECTION
-------------------
Creates the SQLAlchemy engine and a session factory for PostgreSQL, and the
`get_db` dependency that gives each API request its own database session.
"""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    """Parent class of every database table model (see app/models/)."""


engine = create_engine(get_settings().database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: open a session for one request and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
