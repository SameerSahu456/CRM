"""
Lead Service Layer

This module contains all business logic for lead management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.lead import Lead
from app.models.user import User
from app.repositories.lead_repository import LeadRepository
from app.schemas.lead_schema import LeadCreate, LeadOut, LeadUpdate
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import enforce_scope, get_scoped_user_ids


class LeadService:
    """
    Service class for lead business logic.

    Responsibilities:
    - Lead CRUD operations with business rules
    - Access control and scoping
    - Activity logging and audit trails
    - Lead statistics and analytics
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize LeadService.

        Args:
            db: Database session
        """
        self.db = db
        self.lead_repo = LeadRepository(db)

    async def list_leads(
        self,
        page: int,
        limit: int,
        user: User,
        stage: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[str] = None,
        source: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List leads with filtering, pagination, and access control.

        Args:
            page: Page number
            limit: Items per page
            user: Current authenticated user
            stage: Optional filter by stage
            priority: Optional filter by priority
            assigned_to: Optional filter by assigned user
            source: Optional filter by source

        Returns:
            Dictionary with 'data' and 'pagination'
        """
        # Build filters
        filters = []
        if stage:
            filters.append(Lead.stage == stage)
        if priority:
            filters.append(Lead.priority == priority)
        if assigned_to:
            filters.append(Lead.assigned_to == assigned_to)
        if source:
            filters.append(Lead.source == source)

        # Apply access control scoping
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Lead.assigned_to.in_(scoped_ids))

        # Get data from repository
        result = await self.lead_repo.get_with_assigned(
            page=page, limit=limit, filters=filters or None
        )

        # Transform data
        data = []
        for item in result["data"]:
            out = LeadOut.model_validate(item["lead"]).model_dump(by_alias=True)
            out["assignedToName"] = item["assigned_to_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_lead_stats(self, user: User) -> Dict[str, Any]:
        """
        Get lead statistics with access control.

        Args:
            user: Current authenticated user

        Returns:
            Lead statistics
        """
        filters = []
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Lead.assigned_to.in_(scoped_ids))

        return await self.lead_repo.get_stats(filters=filters or None)

    async def get_lead_by_id(self, lead_id: str, user: User) -> Dict[str, Any]:
        """
        Get a single lead by ID with access control.

        Args:
            lead_id: Lead UUID
            user: Current authenticated user

        Returns:
            Lead data

        Raises:
            NotFoundException: If lead not found
        """
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise NotFoundException("Lead not found")

        # Enforce access control
        await enforce_scope(lead, "assigned_to", user, self.db, resource_name="lead")

        return LeadOut.model_validate(lead).model_dump(by_alias=True)

    async def create_lead(self, lead_data: LeadCreate, user: User) -> Dict[str, Any]:
        """
        Create a new lead.

        Args:
            lead_data: Lead creation data
            user: Current authenticated user

        Returns:
            Created lead data
        """
        # Prepare data
        data = lead_data.model_dump(exclude_unset=True)

        # Set assigned_to to current user if not specified
        if "assigned_to" not in data or data["assigned_to"] is None:
            data["assigned_to"] = user.id

        # Create lead
        lead = await self.lead_repo.create(data)

        # Log activity
        await log_activity(self.db, user, "create", "lead", str(lead.id), lead.company_name)

        return LeadOut.model_validate(lead).model_dump(by_alias=True)

    async def update_lead(
        self, lead_id: str, lead_data: LeadUpdate, user: User
    ) -> Dict[str, Any]:
        """
        Update an existing lead.

        Args:
            lead_id: Lead UUID
            lead_data: Lead update data
            user: Current authenticated user

        Returns:
            Updated lead data

        Raises:
            NotFoundException: If lead not found
        """
        # Get existing lead
        old = await self.lead_repo.get_by_id(lead_id)
        if not old:
            raise NotFoundException("Lead not found")

        # Enforce access control
        await enforce_scope(old, "assigned_to", user, self.db, resource_name="lead")

        # Track changes for audit log
        old_data = model_to_dict(old)

        # Update lead
        lead = await self.lead_repo.update(
            lead_id, lead_data.model_dump(exclude_unset=True)
        )

        # Log activity with changes
        changes = compute_changes(old_data, model_to_dict(lead))
        await log_activity(
            self.db, user, "update", "lead", str(lead.id), lead.company, changes
        )

        return LeadOut.model_validate(lead).model_dump(by_alias=True)

    async def delete_lead(self, lead_id: str, user: User) -> bool:
        """
        Delete a lead.

        Args:
            lead_id: Lead UUID
            user: Current authenticated user

        Returns:
            True if successful

        Raises:
            NotFoundException: If lead not found
        """
        # Get existing lead
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise NotFoundException("Lead not found")

        # Enforce access control
        await enforce_scope(lead, "assigned_to", user, self.db, resource_name="lead")

        # Store company name before deletion
        company_name = lead.company

        # Delete lead
        await self.lead_repo.delete(lead_id)

        # Log activity
        await log_activity(self.db, user, "delete", "lead", lead_id, company_name)

        return True
