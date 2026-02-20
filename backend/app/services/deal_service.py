"""
Deal Service Layer

This module contains all business logic for deal management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.deal import Deal
from app.models.deal_line_item import DealLineItem
from app.models.notification import Notification
from app.models.user import User
from app.repositories.deal_repository import DealRepository
from app.schemas.activity_log_schema import ActivityLogOut
from app.schemas.deal_schema import (
    DealActivityCreate,
    DealActivityOut,
    DealCreate,
    DealLineItemCreate,
    DealLineItemOut,
    DealOut,
    DealUpdate,
)
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import enforce_scope, get_scoped_user_ids


class DealService:
    """
    Service class for deal business logic.

    Responsibilities:
    - Deal CRUD operations with business rules
    - Access control and scoping
    - Activity logging and audit trails
    - Pipeline statistics and analytics
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize DealService.

        Args:
            db: Database session
        """
        self.db = db
        self.deal_repo = DealRepository(db)

    async def list_deals(
        self,
        page: int,
        limit: int,
        user: User,
        stage: Optional[str] = None,
        account_id: Optional[str] = None,
        owner: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List deals with filtering, pagination, and access control.

        Args:
            page: Page number
            limit: Items per page
            user: Current authenticated user
            stage: Optional filter by stage
            account_id: Optional filter by account
            owner: Optional filter by owner

        Returns:
            Dictionary with 'data' and 'pagination'
        """
        # Build filters
        filters = []
        if stage:
            filters.append(Deal.stage == stage)
        if account_id:
            filters.append(Deal.account_id == account_id)
        if owner:
            filters.append(Deal.owner_id == owner)

        # Apply access control scoping
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Deal.owner_id.in_(scoped_ids))

        # Get data from repository
        result = await self.deal_repo.get_with_names(
            page=page, limit=limit, filters=filters or None
        )

        # Transform data
        data = []
        for item in result["data"]:
            out = DealOut.model_validate(item["deal"]).model_dump(by_alias=True)
            out["accountName"] = item["account_name"]
            out["contactName"] = item["contact_name"]
            out["ownerName"] = item["owner_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_pipeline_stats(self, user: User) -> Dict[str, Any]:
        """
        Get pipeline statistics with access control.

        Args:
            user: Current authenticated user

        Returns:
            Pipeline statistics
        """
        filters = []
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Deal.owner_id.in_(scoped_ids))

        return await self.deal_repo.get_pipeline_stats(filters=filters or None)

    async def get_pipeline_data(self, user: User) -> Dict[str, Any]:
        """
        Get pipeline data with access control.

        Args:
            user: Current authenticated user

        Returns:
            Pipeline data with all deals
        """
        filters = []
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Deal.owner_id.in_(scoped_ids))

        # Get all deals for pipeline view (using large limit)
        result = await self.deal_repo.get_with_names(page=1, limit=1000, filters=filters or None)

        # Transform data
        data = []
        for item in result["data"]:
            out = DealOut.model_validate(item["deal"]).model_dump(by_alias=True)
            out["accountName"] = item["account_name"]
            out["contactName"] = item["contact_name"]
            out["ownerName"] = item["owner_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_deal_by_id(self, deal_id: str, user: User) -> Dict[str, Any]:
        """
        Get a single deal by ID with access control.

        Args:
            deal_id: Deal UUID
            user: Current authenticated user

        Returns:
            Deal data

        Raises:
            NotFoundException: If deal not found
        """
        deal = await self.deal_repo.get_by_id(deal_id)
        if not deal:
            raise NotFoundException("Deal not found")

        # Enforce access control
        await enforce_scope(deal, "owner_id", user, self.db, resource_name="deal")

        return DealOut.model_validate(deal).model_dump(by_alias=True)

    async def create_deal(self, deal_data: DealCreate, user: User) -> Dict[str, Any]:
        """
        Create a new deal.

        Args:
            deal_data: Deal creation data
            user: Current authenticated user

        Returns:
            Created deal data
        """
        # Prepare data
        data = deal_data.model_dump(exclude_unset=True)

        # Set owner to current user if not specified
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user.id

        # Create deal
        deal = await self.deal_repo.create(data)

        # Log activity
        await log_activity(self.db, user, "create", "deal", str(deal.id), deal.name)

        return DealOut.model_validate(deal).model_dump(by_alias=True)

    async def update_deal(self, deal_id: str, deal_data: DealUpdate, user: User) -> Dict[str, Any]:
        """
        Update an existing deal.

        Args:
            deal_id: Deal UUID
            deal_data: Deal update data
            user: Current authenticated user

        Returns:
            Updated deal data

        Raises:
            NotFoundException: If deal not found
        """
        # Get existing deal
        old = await self.deal_repo.get_by_id(deal_id)
        if not old:
            raise NotFoundException("Deal not found")

        # Enforce access control
        await enforce_scope(old, "owner_id", user, self.db, resource_name="deal")

        # Track changes for audit log
        old_data = model_to_dict(old)

        # Update deal
        deal = await self.deal_repo.update(deal_id, deal_data.model_dump(exclude_unset=True))

        # Log activity with changes
        changes = compute_changes(old_data, model_to_dict(deal))
        await log_activity(self.db, user, "update", "deal", str(deal.id), deal.name, changes)

        return DealOut.model_validate(deal).model_dump(by_alias=True)

    async def delete_deal(self, deal_id: str, user: User) -> bool:
        """
        Delete a deal.

        Args:
            deal_id: Deal UUID
            user: Current authenticated user

        Returns:
            True if successful

        Raises:
            NotFoundException: If deal not found
        """
        # Get existing deal
        deal = await self.deal_repo.get_by_id(deal_id)
        if not deal:
            raise NotFoundException("Deal not found")

        # Enforce access control
        await enforce_scope(deal, "owner_id", user, self.db, resource_name="deal")

        # Store name before deletion
        deal_name = deal.name

        # Delete deal
        await self.deal_repo.delete(deal_id)

        # Log activity
        await log_activity(self.db, user, "delete", "deal", deal_id, deal_name)

        return True

    async def get_deal_with_line_items(self, deal_id: str, user: User) -> Dict[str, Any]:
        """
        Get a single deal by ID with line items.

        Args:
            deal_id: Deal UUID
            user: Current authenticated user

        Returns:
            Deal data with line items

        Raises:
            NotFoundException: If deal not found
        """
        result = await self.deal_repo.get_with_line_items(deal_id)
        if not result:
            raise NotFoundException("Deal not found")

        await enforce_scope(result["deal"], "owner_id", user, self.db, resource_name="deal")

        out = DealOut.model_validate(result["deal"]).model_dump(by_alias=True)
        out["accountName"] = result["account_name"]
        out["contactName"] = result["contact_name"]
        out["ownerName"] = result["owner_name"]
        out["lineItems"] = [
            DealLineItemOut.model_validate(item).model_dump(by_alias=True)
            for item in result["line_items"]
        ]

        return out

    async def create_deal_with_line_items(
        self, deal_data: DealCreate, user: User
    ) -> Dict[str, Any]:
        """
        Create a new deal with line items.

        Args:
            deal_data: Deal creation data with line items
            user: Current authenticated user

        Returns:
            Created deal data with line items
        """
        # Extract line items
        line_items = deal_data.line_items
        data = deal_data.model_dump(exclude_unset=True, exclude={"line_items"})

        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user.id

        # Create deal
        deal = await self.deal_repo.create(data)

        # Create line items
        for item in line_items:
            li = DealLineItem(**item.model_dump(), deal_id=deal.id)
            self.db.add(li)
        await self.db.flush()

        await log_activity(self.db, user, "create", "deal", str(deal.id), deal.name)

        # Return with line items
        result = await self.deal_repo.get_with_line_items(deal.id)
        out = DealOut.model_validate(result["deal"]).model_dump(by_alias=True)
        out["lineItems"] = [
            DealLineItemOut.model_validate(item).model_dump(by_alias=True)
            for item in result["line_items"]
        ]

        return out

    async def update_deal_with_line_items(
        self,
        deal_id: str,
        deal_data: DealUpdate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Update an existing deal with line items and notifications.

        Args:
            deal_id: Deal UUID
            deal_data: Deal update data with optional line items
            user: Current authenticated user

        Returns:
            Updated deal data with line items

        Raises:
            NotFoundException: If deal not found
        """
        old = await self.deal_repo.get_by_id(deal_id)
        if not old:
            raise NotFoundException("Deal not found")

        await enforce_scope(old, "owner_id", user, self.db, resource_name="deal")
        old_data = model_to_dict(old)

        # Update deal (exclude line items)
        update_data = deal_data.model_dump(exclude_unset=True, exclude={"line_items"})
        deal = await self.deal_repo.update(deal_id, update_data)

        # Replace line items if provided
        if deal_data.line_items is not None:
            await self.db.execute(delete(DealLineItem).where(DealLineItem.deal_id == deal_id))
            for item in deal_data.line_items:
                li = DealLineItem(**item.model_dump(), deal_id=deal.id)
                self.db.add(li)
            await self.db.flush()

        changes = compute_changes(old_data, model_to_dict(deal))
        await log_activity(self.db, user, "update", "deal", str(deal.id), deal.name, changes)

        # Notify Product Managers when deal moves to Negotiation stage
        if update_data.get("stage") == "Negotiation":
            await self._notify_product_managers_stage_change(deal, "Deal")

        # Notify deal owner when value is updated
        old_value = old_data.get("value")
        new_value = update_data.get("value")
        if new_value is not None and str(old_value) != str(new_value):
            await self._notify_owner_value_change(deal, old_value, new_value)

        # Return with line items
        result = await self.deal_repo.get_with_line_items(deal.id)
        out = DealOut.model_validate(result["deal"]).model_dump(by_alias=True)
        out["lineItems"] = [
            DealLineItemOut.model_validate(item).model_dump(by_alias=True)
            for item in result["line_items"]
        ]

        return out

    async def get_activities(self, deal_id: str) -> List[Dict[str, Any]]:
        """
        Get activities for a deal.

        Args:
            deal_id: Deal UUID

        Returns:
            List of activity dictionaries
        """
        rows = await self.deal_repo.get_activities(deal_id)
        activities = []
        for row in rows:
            out = DealActivityOut.model_validate(row[0]).model_dump(by_alias=True)
            out["createdByName"] = row[1]
            activities.append(out)
        return activities

    async def add_activity(
        self, deal_id: str, activity_data: DealActivityCreate, user: User
    ) -> Dict[str, Any]:
        """
        Add an activity to a deal.

        Args:
            deal_id: Deal UUID
            activity_data: Activity creation data
            user: Current authenticated user

        Returns:
            Created activity data

        Raises:
            NotFoundException: If deal not found
        """
        deal = await self.deal_repo.get_by_id(deal_id)
        if not deal:
            raise NotFoundException("Deal not found")

        activity = await self.deal_repo.create_activity(
            {
                "deal_id": deal_id,
                "activity_type": activity_data.activity_type,
                "title": activity_data.title,
                "description": activity_data.description,
                "created_by": user.id,
            }
        )
        return DealActivityOut.model_validate(activity).model_dump(by_alias=True)

    async def get_audit_log(self, deal_id: str) -> List[Dict[str, Any]]:
        """
        Get audit log for a deal.

        Args:
            deal_id: Deal UUID

        Returns:
            List of audit log entries
        """
        logs = await self.deal_repo.get_audit_logs(deal_id)
        return [ActivityLogOut.model_validate(log).model_dump(by_alias=True) for log in logs]

    async def _notify_product_managers_stage_change(self, entity: Any, entity_type: str) -> None:
        """
        Notify product managers when entity moves to Negotiation stage.

        Args:
            entity: The deal entity
            entity_type: "Deal"
        """
        result = await self.db.execute(text("SELECT id FROM users WHERE role = 'productmanager'"))
        pm_users = result.fetchall()
        entity_name = getattr(entity, "name", "Unknown")

        for pm in pm_users:
            notif = Notification(
                user_id=pm[0],
                type="stage_change",
                title=f"{entity_type} moved to Negotiation",
                message=f"{entity_type} '{entity_name}' has moved to Negotiation stage",
                is_read=False,
            )
            self.db.add(notif)
        await self.db.flush()

    async def _notify_owner_value_change(self, deal: Deal, old_value: Any, new_value: Any) -> None:
        """
        Notify deal owner when value is updated.

        Args:
            deal: The deal entity
            old_value: Previous value
            new_value: New value
        """
        owner_id = deal.owner_id
        if owner_id:
            old_display = f"₹{old_value:,.0f}" if old_value else "not set"
            new_display = f"₹{new_value:,.0f}" if new_value else "not set"
            notif = Notification(
                user_id=owner_id,
                type="value_change",
                title="Deal value updated",
                message=f"Deal '{deal.name}' value changed from {old_display} to {new_display}",
                is_read=False,
            )
            self.db.add(notif)
            await self.db.flush()
