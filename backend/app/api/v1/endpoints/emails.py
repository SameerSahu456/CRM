"""
Email API Endpoints

This module contains all HTTP endpoints for email management.
Controllers are thin and delegate business logic to the EmailService.

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
from app.schemas.email_schema import EmailCreate, EmailOut, EmailUpdate
from app.services.email_service import EmailService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/")
async def list_emails(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List emails with filtering and pagination.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = EmailService(db)
    result = await service.list_emails(page=page, limit=limit, user=user, status=status)

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Emails retrieved successfully",
    )


@router.get("/{email_id}")
async def get_email(
    email_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single email by ID.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = EmailService(db)
    email = await service.get_email_by_id(email_id=email_id)

    return success_response(data=email, message="Email retrieved successfully")


@router.post("/")
async def create_email(
    body: EmailCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new email.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    service = EmailService(db)
    email = await service.create_email(email_data=body, user=user)

    return created_response(data=email, message="Email created successfully")


@router.put("/{email_id}")
async def update_email(
    email_id: str,
    body: EmailUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing email.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = EmailService(db)
    email = await service.update_email(email_id=email_id, email_data=body)

    return success_response(data=email, message="Email updated successfully")


@router.post("/{email_id}/send")
async def send_email(
    email_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Mark an email as sent.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = EmailService(db)
    email = await service.send_email(email_id=email_id)

    return success_response(data=email, message="Email sent successfully")


@router.delete("/{email_id}")
async def delete_email(
    email_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete an email.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = EmailService(db)
    await service.delete_email(email_id=email_id)

    return deleted_response(message="Email deleted successfully")
