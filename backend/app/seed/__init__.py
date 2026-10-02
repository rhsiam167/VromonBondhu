"""
SEED DATA LOADER
----------------
Loads the reference data in app/seed/*.json (exported from the frontend by
backend/scripts/export_frontend_data.mjs) into the database.

It is IDEMPOTENT: running it again updates existing rows instead of adding
duplicates, because every row has a fixed id and is written with merge().
Run it with:  python -m app.seed
"""
import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Attraction, Destination, Hotel, Restaurant, TransportHub

SEED_DIR = Path(__file__).resolve().parent
SOURCE = "sample-estimate"


def read_json(name: str):
    return json.loads((SEED_DIR / name).read_text(encoding="utf-8"))


def load_reference_data(db: Session) -> dict[str, int]:
    """Insert or update every reference row. Returns how many rows of each kind."""
    counts = {}

    destinations = read_json("destinations.json")
    for d in destinations:
        db.merge(
            Destination(
                id=d["id"],
                name=d["name"],
                name_bn=d["nameBn"],
                division=d["division"],
                categories=d["categories"],
                description=d["description"],
                image_key=d["imageKey"],
                starting_city=d["startingCity"],
                typical_days=d["typicalDays"],
                featured=d["featured"],
            )
        )
    db.flush()  # destinations first — the other tables point to them
    counts["destinations"] = len(destinations)

    attractions = read_json("attractions.json")
    for a in attractions:
        db.merge(
            Attraction(
                id=a["id"],
                destination_id=a["destinationId"],
                name=a["name"],
                image_key=a["imageKey"],
                lat=a["coordinates"]["lat"],
                lng=a["coordinates"]["lng"],
                interests=a["interests"],
                description=a["description"],
                duration_hours=a["durationHours"],
                entry_fee=a["entryFee"],
                crowd_level=a["crowdLevel"],
                best_time=a["bestTime"],
                source=a.get("source", SOURCE),
            )
        )
    counts["attractions"] = len(attractions)

    hotels = read_json("hotels.json")
    for h in hotels:
        db.merge(
            Hotel(
                id=h["id"],
                destination_id=h["destinationId"],
                name=h["name"],
                price_tier=h["priceTier"],
                price_per_night=h["pricePerNight"],
                highlight=h["highlight"],
                image_key=h["imageKey"],
                source=h.get("source", SOURCE),
            )
        )
    counts["hotels"] = len(hotels)

    restaurants = read_json("restaurants.json")
    for r in restaurants:
        db.merge(
            Restaurant(
                id=r["id"],
                destination_id=r["destinationId"],
                name=r["name"],
                cuisine=r["cuisine"],
                price_tier=r["priceTier"],
                avg_cost_per_person=r["avgCostPerPerson"],
                food_tags=r["foodTags"],
                highlight=r["highlight"],
                image_key=r["imageKey"],
                source=r.get("source", SOURCE),
            )
        )
    counts["restaurants"] = len(restaurants)

    hubs = read_json("transport_hubs.json")
    for t in hubs:
        db.merge(
            TransportHub(
                destination_id=t["destinationId"],
                lat=t["coordinates"]["lat"],
                lng=t["coordinates"]["lng"],
                has_airport=t["hasAirport"],
                has_railway=t["hasRailway"],
                local_modes=t["localModes"],
                source=t.get("source", SOURCE),
            )
        )
    counts["transport_hubs"] = len(hubs)

    db.commit()
    return counts
