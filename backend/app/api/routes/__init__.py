"""All API routes. Each file is one group of endpoints under /api."""
from fastapi import APIRouter

from app.api.routes import auth, health, reference, trips

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(reference.router)
api_router.include_router(trips.router)
