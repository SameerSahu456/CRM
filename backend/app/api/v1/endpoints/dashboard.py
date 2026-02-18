from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.security import get_current_user
from app.models.user import User
from app.services.dashboard_service import DashboardService
from app.utils.response_utils import success_response

router = APIRouter()


@router.get("/")
async def dashboard_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get main dashboard statistics.

    Returns:
        Dashboard statistics including sales, partners, leads, and payments
    """
    service = DashboardService(db)
    data = await service.get_dashboard_stats(user)
    return success_response(data, "Dashboard statistics retrieved successfully")


@router.get("/monthly-stats")
async def monthly_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get last 12 months of sales data.

    Returns:
        List of monthly statistics with revenue and count
    """
    service = DashboardService(db)
    data = await service.get_monthly_stats(user)
    return success_response(data, "Monthly statistics retrieved successfully")


@router.get("/growth-stats")
async def growth_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Compare current month vs last month with recent sales.

    Returns:
        Growth statistics including current month, last month, growth percentage, and recent sales
    """
    service = DashboardService(db)
    data = await service.get_growth_stats(user)
    return success_response(data, "Growth statistics retrieved successfully")


@router.get("/all")
async def dashboard_all(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Single combined endpoint returning ALL dashboard data in one request.
    Optimized with minimal queries using aggregations.

    Returns:
        Comprehensive dashboard data including stats, growth, monthly data, lead/deal/task stats, breakdown, and assignee summary
    """
    service = DashboardService(db)
    data = await service.get_dashboard_all(user)
    return success_response(data, "Dashboard data retrieved successfully")


@router.get("/assignee/{user_id}")
async def assignee_detail(
    user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed analytics for a single assignee.

    Returns:
        Detailed analytics including sales, leads, deals, and tasks for the specified user
    """
    service = DashboardService(db)
    data = await service.get_assignee_detail(user_id, user)
    return success_response(data, "Assignee details retrieved successfully")
