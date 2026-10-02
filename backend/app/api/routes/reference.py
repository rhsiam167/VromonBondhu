"""
REFERENCE DATA (read-only, no login needed)
  GET /api/reference/destinations
  GET /api/reference/attractions?destinationId=coxs-bazar   (filter is optional)
  GET /api/reference/hotels?destinationId=...
  GET /api/reference/restaurants?destinationId=...
  GET /api/reference/transport?destinationId=...
All prices are sample estimates (source = "sample-estimate").
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.errors import ApiError
from app.database import get_db
from app.models import Attraction, Destination, Hotel, Restaurant, TransportHub
from app.schemas.reference import AttractionOut, DestinationOut, HotelOut, RestaurantOut, TransportHubOut

router = APIRouter(prefix="/reference", tags=["reference"])

DestinationFilter = Query(default=None, alias="destinationId", description="Only rows for this destination id")


def _check_destination(db: Session, destination_id: str | None) -> None:
    """Give a readable 422 if the destination filter isn't a known destination."""
    if destination_id is None or db.get(Destination, destination_id):
        return
    known = ", ".join(db.scalars(select(Destination.id).order_by(Destination.id)))
    raise ApiError(
        422,
        "validation_error",
        f"Unknown destination '{destination_id}'. Supported destinations: {known}.",
        [{"field": "destinationId", "message": f"'{destination_id}' is not a supported destination."}],
    )


def _rows(db: Session, model, destination_id: str | None, key):
    _check_destination(db, destination_id)
    query = select(model).order_by(key)
    if destination_id:
        query = query.where(model.destination_id == destination_id)
    return db.scalars(query).all()


@router.get("/destinations", response_model=list[DestinationOut])
def list_destinations(db: Session = Depends(get_db)):
    return db.scalars(select(Destination).order_by(Destination.name)).all()


@router.get("/attractions", response_model=list[AttractionOut])
def list_attractions(destination_id: str | None = DestinationFilter, db: Session = Depends(get_db)):
    return [
        AttractionOut(
            id=a.id,
            destination_id=a.destination_id,
            name=a.name,
            image_key=a.image_key,
            coordinates={"lat": a.lat, "lng": a.lng},
            interests=a.interests,
            description=a.description,
            duration_hours=a.duration_hours,
            entry_fee=a.entry_fee,
            crowd_level=a.crowd_level,
            best_time=a.best_time,
            source=a.source,
        )
        for a in _rows(db, Attraction, destination_id, Attraction.id)
    ]


@router.get("/hotels", response_model=list[HotelOut])
def list_hotels(destination_id: str | None = DestinationFilter, db: Session = Depends(get_db)):
    return _rows(db, Hotel, destination_id, Hotel.id)


@router.get("/restaurants", response_model=list[RestaurantOut])
def list_restaurants(destination_id: str | None = DestinationFilter, db: Session = Depends(get_db)):
    return _rows(db, Restaurant, destination_id, Restaurant.id)


@router.get("/transport", response_model=list[TransportHubOut])
def list_transport(destination_id: str | None = DestinationFilter, db: Session = Depends(get_db)):
    return [
        TransportHubOut(
            destination_id=t.destination_id,
            coordinates={"lat": t.lat, "lng": t.lng},
            has_airport=t.has_airport,
            has_railway=t.has_railway,
            local_modes=t.local_modes,
            source=t.source,
        )
        for t in _rows(db, TransportHub, destination_id, TransportHub.destination_id)
    ]
