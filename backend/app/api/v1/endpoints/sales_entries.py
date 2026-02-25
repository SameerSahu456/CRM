from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.schemas.sales_entry_schema import SalesEntryCreate, SalesEntryUpdate
from app.services.sales_entry_service import SalesEntryService
from app.utils.response_utils import (
    created_response,
    deleted_response,
    filter_fields,
    paginated_response,
    success_response,
)

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def list_sales_entries(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    partner_id: str = Query(None, description="Filter by partner ID"),
    product_id: str = Query(None, description="Filter by product ID"),
    salesperson_id: str = Query(None, description="Filter by salesperson ID"),
    payment_status: str = Query(None, description="Filter by payment status"),
    from_date: str = Query(None, description="Filter by sale date from"),
    to_date: str = Query(None, description="Filter by sale date to"),
    location_id: str = Query(None, description="Filter by location ID"),
    vertical_id: str = Query(None, description="Filter by vertical ID"),
    deal_id: str = Query(None, description="Filter by deal ID"),
    search: str = Query(None, description="Search by customer name"),
    fields: str = Query(None, description="Comma-separated camelCase field names to return"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List sales entries with extensive filtering and pagination.
    """
    service = SalesEntryService(db)
    result = await service.list_sales_entries(
        page=page,
        limit=limit,
        user=user,
        partner_id=partner_id,
        product_id=product_id,
        salesperson_id=salesperson_id,
        payment_status=payment_status,
        from_date=from_date,
        to_date=to_date,
        location_id=location_id,
        vertical_id=vertical_id,
        deal_id=deal_id,
        search=search,
    )

    data = filter_fields(result["data"], fields) if fields else result["data"]
    return paginated_response(
        data=data,
        page=page,
        limit=limit,
        total=result["pagination"]["total"],
        message="Sales entries retrieved successfully",
    )


@router.get("/summary", response_model=Dict[str, Any])
async def sales_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get sales summary with totals and counts.

    Args:
        user: Current user
        db: Database session

    Returns:
        Sales summary with total amount, count, commission, and payment status counts
    """
    service = SalesEntryService(db)
    summary = await service.get_sales_summary(user=user)

    return success_response(
        data=summary, message="Sales summary retrieved successfully"
    )


@router.get("/breakdown", response_model=Dict[str, Any])
async def sales_breakdown(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get sales breakdown by product, partner, and salesperson.

    Args:
        user: Current user
        db: Database session

    Returns:
        Sales breakdown with top 10 by product, partner, and salesperson
    """
    service = SalesEntryService(db)
    breakdown = await service.get_sales_breakdown(user=user)

    return success_response(
        data=breakdown, message="Sales breakdown retrieved successfully"
    )


@router.get("/collections", response_model=Dict[str, Any])
async def sales_collections(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get sales collections grouped by customer and payment status.

    Args:
        user: Current user
        db: Database session

    Returns:
        Collections grouped by pending, partial, and paid status
    """
    service = SalesEntryService(db)
    collections = await service.get_sales_collections(user=user)

    return success_response(
        data=collections, message="Sales collections retrieved successfully"
    )


@router.get("/{entry_id}", response_model=Dict[str, Any])
async def get_sales_entry(
    entry_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Get a single sales entry by ID."""
    service = SalesEntryService(db)
    entry = await service.get_sales_entry_by_id(entry_id=entry_id, user=user)
    return success_response(data=entry, message="Sales entry retrieved successfully")


@router.post("/", response_model=Dict[str, Any])
async def create_sales_entry(
    body: SalesEntryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new sales entry.

    Args:
        body: Sales entry creation data
        user: Current user
        db: Database session

    Returns:
        Created sales entry dictionary
    """
    service = SalesEntryService(db)
    entry = await service.create_sales_entry(sales_entry_data=body, user=user)

    return created_response(data=entry, message="Sales entry created successfully")


@router.put("/{entry_id}", response_model=Dict[str, Any])
async def update_sales_entry(
    entry_id: str,
    body: SalesEntryUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing sales entry.

    Args:
        entry_id: Sales entry ID
        body: Sales entry update data
        user: Current user
        db: Database session

    Returns:
        Updated sales entry dictionary
    """
    service = SalesEntryService(db)
    entry = await service.update_sales_entry(
        entry_id=entry_id, sales_entry_data=body, user=user
    )

    return success_response(data=entry, message="Sales entry updated successfully")


@router.delete("/{entry_id}", response_model=Dict[str, Any])
async def delete_sales_entry(
    entry_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a sales entry.

    Args:
        entry_id: Sales entry ID
        user: Current user
        db: Database session

    Returns:
        Success confirmation
    """
    service = SalesEntryService(db)
    await service.delete_sales_entry(entry_id=entry_id, user=user)

    return deleted_response(message="Sales entry deleted successfully")
