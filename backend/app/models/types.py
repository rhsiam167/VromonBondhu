"""
Column types shared by the models.

JSON_DOC is stored as JSONB on PostgreSQL (fast, indexable JSON). On other
databases — only the SQLite database used by the automated tests — it falls
back to plain JSON, so the tests can run without a PostgreSQL server.
"""
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

JSON_DOC = JSON().with_variant(JSONB(), "postgresql")
