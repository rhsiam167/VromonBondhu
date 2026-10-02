"""
REPAIR — the re-optimisation loop (CLASSICAL AI: greedy local search).

WHAT IT IS: when a plan breaks the budget constraint, the loop makes ONE
small change ("a move") at a time, recomputes the cost, re-validates, and
stops as soon as the plan fits — or when no move is left. The moves
("levers") are tried in a fixed order, the same as the frontend:

  1. cheaper transport — ONLY between the user's selected intercity modes
     (a mode they didn't select is a separate last resort in generator.py,
     used only when no selected mode can fit the budget after every lever)
  2. cheaper accommodation tier
  3. cheaper food tier
  4. remove activities, lowest-ranked interests first (never the top interest)
  5. replace remaining activities with cheaper ones
  6. last resort: remove any activity that still costs money
     (an activity's cost = entry fee + the travel needed to reach it)

A move is only accepted if it really lowers the total. Flexible budgets first
use levers 1–5 while keeping the top interest's activities.

Consecutive transport switches are merged into ONE message for the user,
e.g. "Switched the main journey from Flight to Train to fit your budget (saves ৳X)."

WHAT IT IS NOT: not a guaranteed optimum. Greedy local search can stop at a
plan that isn't the cheapest possible, so "lowest possible cost" means the
cheapest plan this search found, not a proven minimum. Not A*.
"""
import copy
import math

from app.services.planner import config
from app.services.planner.budget import cheapest_hotel_in_tier, plan_cost
from app.services.planner.context import PlanContext
from app.services.planner.ordering import order_day
from app.services.planner.scheduler import prune, schedule_days
from app.services.planner.util import format_taka, join_with_and, label_for


def evaluate(plan: dict, ctx: PlanContext) -> dict:
    """Schedule a plan and add up its cost: {"days", "breakdown", "total"}."""
    days = schedule_days(plan, ctx)
    return {"days": days, **plan_cost(days)}


def _copy(plan: dict) -> dict:
    new = copy.copy(plan)
    new["dayActivities"] = [list(day) for day in plan["dayActivities"]]
    return new


def _mode_label(mode: str) -> str:
    return config.INTERCITY_MODES[mode]["label"]


def _tier_label(ctx: PlanContext, tier: str) -> str:
    return label_for(ctx.catalog.options["accommodationTiers"], tier).lower()


# --------------------------------- Levers ---------------------------------


def cheaper_transport(plan: dict, ctx: PlanContext, allow_unselected: bool = False) -> dict | None:
    """
    Switch to the closest cheaper intercity mode. When the user selected modes,
    only THEIR modes are considered — a mode they didn't pick is only ever used
    as a separate last resort (see generator.py), or when working out the
    absolute minimum cost (allow_unselected=True).
    """
    current = ctx.option[plan["mode"]]
    cheaper = [o for o in ctx.route_options if o["groupFare"] < current["groupFare"]]
    if ctx.selected_modes and not allow_unselected:
        pool = [o for o in cheaper if o["mode"] in ctx.selected_modes]
    else:
        pool = cheaper
    if not pool:
        return None
    nxt = max(pool, key=lambda o: o["groupFare"])  # the closest cheaper option
    is_selected = nxt["mode"] in ctx.selected_modes
    if is_selected:
        message = f"Switched the main journey from {current['label']} to {nxt['label']} to fit your budget"
    else:
        outside = f", although {nxt['label']} wasn't one of your selected options" if ctx.selected_modes else ""
        message = f"Switched from {current['label']} to {nxt['label']} to fit your budget{outside}"
    new = _copy(plan)
    new["mode"] = nxt["mode"]
    new["returnMode"] = None  # the return leg follows the main journey unless chosen separately
    # A slower journey leaves less time on the first and last day, so re-fit the days.
    new = prune(new, ctx)
    return {"plan": new, "message": message, "lever": "transport", "fromMode": current["mode"], "toMode": nxt["mode"], "selected": is_selected}


def cheaper_accommodation(plan: dict, ctx: PlanContext) -> dict | None:
    index = config.TIER_ORDER.index(plan["hotelTier"])
    if index <= 0:
        return None
    nxt = config.TIER_ORDER[index - 1]
    hotel = cheapest_hotel_in_tier(ctx.catalog, ctx.destination["id"], nxt)
    new = _copy(plan)
    new["hotelTier"] = nxt
    message = f"Moved your stay from the {_tier_label(ctx, plan['hotelTier'])} to the {_tier_label(ctx, nxt)} tier ({hotel['name']})"
    return {"plan": new, "message": message, "lever": "accommodation"}


def cheaper_food(plan: dict, ctx: PlanContext) -> dict | None:
    index = config.TIER_ORDER.index(plan["foodTier"])
    if index <= 0:
        return None
    nxt = config.TIER_ORDER[index - 1]
    new = _copy(plan)
    new["foodTier"] = nxt
    message = f"Switched meals from {_tier_label(ctx, plan['foodTier'])} to {_tier_label(ctx, nxt)} food options"
    return {"plan": new, "message": message, "lever": "food"}


def _priority(activity: dict, ctx: PlanContext) -> float:
    """Lower number = more important. Places matching no ranked interest come last."""
    interest = activity.get("bestInterest")
    return ctx.rank_of[interest] if interest in ctx.rank_of else math.inf


def _by_lowest_priority(plan: dict, ctx: PlanContext) -> list[dict]:
    activities = [a for day in plan["dayActivities"] for a in day]
    return sorted(activities, key=lambda a: (-_priority(a, ctx), -a["entryFee"]))


def _without(plan: dict, activity_id: str) -> dict:
    new = _copy(plan)
    new["dayActivities"] = [[a for a in day if a["id"] != activity_id] for day in plan["dayActivities"]]
    return new


def _cheaper_without(plan: dict, ctx: PlanContext, activity: dict) -> dict | None:
    candidate = _without(plan, activity["id"])
    return candidate if evaluate(candidate, ctx)["total"] < evaluate(plan, ctx)["total"] else None


def remove_low_priority_activity(plan: dict, ctx: PlanContext) -> dict | None:
    for target in [a for a in _by_lowest_priority(plan, ctx) if a.get("bestInterest") != ctx.top_interest]:
        candidate = _cheaper_without(plan, ctx, target)
        if not candidate:
            continue
        if target.get("bestInterest"):
            reason = f"it matched a lower-ranked interest, {label_for(ctx.catalog.options['interests'], target['bestInterest'])}"
        else:
            reason = "it did not match your ranked interests"
        return {"plan": candidate, "message": f"Removed {target['name']} because {reason}", "lever": "remove", "removedId": target["id"]}
    return None


def replace_with_cheaper_activity(plan: dict, ctx: PlanContext, keep_top_interest: bool) -> dict | None:
    """keep_top_interest: a top-interest activity may only be replaced by another top-interest one."""
    used = {a["id"] for day in plan["dayActivities"] for a in day}
    current_total = evaluate(plan, ctx)["total"]
    for target in _by_lowest_priority(plan, ctx):
        must_match_top = keep_top_interest and target.get("bestInterest") == ctx.top_interest
        options = [
            c["attraction"]
            for c in ctx.candidates
            if c["attraction"]["id"] not in used and (not must_match_top or c["attraction"].get("bestInterest") == ctx.top_interest)
        ]
        for replacement in options:
            new = _copy(plan)
            new["dayActivities"] = [
                order_day([replacement if a["id"] == target["id"] else a for a in day], ctx.hub)
                if any(a["id"] == target["id"] for a in day)
                else day
                for day in plan["dayActivities"]
            ]
            candidate = prune(new, ctx)
            kept = any(a["id"] == replacement["id"] for day in candidate["dayActivities"] for a in day)
            if kept and evaluate(candidate, ctx)["total"] < current_total:
                return {
                    "plan": candidate,
                    "message": f"Replaced {target['name']} with the cheaper {replacement['name']}",
                    "lever": "replace",
                    "removedId": target["id"],
                }
    return None


def remove_any_activity(plan: dict, ctx: PlanContext) -> dict | None:
    for target in _by_lowest_priority(plan, ctx):
        candidate = _cheaper_without(plan, ctx, target)
        if candidate:
            return {"plan": candidate, "message": f"Removed {target['name']} to stay within budget", "lever": "remove-any", "removedId": target["id"]}
    return None


ALL_LEVERS = [
    cheaper_transport,
    cheaper_accommodation,
    cheaper_food,
    remove_low_priority_activity,
    lambda plan, ctx: replace_with_cheaper_activity(plan, ctx, keep_top_interest=False),
    remove_any_activity,
]
FLEXIBLE_FIRST_LEVERS = [
    cheaper_transport,
    cheaper_accommodation,
    cheaper_food,
    remove_low_priority_activity,
    lambda plan, ctx: replace_with_cheaper_activity(plan, ctx, keep_top_interest=True),
]
# Used when the journey back is being fitted to the budget: everything except the journey there.
NON_TRANSPORT_LEVERS = [lever for lever in ALL_LEVERS if lever is not cheaper_transport]
FLEXIBLE_FIRST_NON_TRANSPORT_LEVERS = [lever for lever in FLEXIBLE_FIRST_LEVERS if lever is not cheaper_transport]
# The absolute minimum cost may use any mode, selected or not.
MINIMUM_LEVERS = [lambda plan, ctx: cheaper_transport(plan, ctx, allow_unselected=True), *NON_TRANSPORT_LEVERS]


# ------------------------------ The search loop ------------------------------


def next_move(plan: dict, ctx: PlanContext, levers) -> dict | None:
    """The first lever (in order) whose change really lowers the total, or None."""
    before = evaluate(plan, ctx)["total"]
    for lever in levers:
        move = lever(plan, ctx)
        if move and evaluate(move["plan"], ctx)["total"] < before:
            return move
    return None


def reoptimize(plan: dict, ctx: PlanContext, levers, target: int, steps: list[dict]) -> dict:
    """
    Apply one move at a time until the total is at or under `target`, or no
    move is left. Every move is appended to `steps` with the cost before and after.
    """
    cost = evaluate(plan, ctx)["total"]
    while cost > target:
        move = next_move(plan, ctx, levers)
        if not move:
            break
        new_cost = evaluate(move["plan"], ctx)["total"]
        steps.append({**{k: v for k, v in move.items() if k != "plan"}, "costBefore": cost, "costAfter": new_cost})
        plan, cost = move["plan"], new_cost
    return plan


def cheapest_plan(plan: dict, ctx: PlanContext) -> dict:
    """Keep applying every lever (any transport mode allowed) until none helps — the cheapest plan this search can find."""
    move = next_move(plan, ctx, MINIMUM_LEVERS)
    while move:
        plan = move["plan"]
        move = next_move(plan, ctx, MINIMUM_LEVERS)
    return plan


# ------------------------------ User messages ------------------------------


def adjustment_messages(steps: list[dict], ctx: PlanContext) -> list[str]:
    """
    Turn repair steps into the user-facing `adjustmentsMade` list. Consecutive
    transport switches become ONE message covering the whole switch.
    """
    messages = []
    i = 0
    while i < len(steps):
        step = steps[i]
        if step["lever"] != "transport":
            messages.append(f"{step['message']} (saves {format_taka(step['costBefore'] - step['costAfter'])}).")
            i += 1
            continue
        group = [step]
        while i + len(group) < len(steps) and steps[i + len(group)]["lever"] == "transport":
            group.append(steps[i + len(group)])
        messages.append(_merged_transport_message(group, ctx))
        i += len(group)
    return messages


def _merged_transport_message(group: list[dict], ctx: PlanContext) -> str:
    start, end = group[0]["fromMode"], group[-1]["toMode"]
    via = [s["toMode"] for s in group[:-1]]
    text = f"Switched the main journey from {_mode_label(start)} to {_mode_label(end)}"
    if via:
        text += f" (via {join_with_and([_mode_label(m) for m in via])})"
    text += " to fit your budget"
    outside = [s["toMode"] for s in group if not s["selected"]]
    if outside and ctx.selected_modes:
        names = join_with_and([_mode_label(m) for m in outside])
        text += f", although {names} {'was' if len(outside) == 1 else 'were'}n't {'one of' if len(outside) == 1 else 'among'} your selected options"
    saves = group[0]["costBefore"] - group[-1]["costAfter"]
    return f"{text} (saves {format_taka(saves)})."
