"""
Lead Service Layer

This module contains all business logic for lead management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestException, NotFoundException
from app.models.activity_log import ActivityLog
from app.models.lead import Lead
from app.models.notification import Notification
from app.models.user import User
from app.repositories.lead_repository import LeadRepository
from app.repositories.sales_entry_repository import SalesEntryRepository
from app.schemas.activity_log_schema import ActivityLogOut
from app.schemas.lead_schema import (
    LeadActivityCreate,
    LeadActivityOut,
    LeadConvertRequest,
    LeadCreate,
    LeadOut,
    LeadUpdate,
)
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

    async def update_lead(self, lead_id: str, lead_data: LeadUpdate, user: User) -> Dict[str, Any]:
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
        lead = await self.lead_repo.update(lead_id, lead_data.model_dump(exclude_unset=True))

        # Log activity with changes
        changes = compute_changes(old_data, model_to_dict(lead))
        await log_activity(self.db, user, "update", "lead", str(lead.id), lead.company_name, changes)

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
        company_name = lead.company_name

        # Delete lead
        await self.lead_repo.delete(lead_id)

        # Log activity
        await log_activity(self.db, user, "delete", "lead", lead_id, company_name)

        return True

    async def update_lead_with_notifications(
        self, lead_id: str, lead_data: LeadUpdate, user: User
    ) -> Dict[str, Any]:
        """
        Update an existing lead with notification logic.

        Args:
            lead_id: Lead UUID
            lead_data: Lead update data
            user: Current authenticated user

        Returns:
            Updated lead data

        Raises:
            NotFoundException: If lead not found
        """
        old = await self.lead_repo.get_by_id(lead_id)
        if not old:
            raise NotFoundException("Lead not found")

        await enforce_scope(old, "assigned_to", user, self.db, resource_name="lead")
        old_data = model_to_dict(old)
        update_data = lead_data.model_dump(exclude_unset=True)

        lead = await self.lead_repo.update(lead_id, update_data)
        changes = compute_changes(old_data, model_to_dict(lead))
        await log_activity(
            self.db, user, "update", "lead", str(lead.id), lead.company_name, changes
        )

        # Notify Product Managers when lead moves to Negotiation stage
        if update_data.get("stage") == "Negotiation":
            await self._notify_product_managers_stage_change(lead, "Lead")

        return LeadOut.model_validate(lead).model_dump(by_alias=True)

    async def convert_lead(
        self, lead_id: str, convert_data: LeadConvertRequest, user: User
    ) -> Dict[str, Any]:
        """
        Convert a lead to a sale.

        Args:
            lead_id: Lead UUID
            convert_data: Conversion data
            user: Current authenticated user

        Returns:
            Dictionary with success status and sale_id

        Raises:
            NotFoundException: If lead not found
            BadRequestException: If lead already converted
        """
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise NotFoundException("Lead not found")

        await enforce_scope(lead, "assigned_to", user, self.db, resource_name="lead")

        if lead.stage == "Closed Won":
            raise BadRequestException("Lead already converted")

        # Create sales entry
        sales_repo = SalesEntryRepository(self.db)
        sale_data = {
            "partner_id": convert_data.partner_id,
            "product_id": convert_data.product_id,
            "salesperson_id": user.id,
            "customer_name": convert_data.customer_name or lead.company_name,
            "amount": convert_data.amount,
            "sale_date": convert_data.sale_date,
        }
        sale = await sales_repo.create(sale_data)

        # Update lead
        await self.lead_repo.update(
            lead_id,
            {
                "stage": "Closed Won",
                "won_sale_id": sale.id,
            },
        )

        # Add activity
        await self.lead_repo.create_activity(
            {
                "lead_id": lead_id,
                "activity_type": "converted",
                "title": "Lead converted to sale",
                "description": f"Sale amount: {convert_data.amount}",
                "created_by": user.id,
            }
        )

        return {"success": True, "sale_id": str(sale.id)}

    async def get_activities(self, lead_id: str) -> List[Dict[str, Any]]:
        """
        Get activities for a lead.

        Args:
            lead_id: Lead UUID

        Returns:
            List of activity dictionaries
        """
        rows = await self.lead_repo.get_activities(lead_id)
        activities = []
        for row in rows:
            out = LeadActivityOut.model_validate(row[0]).model_dump(by_alias=True)
            out["createdByName"] = row[1]
            activities.append(out)
        return activities

    async def add_activity(
        self, lead_id: str, activity_data: LeadActivityCreate, user: User
    ) -> Dict[str, Any]:
        """
        Add an activity to a lead.

        Args:
            lead_id: Lead UUID
            activity_data: Activity creation data
            user: Current authenticated user

        Returns:
            Created activity data

        Raises:
            NotFoundException: If lead not found
        """
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise NotFoundException("Lead not found")

        activity = await self.lead_repo.create_activity(
            {
                "lead_id": lead_id,
                "activity_type": activity_data.activity_type,
                "title": activity_data.title,
                "description": activity_data.description,
                "created_by": user.id,
            }
        )
        return LeadActivityOut.model_validate(activity).model_dump(by_alias=True)

    async def get_audit_log(self, lead_id: str) -> List[Dict[str, Any]]:
        """
        Get audit log for a lead.

        Args:
            lead_id: Lead UUID

        Returns:
            List of audit log entries
        """
        stmt = (
            select(ActivityLog)
            .where(ActivityLog.entity_type == "lead")
            .where(ActivityLog.entity_id == str(lead_id))
            .order_by(ActivityLog.created_at.desc())
        )
        result = await self.db.execute(stmt)
        logs = list(result.scalars().all())
        return [ActivityLogOut.model_validate(log).model_dump(by_alias=True) for log in logs]

    # ------------------------------------------------------------------
    # Kanban helpers
    # ------------------------------------------------------------------

    async def get_kanban_page(
        self,
        user: User,
        stage: str,
        page: int = 1,
        limit: int = 5,
        search: Optional[str] = None,
        assigned_to: Optional[str] = None,
        priority: Optional[str] = None,
        source: Optional[str] = None,
    ) -> Dict[str, Any]:
        filters = []
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Lead.assigned_to.in_(scoped_ids))
        if assigned_to:
            filters.append(Lead.assigned_to == assigned_to)
        if priority:
            filters.append(Lead.priority == priority)
        if source:
            filters.append(Lead.source == source)
        if search:
            filters.append(Lead.company_name.ilike(f"%{search}%"))

        result = await self.lead_repo.get_kanban_page(
            stage=stage, page=page, limit=limit, filters=filters or None
        )

        data = []
        for item in result["data"]:
            out = LeadOut.model_validate(item["lead"]).model_dump(by_alias=True)
            out["assignedToName"] = item["assigned_to_name"]
            data.append(out)

        return {
            "entity": "LEAD",
            "status": stage,
            "data": data,
            "pagination": result["pagination"],
        }

    async def get_stage_counts(self, user: User) -> Dict[str, int]:
        filters = []
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Lead.assigned_to.in_(scoped_ids))
        return await self.lead_repo.get_stage_counts(filters=filters or None)

    async def update_stage(self, lead_id: str, new_stage: str, user: User) -> Dict[str, Any]:
        old = await self.lead_repo.get_by_id(lead_id)
        if not old:
            raise NotFoundException("Lead not found")
        await enforce_scope(old, "assigned_to", user, self.db, resource_name="lead")

        old_data = model_to_dict(old)
        lead = await self.lead_repo.update(lead_id, {"stage": new_stage})
        changes = compute_changes(old_data, model_to_dict(lead))
        await log_activity(self.db, user, "update", "lead", str(lead.id), lead.company_name, changes)

        if new_stage == "Negotiation":
            await self._notify_product_managers_stage_change(lead, "Lead")

        return LeadOut.model_validate(lead).model_dump(by_alias=True)

    async def reorder_leads(self, stage: str, ordered_ids: Sequence[str], user: User) -> bool:
        await self.lead_repo.bulk_update_order(stage, ordered_ids)
        return True

    async def _notify_product_managers_stage_change(self, entity: Any, entity_type: str) -> None:
        """
        Notify product managers when entity moves to Negotiation stage.

        Args:
            entity: The lead or deal entity
            entity_type: "Lead" or "Deal"
        """
        result = await self.db.execute(text("SELECT id FROM users WHERE role = 'productmanager'"))
        pm_users = result.fetchall()
        entity_name = getattr(entity, "company_name", "Unknown")

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
