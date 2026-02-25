"""
Sales Entry Service

This module contains business logic for sales entry management.
Follows SOLID principles and service layer architecture.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.sales_entry import SalesEntry
from app.models.user import User
from app.repositories.sales_entry_repository import SalesEntryRepository
from app.schemas.sales_entry_schema import (
    SalesEntryCreate,
    SalesEntryOut,
    SalesEntryUpdate,
    SalesSummary,
)
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import enforce_scope, get_scoped_user_ids


class SalesEntryService:
    """
    Service layer for sales entry business logic.

    Handles:
    - Sales entry listing with extensive filtering
    - Sales summary and analytics
    - Sales breakdown by product, partner, salesperson
    - Collections tracking
    - Sales entry CRUD operations
    - Access control and scoping
    - Activity logging
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.sales_entry_repo = SalesEntryRepository(db)

    async def list_sales_entries(
        self,
        page: int,
        limit: int,
        user: User,
        partner_id: Optional[str] = None,
        product_id: Optional[str] = None,
        salesperson_id: Optional[str] = None,
        payment_status: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        location_id: Optional[str] = None,
        vertical_id: Optional[str] = None,
        deal_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List sales entries with filtering and pagination.

        Args:
            page: Page number
            limit: Items per page
            user: Current user
            partner_id: Filter by partner ID
            product_id: Filter by product ID
            salesperson_id: Filter by salesperson ID
            payment_status: Filter by payment status
            from_date: Filter by sale date from
            to_date: Filter by sale date to
            location_id: Filter by location ID
            vertical_id: Filter by vertical ID
            deal_id: Filter by deal ID
            search: Search by customer name

        Returns:
            Dictionary with data and pagination info
        """
        filters = []

        if partner_id:
            filters.append(SalesEntry.partner_id == partner_id)
        if deal_id:
            filters.append(SalesEntry.deal_id == deal_id)
        if product_id:
            filters.append(SalesEntry.product_id == product_id)
        if salesperson_id:
            filters.append(SalesEntry.salesperson_id == salesperson_id)
        if payment_status:
            filters.append(SalesEntry.payment_status == payment_status)
        if from_date:
            filters.append(SalesEntry.sale_date >= from_date)
        if to_date:
            filters.append(SalesEntry.sale_date <= to_date)
        if location_id:
            filters.append(SalesEntry.location_id == location_id)
        if vertical_id:
            filters.append(SalesEntry.vertical_id == vertical_id)
        if search:
            filters.append(SalesEntry.customer_name.ilike(f"%{search}%"))

        # Scope: non-admin users only see their own / team sales
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(SalesEntry.salesperson_id.in_(scoped_ids))

        result = await self.sales_entry_repo.get_with_names(
            page=page, limit=limit, filters=filters or None
        )

        data = []
        for item in result["data"]:
            entry = item["entry"]
            out = SalesEntryOut.model_validate(entry).model_dump(by_alias=True)
            out["partnerName"] = item["partner_name"]
            out["productName"] = item["product_name"]
            out["productNames"] = item["product_names"]
            out["salespersonName"] = item["salesperson_name"]
            data.append(out)

        return {
            "data": data,
            "pagination": result["pagination"],
        }

    async def get_sales_summary(self, user: User) -> Dict[str, Any]:
        """
        Get sales summary with totals and counts.

        Args:
            user: Current user

        Returns:
            Sales summary dictionary
        """
        filters = []
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(SalesEntry.salesperson_id.in_(scoped_ids))

        summary = await self.sales_entry_repo.get_summary(filters=filters or None)
        return SalesSummary(**summary).model_dump(by_alias=True)

    async def get_sales_breakdown(self, user: User) -> Dict[str, Any]:
        """
        Get sales breakdown by product, partner, and salesperson.

        Args:
            user: Current user

        Returns:
            Sales breakdown dictionary
        """
        filters = []
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(SalesEntry.salesperson_id.in_(scoped_ids))

        return await self.sales_entry_repo.get_breakdown(filters=filters or None)

    async def get_sales_collections(self, user: User) -> Dict[str, Any]:
        """
        Get sales collections grouped by customer and payment status.

        Args:
            user: Current user

        Returns:
            Collections dictionary with pending, partial, and paid
        """
        scoped_ids = await get_scoped_user_ids(user, self.db)
        stmt = (
            select(
                SalesEntry.customer_name,
                SalesEntry.payment_status,
                func.sum(SalesEntry.amount).label("total_amount"),
                func.count().label("entry_count"),
            )
            .group_by(SalesEntry.customer_name, SalesEntry.payment_status)
            .order_by(SalesEntry.customer_name)
        )
        if scoped_ids is not None:
            stmt = stmt.where(SalesEntry.salesperson_id.in_(scoped_ids))

        result = await self.db.execute(stmt)
        rows = result.all()

        pending, partial, paid = [], [], []
        for row in rows:
            item = {
                "customerName": row.customer_name or "Unknown",
                "totalAmount": float(row.total_amount),
                "entryCount": row.entry_count,
            }
            if row.payment_status in ("pending", "overdue"):
                pending.append(item)
            elif row.payment_status == "partial":
                partial.append(item)
            elif row.payment_status == "paid":
                paid.append(item)

        return {"pending": pending, "partialPending": partial, "paid": paid}

    async def create_sales_entry(
        self,
        sales_entry_data: SalesEntryCreate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Create a new sales entry.

        Args:
            sales_entry_data: Sales entry creation data
            user: Current user

        Returns:
            Created sales entry dictionary
        """
        data = sales_entry_data.model_dump(exclude_unset=True)
        if "salesperson_id" not in data or data["salesperson_id"] is None:
            data["salesperson_id"] = user.id

        # Convert UUID objects to strings for JSONB column
        if "product_ids" in data and data["product_ids"]:
            data["product_ids"] = [str(pid) for pid in data["product_ids"]]

        entry = await self.sales_entry_repo.create(data)
        await log_activity(
            self.db, user, "create", "sales_entry", str(entry.id), entry.customer_name
        )
        return SalesEntryOut.model_validate(entry).model_dump(by_alias=True)

    async def get_sales_entry_by_id(self, entry_id: str, user: User) -> Dict[str, Any]:
        """Get a single sales entry by ID."""
        entry = await self.sales_entry_repo.get_by_id(entry_id)
        if not entry:
            raise NotFoundException("Sales entry not found")
        await enforce_scope(entry, "salesperson_id", user, self.db, resource_name="sales entry")
        return SalesEntryOut.model_validate(entry).model_dump(by_alias=True)

    async def update_sales_entry(
        self,
        entry_id: str,
        sales_entry_data: SalesEntryUpdate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Update an existing sales entry.

        Args:
            entry_id: Sales entry ID
            sales_entry_data: Sales entry update data
            user: Current user

        Returns:
            Updated sales entry dictionary

        Raises:
            NotFoundException: If sales entry not found
        """
        old = await self.sales_entry_repo.get_by_id(entry_id)
        if not old:
            raise NotFoundException("Sales entry not found")

        await enforce_scope(
            old, "salesperson_id", user, self.db, resource_name="sales entry"
        )

        old_data = model_to_dict(old)
        update_data = sales_entry_data.model_dump(exclude_unset=True)

        # Convert UUID objects to strings for JSONB column
        if "product_ids" in update_data and update_data["product_ids"]:
            update_data["product_ids"] = [
                str(pid) for pid in update_data["product_ids"]
            ]

        entry = await self.sales_entry_repo.update(entry_id, update_data)
        changes = compute_changes(old_data, model_to_dict(entry))
        await log_activity(
            self.db,
            user,
            "update",
            "sales_entry",
            str(entry.id),
            entry.customer_name,
            changes,
        )
        return SalesEntryOut.model_validate(entry).model_dump(by_alias=True)

    async def delete_sales_entry(self, entry_id: str, user: User) -> bool:
        """
        Delete a sales entry.

        Args:
            entry_id: Sales entry ID
            user: Current user

        Returns:
            True if deleted successfully

        Raises:
            NotFoundException: If sales entry not found
        """
        entry = await self.sales_entry_repo.get_by_id(entry_id)
        if not entry:
            raise NotFoundException("Sales entry not found")

        await enforce_scope(
            entry, "salesperson_id", user, self.db, resource_name="sales entry"
        )

        entry_name = entry.customer_name
        await self.sales_entry_repo.delete(entry_id)
        await log_activity(self.db, user, "delete", "sales_entry", entry_id, entry_name)
        return True
