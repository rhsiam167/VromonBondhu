"""Tests for the hardening: size limits, login rate limit, error format, secrets, CORS."""
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings
from app.main import app


def test_oversized_request_is_rejected_with_413(client):
    huge_notes = "x" * 400_000  # over the default 256 KB limit
    response = client.post("/api/auth/register", content=b'{"name": "' + huge_notes.encode() + b'"}', headers={"Content-Type": "application/json"})
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "request_too_large"


def test_login_is_rate_limited_after_repeated_failures(client, registered_user):
    details, _ = registered_user
    wrong = {"email": details["email"], "password": "wrong-password"}
    for _ in range(5):
        assert client.post("/api/auth/login", json=wrong).status_code == 401
    blocked = client.post("/api/auth/login", json={"email": details["email"], "password": details["password"]})
    assert blocked.status_code == 429
    assert blocked.json()["error"]["message"] == "Too many failed login attempts. Please wait a few minutes and try again."


def test_successful_login_clears_the_failure_count(client, registered_user):
    details, _ = registered_user
    for _ in range(4):
        client.post("/api/auth/login", json={"email": details["email"], "password": "wrong-password"})
    assert client.post("/api/auth/login", json={"email": details["email"], "password": details["password"]}).status_code == 200
    for _ in range(4):
        assert client.post("/api/auth/login", json={"email": details["email"], "password": "wrong-password"}).status_code == 401


def test_unexpected_errors_never_leak_a_stack_trace(client, monkeypatch):
    import app.api.routes.trips as trips_route

    def explode(*args, **kwargs):
        raise RuntimeError("secret internal detail at line 42")

    monkeypatch.setattr(trips_route, "generate_trip", explode)
    body = {
        "from": "Dhaka", "destination": "Sylhet", "days": 2, "nights": 1, "travelers": 1, "budget": 20000,
        "budgetMode": "strict", "interests": ["nature"], "travelStyle": "balanced", "accommodation": "budget", "crowd": "balanced",
    }
    with TestClient(app, raise_server_exceptions=False) as quiet_client:
        from app.database import get_db

        app.dependency_overrides[get_db] = client.app.dependency_overrides[get_db]
        response = quiet_client.post("/api/trips/generate", json=body)
    assert response.status_code == 500
    assert response.json() == {"error": {"code": "server_error", "message": "Something went wrong on our side. Please try again.", "details": []}}
    assert "Traceback" not in response.text and "line 42" not in response.text


@pytest.mark.parametrize("weak", ["change-me-to-a-long-random-string", "short"])
def test_weak_secret_key_is_refused(weak):
    with pytest.raises(ValidationError) as error:
        Settings(database_url="sqlite://", secret_key=weak)
    assert "SECRET_KEY in .env must be a long random value" in str(error.value)


def test_cors_allows_the_frontend_only(client):
    allowed = client.options("/api/health", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    other = client.options("/api/health", headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "GET"})
    assert other.headers.get("access-control-allow-origin") is None
