"""
Contact API Endpoints

This module contains all HTTP endpoints for contact management.
Controllers are thin and delegate business logic to the ContactService.

Following SOLID principles:
- Single Responsibility: Controllers only handle HTTP request/response
- Dependency Inversion: Depends on service abstraction
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.contact_schema import ContactCreate, ContactUpdate
from app.services.contact_service import ContactService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    filter_fields,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/")
async def list_contacts(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    account_id: Optional[str] = Query(None, description="Filter by account"),
    status: Optional[str] = Query(None, description="Filter by status"),
    type: Optional[str] = Query(None, description="Filter by type"),
    search: Optional[str] = Query(None, description="Search by name"),
    fields: Optional[str] = Query(None, description="Comma-separated camelCase field names to return"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List contacts with filtering and pagination.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = ContactService(db)
    result = await service.list_contacts(
        page=page,
        limit=limit,
        user=user,
        account_id=account_id,
        status=status,
        type=type,
        search=search,
    )

    data = filter_fields(result["data"], fields) if fields else result["data"]
    return paginated_response(
        data=data,
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Contacts retrieved successfully",
    )


@router.get("/{contact_id}")
async def get_contact(
    contact_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single contact by ID.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = ContactService(db)
    contact = await service.get_contact_by_id(contact_id=contact_id, user=user)

    return success_response(data=contact, message="Contact retrieved successfully")


@router.post("/")
async def create_contact(
    body: ContactCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new contact.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    service = ContactService(db)
    contact = await service.create_contact(contact_data=body, user=user)

    return created_response(data=contact, message="Contact created successfully")


@router.put("/{contact_id}")
async def update_contact(
    contact_id: str,
    body: ContactUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing contact.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = ContactService(db)
    contact = await service.update_contact(
        contact_id=contact_id, contact_data=body, user=user
    )

    return success_response(data=contact, message="Contact updated successfully")


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a contact.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = ContactService(db)
    await service.delete_contact(contact_id=contact_id, user=user)

    return deleted_response(message="Contact deleted successfully")
