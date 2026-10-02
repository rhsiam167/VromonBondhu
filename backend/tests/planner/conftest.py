"""Shared helpers for the planner tests (no database or server needed)."""
import json
from pathlib import Path

import pytest

from app.services.planner import load_catalog_from_seed

GOLDEN = json.loads((Path(__file__).parent / "golden_values.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def catalog():
    return load_catalog_from_seed()


def make_inputs(**changes) -> dict:
    """A complete planning request (same fields as the frontend), with changes applied."""
    inputs = {
        "from": "Dhaka",
        "destination": "Cox's Bazar",
        "days": 4,
        "nights": 3,
        "travelers": 2,
        "startDate": "",
        "budget": 15000,
        "budgetMode": "strict",
        "budgetCovers": ["transportation", "accommodation", "food", "activities"],
        "interests": ["beach", "nature", "food", "photography"],
        "travelStyle": "balanced",
        "transport": [],
        "food": [],
        "accommodation": "mid-range",
        "crowd": "balanced",
        "notes": "",
    }
    inputs.update(changes)
    return inputs
