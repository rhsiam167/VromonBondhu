"""
Response shapes for the reference data. Field names match the frontend's
src/data/*.js files (camelCase, nested coordinates) so the frontend could use
them directly. Prices carry source = "sample-estimate".
"""
from app.schemas.common import CamelModel


class Coordinates(CamelModel):
    lat: float
    lng: float


class DestinationOut(CamelModel):
    id: str
    name: str
    name_bn: str
    division: str
    categories: list[str]
    description: str
    image_key: str
    starting_city: bool
    typical_days: int
    featured: bool


class AttractionOut(CamelModel):
    id: str
    destination_id: str
    name: str
    image_key: str
    coordinates: Coordinates
    interests: list[str]
    description: str
    duration_hours: float
    entry_fee: int
    crowd_level: str
    best_time: str
    source: str


class HotelOut(CamelModel):
    id: str
    destination_id: str
    name: str
    price_tier: str
    price_per_night: int
    highlight: str
    image_key: str
    source: str


class RestaurantOut(CamelModel):
    id: str
    destination_id: str
    name: str
    cuisine: str
    price_tier: str
    avg_cost_per_person: int
    food_tags: list[str]
    highlight: str
    image_key: str
    source: str


class LocalModeOut(CamelModel):
    mode: str
    fare_per_ride: int


class TransportHubOut(CamelModel):
    destination_id: str
    coordinates: Coordinates
    has_airport: bool
    has_railway: bool
    local_modes: list[LocalModeOut]
    source: str
