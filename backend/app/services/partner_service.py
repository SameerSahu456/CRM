"""
Partner Service

This module contains business logic for partner management.
Follows SOLID principles and service layer architecture.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ForbiddenException, NotFoundException
from app.models.partner import Partner
from app.models.user import User
from app.repositories.partner_repository import PartnerRepository
from app.schemas.partner_schema import (
    PartnerApproveRequest,
    PartnerCreate,
    PartnerOut,
    PartnerUpdate,
)
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import enforce_scope, get_scoped_user_ids


class PartnerService:
    """
    Service layer for partner business logic.

    Handles:
    - Partner listing with pagination and filtering
    - Partner retrieval
    - Partner creation
    - Partner updates
    - Partner deletion
    - Partner approval workflow
    - Partner tier targets management
    - Access control (scoped by assigned_to)
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.partner_repo = PartnerRepository(db)

    # ---------------------------------------------------------------------------
    # Partner Tier Targets
    # ---------------------------------------------------------------------------

    TARGET_KEYS = [
        "partner_target_elite",
        "partner_target_growth",
        "partner_target_new",
    ]

    async def _ensure_settings_table(self) -> None:
        """Create the settings table if it doesn't exist."""
        await self.db.execute(
            text(
                "CREATE TABLE IF NOT EXISTS settings ("
                "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
                "  key VARCHAR(100) UNIQUE NOT NULL,"
                "  value TEXT,"
                "  category VARCHAR(50),"
                "  updated_by UUID,"
                "  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
                ")"
            )
        )

    async def get_targets(self) -> Dict[str, str]:
        """
        Get partner tier targets.

        Returns:
            Dictionary with elite, growth, and new tier targets
        """
        try:
            await self._ensure_settings_table()
            result = await self.db.execute(
                text("SELECT key, value FROM settings WHERE key = ANY(:keys)"),
                {"keys": self.TARGET_KEYS},
            )
            rows = result.mappings().all()
            targets = {
                r["key"].replace("partner_target_", ""): (r["value"] or "")
                for r in rows
            }
            return {
                "elite": targets.get("elite", ""),
                "growth": targets.get("growth", ""),
                "new": targets.get("new", ""),
            }
        except Exception:
            return {"elite": "", "growth": "", "new": ""}

    async def save_targets(
        self,
        targets: Dict[str, str],
        user: User,
    ) -> bool:
        """
        Save partner tier targets.

        Args:
            targets: Dictionary with elite, growth, and new tier targets
            user: Current user (must be admin/superadmin)

        Returns:
            True if saved successfully

        Raises:
            ForbiddenException: If user is not admin/superadmin
        """
        if user.role not in ("admin", "superadmin"):
            raise ForbiddenException("Only admin/superadmin can set targets")

        await self._ensure_settings_table()

        for tier in ("elite", "growth", "new"):
            key = f"partner_target_{tier}"
            value = str(targets.get(tier, ""))
            existing = await self.db.execute(
                text("SELECT id FROM settings WHERE key = :key"), {"key": key}
            )
            if existing.first():
                await self.db.execute(
                    text(
                        "UPDATE settings SET value = :value, updated_by = :uid, "
                        "updated_at = NOW() WHERE key = :key"
                    ),
                    {"value": value, "uid": str(user.id), "key": key},
                )
            else:
                await self.db.execute(
                    text(
                        "INSERT INTO settings (key, value, category, updated_by) "
                        "VALUES (:key, :value, 'partner_targets', :uid)"
                    ),
                    {"key": key, "value": value, "uid": str(user.id)},
                )

        return True

    # ---------------------------------------------------------------------------
    # Partner CRUD Operations
    # ---------------------------------------------------------------------------

    async def list_partners(
        self,
        page: int,
        limit: int,
        user: User,
        status: Optional[str] = None,
        tier: Optional[str] = None,
        city: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List partners with filtering and pagination.

        Args:
            page: Page number
            limit: Items per page
            user: Current user
            status: Filter by status
            tier: Filter by tier
            city: Filter by city
            assigned_to: Filter by assigned user

        Returns:
            Dictionary with data and pagination info
        """
        filters = []
        if status:
            filters.append(Partner.status == status)
        if tier:
            filters.append(Partner.tier == tier)
        if city:
            filters.append(Partner.city == city)
        if assigned_to:
            filters.append(Partner.assigned_to == assigned_to)

        # Scope: non-admin users only see partners assigned to them/their team
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Partner.assigned_to.in_(scoped_ids))

        result = await self.partner_repo.get_with_assigned(
            page=page, limit=limit, filters=filters or None
        )

        # Transform data to include assigned_to name
        data = []
        for item in result["data"]:
            out = PartnerOut.model_validate(item["partner"]).model_dump(by_alias=True)
            out["assignedToName"] = item["assigned_to_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_my_partners(
        self,
        user: User,
    ) -> List[Dict[str, Any]]:
        """
        Get partners assigned to current user.

        Args:
            user: Current user

        Returns:
            List of partners
        """
        partners = await self.partner_repo.get_by_assigned(user.id)
        return [
            PartnerOut.model_validate(p).model_dump(by_alias=True) for p in partners
        ]

    async def get_pending_partners(
        self,
        user: User,
    ) -> List[Dict[str, Any]]:
        """
        Get pending partners.

        Args:
            user: Current user

        Returns:
            List of pending partners (scoped by access control)
        """
        partners = await self.partner_repo.get_pending()

        # Scope: non-admin users only see pending partners assigned to them/their team
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            partners = [p for p in partners if str(p.assigned_to) in scoped_ids]

        return [
            PartnerOut.model_validate(p).model_dump(by_alias=True) for p in partners
        ]

    async def get_partner_by_id(
        self,
        partner_id: str,
        user: User,
    ) -> Dict[str, Any]:
        """
        Get a single partner by ID.

        Args:
            partner_id: Partner ID
            user: Current user

        Returns:
            Partner dictionary

        Raises:
            NotFoundException: If partner not found
            ForbiddenException: If user doesn't have access
        """
        partner = await self.partner_repo.get_by_id(partner_id)
        if not partner:
            raise NotFoundException("Partner not found")

        await enforce_scope(
            partner, "assigned_to", user, self.db, resource_name="partner"
        )

        return PartnerOut.model_validate(partner).model_dump(by_alias=True)

    async def create_partner(
        self,
        partner_data: PartnerCreate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Create a new partner.

        Args:
            partner_data: Partner creation data
            user: Current user

        Returns:
            Created partner dictionary
        """
        data = partner_data.model_dump(exclude_unset=True)

        # Admin/superadmin can assign to any user; others default to self
        if "assigned_to" not in data or not data["assigned_to"]:
            data["assigned_to"] = user.id
        elif user.role not in ("admin", "superadmin"):
            data["assigned_to"] = user.id

        # New partners default to pending status
        data["status"] = "pending"

        partner = await self.partner_repo.create(data)

        await log_activity(
            self.db, user, "create", "partner", str(partner.id), partner.company_name
        )

        return PartnerOut.model_validate(partner).model_dump(by_alias=True)

    async def update_partner(
        self,
        partner_id: str,
        partner_data: PartnerUpdate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Update an existing partner.

        Args:
            partner_id: Partner ID
            partner_data: Partner update data
            user: Current user

        Returns:
            Updated partner dictionary

        Raises:
            NotFoundException: If partner not found
            ForbiddenException: If user doesn't have access
        """
        old = await self.partner_repo.get_by_id(partner_id)
        if not old:
            raise NotFoundException("Partner not found")

        await enforce_scope(old, "assigned_to", user, self.db, resource_name="partner")

        old_data = model_to_dict(old)
        partner = await self.partner_repo.update(
            partner_id, partner_data.model_dump(exclude_unset=True)
        )

        changes = compute_changes(old_data, model_to_dict(partner))
        await log_activity(
            self.db,
            user,
            "update",
            "partner",
            str(partner.id),
            partner.company_name,
            changes,
        )

        return PartnerOut.model_validate(partner).model_dump(by_alias=True)

    async def delete_partner(
        self,
        partner_id: str,
        user: User,
    ) -> bool:
        """
        Delete a partner.

        Args:
            partner_id: Partner ID
            user: Current user

        Returns:
            True if deleted successfully

        Raises:
            NotFoundException: If partner not found
            ForbiddenException: If user doesn't have access
        """
        partner = await self.partner_repo.get_by_id(partner_id)
        if not partner:
            raise NotFoundException("Partner not found")

        await enforce_scope(
            partner, "assigned_to", user, self.db, resource_name="partner"
        )

        partner_name = partner.company_name
        await self.partner_repo.delete(partner_id)

        await log_activity(self.db, user, "delete", "partner", partner_id, partner_name)

        return True

    async def approve_partner(
        self,
        partner_id: str,
        approval_data: PartnerApproveRequest,
        user: User,
    ) -> Dict[str, Any]:
        """
        Approve or reject a partner.

        Args:
            partner_id: Partner ID
            approval_data: Approval request data
            user: Current user (must be admin/businesshead)

        Returns:
            Updated partner dictionary

        Raises:
            NotFoundException: If partner not found
            ForbiddenException: If user doesn't have permission
        """
        allowed_roles = ["admin", "superadmin", "businesshead"]
        if user.role not in allowed_roles:
            raise ForbiddenException("Only admin/businesshead can approve partners")

        partner = await self.partner_repo.get_by_id(partner_id)
        if not partner:
            raise NotFoundException("Partner not found")

        old_data = model_to_dict(partner)

        if approval_data.approved:
            update_data = {
                "status": "approved",
                "approved_by": user.id,
                "approved_at": datetime.utcnow(),
            }
        else:
            update_data = {
                "status": "rejected",
                "rejection_reason": approval_data.rejection_reason or "Rejected",
            }

        updated = await self.partner_repo.update(partner_id, update_data)
        changes = compute_changes(old_data, model_to_dict(updated))
        action = "approve" if approval_data.approved else "reject"

        await log_activity(
            self.db, user, action, "partner", partner_id, partner.company_name, changes
        )

        return PartnerOut.model_validate(updated).model_dump(by_alias=True)
