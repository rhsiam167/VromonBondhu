"""
ERROR HANDLING
--------------
Every error leaves the API in ONE consistent shape:

    {"error": {"code": "validation_error", "message": "Plain-English summary", "details": [...]}}

Validation problems (422) list each bad field with a readable message.
Unexpected crashes return a generic 500 message — stack traces are never sent
to the client (they are only printed in the server log).
"""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger("vromon.errors")


class ApiError(Exception):
    """Raise this from a route to send a clean error response."""

    def __init__(self, status_code: int, code: str, message: str, details: list[dict] | None = None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []


def error_response(status_code: int, code: str, message: str, details: list[dict] | None = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


def _readable(error: dict) -> dict:
    """Turn one Pydantic error into {"field": "...", "message": "..."}."""
    location = [str(part) for part in error.get("loc", []) if part not in ("body", "query", "path")]
    message = error.get("msg", "Invalid value.")
    message = message.removeprefix("Value error, ")  # our own validators already write full sentences
    if error.get("type") == "missing":
        message = "This field is required."
    return {"field": ".".join(location) or None, "message": message}


def register_error_handlers(app: FastAPI) -> None:
    from app.api.body_limit import RequestTooLarge
    from app.services.planner import PlannerInputError

    @app.exception_handler(RequestTooLarge)
    async def handle_too_large(_: Request, exc: RequestTooLarge):
        return error_response(413, "request_too_large", f"Request is too large (limit {exc.max_bytes // 1024} KB).")

    @app.exception_handler(PlannerInputError)
    async def handle_planner_input(_: Request, exc: PlannerInputError):
        return error_response(422, "validation_error", f"{exc.field}: {exc.message}", [{"field": exc.field, "message": exc.message}])

    @app.exception_handler(ApiError)
    async def handle_api_error(_: Request, exc: ApiError):
        return error_response(exc.status_code, exc.code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError):
        details = [_readable(e) for e in exc.errors()]
        first = details[0] if details else {"field": None, "message": "Invalid request."}
        summary = f"{first['field']}: {first['message']}" if first["field"] else first["message"]
        return error_response(422, "validation_error", summary, details)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(_: Request, exc: StarletteHTTPException):
        messages = {404: "Not found.", 405: "Method not allowed.", 413: "Request is too large."}
        message = exc.detail if isinstance(exc.detail, str) else messages.get(exc.status_code, "Request failed.")
        return error_response(exc.status_code, "http_error", message)

    @app.exception_handler(Exception)
    async def handle_unexpected(_: Request, exc: Exception):
        log.exception("Unexpected server error", exc_info=exc)
        return error_response(500, "server_error", "Something went wrong on our side. Please try again.")
