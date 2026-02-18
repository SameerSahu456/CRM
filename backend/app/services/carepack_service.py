"""
Carepack Service

This module contains business logic for carepack management.
Follows SOLID principles and service layer architecture.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.carepack import Carepack
from app.models.partner import Partner
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.carepack_schema import CarepackCreate, CarepackOut, CarepackUpdate


class CarepackService:
    """
    Service layer for carepack business logic.

    Handles:
    - Carepack listing with pagination and filtering
    - Carepack retrieval with partner names
    - Carepack creation
    - Carepack updates
    - Carepack deletion
    - Expiring carepacks tracking
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.carepack_repo = BaseRepository(db, Carepack)

    async def list_carepacks(
        self,
        page: int,
        limit: int,
        status: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List carepacks with filtering and pagination.

        Args:
            page: Page number
            limit: Items per page
            status: Filter by status (active, expired, cancelled)
            partner_id: Filter by partner ID

        Returns:
            Dictionary with data and pagination info
        """
        stmt = select(Carepack, Partner.company_name.label("partner_name")).outerjoin(
            Partner, Carepack.partner_id == Partner.id
        )
        count_stmt = select(func.count()).select_from(Carepack)

        filters = []
        if status:
            filters.append(Carepack.status == status)
        if partner_id:
            filters.append(Carepack.partner_id == partner_id)

        for f in filters:
            stmt = stmt.where(f)
            count_stmt = count_stmt.where(f)

        stmt = stmt.order_by(Carepack.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()

        data = []
        for row in rows:
            out = CarepackOut.model_validate(row[0]).model_dump(by_alias=True)
            out["partnerName"] = row[1]
            data.append(out)

        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()
        total_pages = (total + limit - 1) // limit

        return {
            "data": data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages,
            },
        }

    async def get_expiring_carepacks(self, days: int) -> List[Dict[str, Any]]:
        """
        Get carepacks expiring within the next N days.

        Args:
            days: Number of days to look ahead

        Returns:
            List of expiring carepacks with partner names
        """
        cutoff = date.today() + timedelta(days=days)

        stmt = (
            select(Carepack, Partner.company_name.label("partner_name"))
            .outerjoin(Partner, Carepack.partner_id == Partner.id)
            .where(Carepack.status == "active")
            .where(Carepack.end_date <= cutoff)
            .where(Carepack.end_date >= date.today())
            .order_by(Carepack.end_date)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        data = []
        for row in rows:
            out = CarepackOut.model_validate(row[0]).model_dump(by_alias=True)
            out["partnerName"] = row[1]
            data.append(out)

        return data

    async def get_carepack_by_id(self, carepack_id: str) -> Dict[str, Any]:
        """
        Get a single carepack by ID.

        Args:
            carepack_id: Carepack ID

        Returns:
            Carepack dictionary

        Raises:
            NotFoundException: If carepack not found
        """
        carepack = await self.carepack_repo.get_by_id(carepack_id)
        if not carepack:
            raise NotFoundException("Carepack not found")
        return CarepackOut.model_validate(carepack).model_dump(by_alias=True)

    async def create_carepack(
        self,
        carepack_data: CarepackCreate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Create a new carepack.

        Args:
            carepack_data: Carepack creation data
            user: Current user

        Returns:
            Created carepack dictionary
        """
        data = carepack_data.model_dump(exclude_unset=True)
        data["created_by"] = user.id
        carepack = await self.carepack_repo.create(data)
        return CarepackOut.model_validate(carepack).model_dump(by_alias=True)

    async def update_carepack(
        self,
        carepack_id: str,
        carepack_data: CarepackUpdate,
    ) -> Dict[str, Any]:
        """
        Update an existing carepack.

        Args:
            carepack_id: Carepack ID
            carepack_data: Carepack update data

        Returns:
            Updated carepack dictionary

        Raises:
            NotFoundException: If carepack not found
        """
        carepack = await self.carepack_repo.update(
            carepack_id, carepack_data.model_dump(exclude_unset=True)
        )
        if not carepack:
            raise NotFoundException("Carepack not found")
        return CarepackOut.model_validate(carepack).model_dump(by_alias=True)

    async def delete_carepack(self, carepack_id: str) -> bool:
        """
        Delete a carepack.

        Args:
            carepack_id: Carepack ID

        Returns:
            True if deleted successfully

        Raises:
            NotFoundException: If carepack not found
        """
        deleted = await self.carepack_repo.delete(carepack_id)
        if not deleted:
            raise NotFoundException("Carepack not found")
        return True
