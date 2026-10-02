"""
CONSTRAINTS — CSP-style constraint handling (CLASSICAL AI).

WHAT IT IS: the plan is checked against HARD constraints. A plan that breaks
any of them is not allowed to be returned:

  1. Budget cap        – total ≤ the allowed maximum (strict: the budget itself;
                         flexible: budget × 1.30)
  2. Trip duration     – exactly one itinerary day per trip day, nights ≤ days
  3. No overlapping activities – each timed stop starts after the previous one ends
  4. Travel time fits the day  – every activity (including travel to it) ends
                         by the day's end (9:00 PM, or 1:30 PM on the last day)
  5. Max activities per day    – no day has more than the pace allows
  6. Chosen transport exists   – the main journey's mode exists on this route

SOFT preferences (interests, crowds, pace) are NOT checked here — they are
handled by the scoring in recommendation.py.

`validate_plan` returns a list of violations, each with a plain-English message.
An empty list means every hard constraint is satisfied.

WHAT IT IS NOT: not a formal CSP solver (no backtracking search over variable
domains). It is "CSP-style": explicit constraints are checked, and the repair
step (repair.py) changes the plan until they hold.
"""
from app.services.planner.context import PlanContext
from app.services.planner.scheduler import day_caps
from app.services.planner.util import format_taka, js_round

CONSTRAINT_NAMES = [
    "Budget cap",
    "Trip duration",
    "No overlapping activities",
    "Travel time fits the day",
    "Max activities per day",
    "Chosen transport exists",
]


def allowed_maximum(ctx: PlanContext, tolerance: float) -> int:
    return js_round(ctx.budget * (1 + tolerance))


def validate_plan(plan: dict, days: list[dict], total: int, ctx: PlanContext, cap: int) -> list[dict]:
    """Check every hard constraint. Returns [{"constraint", "message"}] (empty = all satisfied)."""
    violations = []

    def fail(name: str, message: str):
        violations.append({"constraint": name, "message": message})

    # 1. Budget cap
    if total > cap:
        fail("Budget cap", f"The plan costs {format_taka(total)}, which is {format_taka(total - cap)} over the allowed maximum of {format_taka(cap)}.")

    # 2. Trip duration
    if len(days) != ctx.days:
        fail("Trip duration", f"The itinerary has {len(days)} days but the trip is {ctx.days} days long.")
    if ctx.nights > ctx.days:
        fail("Trip duration", f"The trip has {ctx.nights} nights, which is more than its {ctx.days} days.")

    # 3. No overlapping activities, and 4. Travel time fits the day
    for number, day in enumerate(days, start=1):
        previous_end, previous_title = None, None
        for start, end, title in sorted(day["intervals"]):
            if previous_end is not None and start < previous_end:
                fail("No overlapping activities", f"Day {number}: {title} starts before {previous_title} has finished.")
            previous_end, previous_title = end, title
        for a in day["activities"]:
            end = next((e for s, e, t in day["intervals"] if t == a["name"]), None)
            if end is not None and end > day["dayEnd"]:
                fail("Travel time fits the day", f"Day {number}: {a['name']} would finish after the day ends.")

    # 5. Max activities per day (if the mode doesn't exist, fall back to the pace's daily limit)
    caps = day_caps(ctx, plan["mode"]) if plan["mode"] in ctx.option else [ctx.activities_per_day] * ctx.days
    for number, (day, cap_for_day) in enumerate(zip(plan["dayActivities"], caps), start=1):
        if len(day) > cap_for_day:
            fail("Max activities per day", f"Day {number} has {len(day)} activities; the pace allows at most {cap_for_day}.")

    # 6. Chosen transport exists
    for mode in dict.fromkeys([plan["mode"], plan.get("returnMode") or plan["mode"]]):
        if mode not in ctx.option:
            fail("Chosen transport exists", f"{mode} is not available between {ctx.origin['name']} and {ctx.destination['name']}.")

    return violations


def constraint_checks(violations: list[dict]) -> list[dict]:
    """[{"name", "passed"}] for every hard constraint — used in trip.explanation."""
    failed = {v["constraint"] for v in violations}
    return [{"name": name, "passed": name not in failed} for name in CONSTRAINT_NAMES]
