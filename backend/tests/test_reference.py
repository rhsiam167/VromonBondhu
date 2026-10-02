"""Tests for the health check and the read-only reference data endpoints."""


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_destinations(client):
    rows = client.get("/api/reference/destinations").json()
    assert len(rows) == 12
    coxs = next(d for d in rows if d["id"] == "coxs-bazar")
    assert coxs["name"] == "Cox's Bazar"
    assert coxs["startingCity"] is False
    starting = sorted(d["name"] for d in rows if d["startingCity"])
    assert starting == sorted(["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Rangpur", "Barishal", "Cumilla", "Mymensingh"])


def test_attractions_all_and_filtered(client):
    assert len(client.get("/api/reference/attractions").json()) == 76
    rows = client.get("/api/reference/attractions", params={"destinationId": "sajek-valley"}).json()
    assert rows and all(r["destinationId"] == "sajek-valley" for r in rows)
    first = rows[0]
    assert set(first["coordinates"]) == {"lat", "lng"}
    assert first["source"] == "sample-estimate"


def test_hotels_and_restaurants(client):
    assert len(client.get("/api/reference/hotels").json()) == 40
    assert len(client.get("/api/reference/restaurants").json()) == 33
    hotel = client.get("/api/reference/hotels", params={"destinationId": "coxs-bazar"}).json()[0]
    assert {"pricePerNight", "priceTier", "imageKey", "source"} <= set(hotel)


def test_transport(client):
    rows = client.get("/api/reference/transport").json()
    assert len(rows) == 12
    sundarbans = next(r for r in rows if r["destinationId"] == "sundarbans")
    assert sundarbans["hasAirport"] is False
    assert sundarbans["localModes"] == [{"mode": "boat", "farePerRide": 800}]


def test_unknown_destination_filter_gives_readable_422(client):
    response = client.get("/api/reference/hotels", params={"destinationId": "atlantis"})
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["message"].startswith("Unknown destination 'atlantis'. Supported destinations:")
    assert error["details"] == [{"field": "destinationId", "message": "'atlantis' is not a supported destination."}]


def test_unknown_route_uses_standard_error_format(client):
    response = client.get("/api/nothing-here")
    assert response.status_code == 404
    assert response.json() == {"error": {"code": "http_error", "message": "Not Found", "details": []}}
