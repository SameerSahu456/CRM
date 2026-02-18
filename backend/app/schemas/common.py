from __future__ import annotations

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    """Base model with automatic camelCase conversion for API responses."""

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class PaginationMeta(BaseModel):
    """Pagination metadata for list endpoints."""

    page: int
    limit: int
    total: int
    total_pages: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class StandardResponse(BaseModel, Generic[T]):
    """
    Standardized API response format.

    All API endpoints should return this structure:
    {
        "code": 200,
        "data": <payload>,
        "message": "Success",
        "pagination": {...}  // Optional, only for paginated lists
    }
    """

    code: int = Field(default=200, description="HTTP status code")
    data: T = Field(description="Response payload")
    message: str = Field(default="Success", description="Human-readable message")
    pagination: Optional[PaginationMeta] = Field(
        default=None,
        description="Pagination metadata (only for paginated list endpoints)",
    )


class ErrorResponse(BaseModel):
    """Standardized error response format."""

    code: int
    data: Any = None
    message: str


class DeleteResponse(BaseModel):
    """Response payload for successful delete operations."""

    success: bool = True


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Legacy paginated response format (deprecated).
    Use StandardResponse with pagination field instead.
    """

    data: list[T]
    pagination: PaginationMeta
