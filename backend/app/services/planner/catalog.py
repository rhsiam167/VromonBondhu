"""
CATALOG — the reference data the planner works on, as plain Python dicts.

The planner never talks to the database or to FastAPI. It receives a Catalog
built either from the seed JSON files (tests, demo) or from database rows
(the API). Every record keeps the same camelCase field names as the
frontend's src/data/*.js, so the logic reads the same on both sides.
"""
import json
from dataclasses import dataclass, field
from pathlib import Path

SEED_DIR = Path(__file__).resolve().parents[2] / "seed"


@dataclass
class Catalog:
    destinations: list[dict]
    attractions: list[dict]
    hotels: list[dict]
    restaurants: list[dict]
    transport_hubs: list[dict]  # [{"destinationId", "coordinates", "hasAirport", "hasRailway", "localModes"}]
    options: dict  # planning options (interests, travel styles, ...)
    _hubs: dict = field(init=False, repr=False)

    def __post_init__(self):
        self._hubs = {h["destinationId"]: h for h in self.transport_hubs}

    # ---- lookups (names are matched ignoring upper/lower case, like the frontend) ----

    def destination_by_name(self, name: str | None) -> dict | None:
        wanted = (name or "").strip().lower()
        return next((d for d in self.destinations if d["name"].lower() == wanted), None)

    def starting_city_by_name(self, name: str | None) -> dict | None:
        found = self.destination_by_name(name)
        return found if found and found["startingCity"] else None

    def starting_city_names(self) -> list[str]:
        return [d["name"] for d in self.destinations if d["startingCity"]]

    def attractions_for(self, destination_id: str) -> list[dict]:
        return [a for a in self.attractions if a["destinationId"] == destination_id]

    def hotels_for(self, destination_id: str) -> list[dict]:
        return [h for h in self.hotels if h["destinationId"] == destination_id]

    def restaurants_for(self, destination_id: str) -> list[dict]:
        return [r for r in self.restaurants if r["destinationId"] == destination_id]

    def hub(self, destination_id: str) -> dict | None:
        return self._hubs.get(destination_id)


def load_catalog_from_seed() -> Catalog:
    """Build a Catalog from app/seed/*.json (no database needed)."""

    def read(name: str):
        return json.loads((SEED_DIR / name).read_text(encoding="utf-8"))

    def by_id(rows: list[dict], key: str = "id") -> list[dict]:
        # Same order as the database version (app/services/catalog_repository.py),
        # so ties are broken identically whichever source is used.
        return sorted(rows, key=lambda row: row[key])

    return Catalog(
        destinations=by_id(read("destinations.json")),
        attractions=by_id(read("attractions.json")),
        hotels=by_id(read("hotels.json")),
        restaurants=by_id(read("restaurants.json")),
        transport_hubs=by_id(read("transport_hubs.json"), "destinationId"),
        options=read("planning_options.json"),
    )
