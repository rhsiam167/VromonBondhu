"""
Builds the planner's Catalog from the DATABASE (the planner itself never
touches the database). Rows are turned back into the same plain dicts, with
the same camelCase names, as the seed files and the frontend's src/data.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Attraction, Destination, Hotel, Restaurant, TransportHub
from app.schemas.trips import planning_options
from app.services.planner.catalog import Catalog


def build_catalog(db: Session) -> Catalog:
    destinations = [
        {
            "id": d.id,
            "name": d.name,
            "nameBn": d.name_bn,
            "division": d.division,
            "categories": d.categories,
            "description": d.description,
            "imageKey": d.image_key,
            "startingCity": d.starting_city,
            "typicalDays": d.typical_days,
            "featured": d.featured,
        }
        for d in db.scalars(select(Destination).order_by(Destination.id))
    ]
    # Order by the seed order is not stored, so sort by id everywhere for stable results.
    attractions = [
        {
            "id": a.id,
            "destinationId": a.destination_id,
            "name": a.name,
            "imageKey": a.image_key,
            "coordinates": {"lat": a.lat, "lng": a.lng},
            "interests": a.interests,
            "description": a.description,
            "durationHours": a.duration_hours,
            "entryFee": a.entry_fee,
            "crowdLevel": a.crowd_level,
            "bestTime": a.best_time,
        }
        for a in db.scalars(select(Attraction).order_by(Attraction.id))
    ]
    hotels = [
        {
            "id": h.id,
            "destinationId": h.destination_id,
            "name": h.name,
            "priceTier": h.price_tier,
            "pricePerNight": h.price_per_night,
            "highlight": h.highlight,
            "imageKey": h.image_key,
        }
        for h in db.scalars(select(Hotel).order_by(Hotel.id))
    ]
    restaurants = [
        {
            "id": r.id,
            "destinationId": r.destination_id,
            "name": r.name,
            "cuisine": r.cuisine,
            "priceTier": r.price_tier,
            "avgCostPerPerson": r.avg_cost_per_person,
            "foodTags": r.food_tags,
            "highlight": r.highlight,
            "imageKey": r.image_key,
        }
        for r in db.scalars(select(Restaurant).order_by(Restaurant.id))
    ]
    hubs = [
        {
            "destinationId": t.destination_id,
            "coordinates": {"lat": t.lat, "lng": t.lng},
            "hasAirport": t.has_airport,
            "hasRailway": t.has_railway,
            "localModes": t.local_modes,
        }
        for t in db.scalars(select(TransportHub).order_by(TransportHub.destination_id))
    ]
    return Catalog(destinations, attractions, hotels, restaurants, hubs, planning_options())
