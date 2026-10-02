"""
BUDGET — adding up what a plan costs.

WHAT IT IS: business logic (arithmetic on sample prices).

    Total = Transportation + Accommodation + Food + Activities
            + Local Transport + Miscellaneous

The total is computed FROM THE SCHEDULED DAYS: every fare comes from the same
travel legs that are shown in the itinerary ("Getting there: … ≈ ৳X"), so the
displayed fares and the budget breakdown always agree.

WHAT IT IS NOT: not a price predictor. All prices are sample estimates.
"""
import math

from app.services.planner import config
from app.services.planner.catalog import Catalog
from app.services.planner.util import js_round

CATEGORIES = ["transportation", "accommodation", "food", "activities", "localTransport"]


def rooms_for(travelers: int) -> int:
    return math.ceil(travelers / config.TRAVELERS_PER_ROOM)


def misc_for(subtotal: float) -> float:
    return subtotal * config.MISC_PERCENT


def cheapest_hotel_in_tier(catalog: Catalog, destination_id: str, tier: str) -> dict:
    """The cheapest listed hotel in a tier, or a generic sample stay priced from config."""
    in_tier = sorted(
        (h for h in catalog.hotels_for(destination_id) if h["priceTier"] == tier),
        key=lambda h: h["pricePerNight"],
    )
    if in_tier:
        return in_tier[0]
    return {
        "id": f"{destination_id}-{tier}-stay",
        "destinationId": destination_id,
        "name": f"{tier[0].upper()}{tier[1:]} stay",
        "priceTier": tier,
        "pricePerNight": config.HOTEL_PRICE_PER_ROOM_PER_NIGHT[tier],
        "highlight": "Sample price",
        "imageKey": {"budget": "guesthouse", "premium": "premium-hotel"}.get(tier, "city-hotel"),
    }


def plan_cost(days: list[dict]) -> dict:
    """
    Add up the costs recorded on each scheduled day.
    Returns {"breakdown": {...six categories...}, "total": int}.
    """
    breakdown = {key: js_round(sum(day["costs"][key] for day in days)) for key in CATEGORIES}
    subtotal = sum(breakdown.values())
    breakdown["miscellaneous"] = js_round(misc_for(subtotal))
    return {"breakdown": breakdown, "total": subtotal + breakdown["miscellaneous"]}


def day_totals(days: list[dict], total: int) -> list[int]:
    """Each day's own costs plus its share of miscellaneous, adding up exactly to `total`."""
    totals = []
    for day in days:
        subtotal = sum(day["costs"].values())
        totals.append(js_round(subtotal + misc_for(subtotal)))
    if totals:
        totals[-1] += total - sum(totals)  # rounding difference goes on the last day
    return totals
