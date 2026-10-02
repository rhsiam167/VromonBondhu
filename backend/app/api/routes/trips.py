"""
TRIPS
  POST   /api/trips/generate  – plan a trip (works for GUESTS, nothing is stored)
  POST   /api/trips           – store a generated trip: {"trip": {...}, "saved": true|false}  (login needed)
  GET    /api/trips           – my trips, newest first; ?saved=true|false to filter          (login needed)
  GET    /api/trips/{id}      – one of my trips                                              (login needed)
  PATCH  /api/trips/{id}      – mark it saved / completed: {"saved": true} {"completed": true} (login needed)
  DELETE /api/trips/{id}      – delete one of my trips                                       (login needed)

"Planned" trips (saved = false) are every trip the user generated while
logged in; "saved" trips are the ones they pressed Save Trip on. Storing the
same generated trip twice returns the existing record instead of a copy.

A user can only ever see or delete their OWN trips: someone else's trip id
answers "Trip not found" (404), exactly like an id that doesn't exist, so
trip ids of other users can't even be confirmed.
"""
import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.errors import ApiError
from app.database import get_db
from app.models import Destination, SavedTrip, User
from app.models.user import utc_now
from app.schemas.trips import PlanRequest, SavedTripOut, SaveTripRequest, UpdateTripRequest
from app.services.catalog_repository import build_catalog
from app.services.planner import generate_trip

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post(
    "/generate",
    summary="Plan a trip (guests allowed; nothing is saved)",
    response_description="The frontend contract: {status, trip, budgetReport, adjustmentsMade}",
)
def generate(body: PlanRequest, db: Session = Depends(get_db)) -> JSONResponse:
    catalog = build_catalog(db)
    inputs = body.planner_inputs()
    if catalog.starting_city_by_name(inputs["from"]) is None:
        supported = ", ".join(catalog.starting_city_names())
        raise ApiError(
            422,
            "validation_error",
            f"from: Please choose one of the supported starting cities ({supported}).",
            [{"field": "from", "message": "Please choose one of the supported starting cities."}],
        )
    # Returned as-is: the planner already builds the exact frontend shape (camelCase).
    return JSONResponse(generate_trip(inputs, catalog))


def _out(saved: SavedTrip) -> SavedTripOut:
    return SavedTripOut(
        id=saved.id,
        saved=saved.is_saved,
        completed=saved.completed_at is not None,
        completed_at=saved.completed_at,
        title=saved.title,
        destination_id=saved.destination_id,
        days=saved.days,
        travelers=saved.travelers,
        budget_total=saved.budget_total,
        estimated_cost=saved.estimated_cost,
        budget_mode=saved.budget_mode,
        created_at=saved.created_at,
        trip=saved.trip_json,
        inputs=saved.inputs_json,
    )


def _own_trip(db: Session, user: User, trip_id: uuid.UUID) -> SavedTrip:
    saved = db.get(SavedTrip, trip_id)
    if saved is None or saved.user_id != user.id:
        raise ApiError(404, "not_found", "Trip not found.")
    return saved


@router.post("", response_model=SavedTripOut, status_code=status.HTTP_201_CREATED, summary="Store a generated trip (planned or saved)")
def save_trip(body: SaveTripRequest, response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SavedTripOut:
    trip = body.trip
    if db.get(Destination, trip["destinationId"]) is None:
        raise ApiError(422, "validation_error", f"Unknown destination '{trip['destinationId']}'.", [{"field": "trip.destinationId", "message": "Unknown destination."}])

    # The same generated trip stored again → return the existing record (and mark it saved if asked).
    planner_id = str(trip.get("id") or "")[:64] or None
    if planner_id:
        existing = db.scalar(select(SavedTrip).where(SavedTrip.user_id == user.id, SavedTrip.planner_trip_id == planner_id))
        if existing:
            if body.saved and not existing.is_saved:
                existing.is_saved = True
                db.commit()
                db.refresh(existing)
            response.status_code = status.HTTP_200_OK
            return _out(existing)

    saved = SavedTrip(
        user_id=user.id,
        title=str(trip["title"])[:200],
        destination_id=trip["destinationId"],
        days=trip["days"],
        travelers=trip["travelers"],
        budget_total=round(trip["budget"]["total"]),
        estimated_cost=round(trip["budget"]["estimatedCost"]),
        budget_mode=trip["budget"]["mode"],
        trip_json=trip,  # the full snapshot — never recalculated later
        inputs_json=trip["inputs"],
        is_saved=body.saved,
        planner_trip_id=planner_id,
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return _out(saved)


@router.get("", response_model=list[SavedTripOut], summary="My trips (planned and saved)")
def list_trips(
    saved: bool | None = Query(default=None, description="true = only saved trips, false = only planned ones"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SavedTripOut]:
    query = select(SavedTrip).where(SavedTrip.user_id == user.id)
    if saved is not None:
        query = query.where(SavedTrip.is_saved == saved)
    rows = db.scalars(query.order_by(SavedTrip.created_at.desc()))
    return [_out(row) for row in rows]


@router.get("/{trip_id}", response_model=SavedTripOut, summary="One of my trips")
def get_trip(trip_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SavedTripOut:
    return _out(_own_trip(db, user, trip_id))


@router.patch("/{trip_id}", response_model=SavedTripOut, summary="Mark one of my trips as saved / completed (or not)")
def update_trip(trip_id: uuid.UUID, body: UpdateTripRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SavedTripOut:
    trip = _own_trip(db, user, trip_id)
    if body.saved is not None:
        trip.is_saved = body.saved
        if not body.saved:
            trip.completed_at = None  # an un-saved (planned) trip can't be completed
    if body.completed is not None:
        if body.completed and not trip.is_saved:
            raise ApiError(422, "validation_error", "Save the trip before marking it as completed.", [{"field": "completed", "message": "Only saved trips can be completed."}])
        if body.completed and trip.completed_at is None:
            trip.completed_at = utc_now()
        elif not body.completed:
            trip.completed_at = None
    db.commit()
    db.refresh(trip)
    return _out(trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete one of my trips")
def delete_trip(trip_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    db.delete(_own_trip(db, user, trip_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
