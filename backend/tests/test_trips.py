"""Tests for planning (guests allowed) and saving trips (owner only)."""
import pytest

from app.models import SavedTrip
from tests.conftest import sign_up

PLAN = {
    "from": "Dhaka",
    "destination": "Cox's Bazar",
    "days": 4,
    "nights": 3,
    "travelers": 2,
    "startDate": "",
    "budget": 15000,
    "budgetMode": "strict",
    "budgetCovers": ["transportation", "accommodation", "food", "activities"],
    "interests": ["beach", "nature", "food", "photography"],
    "travelStyle": "relaxed",
    "transport": ["bus", "train"],
    "food": ["local-food"],
    "accommodation": "mid-range",
    "crowd": "balanced",
    "notes": "",
}


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def generate(client, **changes):
    return client.post("/api/trips/generate", json={**PLAN, **changes})


# ------------------------------ Generate ------------------------------


def test_guest_can_generate_and_nothing_is_saved(client, db_session):
    response = generate(client)
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"status", "trip", "budgetReport", "adjustmentsMade"}
    assert body["status"] == "ok"
    assert body["budgetReport"]["totalCost"] <= 15000
    trip = body["trip"]
    assert trip["title"] == "Dhaka to Cox's Bazar"
    assert trip["transport"]["outbound"]["mode"] == "train"
    assert set(trip["explanation"]) == {"topScoredPlaces", "constraintChecks", "repairSteps"}
    with db_session() as db:
        assert db.query(SavedTrip).count() == 0


def test_generate_infeasible(client):
    body = generate(client, destination="Sundarbans", days=3, nights=2, travelers=3, budget=5000, transport=[]).json()
    assert body["status"] == "infeasible"
    assert body["trip"] is None
    report = body["budgetReport"]
    assert report["minimumCost"] > 5000 and report["shortfall"] == report["minimumCost"] - 5000


def test_unsupported_starting_city_is_a_readable_422(client):
    response = generate(client, **{"from": "Sajek Valley"})
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["message"].startswith("from: Please choose one of the supported starting cities (Barishal, Chattogram, Cumilla")
    assert error["details"] == [{"field": "from", "message": "Please choose one of the supported starting cities."}]


def test_unknown_destination_is_a_readable_422(client):
    response = generate(client, destination="Atlantis")
    assert response.status_code == 422
    assert response.json()["error"]["details"] == [{"field": "destination", "message": "Please choose a destination from the list."}]


@pytest.mark.parametrize(
    "changes,field,message_start",
    [
        ({"interests": ["skydiving"]}, "interests", "Unknown interest 'skydiving'. Choose from:"),
        ({"interests": []}, "interests", "List should have at least 1 item"),
        ({"travelStyle": "lazy"}, "travelStyle", "Unknown travel style 'lazy'."),
        ({"transport": ["rocket"]}, "transport", "Unknown transport option 'rocket'."),
        ({"budgetMode": "loose"}, "budgetMode", "Input should be 'strict' or 'flexible'"),
        ({"budget": 500}, "budget", "Budget must be at least ৳2,000."),
        ({"days": 40}, "days", "Input should be less than or equal to 14"),
        ({"startDate": "31/12/2026"}, "startDate", "Start date must look like 2026-12-31."),
        ({"nights": 9, "days": 4}, None, "Nights can’t be more than days."),
    ],
)
def test_every_field_is_validated(client, changes, field, message_start):
    response = generate(client, **changes)
    assert response.status_code == 422
    detail = response.json()["error"]["details"][0]
    assert detail["field"] == field
    assert detail["message"].startswith(message_start)


def test_missing_field_is_reported(client):
    body = {k: v for k, v in PLAN.items() if k != "destination"}
    response = client.post("/api/trips/generate", json=body)
    assert response.status_code == 422
    assert response.json()["error"]["details"][0] == {"field": "destination", "message": "This field is required."}


# ------------------------------ Save / list / get / delete ------------------------------


def generated_trip(client) -> dict:
    return generate(client).json()["trip"]


def test_saving_needs_login(client):
    response = client.post("/api/trips", json={"trip": generated_trip(client)})
    assert response.status_code == 401


def test_save_list_get_delete(client, registered_user):
    _, token = registered_user
    trip = generated_trip(client)

    saved = client.post("/api/trips", json={"trip": trip}, headers=auth(token))
    assert saved.status_code == 201
    saved_body = saved.json()
    assert saved_body["title"] == "Dhaka to Cox's Bazar"
    assert saved_body["destinationId"] == "coxs-bazar"
    assert saved_body["estimatedCost"] == trip["budget"]["estimatedCost"]
    assert saved_body["trip"] == trip  # stored exactly as sent (a snapshot)
    assert saved_body["inputs"] == trip["inputs"]
    trip_id = saved_body["id"]

    listed = client.get("/api/trips", headers=auth(token)).json()
    assert [t["id"] for t in listed] == [trip_id]

    one = client.get(f"/api/trips/{trip_id}", headers=auth(token))
    assert one.status_code == 200 and one.json()["trip"]["itinerary"] == trip["itinerary"]

    assert client.delete(f"/api/trips/{trip_id}", headers=auth(token)).status_code == 204
    assert client.get(f"/api/trips/{trip_id}", headers=auth(token)).status_code == 404
    assert client.get("/api/trips", headers=auth(token)).json() == []


def test_users_cannot_see_or_delete_each_others_trips(client):
    _, alice = sign_up(client, "alice@example.com", "Alice")
    _, bob = sign_up(client, "bob@example.com", "Bob")
    alice_trip = client.post("/api/trips", json={"trip": generated_trip(client)}, headers=auth(alice)).json()["id"]

    # Bob can't list, read or delete Alice's trip — it looks exactly like a missing one.
    assert client.get("/api/trips", headers=auth(bob)).json() == []
    read = client.get(f"/api/trips/{alice_trip}", headers=auth(bob))
    assert read.status_code == 404
    assert read.json()["error"]["message"] == "Trip not found."
    assert client.delete(f"/api/trips/{alice_trip}", headers=auth(bob)).status_code == 404

    # Alice still has it.
    assert client.get(f"/api/trips/{alice_trip}", headers=auth(alice)).status_code == 200


def test_planned_then_saved_trips(client, registered_user):
    _, token = registered_user
    trip = generated_trip(client)

    # Planning while logged in stores the trip as "planned" (saved = false).
    planned = client.post("/api/trips", json={"trip": trip, "saved": False}, headers=auth(token))
    assert planned.status_code == 201
    assert planned.json()["saved"] is False
    trip_id = planned.json()["id"]

    # Storing the same generated trip again doesn't create a copy.
    again = client.post("/api/trips", json={"trip": trip, "saved": False}, headers=auth(token))
    assert again.status_code == 200 and again.json()["id"] == trip_id
    assert len(client.get("/api/trips", headers=auth(token)).json()) == 1

    # Filters: it is planned, not saved.
    assert [t["id"] for t in client.get("/api/trips?saved=false", headers=auth(token)).json()] == [trip_id]
    assert client.get("/api/trips?saved=true", headers=auth(token)).json() == []

    # Save Trip on the same trip marks the existing record as saved.
    saved = client.post("/api/trips", json={"trip": trip}, headers=auth(token))
    assert saved.status_code == 200 and saved.json()["id"] == trip_id and saved.json()["saved"] is True
    assert [t["id"] for t in client.get("/api/trips?saved=true", headers=auth(token)).json()] == [trip_id]

    # PATCH can un-save and save again.
    assert client.patch(f"/api/trips/{trip_id}", json={"saved": False}, headers=auth(token)).json()["saved"] is False
    assert client.patch(f"/api/trips/{trip_id}", json={"saved": True}, headers=auth(token)).json()["saved"] is True


def test_mark_saved_trip_completed_and_back(client, registered_user):
    _, token = registered_user
    trip = generated_trip(client)
    trip_id = client.post("/api/trips", json={"trip": trip, "saved": False}, headers=auth(token)).json()["id"]

    # A planned (unsaved) trip can't be completed.
    refused = client.patch(f"/api/trips/{trip_id}", json={"completed": True}, headers=auth(token))
    assert refused.status_code == 422
    assert refused.json()["error"]["message"] == "Save the trip before marking it as completed."

    saved = client.patch(f"/api/trips/{trip_id}", json={"saved": True}, headers=auth(token)).json()
    assert saved["completed"] is False and saved["completedAt"] is None

    done = client.patch(f"/api/trips/{trip_id}", json={"completed": True}, headers=auth(token)).json()
    assert done["completed"] is True and done["completedAt"] and done["saved"] is True
    # Marking it again keeps the original completion time; the listing shows it too.
    assert client.patch(f"/api/trips/{trip_id}", json={"completed": True}, headers=auth(token)).json()["completedAt"] == done["completedAt"]
    assert client.get("/api/trips", headers=auth(token)).json()[0]["completed"] is True

    back = client.patch(f"/api/trips/{trip_id}", json={"completed": False}, headers=auth(token)).json()
    assert back["completed"] is False and back["completedAt"] is None

    # Un-saving a completed trip also clears "completed".
    client.patch(f"/api/trips/{trip_id}", json={"completed": True}, headers=auth(token))
    unsaved = client.patch(f"/api/trips/{trip_id}", json={"saved": False}, headers=auth(token)).json()
    assert unsaved["saved"] is False and unsaved["completed"] is False

    # An empty PATCH is a clear validation error.
    assert client.patch(f"/api/trips/{trip_id}", json={}, headers=auth(token)).status_code == 422


def test_patch_is_owner_only(client):
    _, alice = sign_up(client, "alice2@example.com", "Alice")
    _, bob = sign_up(client, "bob2@example.com", "Bob")
    trip_id = client.post("/api/trips", json={"trip": generated_trip(client), "saved": False}, headers=auth(alice)).json()["id"]
    assert client.patch(f"/api/trips/{trip_id}", json={"saved": True}, headers=auth(bob)).status_code == 404
    assert client.get(f"/api/trips/{trip_id}", headers=auth(alice)).json()["saved"] is False


def test_saving_rejects_something_that_is_not_a_trip(client, registered_user):
    _, token = registered_user
    response = client.post("/api/trips", json={"trip": {"title": "hello"}}, headers=auth(token))
    assert response.status_code == 422
    assert "doesn't look like a generated trip" in response.json()["error"]["message"]


def test_bad_trip_id_is_readable(client, registered_user):
    _, token = registered_user
    response = client.get("/api/trips/not-a-uuid", headers=auth(token))
    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["field"] == "trip_id"
