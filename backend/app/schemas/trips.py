"""
Request and response shapes for trips.

PlanRequest mirrors the frontend's planning inputs (context/TripPlanContext.jsx)
field for field, in camelCase. Every choice (interests, transport, pace, ...)
is checked against app/seed/planning_options.json — the same lists the
frontend offers — so a typo gives a clear 422 message instead of a crash.
"""
import json
import uuid
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from pydantic import Field, field_validator, model_validator

from app.schemas.common import CamelModel

OPTIONS_FILE = Path(__file__).resolve().parents[1] / "seed" / "planning_options.json"


@lru_cache
def planning_options() -> dict:
    return json.loads(OPTIONS_FILE.read_text(encoding="utf-8"))


def _ids(group: str) -> list[str]:
    return [o["id"] for o in planning_options()[group]]


def _check_choices(values: list[str], group: str, what: str) -> list[str]:
    allowed = _ids(group)
    for value in values:
        if value not in allowed:
            raise ValueError(f"Unknown {what} '{value}'. Choose from: {', '.join(allowed)}.")
    if len(set(values)) != len(values):
        raise ValueError(f"Each {what} can only be chosen once.")
    return values


class PlanRequest(CamelModel):
    """The planning inputs from the 6-step flow."""

    from_: str = Field(alias="from", min_length=1, max_length=100, description="Starting city, e.g. Dhaka")
    destination: str = Field(min_length=1, max_length=100)
    days: int = Field(ge=1, le=14)
    nights: int = Field(ge=0, le=14)
    travelers: int = Field(ge=1, le=20)
    start_date: str = Field(default="", description="Optional, YYYY-MM-DD")
    budget: int = Field(le=10_000_000, description="TOTAL for the whole group, in BDT")
    budget_mode: Literal["strict", "flexible"]
    budget_covers: list[str] = Field(default_factory=list, max_length=10)
    interests: list[str] = Field(min_length=1, max_length=10, description="Ranked, most important first")
    travel_style: str
    transport: list[str] = Field(default_factory=list, max_length=10)
    food: list[str] = Field(default_factory=list, max_length=10)
    accommodation: str
    crowd: str
    notes: str = Field(default="", max_length=1000)

    @field_validator("budget")
    @classmethod
    def budget_minimum(cls, value: int) -> int:
        minimum = planning_options()["budgetLimits"]["min"]
        if value < minimum:
            raise ValueError(f"Budget must be at least ৳{minimum:,}.")
        return value

    @field_validator("start_date")
    @classmethod
    def valid_date(cls, value: str) -> str:
        if value:
            try:
                date.fromisoformat(value)
            except ValueError as error:
                raise ValueError("Start date must look like 2026-12-31.") from error
        return value

    @field_validator("budget_covers")
    @classmethod
    def valid_covers(cls, value):
        return _check_choices(value, "budgetCovers", "budget item")

    @field_validator("interests")
    @classmethod
    def valid_interests(cls, value):
        return _check_choices(value, "interests", "interest")

    @field_validator("travel_style")
    @classmethod
    def valid_style(cls, value):
        return _check_choices([value], "travelStyles", "travel style")[0]

    @field_validator("transport")
    @classmethod
    def valid_transport(cls, value):
        return _check_choices(value, "transportOptions", "transport option")

    @field_validator("food")
    @classmethod
    def valid_food(cls, value):
        return _check_choices(value, "foodOptions", "food preference")

    @field_validator("accommodation")
    @classmethod
    def valid_accommodation(cls, value):
        return _check_choices([value], "accommodationTiers", "accommodation tier")[0]

    @field_validator("crowd")
    @classmethod
    def valid_crowd(cls, value):
        return _check_choices([value], "crowdOptions", "crowd preference")[0]

    @model_validator(mode="after")
    def nights_not_more_than_days(self):
        if self.nights > self.days:
            raise ValueError("Nights can’t be more than days.")
        return self

    def planner_inputs(self) -> dict:
        """The inputs in the frontend's exact field names, for the planner."""
        return self.model_dump(by_alias=True)


class SaveTripRequest(CamelModel):
    """
    Store a trip returned by /api/trips/generate. `trip` is stored as-is (a snapshot).
    saved = True  → the user pressed Save Trip (shown under "Saved Trips")
    saved = False → just planned (shown under "Recently Planned")
    """

    trip: dict[str, Any]
    saved: bool = True

    @field_validator("trip")
    @classmethod
    def looks_like_a_trip(cls, trip: dict) -> dict:
        required = ["title", "destinationId", "days", "travelers", "budget", "itinerary", "inputs"]
        missing = [key for key in required if key not in trip]
        if missing:
            raise ValueError(f"This doesn't look like a generated trip (missing: {', '.join(missing)}).")
        budget = trip["budget"]
        if not isinstance(budget, dict) or not {"total", "estimatedCost", "mode"} <= set(budget):
            raise ValueError("The trip's budget must include total, estimatedCost and mode.")
        if budget["mode"] not in ("strict", "flexible"):
            raise ValueError("The trip's budget mode must be 'strict' or 'flexible'.")
        for key in ("days", "travelers"):
            if not isinstance(trip[key], int) or trip[key] < 1:
                raise ValueError(f"The trip's {key} must be a positive whole number.")
        for key in ("total", "estimatedCost"):
            if not isinstance(budget[key], (int, float)) or budget[key] < 0:
                raise ValueError(f"The trip's budget {key} must be a number.")
        if not isinstance(trip["inputs"], dict) or not isinstance(trip["itinerary"], list):
            raise ValueError("The trip's inputs must be an object and its itinerary a list.")
        return trip


class UpdateTripRequest(CamelModel):
    """
    Change one of my trips. Send at least one field:
      saved     – mark a planned trip as saved (or un-save it)
      completed – mark a saved trip as completed (or back to upcoming)
    """

    saved: bool | None = None
    completed: bool | None = None

    @model_validator(mode="after")
    def something_to_change(self):
        if self.saved is None and self.completed is None:
            raise ValueError("Send 'saved' and/or 'completed'.")
        return self


class SavedTripOut(CamelModel):
    id: uuid.UUID
    saved: bool
    completed: bool
    completed_at: datetime | None
    title: str
    destination_id: str
    days: int
    travelers: int
    budget_total: int
    estimated_cost: int
    budget_mode: str
    created_at: datetime
    trip: dict[str, Any]
    inputs: dict[str, Any]
