"""
GENERATOR — the planning pipeline.

WHAT IT IS: the steps that turn planning inputs into a trip, in order:

  1. check the inputs            (clean PlannerInputError, never a crash)
  2. rank every place by score   (recommendation.py — heuristic scoring)
  3. pick the intercity mode     (cheapest of the user's picks; fastest if Packed)
  4. build the days greedily, grouping nearby places (scheduler.py)
  5. schedule, cost and validate (scheduler.py, budget.py, constraints.py)
  6. repair if the budget is broken (repair.py — greedy local search), moving
     only between the user's SELECTED intercity modes
  6b. last resort: only if no selected mode can fit the budget (or none runs on
     this route), re-plan with the cheapest mode overall — recorded in
     adjustmentsMade and flagged with transport.outbound.selected = false.
     The journey back is then chosen on its own, preferring a selected mode
  7. packed trips: fill leftover gaps with the best places that still fit the budget
  8. validate again, then build the response

The response has EXACTLY the shape of the frontend's generateTrip() in
src/services/tripGenerator.js (camelCase, same nesting), plus one extra,
optional field: trip.explanation (which the frontend ignores).

WHAT IT IS NOT: no machine learning, no LLM, no A*. All prices are sample estimates.
"""
import uuid
from datetime import datetime, timezone

from app.services.planner import config
from app.services.planner.budget import cheapest_hotel_in_tier, day_totals
from app.services.planner.catalog import Catalog
from app.services.planner.constraints import allowed_maximum, constraint_checks, validate_plan
from app.services.planner.context import PlanContext
from app.services.planner.errors import PlannerInputError
from app.services.planner.preferences import interest_weights
from app.services.planner.recommendation import COMPONENTS, rank_candidates
from app.services.planner.repair import (
    ALL_LEVERS,
    FLEXIBLE_FIRST_LEVERS,
    FLEXIBLE_FIRST_NON_TRANSPORT_LEVERS,
    NON_TRANSPORT_LEVERS,
    adjustment_messages,
    cheapest_plan,
    evaluate,
    reoptimize,
)
from app.services.planner.scheduler import build_days, day_caps, day_title, fill_day, pick_restaurants, prune, return_mode
from app.services.planner.transport import describe_local_modes, route_options
from app.services.planner.util import join_with_and, js_round, label_for


# ------------------------------- 1. Inputs -------------------------------


def create_context(inputs: dict, catalog: Catalog) -> PlanContext:
    """Check the inputs and work out the fixed facts of the request."""
    origin = catalog.starting_city_by_name(inputs.get("from"))
    destination = catalog.destination_by_name(inputs.get("destination"))
    if not origin:
        raise PlannerInputError("from", "Please choose one of the supported starting cities.")
    if not destination:
        raise PlannerInputError("destination", "Please choose a destination from the list.")
    if origin["id"] == destination["id"]:
        raise PlannerInputError("destination", "Destination must be different from your starting location.")
    if inputs["nights"] > inputs["days"]:
        raise PlannerInputError("nights", "Nights can’t be more than days.")
    if not inputs["interests"]:
        raise PlannerInputError("interests", "Select at least one interest.")

    styles = {s["id"]: s for s in catalog.options["travelStyles"]}
    if inputs["travelStyle"] not in styles:
        raise PlannerInputError("travelStyle", f"Unknown travel style '{inputs['travelStyle']}'.")
    known_interests = {i["id"] for i in catalog.options["interests"]}
    unknown = [i for i in inputs["interests"] if i not in known_interests]
    if unknown:
        raise PlannerInputError("interests", f"Unknown interest '{unknown[0]}'.")

    options = route_options(catalog, origin["id"], destination["id"], inputs["travelers"])
    ctx = PlanContext(
        inputs=inputs,
        catalog=catalog,
        destination=destination,
        origin=origin,
        weights=interest_weights(inputs["interests"]),
        rank_of={interest: i for i, interest in enumerate(inputs["interests"])},
        hub=catalog.hub(destination["id"])["coordinates"],
        route_options=options,
        selected_modes=[o["mode"] for o in options if o["mode"] in inputs["transport"]],
        use_local_transport="local" in inputs["transport"],
        activities_per_day=styles[inputs["travelStyle"]]["activitiesPerDay"],
        budget=inputs["budget"],
        travelers=inputs["travelers"],
        days=inputs["days"],
        nights=inputs["nights"],
    )
    return ctx


# ---------------------------- 3. Intercity mode ----------------------------


def recommend_mode(ctx: PlanContext) -> tuple[str, str | None]:
    """Cheapest of the user's selected modes (fastest if Packed); otherwise the cheapest mode, with a note."""
    candidates = [o for o in ctx.route_options if o["mode"] in ctx.selected_modes]
    if candidates:
        if ctx.travel_style == "packed":
            pick = sorted(candidates, key=lambda o: (o["durationMinutes"], o["groupFare"]))[0]
        else:
            pick = candidates[0]  # route options are already cheapest first
        return pick["mode"], None

    cheapest = ctx.route_options[0]
    picked = picked_intercity_modes(ctx)
    if picked:
        names = join_with_and([config.INTERCITY_MODES[m]["label"] for m in picked])
        verb = "aren't" if len(picked) > 1 else "isn't"
        note = (
            f"Switched the main journey from your selected {slash_names(picked)} to {cheapest['label']} because "
            f"{names} {verb} available between {ctx.origin['name']} and {ctx.destination['name']}."
        )
    else:
        note = f"You didn't choose an intercity transport option, so the cheapest one for this route ({cheapest['label']}) was used."
    return cheapest["mode"], note


def picked_intercity_modes(ctx: PlanContext) -> list[str]:
    """The intercity modes the user ticked, in their order (even ones this route doesn't have)."""
    return [m for m in ctx.inputs["transport"] if m in config.INTERCITY_MODE_IDS]


def slash_names(modes: list[str]) -> str:
    """["bus", "flight"] -> "Bus/Flight"."""
    return "/".join(config.INTERCITY_MODES[m]["label"] for m in modes)


def repair(plan: dict, ctx: PlanContext, flexible: bool, cap: int, steps: list[dict], with_transport: bool = True) -> dict:
    """Step 6: greedy local search until the plan fits (see repair.py)."""
    if not flexible:
        return reoptimize(plan, ctx, ALL_LEVERS if with_transport else NON_TRANSPORT_LEVERS, cap, steps)
    # Flexible: try to fit the BUDGET first without touching the top interest's places…
    first = FLEXIBLE_FIRST_LEVERS if with_transport else FLEXIBLE_FIRST_NON_TRANSPORT_LEVERS
    plan = reoptimize(plan, ctx, first, ctx.budget, steps)
    # …and only if that is still above the cap, allow every lever (still aiming for the budget).
    if evaluate(plan, ctx)["total"] > cap:
        plan = reoptimize(plan, ctx, ALL_LEVERS if with_transport else NON_TRANSPORT_LEVERS, ctx.budget, steps)
    return plan


def plan_with_mode(ctx: PlanContext, mode: str, flexible: bool, cap: int) -> dict:
    """Build the days for one main-journey mode and repair them: {"plan", "steps", "first", "fits"}."""
    plan = build_days(ctx, mode, ctx.inputs["accommodation"], ctx.inputs["accommodation"])
    first = evaluate(plan, ctx)
    steps: list[dict] = []
    plan = repair(plan, ctx, flexible, cap, steps)
    return {"plan": plan, "steps": steps, "first": first, "fits": evaluate(plan, ctx)["total"] <= cap}


def return_candidates(ctx: PlanContext) -> list[dict]:
    """The user's selected modes for this route, best first: cheapest, or fastest on a Packed trip."""
    options = [o for o in ctx.route_options if o["mode"] in ctx.selected_modes]
    if ctx.travel_style == "packed":
        options.sort(key=lambda o: (o["durationMinutes"], o["groupFare"]))
    return options


def choose_return_mode(plan: dict, ctx: PlanContext, flexible: bool, cap: int, steps: list[dict]) -> dict:
    """
    When the journey there had to use a mode the user didn't select, the
    journey back is decided on its own: the best of the user's selected modes
    that can still fit the budget (with the usual stay/food/activity
    adjustments, but without touching the journey there). If none fits, the
    journey back stays on the same mode as the journey there.
    """
    for option in return_candidates(ctx):
        trial_steps: list[dict] = []
        trial = prune({**plan, "returnMode": option["mode"]}, ctx)
        trial = repair(trial, ctx, flexible, cap, trial_steps, with_transport=False)
        result = evaluate(trial, ctx)
        if result["total"] <= cap and not validate_plan(trial, result["days"], result["total"], ctx, cap):
            steps.extend(trial_steps)
            return trial
    return plan


def fallback_message(plan: dict, ctx: PlanContext) -> str:
    """The adjustmentsMade sentence for a main journey on a mode the user didn't select."""
    selected = slash_names([m for m in picked_intercity_modes(ctx) if m in ctx.selected_modes])
    there, back = ctx.option[plan["mode"]]["label"], ctx.option[return_mode(plan)]["label"]
    if return_mode(plan) == plan["mode"]:
        return f"Switched the main journey from your selected {selected} to {there} because it was the only way to fit your budget."
    return (
        f"Switched the journey there from your selected {selected} to {there} because it was the only way to fit your budget; "
        f"the journey back uses {back}, one of your selected options."
    )


# ------------------------------- Pipeline -------------------------------


def generate_trip(inputs: dict, catalog: Catalog, trace: dict | None = None) -> dict:
    """
    Plan a trip. Returns the frontend contract:
      {"status": "ok"|"infeasible", "trip", "budgetReport", "adjustmentsMade"}
    Pass a dict as `trace` to receive every intermediate step (used by the demo).
    """
    ctx = create_context(inputs, catalog)
    flexible = inputs["budgetMode"] == "flexible"
    cap = allowed_maximum(ctx, config.FLEXIBLE_LIMIT if flexible else config.STRICT_TOLERANCE)

    # 2. Rank every place.
    ctx.candidates = rank_candidates(ctx)

    # 3–6. Mode, greedy day building, schedule + cost, then repair — using
    # only the user's selected intercity modes.
    mode, ctx.mode_note = recommend_mode(ctx)
    attempt = plan_with_mode(ctx, mode, flexible, cap)
    first = attempt["first"]
    first_violations = validate_plan(attempt["plan"], first["days"], first["total"], ctx, cap)
    fallback_messages: list[str] = []
    rejected = None

    # 6b. Last resort: none of the selected modes can fit the budget, so re-plan
    # with the cheapest mode overall. This is the ONLY case where a mode the
    # user didn't select is used when they did select some.
    cheapest_mode = ctx.route_options[0]["mode"]
    if not attempt["fits"] and ctx.selected_modes and cheapest_mode not in ctx.selected_modes:
        retry = plan_with_mode(ctx, cheapest_mode, flexible, cap)
        if retry["fits"]:
            rejected = {"mode": mode, "cost": evaluate(attempt["plan"], ctx)["total"], "steps": attempt["steps"]}
            attempt = retry
            # The journey back is decided on its own (it may use a selected mode).
            attempt["plan"] = choose_return_mode(attempt["plan"], ctx, flexible, cap, attempt["steps"])
            fallback_messages.append(fallback_message(attempt["plan"], ctx))
    plan, steps = attempt["plan"], attempt["steps"]
    if ctx.mode_note and picked_intercity_modes(ctx):
        # The user picked intercity modes, but none of them runs on this route.
        fallback_messages.append(ctx.mode_note)

    # 7. Packed trips: fill leftover gaps with the best places that still fit.
    added = []
    if ctx.travel_style == "packed":
        plan, added = fill_gaps_within_budget(plan, ctx, cap)

    # 8. Validate again.
    plan = prune(plan, ctx)
    final = evaluate(plan, ctx)
    violations = validate_plan(plan, final["days"], final["total"], ctx, cap)
    cheapest = evaluate(cheapest_plan(plan, ctx), ctx)
    # A place removed during repair but put back by the gap filling is no longer
    # "removed", so that step is left out of the messages shown to the user.
    final_ids = {a["id"] for day in plan["dayActivities"] for a in day}
    all_steps = [{**s, "undone": s.get("removedId") in final_ids} for s in steps]
    steps = [s for s in steps if s.get("removedId") not in final_ids]
    adjustments = fallback_messages + adjustment_messages(steps, ctx)

    if trace is not None:
        trace.update(
            {
                "candidates": ctx.candidates,
                "modeNote": ctx.mode_note,
                "rejectedSelectedAttempt": rejected,  # the best plan with the user's selected modes, when it didn't fit
                "returnMode": return_mode(plan),
                "initialCost": first["total"],
                "initialBreakdown": first["breakdown"],
                "initialViolations": first_violations,
                "allowedMaximum": cap,
                "repairSteps": all_steps,  # every step, with "undone" = put back by the gap filling
                "gapFills": added,
                "finalCost": final["total"],
                "finalViolations": violations,
                "minimumCost": cheapest["total"],
            }
        )

    if any(v["constraint"] == "Budget cap" for v in violations):
        overage = cheapest["total"] - ctx.budget
        return {
            "status": "infeasible",
            "trip": None,
            "budgetReport": {
                "budget": ctx.budget,
                "mode": inputs["budgetMode"],
                "allowedMaximum": cap,
                "totalCost": cheapest["total"],
                "minimumCost": cheapest["total"],
                "shortfall": overage,
                "overage": overage,
                "overagePercent": percent_of(overage, ctx.budget),
                "overLimit": cheapest["total"] - cap,
                "breakdown": cheapest["breakdown"],
            },
            "adjustmentsMade": adjustments,
        }

    overage = max(0, final["total"] - ctx.budget)
    budget_report = {
        "budget": ctx.budget,
        "mode": inputs["budgetMode"],
        "allowedMaximum": cap,
        "totalCost": final["total"],
        "minimumCost": cheapest["total"],
        "shortfall": overage,
        "overage": overage,
        "overagePercent": percent_of(overage, ctx.budget),
        "overLimit": 0,
        "breakdown": final["breakdown"],
    }
    explanation = {
        "topScoredPlaces": [
            {
                "name": c["attraction"]["name"],
                "score": round(c["score"], 3),
                "components": {name: round(c["components"][name], 3) for name in COMPONENTS},
            }
            for c in ctx.candidates[:5]
        ],
        "constraintChecks": constraint_checks(violations),
        "repairSteps": len(steps),
    }
    trip = assemble_trip(plan, final, ctx, adjustments, budget_report, explanation)
    return {"status": "ok", "trip": trip, "budgetReport": budget_report, "adjustmentsMade": adjustments}


def fill_gaps_within_budget(plan: dict, ctx: PlanContext, cap: int) -> tuple[dict, list[str]]:
    """
    Packed trips only: top up days that have room with the best remaining
    places, as long as the total stays within the budget (or the current
    total if a flexible plan is already over it) and every constraint holds.
    A place removed earlier by the repair step can come back here if the
    budget now has room for it (e.g. after a big saving elsewhere).
    """
    current = evaluate(plan, ctx)["total"]
    limit = min(cap, max(ctx.budget, current))

    def accept(trial: dict) -> bool:
        result = evaluate(trial, ctx)
        return result["total"] <= limit and not validate_plan(trial, result["days"], result["total"], ctx, cap)

    before = {a["id"] for day in plan["dayActivities"] for a in day}
    for i, day_cap in enumerate(day_caps(ctx, plan["mode"])):
        plan = fill_day(plan, ctx, i, day_cap, accept)
    added = [a["name"] for day in plan["dayActivities"] for a in day if a["id"] not in before]
    return plan, added


def percent_of(part: float, whole: float) -> float:
    return js_round((part / whole) * 1000) / 10 if whole > 0 else 0


# ------------------------------ Response ------------------------------


def assemble_trip(plan: dict, cost: dict, ctx: PlanContext, adjustments: list[str], budget_report: dict, explanation: dict) -> dict:
    """Build the trip object in the frontend's exact shape."""
    inputs, destination, origin, catalog = ctx.inputs, ctx.destination, ctx.origin, ctx.catalog
    days_out = cost["days"]
    hotel = cheapest_hotel_in_tier(catalog, destination["id"], plan["hotelTier"])
    interest_labels = [label_for(catalog.options["interests"], i) for i in inputs["interests"]]
    totals = day_totals(days_out, cost["total"])

    # Stays: the chosen one first, then others in the same or cheaper tiers.
    tier_index = config.TIER_ORDER.index(plan["hotelTier"])

    def tier_distance(h):
        index = config.TIER_ORDER.index(h["priceTier"])
        return 10 if index > tier_index else tier_index - index

    others = sorted((h for h in catalog.hotels_for(destination["id"]) if h["id"] != hotel["id"]), key=lambda h: (tier_distance(h), h["pricePerNight"]))
    stays = [hotel, *others][:3]
    restaurants = pick_restaurants(ctx, plan["foodTier"])
    difference = ctx.budget - cost["total"]

    journey = ctx.option[plan["mode"]]
    picked_any = bool(picked_intercity_modes(ctx))

    def leg_summary(mode: str) -> dict:
        summary = {key: ctx.option[mode][key] for key in ("mode", "label", "durationMinutes", "farePerPerson", "groupFare", "distanceKm")}
        # True/False = the user did/didn't select this mode; None = they selected no intercity mode at all.
        summary["selected"] = (mode in ctx.selected_modes) if picked_any else None
        return summary
    used_labels = []
    for day in days_out:
        for item in day["items"]:
            label = (item.get("leg") or {}).get("label")
            if label and label not in used_labels:
                used_labels.append(label)
    offered = describe_local_modes(catalog, destination["id"])
    walk_label = config.LOCAL_MODES["walk"]["label"]
    local_modes = [
        {"mode": "walk", "label": label, "farePerRide": 0}
        if label == walk_label
        else next((m for m in offered if m["label"] == label), {"mode": label, "label": label, "farePerRide": None})
        for label in used_labels
        if label not in (journey["label"], ctx.option[return_mode(plan)]["label"])
    ]

    return {
        "id": f"trip-{uuid.uuid4().hex[:16]}",
        "createdAt": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "title": f"{origin['name']} to {destination['name']}",
        "from": origin["name"],
        "destinationName": destination["name"],
        "destinationId": destination["id"],
        "destinationImageKey": destination["imageKey"],
        "days": ctx.days,
        "nights": ctx.nights,
        "travelers": ctx.travelers,
        "startDate": inputs.get("startDate") or None,
        "focusLabel": f"{join_with_and(interest_labels[:2])} Focused" if interest_labels else "Balanced Trip",
        "budget": {
            "total": ctx.budget,
            "mode": inputs["budgetMode"],
            "estimatedCost": cost["total"],
            "difference": difference,
            "withinBudget": difference >= 0,
            "allowedMaximum": budget_report["allowedMaximum"],
            "overage": budget_report["overage"],
            "overagePercent": budget_report["overagePercent"],
            "breakdown": cost["breakdown"],
        },
        "adjustmentsMade": adjustments,
        "activityCount": sum(len(day) for day in plan["dayActivities"]),
        "reasons": build_reasons(plan, days_out, ctx, interest_labels, adjustments),
        "transport": {
            "outbound": leg_summary(plan["mode"]),
            "return": leg_summary(return_mode(plan)),
            "alternatives": [
                {key: o[key] for key in ("mode", "label", "durationMinutes", "farePerPerson")}
                for o in ctx.route_options
                if o["mode"] != plan["mode"]
            ],
            "local": {
                "modes": local_modes,
                "totalFare": cost["breakdown"]["localTransport"],
                "note": None
                if ctx.use_local_transport
                else f"Local Transport wasn't selected, so stops up to {config.WALKING_MAX_KM} km apart are walked and longer hops use the cheapest local option.",
            },
            "note": ctx.mode_note,
        },
        "stays": [{key: s[key] for key in ("id", "name", "priceTier", "pricePerNight", "highlight", "imageKey")} for s in stays],
        "restaurants": [{key: r[key] for key in ("id", "name", "cuisine", "highlight", "imageKey")} for r in restaurants],
        "itinerary": [
            {
                "day": i + 1,
                "title": day_title(day["activities"], i == 0, i == ctx.days - 1, ctx.days),
                "estimatedCost": totals[i],
                "items": day["items"],
            }
            for i, day in enumerate(days_out)
        ],
        "inputs": inputs,
        "explanation": explanation,
    }


def build_reasons(plan: dict, days_out: list[dict], ctx: PlanContext, interest_labels: list[str], adjustments: list[str]) -> list[str]:
    """Plain-language explanation of the main planning decisions (same sentences as the frontend)."""
    reasons = []
    interests = ctx.inputs["interests"]
    if interests:
        places = [a["name"] for day in days_out for a in day["activities"] if a.get("bestInterest") == interests[0]][:2]
        verb = "were" if len(places) > 1 else "was"
        reasons.append(f"{interest_labels[0]} was your top priority, so {join_with_and(places) if places else 'matching places'} {verb} scheduled first.")
    if len(interests) > 1:
        crowd_note = ", favouring less crowded places" if ctx.inputs["crowd"] == "avoid" else ""
        reasons.append(f"{interest_labels[1]} came second, so related spots were added{crowd_note}.")
    tier = label_for(ctx.catalog.options["accommodationTiers"], plan["hotelTier"]).lower()
    there = config.INTERCITY_MODES[plan["mode"]]["label"].lower()
    back = config.INTERCITY_MODES[return_mode(plan)]["label"].lower()
    journey = f"{there} for the main journey" if there == back else f"{there} there and {back} back"
    reasons.append(f"Your stay is in the {tier} tier, with {journey}.")
    if ctx.mode_note and ctx.mode_note not in adjustments:  # shown once, not twice
        reasons.append(ctx.mode_note)
    return reasons
