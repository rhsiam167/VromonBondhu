"""
VROMON BONDHU API — application entry point.

Start the server (from the backend folder, with the virtual environment active):
    uvicorn app.main:app --reload
Then open http://localhost:8000/docs for the interactive API documentation.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.body_limit import BodySizeLimitMiddleware
from app.api.errors import register_error_handlers
from app.api.routes import api_router
from app.config import get_settings

settings = get_settings()  # fails fast with a clear message if .env is missing or SECRET_KEY is weak

app = FastAPI(
    title="Vromon Bondhu API",
    description="Backend for ভ্রমণবন্ধু, a personalized travel planner for Bangladesh. "
    "All prices are sample estimates, not live prices.",
    version="0.3.0",
    debug=False,  # never send stack traces to the client
)

register_error_handlers(app)
app.include_router(api_router)

# Middleware runs outside-in in the REVERSE order it is added, so CORS (added
# last) is the outermost layer and even a 413 "too large" answer carries the
# CORS header the browser needs.
app.add_middleware(BodySizeLimitMiddleware, max_bytes=settings.max_request_bytes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,  # only the frontend(s) listed in .env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
