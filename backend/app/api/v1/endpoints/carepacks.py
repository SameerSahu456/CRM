from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.carepack_schema import CarepackCreate, CarepackUpdate
from app.services.carepack_service import CarepackService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def list_carepacks(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: str = Query(None, description="Filter by status"),
    partner_id: str = Query(None, description="Filter by partner ID"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List carepacks with filtering and pagination.

    Args:
        page: Page number
        limit: Items per page
        status: Filter by status (active, expired, cancelled)
        partner_id: Filter by partner ID
        user: Current user
        db: Database session

    Returns:
        Paginated list of carepacks with partner names
    """
    service = CarepackService(db)
    result = await service.list_carepacks(
        page=page, limit=limit, status=status, partner_id=partner_id
    )

    return paginated_response(
        data=result["data"],
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Carepacks retrieved successfully",
    )


@router.get("/expiring", response_model=Dict[str, Any])
async def expiring_carepacks(
    days: int = Query(30, ge=1, le=365, description="Days to look ahead"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get carepacks expiring within the next N days.

    Args:
        days: Number of days to look ahead
        user: Current user
        db: Database session

    Returns:
        List of expiring carepacks with partner names
    """
    service = CarepackService(db)
    data = await service.get_expiring_carepacks(days=days)

    return success_response(
        data=data, message="Expiring carepacks retrieved successfully"
    )


@router.get("/{carepack_id}", response_model=Dict[str, Any])
async def get_carepack(
    carepack_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get a single carepack by ID.

    Args:
        carepack_id: Carepack ID
        user: Current user
        db: Database session

    Returns:
        Carepack dictionary
    """
    service = CarepackService(db)
    carepack = await service.get_carepack_by_id(carepack_id)

    return success_response(data=carepack, message="Carepack retrieved successfully")


@router.post("/", response_model=Dict[str, Any])
async def create_carepack(
    body: CarepackCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new carepack.

    Args:
        body: Carepack creation data
        user: Current user
        db: Database session

    Returns:
        Created carepack dictionary
    """
    service = CarepackService(db)
    carepack = await service.create_carepack(carepack_data=body, user=user)

    return created_response(data=carepack, message="Carepack created successfully")


@router.put("/{carepack_id}", response_model=Dict[str, Any])
async def update_carepack(
    carepack_id: str,
    body: CarepackUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing carepack.

    Args:
        carepack_id: Carepack ID
        body: Carepack update data
        user: Current user
        db: Database session

    Returns:
        Updated carepack dictionary
    """
    service = CarepackService(db)
    carepack = await service.update_carepack(
        carepack_id=carepack_id, carepack_data=body
    )

    return success_response(data=carepack, message="Carepack updated successfully")


@router.delete("/{carepack_id}", response_model=Dict[str, Any])
async def delete_carepack(
    carepack_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a carepack.

    Args:
        carepack_id: Carepack ID
        user: Current user
        db: Database session

    Returns:
        Success confirmation
    """
    service = CarepackService(db)
    await service.delete_carepack(carepack_id)

    return deleted_response(message="Carepack deleted successfully")
