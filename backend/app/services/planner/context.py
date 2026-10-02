"""
PLAN CONTEXT — the fixed facts about one planning request (who, where, how
many, which interests, which transport exists), worked out once and then
shared by the scoring, scheduling, constraint and repair modules.
"""
from dataclasses import dataclass, field

from app.services.planner.catalog import Catalog


@dataclass
class PlanContext:
    inputs: dict  # the planning inputs (frontend field names)
    catalog: Catalog
    destination: dict
    origin: dict
    weights: dict[str, float]  # interest id → weight (preferences.py)
    rank_of: dict[str, int]  # interest id → 0-based rank
    hub: dict  # {"lat", "lng"} of the destination's base
    route_options: list[dict]  # intercity options, cheapest first
    selected_modes: list[str]  # the user's intercity picks that exist on this route
    use_local_transport: bool
    activities_per_day: int  # from the travel style
    budget: int
    travelers: int
    days: int
    nights: int
    candidates: list[dict] = field(default_factory=list)  # scored attractions, best first
    mode_note: str | None = None  # why a mode was chosen when it wasn't the user's pick

    @property
    def option(self) -> dict[str, dict]:
        return {o["mode"]: o for o in self.route_options}

    @property
    def top_interest(self) -> str | None:
        return self.inputs["interests"][0] if self.inputs["interests"] else None

    @property
    def travel_style(self) -> str:
        return self.inputs["travelStyle"]
