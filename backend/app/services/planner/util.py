"""
Small helpers shared by the planner modules.

`js_round` copies JavaScript's Math.round (halves round UP, e.g. 2.5 → 3,
-2.5 → -2). Python's built-in round() rounds halves to the nearest even
number (2.5 → 2), which would make some fares differ by a taka from the
frontend. Using js_round everywhere keeps the numbers identical.
"""
import math


def js_round(value: float) -> int:
    return math.floor(value + 0.5)


def format_taka(amount: float) -> str:
    """14200 → '৳14,200' (same as the frontend's formatTaka)."""
    return f"৳{js_round(amount or 0):,}"


def join_with_and(words: list[str]) -> str:
    """['Beach', 'Nature', 'Food'] → 'Beach, Nature & Food'."""
    if len(words) <= 1:
        return "".join(words)
    return f"{', '.join(words[:-1])} & {words[-1]}"


def round_up_quarter(minutes: float) -> int:
    """Round up to the next quarter hour (the frontend's roundUp)."""
    return math.ceil(minutes / 15) * 15


def label_for(options: list[dict], option_id: str) -> str:
    """Look up an option's label, e.g. label_for(INTERESTS, 'beach') → 'Beach'."""
    for option in options:
        if option["id"] == option_id:
            return option["label"]
    return option_id
