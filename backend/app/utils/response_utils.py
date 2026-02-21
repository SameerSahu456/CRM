"""
Utility functions for standardizing API responses.

This module provides helper functions to ensure all API endpoints
return consistent response structures following the pattern:
{
    "code": <HTTP status code>,
    "data": <payload>,
    "message": <human-readable message>,
    "pagination": <optional pagination metadata>
}
"""
from typing import Any, Dict, List, Optional, TypeVar, Generic
from app.schemas.common import PaginationMeta

T = TypeVar("T")


def success_response(
    data: Any,
    message: str = "Success",
    code: int = 200,
    pagination: Optional[PaginationMeta] = None,
) -> Dict[str, Any]:
    """
    Create a standardized success response.
    
    Args:
        data: The response payload (can be object, list, or None)
        message: Human-readable success message
        code: HTTP status code (default: 200)
        pagination: Optional pagination metadata for list endpoints
        
    Returns:
        Dictionary with standardized response structure
        
    Example:
        >>> success_response({"id": "123", "name": "John"})
        {"code": 200, "data": {"id": "123", "name": "John"}, "message": "Success"}
        
        >>> success_response([...], pagination=PaginationMeta(...))
        {"code": 200, "data": [...], "message": "Success", "pagination": {...}}
    """
    response = {
        "code": code,
        "data": data,
        "message": message,
    }
    
    if pagination is not None:
        if isinstance(pagination, dict):
            response["pagination"] = pagination
        else:
            response["pagination"] = pagination.model_dump(by_alias=True)
    
    return response


def created_response(
    data: Any,
    message: str = "Created successfully",
) -> Dict[str, Any]:
    """
    Create a standardized response for resource creation (201).
    
    Args:
        data: The created resource
        message: Success message
        
    Returns:
        Dictionary with code=201
    """
    return success_response(data=data, message=message, code=201)


def deleted_response(
    message: str = "Deleted successfully",
) -> Dict[str, Any]:
    """
    Create a standardized response for resource deletion.
    
    Args:
        message: Success message
        
    Returns:
        Dictionary with code=200 and data={success: true}
    """
    return success_response(
        data={"success": True},
        message=message,
        code=200,
    )


def paginated_response(
    data: List[Any],
    page: int,
    limit: int,
    total: int,
    message: str = "Success",
) -> Dict[str, Any]:
    """
    Create a standardized paginated response.
    
    Args:
        data: List of items for current page
        page: Current page number
        limit: Items per page
        total: Total number of items across all pages
        message: Success message
        
    Returns:
        Dictionary with data and pagination metadata
        
    Example:
        >>> paginated_response(data=[...], page=1, limit=20, total=100)
        {
            "code": 200,
            "data": [...],
            "message": "Success",
            "pagination": {
                "page": 1,
                "limit": 20,
                "total": 100,
                "totalPages": 5
            }
        }
    """
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    
    pagination = PaginationMeta(
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages,
    )
    
    return success_response(
        data=data,
        message=message,
        pagination=pagination,
    )


def no_content_response() -> Dict[str, Any]:
    """
    Create a standardized response for operations with no content (204).
    
    Returns:
        Dictionary with code=204 and empty data
    """
    return success_response(
        data=None,
        message="No content",
        code=204,
    )

