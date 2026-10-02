"""Tests for registration, login and protected routes."""


def test_register_returns_token_and_user(client):
    response = client.post("/api/auth/register", json={"name": "Nadia", "email": "Nadia@Example.com", "password": "secret-pass-1"})
    assert response.status_code == 201
    body = response.json()
    assert body["tokenType"] == "bearer"
    assert body["accessToken"]
    assert body["user"]["name"] == "Nadia"
    assert body["user"]["email"] == "nadia@example.com"  # stored lower-case
    assert "password" not in str(body).lower().replace("passwordhash", "")  # never echoed back


def test_password_is_stored_hashed(client, db_session):
    client.post("/api/auth/register", json={"name": "Rafi", "email": "rafi@example.com", "password": "plain-text-pw"})
    from app.models import User

    with db_session() as db:
        user = db.query(User).filter_by(email="rafi@example.com").one()
    assert user.password_hash != "plain-text-pw"
    assert user.password_hash.startswith("$argon2")


def test_duplicate_email_is_rejected(client, registered_user):
    details, _ = registered_user
    response = client.post("/api/auth/register", json={**details, "email": details["email"].upper()})
    assert response.status_code == 409
    assert response.json()["error"]["message"] == "An account with this email already exists. Please log in instead."


def test_short_password_gives_readable_error(client):
    response = client.post("/api/auth/register", json={"name": "A", "email": "a@example.com", "password": "short"})
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert error["details"][0] == {"field": "password", "message": "Password must be at least 8 characters."}


def test_invalid_email_is_rejected(client):
    response = client.post("/api/auth/register", json={"name": "A", "email": "not-an-email", "password": "long-enough-1"})
    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["field"] == "email"


def test_login_with_correct_password(client, registered_user):
    details, _ = registered_user
    response = client.post("/api/auth/login", json={"email": details["email"], "password": details["password"]})
    assert response.status_code == 200
    assert response.json()["user"]["email"] == details["email"]


def test_login_with_wrong_password(client, registered_user):
    details, _ = registered_user
    response = client.post("/api/auth/login", json={"email": details["email"], "password": "wrong-password"})
    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Incorrect email or password."


def test_login_with_unknown_email_gives_same_message(client):
    response = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "whatever-123"})
    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Incorrect email or password."


def test_me_requires_login(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


def test_me_rejects_bad_token(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"


def test_me_with_token(client, registered_user):
    details, token = registered_user
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == details["email"]
    assert set(response.json()) == {"id", "name", "email", "createdAt"}
