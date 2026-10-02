"""
Database table models. Importing this package registers every table with
Base.metadata (used by Alembic migrations and the tests).
"""
from app.models.reference import Attraction, Destination, Hotel, Restaurant, TransportHub
from app.models.saved_trip import SavedTrip
from app.models.user import User

__all__ = ["Attraction", "Destination", "Hotel", "Restaurant", "TransportHub", "User", "SavedTrip"]
