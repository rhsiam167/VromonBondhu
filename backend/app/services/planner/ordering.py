"""
ORDERING — the order to visit a day's stops (CLASSICAL AI: a greedy heuristic).

WHAT IT IS: the "nearest neighbour" rule. Stops are first grouped by their
best time of day (morning → afternoon → any → evening). Inside each group,
starting from where the group is now, it repeatedly goes to the closest
not-yet-visited stop. It is fast and usually gives short routes.

WHAT IT IS NOT: it does not guarantee the shortest possible route (that would
need an exact route-optimisation method). It is not A* and not a formal
optimiser. It lives in its own module on purpose, so a better ordering
algorithm could replace `order_day` later without touching anything else.
"""
from app.services.planner import config
from app.services.planner.transport import road_km


def nearest_neighbour(stops: list[dict], start: dict) -> list[dict]:
    """Greedy nearest-neighbour order of `stops`, starting from the point `start`."""
    remaining = list(stops)
    ordered = []
    position = start
    while remaining:
        # Closest next stop; ties broken by id so the order is always the same.
        nearest = min(remaining, key=lambda s: (road_km(position, s["coordinates"]), s["id"]))
        ordered.append(nearest)
        remaining.remove(nearest)
        position = nearest["coordinates"]
    return ordered


def order_day(activities: list[dict], start: dict) -> list[dict]:
    """Group a day's activities by time of day, then order each group by nearest neighbour."""
    groups: dict[int, list[dict]] = {}
    for a in activities:
        groups.setdefault(config.TIME_ORDER[a["bestTime"]], []).append(a)

    ordered = []
    position = start
    for key in sorted(groups):
        group = nearest_neighbour(groups[key], position)
        ordered.extend(group)
        position = group[-1]["coordinates"]
    return ordered
