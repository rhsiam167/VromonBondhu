"""Unit tests for each planning technique on its own."""
import pytest

from app.services.planner import config
from app.services.planner.constraints import validate_plan
from app.services.planner.generator import create_context
from app.services.planner.ordering import nearest_neighbour, order_day
from app.services.planner.preferences import calculate_weight, interest_weights
from app.services.planner.recommendation import (
    budget_match,
    combine,
    distance_score,
    interest_match,
    preference_match,
    rank_candidates,
    time_match,
)
from app.services.planner.repair import adjustment_messages
from tests.planner.conftest import make_inputs


def test_preference_weights_formula():
    assert [calculate_weight(r, 4) for r in (1, 2, 3, 4)] == [1.0, 0.75, 0.5, 0.25]
    assert interest_weights([]) == {}


def test_score_weights_add_up_to_one():
    assert sum(config.SCORE_WEIGHTS.values()) == pytest.approx(1.0)


def test_score_components():
    weights = {"beach": 1.0, "nature": 0.5}
    assert interest_match({"interests": ["beach"]}, weights) == pytest.approx(1 / 1.5)
    assert interest_match({"interests": ["history"]}, weights) == 0
    assert budget_match(500, 1000) == 1.0
    assert budget_match(2000, 1000) == 0.5
    place = {"durationHours": 2, "bestTime": "morning", "crowdLevel": "high"}
    assert time_match(place, free_minutes=180, travel_minutes=0, period="morning") == 1.0
    assert time_match(place, free_minutes=60, travel_minutes=0, period="morning") == 0.5
    assert time_match(place, free_minutes=180, travel_minutes=0, period="evening") == 0.5
    assert distance_score(5, 5, 25) == 1.0 and distance_score(25, 5, 25) == 0.0 and distance_score(3, 3, 3) == 1.0
    assert preference_match(place, "avoid", "balanced") == pytest.approx((0.2 + 1.0) / 2)
    assert combine({name: 1.0 for name in config.SCORE_WEIGHTS}) == pytest.approx(1.0)


def test_ranking_prefers_the_top_interest(catalog):
    ranked = rank_candidates(create_context(make_inputs(destination="Sylhet", interests=["nature"]), catalog))
    assert "nature" in ranked[0]["attraction"]["interests"]
    assert all(0 <= c["score"] <= 1 for c in ranked)


def test_nearest_neighbour_ordering():
    start = {"lat": 0, "lng": 0}
    far = {"id": "far", "coordinates": {"lat": 0, "lng": 0.3}, "bestTime": "any"}
    near = {"id": "near", "coordinates": {"lat": 0, "lng": 0.1}, "bestTime": "any"}
    middle = {"id": "middle", "coordinates": {"lat": 0, "lng": 0.2}, "bestTime": "any"}
    assert [s["id"] for s in nearest_neighbour([far, near, middle], start)] == ["near", "middle", "far"]
    evening = {"id": "evening", "coordinates": {"lat": 0, "lng": 0.05}, "bestTime": "evening"}
    morning = {"id": "morning", "coordinates": {"lat": 0, "lng": 0.4}, "bestTime": "morning"}
    assert [s["id"] for s in order_day([evening, morning], start)] == ["morning", "evening"]


def test_constraint_checker_reports_violations(catalog):
    ctx = create_context(make_inputs(), catalog)
    plan = {"mode": "teleport", "hotelTier": "budget", "foodTier": "budget", "dayActivities": [[{"id": f"x{i}"} for i in range(9)], [], [], []]}
    days = [
        {"intervals": [(600, 700, "A"), (650, 720, "B")], "activities": [{"name": "A"}], "dayEnd": 690},
        {"intervals": [], "activities": [], "dayEnd": 1260},
        {"intervals": [], "activities": [], "dayEnd": 1260},
    ]
    names = {v["constraint"] for v in validate_plan(plan, days, total=20000, ctx=ctx, cap=15000)}
    assert names == {
        "Budget cap",
        "Trip duration",
        "No overlapping activities",
        "Travel time fits the day",
        "Max activities per day",
        "Chosen transport exists",
    }


def test_transport_switches_merge_into_one_message(catalog):
    ctx = create_context(make_inputs(transport=["flight"]), catalog)
    steps = [
        {"lever": "transport", "fromMode": "flight", "toMode": "car", "selected": False, "costBefore": 30000, "costAfter": 25000, "message": "x"},
        {"lever": "transport", "fromMode": "car", "toMode": "train", "selected": False, "costBefore": 25000, "costAfter": 20000, "message": "y"},
        {"lever": "food", "costBefore": 20000, "costAfter": 18000, "message": "Switched meals from mid-range to budget food options"},
    ]
    assert adjustment_messages(steps, ctx) == [
        "Switched the main journey from Flight to Train (via Car) to fit your budget, although Car & Train weren't among your selected options (saves ৳10,000).",
        "Switched meals from mid-range to budget food options (saves ৳2,000).",
    ]
