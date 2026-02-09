from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class StandardResponse(BaseModel, Generic[T]):
    code: int = 200
    data: T
    message: str = "Success"


class ErrorResponse(BaseModel):
    code: int
    data: Any = None
    message: str


class DeleteResponse(BaseModel):
    success: bool = True


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    pagination: PaginationMeta
