"""
RECOMMENDATION — heuristic scoring of places (CLASSICAL AI: a weighted-sum heuristic).

WHAT IT IS: every candidate place gets a score between 0 and 1:

    Score = w1·InterestMatch + w2·BudgetMatch + w3·TimeMatch
            + w4·DistanceScore + w5·PreferenceMatch

Each component is normalised to 0–1:

  InterestMatch   = (sum of the weights of the user's interests this place
                    matches) / (sum of all the user's interest weights)
  BudgetMatch     = how well the visit's cost fits its share of the budget.
                    Visit cost = entry fee × travelers + the round trip from
                    the base. Share = budget × ACTIVITY_BUDGET_SHARE ÷ planned
                    visits. 1 if the cost fits the share, otherwise share ÷ cost.
  TimeMatch       = fit between the place's bestTime, its duration (plus travel)
                    and the free slot: min(1, free minutes ÷ minutes needed),
                    halved if its bestTime doesn't suit that part of the day.
  DistanceScore   = closeness to the reference point (the base, or the previous
                    stop), min-max normalised across the candidates:
                    1 − (d − d_min) ÷ (d_max − d_min); 1 when all are equally far.
  PreferenceMatch = average of the crowd fit (crowd level vs the crowd
                    preference) and the pace fit (visit length vs the travel
                    style's typical slot).

The weights w1..w5 are PROPOSED DEFAULTS in config.py — configurable, NOT tuned.

WHAT IT IS NOT: not machine learning. Nothing is trained or learned; the
formula and weights are fixed rules written by hand.
"""
from app.services.planner import config
from app.services.planner.context import PlanContext
from app.services.planner.transport import plan_local_leg, road_km

COMPONENTS = ["interestMatch", "budgetMatch", "timeMatch", "distanceScore", "preferenceMatch"]


def interest_match(attraction: dict, weights: dict[str, float]) -> float:
    total = sum(weights.values())
    if total == 0:
        return 0.0
    return sum(weights.get(i, 0) for i in attraction["interests"]) / total


def budget_match(visit_cost: float, share: float) -> float:
    if visit_cost <= share:
        return 1.0
    return share / visit_cost


def time_match(attraction: dict, free_minutes: float, travel_minutes: float, period: str | None) -> float:
    needed = attraction["durationHours"] * 60 + travel_minutes
    fit = min(1.0, free_minutes / needed) if needed > 0 else 1.0
    if period and attraction["bestTime"] not in ("any", period):
        fit *= 0.5
    return max(0.0, fit)


def distance_score(distance_km: float, d_min: float, d_max: float) -> float:
    if d_max - d_min < 1e-9:
        return 1.0
    return 1 - (distance_km - d_min) / (d_max - d_min)


def preference_match(attraction: dict, crowd: str, travel_style: str) -> float:
    crowd_fit = config.CROWD_FIT.get(crowd, config.CROWD_FIT["balanced"])[attraction["crowdLevel"]]
    slot = config.TYPICAL_SLOT_HOURS.get(travel_style, 3.0)
    pace_fit = min(1.0, slot / attraction["durationHours"])
    return (crowd_fit + pace_fit) / 2


def best_interest(attraction: dict, weights: dict[str, float]) -> str | None:
    """The user's highest-weighted interest this place matches (explains "why")."""
    matched = [i for i in attraction["interests"] if weights.get(i)]
    return max(matched, key=lambda i: weights[i]) if matched else None


def combine(components: dict[str, float]) -> float:
    return sum(config.SCORE_WEIGHTS[name] * components[name] for name in COMPONENTS)


def activity_share(ctx: PlanContext) -> float:
    """Budget share for one visit (see BudgetMatch)."""
    visits = max(1, ctx.activities_per_day * ctx.days)
    return ctx.budget * config.ACTIVITY_BUDGET_SHARE / visits


def score_candidates(ctx: PlanContext, attractions: list[dict], reference: dict, free_minutes: float, period: str | None) -> list[dict]:
    """
    Score every attraction relative to a reference point (base or previous stop)
    and a free slot. Returns [{"attraction", "score", "components", "leg"}], best first.
    """
    if not attractions:
        return []
    inputs = ctx.inputs
    share = activity_share(ctx)
    distances = {a["id"]: road_km(reference, a["coordinates"]) for a in attractions}
    d_min, d_max = min(distances.values()), max(distances.values())

    scored = []
    for a in attractions:
        leg = plan_local_leg(ctx.catalog, reference, a["coordinates"], ctx.destination["id"], ctx.travelers, ctx.use_local_transport)
        leg_fare = leg["fare"] if leg else 0
        leg_minutes = leg["durationMinutes"] if leg else 0
        components = {
            "interestMatch": interest_match(a, ctx.weights),
            "budgetMatch": budget_match(a["entryFee"] * ctx.travelers + 2 * leg_fare, share),
            "timeMatch": time_match(a, free_minutes, leg_minutes, period),
            "distanceScore": distance_score(distances[a["id"]], d_min, d_max),
            "preferenceMatch": preference_match(a, inputs["crowd"], ctx.travel_style),
        }
        scored.append({"attraction": a, "score": combine(components), "components": components, "leg": leg})
    # Best score first; ties broken by id so results are always the same.
    return sorted(scored, key=lambda s: (-s["score"], s["attraction"]["id"]))


def rank_candidates(ctx: PlanContext) -> list[dict]:
    """
    The initial ranking: every attraction at the destination, scored from the
    base with the typical free slot for the chosen pace. Adds `bestInterest`
    to each attraction (used for "Why" texts and by the repair step).
    """
    attractions = [
        {**a, "bestInterest": best_interest(a, ctx.weights)}
        for a in ctx.catalog.attractions_for(ctx.destination["id"])
    ]
    free = config.TYPICAL_SLOT_HOURS.get(ctx.travel_style, 3.0) * 60
    return score_candidates(ctx, attractions, ctx.hub, free, period=None)
