"""
SAVED TRIPS TABLE
-----------------
The trips in a user's "My Trips": every trip they PLANNED while logged in
(is_saved = False), and the ones they chose to SAVE (is_saved = True).

The full generated trip is stored as a JSON snapshot (trip_json) ON PURPOSE:
a stored itinerary must never change later when reference data (prices,
hotels, attractions) is updated. The few plain columns (title, days, cost, ...)
are copies for quick listing.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Uuid, true
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.types import JSON_DOC
from app.models.user import utc_now


class SavedTrip(Base):
    __tablename__ = "saved_trips"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    destination_id: Mapped[str] = mapped_column(ForeignKey("destinations.id"))
    days: Mapped[int] = mapped_column(Integer)
    travelers: Mapped[int] = mapped_column(Integer)
    budget_total: Mapped[int] = mapped_column(Integer)
    estimated_cost: Mapped[int] = mapped_column(Integer)
    budget_mode: Mapped[str] = mapped_column(String(10))  # strict / flexible
    trip_json: Mapped[dict] = mapped_column(JSON_DOC)  # full trip snapshot (frontend contract shape)
    inputs_json: Mapped[dict] = mapped_column(JSON_DOC)  # the planning inputs it was built from
    # False = planned (appears under "Recently Planned"); True = the user pressed Save Trip
    is_saved: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    # The planner's own id for the trip (trip_json["id"]), so the same trip is never stored twice
    planner_trip_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    # When the user marked the (saved) trip as completed; None = not marked (still upcoming)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
