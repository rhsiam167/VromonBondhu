"""Initial tables: reference data, users and saved trips.

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-29
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

# JSONB on PostgreSQL (plain JSON elsewhere)
JSON_DOC = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.create_table(
        "destinations",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("name_bn", sa.String(100), nullable=False),
        sa.Column("division", sa.String(50), nullable=False),
        sa.Column("categories", JSON_DOC, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_key", sa.String(50), nullable=False),
        sa.Column("starting_city", sa.Boolean(), nullable=False),
        sa.Column("typical_days", sa.Integer(), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False),
    )

    op.create_table(
        "attractions",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("destination_id", sa.String(50), sa.ForeignKey("destinations.id"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("image_key", sa.String(50), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("interests", JSON_DOC, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("duration_hours", sa.Float(), nullable=False),
        sa.Column("entry_fee", sa.Integer(), nullable=False),
        sa.Column("crowd_level", sa.String(10), nullable=False),
        sa.Column("best_time", sa.String(10), nullable=False),
        sa.Column("source", sa.String(30), nullable=False),
    )
    op.create_index("ix_attractions_destination_id", "attractions", ["destination_id"])

    op.create_table(
        "hotels",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("destination_id", sa.String(50), sa.ForeignKey("destinations.id"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("price_tier", sa.String(20), nullable=False),
        sa.Column("price_per_night", sa.Integer(), nullable=False),
        sa.Column("highlight", sa.String(100), nullable=False),
        sa.Column("image_key", sa.String(50), nullable=False),
        sa.Column("source", sa.String(30), nullable=False),
    )
    op.create_index("ix_hotels_destination_id", "hotels", ["destination_id"])

    op.create_table(
        "restaurants",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("destination_id", sa.String(50), sa.ForeignKey("destinations.id"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("cuisine", sa.String(100), nullable=False),
        sa.Column("price_tier", sa.String(20), nullable=False),
        sa.Column("avg_cost_per_person", sa.Integer(), nullable=False),
        sa.Column("food_tags", JSON_DOC, nullable=False),
        sa.Column("highlight", sa.String(100), nullable=False),
        sa.Column("image_key", sa.String(50), nullable=False),
        sa.Column("source", sa.String(30), nullable=False),
    )
    op.create_index("ix_restaurants_destination_id", "restaurants", ["destination_id"])

    op.create_table(
        "transport_hubs",
        sa.Column("destination_id", sa.String(50), sa.ForeignKey("destinations.id"), primary_key=True),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("has_airport", sa.Boolean(), nullable=False),
        sa.Column("has_railway", sa.Boolean(), nullable=False),
        sa.Column("local_modes", JSON_DOC, nullable=False),
        sa.Column("source", sa.String(30), nullable=False),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "saved_trips",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("destination_id", sa.String(50), sa.ForeignKey("destinations.id"), nullable=False),
        sa.Column("days", sa.Integer(), nullable=False),
        sa.Column("travelers", sa.Integer(), nullable=False),
        sa.Column("budget_total", sa.Integer(), nullable=False),
        sa.Column("estimated_cost", sa.Integer(), nullable=False),
        sa.Column("budget_mode", sa.String(10), nullable=False),
        sa.Column("trip_json", JSON_DOC, nullable=False),
        sa.Column("inputs_json", JSON_DOC, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_saved_trips_user_id", "saved_trips", ["user_id"])


def downgrade() -> None:
    op.drop_table("saved_trips")
    op.drop_table("users")
    op.drop_table("transport_hubs")
    op.drop_table("restaurants")
    op.drop_table("hotels")
    op.drop_table("attractions")
    op.drop_table("destinations")
