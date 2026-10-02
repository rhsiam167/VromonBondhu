"""Planned vs saved trips: add is_saved and planner_trip_id to saved_trips.

Existing rows were all saved on purpose, so they get is_saved = true.

Revision ID: 0002_planned_and_saved
Revises: 0001_initial
Create Date: 2026-09-29
"""
import sqlalchemy as sa
from alembic import op

revision = "0002_planned_and_saved"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("saved_trips", sa.Column("is_saved", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("saved_trips", sa.Column("planner_trip_id", sa.String(64), nullable=True))
    op.create_index("ix_saved_trips_planner_trip_id", "saved_trips", ["planner_trip_id"])


def downgrade() -> None:
    op.drop_index("ix_saved_trips_planner_trip_id", table_name="saved_trips")
    op.drop_column("saved_trips", "planner_trip_id")
    op.drop_column("saved_trips", "is_saved")
