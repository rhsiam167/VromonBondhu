"""
Test setup shared by every test file.

By default the tests do NOT need PostgreSQL: each test gets a brand-new
in-memory SQLite database, filled with the real seed data, and the API is
pointed at it. (JSONB columns automatically fall back to plain JSON on SQLite.)

To run them against real PostgreSQL instead, set TEST_DATABASE_URL to a
SEPARATE, throw-away test database (never your real app database — every test
drops and recreates all tables):

    $env:TEST_DATABASE_URL = "postgresql+psycopg://USER:PASSWORD@localhost:5432/vromon_bondhu_test"
    python -m pytest -q
"""
import os

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
if TEST_DATABASE_URL and not TEST_DATABASE_URL.rstrip("/").endswith("_test"):
    raise RuntimeError("TEST_DATABASE_URL must point to a database whose name ends in '_test' — the tests wipe it.")

# Settings the app needs — set BEFORE the app is imported. Real values come from .env.
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-for-automated-tests-only-0123456789"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers the tables)
from app.database import Base, get_db
from app.main import app
from app.seed import load_reference_data


@pytest.fixture(scope="session")
def test_engine():
    if TEST_DATABASE_URL:
        engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    else:
        engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(test_engine):
    Base.metadata.drop_all(test_engine)  # every test starts from empty tables
    Base.metadata.create_all(test_engine)
    TestSession = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)
    with TestSession() as session:
        load_reference_data(session)
    yield TestSession
    Base.metadata.drop_all(test_engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        db = db_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def fresh_login_limits():
    """Every test starts with no failed-login history."""
    from app.services import rate_limit

    rate_limit.reset_all()
    yield
    rate_limit.reset_all()


def sign_up(client, email: str, name: str = "Test Traveler", password: str = "correct-horse-1"):
    """Create an account and return (details, token)."""
    details = {"name": name, "email": email, "password": password}
    response = client.post("/api/auth/register", json=details)
    assert response.status_code == 201, response.text
    return details, response.json()["accessToken"]


@pytest.fixture
def registered_user(client):
    """A user who has just signed up. Returns (details, token)."""
    return sign_up(client, "traveler@example.com")
