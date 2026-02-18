from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.email_template_schema import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
)
from app.services.email_template_service import EmailTemplateService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/")
async def list_email_templates(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List email templates with filtering and pagination.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = EmailTemplateService(db)
    result = await service.list_email_templates(page=page, limit=limit, user=user)

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Email templates retrieved successfully",
    )


@router.get("/{template_id}")
async def get_email_template(
    template_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single email template by ID.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = EmailTemplateService(db)
    template = await service.get_email_template_by_id(template_id=template_id)

    return success_response(
        data=template, message="Email template retrieved successfully"
    )


@router.post("/")
async def create_email_template(
    body: EmailTemplateCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new email template.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    service = EmailTemplateService(db)
    template = await service.create_email_template(template_data=body, user=user)

    return created_response(
        data=template, message="Email template created successfully"
    )


@router.put("/{template_id}")
async def update_email_template(
    template_id: str,
    body: EmailTemplateUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing email template.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = EmailTemplateService(db)
    template = await service.update_email_template(
        template_id=template_id, template_data=body
    )

    return success_response(
        data=template, message="Email template updated successfully"
    )


@router.delete("/{template_id}")
async def delete_email_template(
    template_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete an email template.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = EmailTemplateService(db)
    await service.delete_email_template(template_id=template_id)

    return deleted_response(message="Email template deleted successfully")
