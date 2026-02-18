from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.partner_schema import (
    PartnerApproveRequest,
    PartnerCreate,
    PartnerUpdate,
)
from app.services.partner_service import PartnerService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    paginated_response,
    success_response,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Partner Tier Targets
# ---------------------------------------------------------------------------


@router.get("/targets")
async def get_targets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get partner tier targets.

    Returns standardized response:
    {
        "code": 200,
        "data": {"elite": "...", "growth": "...", "new": "..."},
        "message": "Success"
    }
    """
    service = PartnerService(db)
    targets = await service.get_targets()

    return success_response(
        data=targets, message="Partner targets retrieved successfully"
    )


@router.put("/targets")
async def save_targets(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Save partner tier targets. Admin/superadmin only.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Success"
    }
    """
    service = PartnerService(db)
    await service.save_targets(targets=body, user=user)

    return success_response(data=None, message="Partner targets saved successfully")


@router.get("/")
async def list_partners(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    tier: Optional[str] = Query(None, description="Filter by tier"),
    city: Optional[str] = Query(None, description="Filter by city"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List partners with filtering and pagination.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success",
        "pagination": {...}
    }
    """
    service = PartnerService(db)
    result = await service.list_partners(
        page=page,
        limit=limit,
        user=user,
        status=status,
        tier=tier,
        city=city,
        assigned_to=assigned_to,
    )

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Partners retrieved successfully",
    )


@router.get("/my")
async def my_partners(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get partners assigned to current user.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success"
    }
    """
    service = PartnerService(db)
    partners = await service.get_my_partners(user=user)

    return success_response(data=partners, message="My partners retrieved successfully")


@router.get("/pending")
async def pending_partners(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get pending partners.

    Returns standardized response:
    {
        "code": 200,
        "data": [...],
        "message": "Success"
    }
    """
    service = PartnerService(db)
    partners = await service.get_pending_partners(user=user)

    return success_response(
        data=partners, message="Pending partners retrieved successfully"
    )


@router.get("/{partner_id}")
async def get_partner(
    partner_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single partner by ID.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = PartnerService(db)
    partner = await service.get_partner_by_id(partner_id=partner_id, user=user)

    return success_response(data=partner, message="Partner retrieved successfully")


@router.post("/")
async def create_partner(
    body: PartnerCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new partner.

    Returns standardized response:
    {
        "code": 201,
        "data": {...},
        "message": "Created successfully"
    }
    """
    service = PartnerService(db)
    partner = await service.create_partner(partner_data=body, user=user)

    return created_response(data=partner, message="Partner created successfully")


@router.put("/{partner_id}")
async def update_partner(
    partner_id: str,
    body: PartnerUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing partner.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = PartnerService(db)
    partner = await service.update_partner(
        partner_id=partner_id, partner_data=body, user=user
    )

    return success_response(data=partner, message="Partner updated successfully")


@router.delete("/{partner_id}")
async def delete_partner(
    partner_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a partner.

    Returns standardized response:
    {
        "code": 200,
        "data": null,
        "message": "Deleted successfully"
    }
    """
    service = PartnerService(db)
    await service.delete_partner(partner_id=partner_id, user=user)

    return deleted_response(message="Partner deleted successfully")


@router.post("/{partner_id}/approve")
async def approve_partner(
    partner_id: str,
    body: PartnerApproveRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Approve or reject a partner.

    Returns standardized response:
    {
        "code": 200,
        "data": {...},
        "message": "Success"
    }
    """
    service = PartnerService(db)
    partner = await service.approve_partner(
        partner_id=partner_id, approval_data=body, user=user
    )

    action = "approved" if body.approved else "rejected"
    return success_response(data=partner, message=f"Partner {action} successfully")
