"""
Shared schema pieces.

CamelModel: Python code uses snake_case (price_per_night) but the JSON sent to
and from the frontend uses camelCase (pricePerNight), exactly like the
frontend's JavaScript. Every API schema inherits from CamelModel.
"""
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class ErrorItem(BaseModel):
    field: str | None = None
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorItem] = []


class ErrorResponse(BaseModel):
    """Every error the API returns has this shape: {"error": {"code", "message", "details"}}."""

    error: ErrorBody
