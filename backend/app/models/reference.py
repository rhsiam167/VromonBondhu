"""
REFERENCE DATA TABLES
---------------------
Destinations, attractions, hotels, restaurants and transport hubs. This data
is loaded from app/seed/*.json by `python -m app.seed` (exported from the
frontend's src/data/*.js). All prices are SAMPLE ESTIMATES, marked with
source = "sample-estimate" — not live prices.
"""
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.types import JSON_DOC


class Destination(Base):
    __tablename__ = "destinations"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # slug, e.g. "coxs-bazar"
    name: Mapped[str] = mapped_column(String(100), unique=True)
    name_bn: Mapped[str] = mapped_column(String(100))
    division: Mapped[str] = mapped_column(String(50))
    categories: Mapped[list[str]] = mapped_column(JSON_DOC)  # beach / nature / adventure / heritage / urban
    description: Mapped[str] = mapped_column(Text)
    image_key: Mapped[str] = mapped_column(String(50))
    starting_city: Mapped[bool] = mapped_column(Boolean, default=False)  # can a trip start here?
    typical_days: Mapped[int] = mapped_column(Integer)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)


class Attraction(Base):
    __tablename__ = "attractions"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    destination_id: Mapped[str] = mapped_column(ForeignKey("destinations.id"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    image_key: Mapped[str] = mapped_column(String(50))
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    interests: Mapped[list[str]] = mapped_column(JSON_DOC)  # interest ids it satisfies
    description: Mapped[str] = mapped_column(Text)
    duration_hours: Mapped[float] = mapped_column(Float)
    entry_fee: Mapped[int] = mapped_column(Integer)  # BDT per person (sample estimate)
    crowd_level: Mapped[str] = mapped_column(String(10))  # low / medium / high
    best_time: Mapped[str] = mapped_column(String(10))  # morning / afternoon / evening / any
    source: Mapped[str] = mapped_column(String(30), default="sample-estimate")


class Hotel(Base):
    __tablename__ = "hotels"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    destination_id: Mapped[str] = mapped_column(ForeignKey("destinations.id"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    price_tier: Mapped[str] = mapped_column(String(20))  # budget / mid-range / premium
    price_per_night: Mapped[int] = mapped_column(Integer)  # BDT per room (sample estimate)
    highlight: Mapped[str] = mapped_column(String(100))
    image_key: Mapped[str] = mapped_column(String(50))
    source: Mapped[str] = mapped_column(String(30), default="sample-estimate")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    destination_id: Mapped[str] = mapped_column(ForeignKey("destinations.id"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    cuisine: Mapped[str] = mapped_column(String(100))
    price_tier: Mapped[str] = mapped_column(String(20))
    avg_cost_per_person: Mapped[int] = mapped_column(Integer)  # BDT (sample estimate)
    food_tags: Mapped[list[str]] = mapped_column(JSON_DOC)
    highlight: Mapped[str] = mapped_column(String(100))
    image_key: Mapped[str] = mapped_column(String(50))
    source: Mapped[str] = mapped_column(String(30), default="sample-estimate")


class TransportHub(Base):
    """Transport facts for one destination (one row per destination)."""

    __tablename__ = "transport_hubs"

    destination_id: Mapped[str] = mapped_column(ForeignKey("destinations.id"), primary_key=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    has_airport: Mapped[bool] = mapped_column(Boolean)
    has_railway: Mapped[bool] = mapped_column(Boolean)
    # [{"mode": "cng", "farePerRide": 250}, ...] — typical fare per ride, per vehicle (sample estimate)
    local_modes: Mapped[list[dict]] = mapped_column(JSON_DOC)
    source: Mapped[str] = mapped_column(String(30), default="sample-estimate")
