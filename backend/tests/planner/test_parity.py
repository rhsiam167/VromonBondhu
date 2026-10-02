"""
PARITY: the Python transport, cost and weight helpers must give the same numbers
as the frontend's JavaScript. golden_values.json was produced by running the
frontend code (node backend/scripts/make_golden_values.mjs).
"""
import pytest

from app.services.planner.budget import cheapest_hotel_in_tier, misc_for, rooms_for
from app.services.planner.preferences import interest_weights
from app.services.planner.transport import plan_local_leg, route_options
from app.services.planner.util import js_round
from tests.planner.conftest import GOLDEN


@pytest.mark.parametrize("case", GOLDEN["routes"], ids=lambda c: f"{c['from']}-{c['to']}-{c['travelers']}")
def test_route_options_match_frontend(catalog, case):
    assert route_options(catalog, case["from"], case["to"], case["travelers"]) == case["options"]


@pytest.mark.parametrize("case", GOLDEN["legs"])
def test_local_legs_match_frontend(catalog, case):
    leg = plan_local_leg(catalog, case["from"], case["to"], case["destinationId"], case["travelers"], case["useLocal"])
    assert leg == case["leg"]


@pytest.mark.parametrize("case", GOLDEN["hotels"], ids=lambda c: f"{c['destinationId']}-{c['tier']}")
def test_cheapest_hotel_matches_frontend(catalog, case):
    hotel = cheapest_hotel_in_tier(catalog, case["destinationId"], case["tier"])
    assert (hotel["id"], hotel["pricePerNight"]) == (case["id"], case["pricePerNight"])


def test_rooms_and_misc_match_frontend():
    for case in GOLDEN["roomsFor"]:
        assert rooms_for(case["travelers"]) == case["rooms"]
    for case in GOLDEN["miscFor"]:
        assert misc_for(case["subtotal"]) == pytest.approx(case["misc"])


def test_interest_weights_match_frontend():
    for case in GOLDEN["interestWeights"]:
        assert interest_weights(case["ranked"]) == pytest.approx(case["weights"])


def test_js_round_matches_math_round():
    # JavaScript's Math.round rounds halves up; Python's round() would give 2 and -2.
    assert js_round(2.5) == 3
    assert js_round(-2.5) == -2
    assert js_round(0.49999) == 0
