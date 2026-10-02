"""
TRANSPORT — distances, travel times and fares (sample estimates).

WHAT IT IS: data processing. A direct port of the frontend's
src/services/transportPlanner.js, so both give the same numbers:
  * road distance = Haversine (great-circle) distance × a road-winding factor
  * for each intercity mode that exists on a route (flight needs airports at
    both ends, train needs railway stations at both ends, bus and hired car
    always exist), duration and fare come from the per-mode rates in config.py
  * local legs between stops use walking or the destination's local modes

WHAT IT IS NOT: not a route-finding or search algorithm, and the fares are
sample estimates, not live fares or schedules.
"""
import math

from app.services.planner import config
from app.services.planner.catalog import Catalog
from app.services.planner.util import js_round


def straight_km(a: dict, b: dict) -> float:
    """Great-circle distance in km between two {"lat", "lng"} points (Haversine formula)."""
    r = 6371
    d_lat = math.radians(b["lat"] - a["lat"])
    d_lng = math.radians(b["lng"] - a["lng"])
    h = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(a["lat"])) * math.cos(math.radians(b["lat"])) * math.sin(d_lng / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def road_km(a: dict, b: dict) -> float:
    return straight_km(a, b) * config.ROAD_WINDING_FACTOR


def round_fare(amount: float) -> int:
    return js_round(amount / config.FARE_ROUNDING) * config.FARE_ROUNDING


def round_minutes(minutes: float) -> int:
    return max(5, js_round(minutes / 5) * 5)


# ------------------------------- Intercity -------------------------------


def route_options(catalog: Catalog, from_id: str, to_id: str, travelers: int) -> list[dict]:
    """
    Every intercity mode that exists between two destinations, cheapest first:
    [{mode, label, distanceKm, durationMinutes, farePerPerson, groupFare, vehicles}]
    """
    origin, dest = catalog.hub(from_id), catalog.hub(to_id)
    if not origin or not dest:
        return []

    road = road_km(origin["coordinates"], dest["coordinates"])
    air = straight_km(origin["coordinates"], dest["coordinates"])
    overrides = config.ROUTE_OVERRIDES.get("|".join(sorted([from_id, to_id])), {})
    modes = config.INTERCITY_MODES
    options = []

    bus = modes["bus"]
    options.append(_per_person("bus", road, travelers, overrides.get("bus"), (road / bus["speedKmh"]) * 60, bus["baseFare"] + bus["farePerKm"] * road))

    if origin["hasRailway"] and dest["hasRailway"]:
        train = modes["train"]
        options.append(_per_person("train", road, travelers, overrides.get("train"), (road / train["speedKmh"]) * 60, train["baseFare"] + train["farePerKm"] * road))

    if origin["hasAirport"] and dest["hasAirport"]:
        flight = modes["flight"]
        options.append(
            _per_person(
                "flight",
                air,
                travelers,
                overrides.get("flight"),
                flight["airportMinutes"] + (air / flight["cruiseSpeedKmh"]) * 60,
                flight["baseFare"] + flight["farePerKm"] * air,
            )
        )

    car = modes["car"]
    vehicles = math.ceil(travelers / car["capacity"])
    group_fare = round_fare(vehicles * (car["baseFare"] + car["farePerKm"] * road))
    options.append(
        {
            "mode": "car",
            "label": car["label"],
            "distanceKm": js_round(road),
            "durationMinutes": round_minutes((road / car["speedKmh"]) * 60),
            "farePerPerson": js_round(group_fare / travelers),
            "groupFare": group_fare,
            "vehicles": vehicles,
        }
    )

    return sorted(options, key=lambda o: o["groupFare"])  # stable, like the frontend's sort


def _per_person(mode, distance_km, travelers, override, duration_minutes, fare_per_person) -> dict:
    if override:
        duration_minutes, fare_per_person = override["durationMinutes"], override["farePerPerson"]
    fare = round_fare(fare_per_person)
    return {
        "mode": mode,
        "label": config.INTERCITY_MODES[mode]["label"],
        "distanceKm": js_round(distance_km),
        "durationMinutes": round_minutes(duration_minutes),
        "farePerPerson": fare,
        "groupFare": fare * travelers,
        "vehicles": None,
    }


# --------------------------------- Local ---------------------------------


def plan_local_leg(catalog: Catalog, start: dict, end: dict, destination_id: str, travelers: int, use_local_transport: bool) -> dict | None:
    """
    How the group gets from one stop to the next (fare is for the whole group).
    None when the two stops are the same place (closer than SAME_PLACE_KM).
    """
    km = road_km(start, end)
    if km < config.SAME_PLACE_KM:
        return None
    if not use_local_transport and km <= config.WALKING_MAX_KM:
        return _make_leg("walk", km, 0, travelers)

    hub = catalog.hub(destination_id)
    modes = hub["localModes"] if hub else []
    suitable = [m for m in modes if config.LOCAL_MODES[m["mode"]]["maxKm"] >= km]
    if suitable:
        pool = suitable
    else:  # nothing is meant for a ride this long → the longest-range mode available
        pool = sorted(modes, key=lambda m: -config.LOCAL_MODES[m["mode"]]["maxKm"])[:1]
    if not pool:
        return _make_leg("walk", km, 0, travelers)

    legs = [_make_leg(m["mode"], km, m["farePerRide"], travelers) for m in pool]
    return sorted(legs, key=lambda leg: leg["fare"])[0]


def _make_leg(mode: str, km: float, fare_per_ride: float, travelers: int) -> dict:
    rates = config.LOCAL_MODES[mode]
    vehicles = 0 if mode == "walk" else math.ceil(travelers / rates["capacity"])
    per_vehicle = max(fare_per_ride, rates["farePerKm"] * km)
    return {
        "mode": mode,
        "label": rates["label"],
        "distanceKm": js_round(km * 10) / 10,
        "durationMinutes": round_minutes((km / rates["speedKmh"]) * 60),
        "fare": round_fare(vehicles * per_vehicle),
    }


def describe_local_modes(catalog: Catalog, destination_id: str) -> list[dict]:
    """The local modes a destination offers: [{mode, label, farePerRide}]."""
    hub = catalog.hub(destination_id)
    return [
        {"mode": m["mode"], "label": config.LOCAL_MODES[m["mode"]]["label"], "farePerRide": m["farePerRide"]}
        for m in (hub["localModes"] if hub else [])
    ]
