"""
PREFERENCES — turning the user's ranked interests into weights.

WHAT IT IS: a simple, fixed formula (the same one the frontend uses):

    W_i = (N - Rank_i + 1) / N

where N is how many interests were chosen and Rank_i starts at 1 for the most
important one. With 4 interests the weights are 1.00, 0.75, 0.50, 0.25.

WHAT IT IS NOT: nothing is learned or estimated; it is plain arithmetic.
"""


def calculate_weight(rank: int, total_selected: int) -> float:
    """Weight of the interest at `rank` (1 = most important) out of `total_selected`."""
    if total_selected == 0:
        return 0.0
    return (total_selected - rank + 1) / total_selected


def interest_weights(ranked_interest_ids: list[str]) -> dict[str, float]:
    """['beach', 'nature'] → {'beach': 1.0, 'nature': 0.5}"""
    total = len(ranked_interest_ids)
    return {interest: calculate_weight(i + 1, total) for i, interest in enumerate(ranked_interest_ids)}
