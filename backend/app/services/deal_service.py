"""
Deal Service Layer

This module contains all business logic for deal management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.deal import Deal
from app.models.user import User
from app.repositories.deal_repository import DealRepository
from app.schemas.deal_schema import DealCreate, DealOut, DealUpdate
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
        result = await self.deal_repo.get_with_names(
            page=1, limit=1000, filters=filters or None
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

    async def update_deal(
        self, deal_id: str, deal_data: DealUpdate, user: User
    ) -> Dict[str, Any]:
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
        deal = await self.deal_repo.update(
            deal_id, deal_data.model_dump(exclude_unset=True)
        )

        # Log activity with changes
        changes = compute_changes(old_data, model_to_dict(deal))
        await log_activity(
            self.db, user, "update", "deal", str(deal.id), deal.name, changes
        )

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
