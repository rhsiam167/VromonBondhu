"""Completed trips: add completed_at to saved_trips.

Existing rows have not been marked completed, so they get NULL.

Revision ID: 0003_completed_trips
Revises: 0002_planned_and_saved
Create Date: 2026-09-29
"""
import sqlalchemy as sa
from alembic import op

revision = "0003_completed_trips"
down_revision = "0002_planned_and_saved"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("saved_trips", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("saved_trips", "completed_at")
