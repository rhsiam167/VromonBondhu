"""
ACCEPTANCE TESTS for the planning engine (run on the planner alone —
no database, no server).
"""
import itertools
import json

import pytest

from app.services.planner import PlannerInputError, generate_trip
from app.services.planner.config import FLEXIBLE_LIMIT
from tests.planner.conftest import GOLDEN, make_inputs

# A spread of requests: destinations, budgets, paces, stays and transport picks.
MATRIX = list(
    itertools.product(
        [("Dhaka", "Cox's Bazar"), ("Dhaka", "Sylhet"), ("Chattogram", "Sajek Valley"), ("Khulna", "Sundarbans"), ("Rajshahi", "Barishal")],
        [6000, 12000, 20000, 45000],
        ["relaxed", "packed"],
        [["bus"], ["flight", "car"], []],
    )
)


def activities_per_day(trip: dict) -> list[int]:
    return [sum(1 for item in day["items"] if item.get("imageGroup") == "attractions") for day in trip["itinerary"]]


# ---------------------------- Budget guarantees ----------------------------


@pytest.mark.parametrize("route,budget,style,transport", MATRIX)
def test_strict_never_exceeds_budget(catalog, route, budget, style, transport):
    inputs = make_inputs(**{"from": route[0]}, destination=route[1], budget=budget, travelStyle=style, transport=transport)
    result = generate_trip(inputs, catalog)
    report = result["budgetReport"]
    if result["status"] == "ok":
        assert report["totalCost"] <= budget
        assert result["trip"]["budget"]["estimatedCost"] == report["totalCost"]
        assert all(check["passed"] for check in result["trip"]["explanation"]["constraintChecks"])
    else:
        assert result["trip"] is None
        assert report["minimumCost"] > budget
        assert report["shortfall"] == report["minimumCost"] - budget


@pytest.mark.parametrize("route,budget,style,transport", MATRIX)
def test_flexible_never_exceeds_the_cap(catalog, route, budget, style, transport):
    inputs = make_inputs(**{"from": route[0]}, destination=route[1], budget=budget, travelStyle=style, transport=transport, budgetMode="flexible")
    result = generate_trip(inputs, catalog)
    report = result["budgetReport"]
    assert report["allowedMaximum"] == round(budget * (1 + FLEXIBLE_LIMIT))
    if result["status"] == "ok":
        assert report["totalCost"] <= report["allowedMaximum"]
    else:
        assert report["minimumCost"] > report["allowedMaximum"]
        assert report["overLimit"] == report["minimumCost"] - report["allowedMaximum"]


def test_flexible_fits_the_budget_first_when_it_can(catalog):
    # A strict plan fits ৳15,000, so a flexible plan must not spend more than the budget.
    strict = generate_trip(make_inputs(budget=15000), catalog)
    flexible = generate_trip(make_inputs(budget=15000, budgetMode="flexible"), catalog)
    assert strict["status"] == "ok"
    assert flexible["status"] == "ok"
    assert flexible["budgetReport"]["totalCost"] <= 15000
    assert flexible["budgetReport"]["overage"] == 0


def test_flexible_goes_over_only_to_keep_the_top_interest(catalog):
    inputs = make_inputs(budget=12500, budgetMode="flexible", interests=["beach", "nature"])
    result = generate_trip(inputs, catalog)
    report = result["budgetReport"]
    assert result["status"] == "ok"
    assert 0 < report["overage"] <= 12500 * FLEXIBLE_LIMIT
    assert report["overagePercent"] == round(report["overage"] / 12500 * 100, 1)
    # The places kept are the top interest's (beach) — the reason it went over.
    kept = [item["why"] for day in result["trip"]["itinerary"] for item in day["items"] if item.get("why")]
    assert kept and all("Beach" in why for why in kept)


# ------------------------------ Named scenarios ------------------------------


def test_sundarbans_tiny_strict_budget_is_infeasible(catalog):
    inputs = make_inputs(destination="Sundarbans", days=3, nights=2, travelers=3, budget=5000, interests=["nature", "photography"])
    result = generate_trip(inputs, catalog)
    report = result["budgetReport"]
    assert result["status"] == "infeasible"
    assert result["trip"] is None
    assert report["minimumCost"] == report["totalCost"] > 5000
    assert report["shortfall"] == report["minimumCost"] - 5000
    assert sum(report["breakdown"].values()) == report["minimumCost"]
    # "Correct minimumCost": with exactly that budget, a plan fits.
    retry = generate_trip({**inputs, "budget": report["minimumCost"]}, catalog)
    assert retry["status"] == "ok"
    assert retry["budgetReport"]["totalCost"] <= report["minimumCost"]


def test_relaxed_and_packed_give_different_itineraries(catalog):
    relaxed = generate_trip(make_inputs(interests=["beach", "nature", "food", "photography"], travelStyle="relaxed"), catalog)
    packed = generate_trip(make_inputs(interests=["adventure", "photography", "food", "beach"], travelStyle="packed"), catalog)
    assert relaxed["status"] == packed["status"] == "ok"
    assert relaxed["budgetReport"]["totalCost"] <= 15000 and packed["budgetReport"]["totalCost"] <= 15000

    def titles(trip):
        return [[item["title"] for item in day["items"]] for day in trip["itinerary"]]

    assert titles(relaxed["trip"]) != titles(packed["trip"])
    relaxed_per_day, packed_per_day = activities_per_day(relaxed["trip"]), activities_per_day(packed["trip"])
    assert sum(packed_per_day) / len(packed_per_day) > sum(relaxed_per_day) / len(relaxed_per_day)
    assert max(packed_per_day) > max(relaxed_per_day)


def test_packed_trip_has_no_free_day_when_places_fit(catalog):
    result = generate_trip(make_inputs(travelStyle="packed", budget=60000, days=5, nights=4, interests=["beach", "nature"]), catalog)
    titles = [day["title"] for day in result["trip"]["itinerary"]]
    assert "Free Day" not in titles


def test_flight_only_tight_budget_falls_back_to_cheapest_with_a_record(catalog):
    trace: dict = {}
    result = generate_trip(make_inputs(transport=["flight"], budget=15000, interests=["beach", "nature"]), catalog, trace)
    assert result["status"] == "ok"
    # The repair never moves to a mode the user didn't select…
    assert all(s["selected"] for s in trace["repairSteps"] if s["lever"] == "transport")
    # …the non-selected mode only comes from the last-resort fallback, which is recorded.
    assert trace["rejectedSelectedAttempt"]["mode"] == "flight"
    assert result["adjustmentsMade"][0] == "Switched the main journey from your selected Flight to Train because it was the only way to fit your budget."
    transport = result["trip"]["transport"]
    assert transport["outbound"]["mode"] == transport["return"]["mode"] == "train"
    assert transport["outbound"]["selected"] is False and transport["return"]["selected"] is False


def test_selected_mode_that_fits_beats_a_cheaper_unselected_one(catalog):
    # The reported bug: Bus + Flight selected, Flight can't fit, Train was recommended anyway.
    result = generate_trip(make_inputs(transport=["bus", "flight"], budget=15000, interests=["beach", "nature"]), catalog)
    assert result["status"] == "ok" and result["budgetReport"]["totalCost"] <= 15000
    transport = result["trip"]["transport"]
    assert transport["outbound"]["mode"] == transport["return"]["mode"] == "bus"
    assert transport["outbound"]["selected"] is True and transport["return"]["selected"] is True
    assert not any("your selected" in m for m in result["adjustmentsMade"])
    assert [a["mode"] for a in transport["alternatives"]] == ["train", "car", "flight"]


def test_fallback_only_when_no_selected_mode_fits(catalog):
    result = generate_trip(make_inputs(transport=["bus", "flight"], budget=13000, interests=["beach", "nature"]), catalog)
    assert result["status"] == "ok" and result["budgetReport"]["totalCost"] <= 13000
    transport = result["trip"]["transport"]
    assert transport["outbound"]["mode"] == transport["return"]["mode"] == "train"
    assert transport["outbound"]["selected"] is False
    assert result["adjustmentsMade"][0] == "Switched the main journey from your selected Bus/Flight to Train because it was the only way to fit your budget."


def test_return_leg_is_chosen_independently(catalog):
    result = generate_trip(make_inputs(transport=["bus", "flight"], budget=14000, interests=["beach", "nature"]), catalog)
    assert result["status"] == "ok" and result["budgetReport"]["totalCost"] <= 14000
    trip = result["trip"]
    transport = trip["transport"]
    assert (transport["outbound"]["mode"], transport["outbound"]["selected"]) == ("train", False)
    assert (transport["return"]["mode"], transport["return"]["selected"]) == ("bus", True)
    assert result["adjustmentsMade"][0].startswith("Switched the journey there from your selected Bus/Flight to Train")
    assert transport["outbound"]["groupFare"] + transport["return"]["groupFare"] == trip["budget"]["breakdown"]["transportation"]
    last_day = [item["title"] for item in trip["itinerary"][-1]["items"]]
    assert any(item.get("detail") == "Bus back to Dhaka" for item in trip["itinerary"][-1]["items"]), last_day


def test_packed_prefers_the_fastest_selected_mode_only_when_it_fits(catalog):
    roomy = generate_trip(make_inputs(transport=["bus", "flight"], budget=90000, travelStyle="packed", interests=["beach", "nature"]), catalog)
    assert roomy["trip"]["transport"]["outbound"]["mode"] == "flight"
    tight = generate_trip(make_inputs(transport=["bus", "flight"], budget=26000, travelStyle="packed", interests=["beach", "nature"]), catalog)
    assert tight["trip"]["transport"]["outbound"]["mode"] == "bus"


def test_unavailable_selected_mode_is_recorded(catalog):
    # Sajek Valley has no railway station, so the user's only pick doesn't exist on this route.
    result = generate_trip(make_inputs(transport=["train"], destination="Sajek Valley", budget=40000, interests=["nature"]), catalog)
    transport = result["trip"]["transport"]
    assert "train" not in {o["mode"] for o in [transport["outbound"], *transport["alternatives"]]}
    assert transport["outbound"]["selected"] is False
    assert any(m.startswith("Switched the main journey from your selected Train to") for m in result["adjustmentsMade"])


def test_no_intercity_selection_is_not_flagged(catalog):
    transport = generate_trip(make_inputs(transport=["local"], budget=40000), catalog)["trip"]["transport"]
    assert transport["outbound"]["selected"] is None and transport["note"]


def test_unsupported_starting_city_gives_clean_error(catalog):
    with pytest.raises(PlannerInputError) as error:
        generate_trip(make_inputs(**{"from": "Sajek Valley"}), catalog)
    assert error.value.field == "from"
    assert error.value.message == "Please choose one of the supported starting cities."


@pytest.mark.parametrize(
    "changes,field",
    [
        ({"destination": "Atlantis"}, "destination"),
        ({"destination": "Dhaka"}, "destination"),
        ({"nights": 9}, "nights"),
        ({"interests": []}, "interests"),
        ({"interests": ["skydiving"]}, "interests"),
    ],
)
def test_other_bad_inputs_give_clean_errors(catalog, changes, field):
    with pytest.raises(PlannerInputError) as error:
        generate_trip(make_inputs(**changes), catalog)
    assert error.value.field == field


# ------------------------------ Consistency ------------------------------


@pytest.mark.parametrize("transport", [["bus", "train"], ["local"], ["car"]])
def test_fares_and_breakdown_always_agree(catalog, transport):
    trip = generate_trip(make_inputs(budget=40000, transport=transport), catalog)["trip"]
    breakdown = trip["budget"]["breakdown"]
    assert trip["transport"]["outbound"]["groupFare"] + trip["transport"]["return"]["groupFare"] == breakdown["transportation"]
    legs = sum(item["leg"]["fare"] for day in trip["itinerary"] for item in day["items"] if item.get("leg"))
    assert legs == breakdown["transportation"] + breakdown["localTransport"]
    assert trip["transport"]["local"]["totalFare"] == breakdown["localTransport"]
    assert sum(day["estimatedCost"] for day in trip["itinerary"]) == trip["budget"]["estimatedCost"] == sum(breakdown.values())


# -------------------------------- Contract --------------------------------


def shape(value):
    """Same as the shape() helper in make_golden_values.mjs."""
    if value is None:
        return "null"
    if isinstance(value, list):
        merged = {}
        for v in value:
            s = shape(v)
            if isinstance(s, dict):
                for k, sub in s.items():
                    merged[k] = merged[k] if isinstance(merged.get(k), dict) else sub
        return ["scalar"] if value and not isinstance(shape(value[0]), dict) else [merged]
    if isinstance(value, dict):
        return {k: shape(v) for k, v in value.items()}
    return "value"


def same_keys(expected, actual, path="result"):
    """Every object must have exactly the frontend's keys, at every level."""
    if isinstance(expected, dict) and isinstance(actual, dict):
        assert set(actual) == set(expected), f"{path}: keys differ — extra {set(actual) - set(expected)}, missing {set(expected) - set(actual)}"
        for key in expected:
            same_keys(expected[key], actual[key], f"{path}.{key}")
    elif isinstance(expected, list) and isinstance(actual, list) and expected and actual:
        same_keys(expected[0], actual[0], f"{path}[]")


def test_ok_result_matches_frontend_contract(catalog):
    inputs = make_inputs(budget=40000, transport=["bus", "train"], food=["local-food"], accommodation="budget", interests=["beach", "nature"])
    result = json.loads(json.dumps(generate_trip(inputs, catalog), ensure_ascii=False))
    assert result["status"] == GOLDEN["contract"]["okStatus"] == "ok"
    actual = shape(result)
    explanation = actual["trip"].pop("explanation")  # the allowed extra fields: trip.explanation…
    for leg in ("outbound", "return"):  # …and whether each journey leg was one of the user's selected modes
        assert actual["trip"]["transport"][leg].pop("selected") == "value"
    same_keys(GOLDEN["contract"]["ok"], actual)
    assert set(explanation) == {"topScoredPlaces", "constraintChecks", "repairSteps"}


def test_infeasible_result_matches_frontend_contract(catalog):
    inputs = make_inputs(budget=3000, transport=["bus", "train"], food=["local-food"], accommodation="budget", interests=["beach", "nature"])
    result = json.loads(json.dumps(generate_trip(inputs, catalog), ensure_ascii=False))
    assert result["status"] == GOLDEN["contract"]["infeasibleStatus"] == "infeasible"
    assert result["trip"] is None
    same_keys(GOLDEN["contract"]["infeasible"], shape(result))


def test_explanation_components_are_normalised(catalog):
    trip = generate_trip(make_inputs(budget=40000), catalog)["trip"]
    places = trip["explanation"]["topScoredPlaces"]
    assert len(places) == 5
    for place in places:
        assert set(place["components"]) == {"interestMatch", "budgetMatch", "timeMatch", "distanceScore", "preferenceMatch"}
        assert all(0 <= v <= 1 for v in place["components"].values())
        assert 0 <= place["score"] <= 1
    assert [p["score"] for p in places] == sorted((p["score"] for p in places), reverse=True)
