"""
SCHEDULER — putting stops into day slots with meals and travel time
(CLASSICAL AI: greedy construction with a time-slot model).

WHAT IT IS:
  * build_days / fill_day: builds each day greedily. For every open slot it
    re-scores the unused places relative to the PREVIOUS stop and the time
    left in the day (recommendation.py), and adds the best one that still
    fits. Because closeness to the previous stop is part of the score,
    geographically compatible places end up on the same day.
  * schedule_days: lays out every day minute by minute — departure, arrival,
    activities (ordered by ordering.py), lunch, dinner, check-out, the return
    journey — and records every travel leg and cost on the day it happens.

Two improvements over the frontend's placeholder:
  (a) days are FILLED with the best remaining places that fit (a packed trip
      only shows a "Free Day" when nothing else fits), and
  (b) inside each time-of-day group, stops are ordered by nearest neighbour.

WHAT IT IS NOT: not an exact scheduler or optimiser; a greedy method can miss
the best possible arrangement. Not A*.
"""
import copy

from app.services.planner import config
from app.services.planner.budget import cheapest_hotel_in_tier, rooms_for
from app.services.planner.context import PlanContext
from app.services.planner.ordering import order_day
from app.services.planner.recommendation import score_candidates
from app.services.planner.transport import plan_local_leg
from app.services.planner.util import format_taka, join_with_and, js_round, label_for, round_up_quarter


# ------------------------------ Day capacity ------------------------------


def day_caps(ctx: PlanContext, mode: str) -> list[int]:
    """Maximum number of activities on each day (the "max activities per day" constraint)."""
    per_day = ctx.activities_per_day
    hours = ctx.option[mode]["durationMinutes"] / 60
    caps = []
    for i in range(ctx.days):
        if ctx.days == 1:
            caps.append(max(1, per_day - 1))
        elif i == 0:
            caps.append(per_day - 1 if hours <= 5 else max(1, per_day - 2))
        elif i == ctx.days - 1:
            caps.append(1)  # the last day is a morning before the journey home
        else:
            caps.append(per_day)
    return caps


def return_mode(plan: dict) -> str:
    """The mode of the journey home: the main journey's mode unless one was chosen separately."""
    return plan.get("returnMode") or plan["mode"]


def period_of(minutes: int) -> str:
    if minutes < 12 * 60:
        return "morning"
    if minutes < config.EVENING_START:
        return "afternoon"
    return "evening"


# ------------------------------ Building days ------------------------------


def used_ids(plan: dict) -> set[str]:
    return {a["id"] for day in plan["dayActivities"] for a in day}


def build_days(ctx: PlanContext, mode: str, hotel_tier: str, food_tier: str) -> dict:
    """The first plan: fill every day greedily with the best places that fit."""
    plan = {"mode": mode, "returnMode": None, "hotelTier": hotel_tier, "foodTier": food_tier, "dayActivities": [[] for _ in range(ctx.days)]}
    caps = day_caps(ctx, mode)
    for i in range(ctx.days):
        plan = fill_day(plan, ctx, i, caps[i])
    return plan


def fill_day(plan: dict, ctx: PlanContext, day_index: int, cap: int, accept=None, exclude: set[str] | None = None) -> dict:
    """
    Add places to one day, one at a time, while the day has room.
    `accept(trial_plan)` can reject an addition (e.g. when it would break the budget);
    places whose id is in `exclude` are never added.
    """
    is_last = day_index == ctx.days - 1 and ctx.days > 1
    while len(plan["dayActivities"][day_index]) < cap:
        day = schedule_days(plan, ctx)[day_index]
        taken = used_ids(plan) | (exclude or set())
        pool = [
            c["attraction"]
            for c in ctx.candidates
            if c["attraction"]["id"] not in taken and not (is_last and c["attraction"]["bestTime"] == "evening")
        ]
        if not pool:
            break
        free = max(0, day["dayEnd"] - day["cursorAfterActivities"])
        ranked = score_candidates(ctx, pool, day["positionAfterActivities"], free, period_of(day["cursorAfterActivities"]))
        added = False
        for entry in ranked:
            trial = copy.copy(plan)
            trial["dayActivities"] = [list(d) for d in plan["dayActivities"]]
            trial["dayActivities"][day_index].append(entry["attraction"])
            trial = prune(trial, ctx)
            before = len(plan["dayActivities"][day_index])
            kept = [a["id"] for a in trial["dayActivities"][day_index]]
            if entry["attraction"]["id"] in kept and len(kept) == before + 1 and (accept is None or accept(trial)):
                plan, added = trial, True
                break
        if not added:
            break
    return plan


def prune(plan: dict, ctx: PlanContext) -> dict:
    """
    Keep only the activities that actually fit: at most the day's cap (the
    best-ranked ones are kept) and only those the schedule has time for.
    Returned in visiting order.
    """
    rank = {c["attraction"]["id"]: i for i, c in enumerate(ctx.candidates)}
    caps = day_caps(ctx, plan["mode"])
    trimmed = [
        sorted(day, key=lambda a: rank.get(a["id"], len(rank)))[:cap] if len(day) > cap else day
        for day, cap in zip(plan["dayActivities"], caps)
    ]
    days = schedule_days({**plan, "dayActivities": trimmed}, ctx)
    return {**plan, "dayActivities": [day["activities"] for day in days]}


# --------------------------- Laying out the days ---------------------------


def pick_restaurants(ctx: PlanContext, food_tier: str) -> list[dict]:
    """Up to 3 restaurants that fit the food tier and match food preferences (same rules as the frontend)."""
    food_prefs = ctx.inputs["food"]
    all_restaurants = ctx.catalog.restaurants_for(ctx.destination["id"])
    max_tier = config.TIER_ORDER.index(food_tier)
    affordable = [r for r in all_restaurants if config.TIER_ORDER.index(r["priceTier"]) <= max_tier]
    pool = affordable or sorted(all_restaurants, key=lambda r: r["avgCostPerPerson"])[:1]
    vegetarian_only = "vegetarian" in food_prefs and len(food_prefs) == 1
    if vegetarian_only and any("vegetarian" in r["foodTags"] for r in pool):
        pool = [r for r in pool if "vegetarian" in r["foodTags"]]

    def score(r):
        return len([t for t in r["foodTags"] if t in food_prefs]) * 2 + (1 if r["priceTier"] == food_tier else 0)

    return sorted(pool, key=lambda r: -score(r))[:3]  # stable sort keeps data order on ties, like the frontend


def why_text(ctx: PlanContext, attraction: dict) -> str | None:
    interest = attraction.get("bestInterest")
    if not interest:
        return None
    label = label_for(ctx.catalog.options["interests"], interest)
    return f"Matches your top interest, {label}" if ctx.top_interest == interest else f"Matches your interest in {label}"


def schedule_days(plan: dict, ctx: PlanContext) -> list[dict]:
    """
    Lay out every day. Returns one dict per day:
      activities – the activities that fit, in visiting order
      items      – the itinerary entries (exact frontend shape)
      costs      – {transportation, localTransport, accommodation, food, activities}
      intervals  – (start, end, title) of each timed entry, for the constraint checks
      dayEnd, cursorAfterActivities, positionAfterActivities – used when filling days
    """
    inputs = ctx.inputs
    destination, origin, hub = ctx.destination, ctx.origin, ctx.hub
    days, nights, travelers = ctx.days, ctx.nights, ctx.travelers
    journey = ctx.option[plan["mode"]]
    # The journey back can use a different mode (see generator.choose_return_mode).
    back = ctx.option[return_mode(plan)]
    intercity_leg = {"label": journey["label"], "durationMinutes": journey["durationMinutes"], "fare": journey["groupFare"]}
    return_leg = {"label": back["label"], "durationMinutes": back["durationMinutes"], "fare": back["groupFare"]}
    hotel = cheapest_hotel_in_tier(ctx.catalog, destination["id"], plan["hotelTier"])
    night_cost = hotel["pricePerNight"] * rooms_for(travelers)
    restaurants = pick_restaurants(ctx, plan["foodTier"])
    daily_food = config.FOOD_COST_PER_PERSON_PER_DAY[plan["foodTier"]]
    interest_options = ctx.catalog.options["interests"]
    meal_index = 0
    result = []

    for i, day_activities in enumerate(plan["dayActivities"]):
        is_first, is_last = i == 0, i == days - 1
        items, scheduled, intervals = [], [], []
        costs = {"transportation": 0, "localTransport": 0, "accommodation": 0, "food": daily_food * travelers, "activities": 0}
        state = {"position": hub, "cursor": config.DAY_START, "lunchDone": False}

        def leg_to(point):
            return plan_local_leg(ctx.catalog, state["position"], point, destination["id"], travelers, ctx.use_local_transport)

        def item_leg(leg):
            return {"label": leg["label"], "durationMinutes": leg["durationMinutes"], "fare": leg["fare"]} if leg else None

        def add_meal(label, share, leg):
            nonlocal meal_index
            if not restaurants:
                return
            r = restaurants[meal_index % len(restaurants)]
            meal_index += 1
            per_person = js_round((daily_food * share) / 10) * 10
            items.append(
                {
                    "time": state["cursor"],
                    "title": f"{label} at {r['name']}",
                    "detail": f"{r['cuisine']} · About {format_taka(per_person)} per person",
                    "imageGroup": "food",
                    "imageKey": r["imageKey"],
                    "leg": item_leg(leg),
                }
            )
            intervals.append((state["cursor"], state["cursor"] + 75, items[-1]["title"]))
            state["cursor"] = round_up_quarter(state["cursor"] + 75)

        if is_first:
            state["cursor"] = 9 * 60 if plan["mode"] == "flight" else 7 * 60
            items.append({"time": state["cursor"], "title": f"Depart from {origin['name']}", "detail": f"{journey['label']} to {destination['name']}", "leg": intercity_leg})
            costs["transportation"] += journey["groupFare"]
            state["cursor"] = round_up_quarter(state["cursor"] + journey["durationMinutes"])
            items.append(
                {
                    "time": state["cursor"],
                    "title": f"Arrive in {destination['name']}",
                    "detail": f"Check-in at {hotel['name']}" if nights > 0 else "Day trip — no overnight stay",
                }
            )
            state["cursor"] = round_up_quarter(state["cursor"] + 60)
            if state["cursor"] > 15 * 60:
                state["lunchDone"] = True  # late arrivals eat on the way

        day_end = config.LAST_DAY_END if (is_last and days > 1) else config.DAY_END

        for a in order_day(day_activities, state["position"]):
            if not state["lunchDone"] and (state["cursor"] >= 11 * 60 + 30 or a["bestTime"] == "evening"):
                state["cursor"] = max(state["cursor"], config.LUNCH_TIME)
                add_meal("Lunch", config.MEAL_SHARE["lunch"], None)  # lunch near where you are
                state["lunchDone"] = True
            leg = leg_to(a["coordinates"])
            start = round_up_quarter(state["cursor"] + (leg["durationMinutes"] if leg else 0))
            if a["bestTime"] == "evening":
                start = max(start, config.EVENING_START)
            end = start + a["durationHours"] * 60
            if end > day_end:
                continue  # doesn't fit today — skip it
            fee_note = f" · Entry about {format_taka(a['entryFee'])} per person" if a["entryFee"] else ""
            items.append(
                {
                    "time": start,
                    "title": a["name"],
                    "detail": f"{label_for(interest_options, a.get('bestInterest') or a['interests'][0])} · {a['description']}{fee_note}",
                    "why": why_text(ctx, a),
                    "imageGroup": "attractions",
                    "imageKey": a["imageKey"],
                    "leg": item_leg(leg),
                }
            )
            intervals.append((start, end, a["name"]))
            if leg:
                costs["localTransport"] += leg["fare"]
            costs["activities"] += a["entryFee"] * travelers
            scheduled.append(a)
            state["position"] = a["coordinates"]
            state["cursor"] = round_up_quarter(end)

        cursor_after, position_after = state["cursor"], state["position"]

        if not scheduled and not is_first and not is_last:
            items.append({"time": state["cursor"], "title": f"Free time in {destination['name']}", "detail": "Explore at your own pace"})
            state["cursor"] = round_up_quarter(state["cursor"] + 180)

        if is_last and days > 1 and nights > 0:
            leg = leg_to(hub)
            state["cursor"] = max(round_up_quarter(state["cursor"] + (leg["durationMinutes"] if leg else 0)), 10 * 60)
            items.append({"time": state["cursor"], "title": f"Check out from {hotel['name']}", "detail": "Pack up and settle any bills", "leg": item_leg(leg)})
            intervals.append((state["cursor"], state["cursor"] + 30, "Check out"))
            if leg:
                costs["localTransport"] += leg["fare"]
            state["position"] = hub
            state["cursor"] = round_up_quarter(state["cursor"] + 30)

        if not state["lunchDone"] and state["cursor"] <= 16 * 60:
            state["cursor"] = max(state["cursor"], config.LUNCH_TIME)
            add_meal("Lunch", config.MEAL_SHARE["lunch"], None)

        if is_last:
            leg = leg_to(hub)  # back to the bus stand / station / airport area
            state["cursor"] = round_up_quarter(state["cursor"] + (leg["durationMinutes"] if leg else 0))
            items.append({"time": state["cursor"], "title": f"Depart for {origin['name']}", "detail": f"{back['label']} back to {origin['name']}", "leg": item_leg(leg)})
            if leg:
                costs["localTransport"] += leg["fare"]
            costs["transportation"] += back["groupFare"]
            state["cursor"] = round_up_quarter(state["cursor"] + back["durationMinutes"])
            items.append({"time": state["cursor"], "title": f"Arrive back in {origin['name']}", "detail": "Trip complete", "leg": return_leg})
        else:
            leg = leg_to(hub)  # dinner near the hotel
            state["cursor"] = max(round_up_quarter(state["cursor"] + (leg["durationMinutes"] if leg else 0)), config.DINNER_TIME)
            add_meal("Dinner", config.MEAL_SHARE["dinner"], leg)
            if leg:
                costs["localTransport"] += leg["fare"]
            state["position"] = hub
            items.append({"time": round_up_quarter(state["cursor"] + 15), "title": "Return to Hotel & Rest", "detail": f"Overnight stay at {hotel['name']}"})

        if i < nights:
            costs["accommodation"] += night_cost
        if is_last and nights > days:
            costs["accommodation"] += night_cost * (nights - days)

        result.append(
            {
                "activities": scheduled,
                "items": items,
                "costs": costs,
                "intervals": intervals,
                "dayEnd": day_end,
                "cursorAfterActivities": cursor_after,
                "positionAfterActivities": position_after,
            }
        )
    return result


def day_title(activities: list[dict], is_first: bool, is_last: bool, total_days: int) -> str:
    names = [a["name"] for a in activities]
    if total_days == 1:
        return f"Day Trip: {join_with_and(names[:2])}" if names else "Day Trip"
    if is_first:
        return f"Arrival & {names[0]}" if names else "Arrival & Settling In"
    if is_last:
        return f"{names[0]} & Departure" if names else "Departure"
    return join_with_and(names[:2]) if names else "Free Day"
