"""
Email Service

This module contains business logic for email management.
Follows SOLID principles and service layer architecture.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.email import Email
from app.models.user import User
from app.repositories.email_repository import EmailRepository
from app.schemas.email_schema import EmailCreate, EmailOut, EmailUpdate


class EmailService:
    """
    Service layer for email business logic.

    Handles:
    - Email listing with pagination and filtering
    - Email retrieval
    - Email creation
    - Email updates
    - Email deletion
    - Email sending
    - Access control (sales users only see their own emails)
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.email_repo = EmailRepository(db)

    async def list_emails(
        self,
        page: int,
        limit: int,
        user: User,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List emails with filtering and pagination.

        Args:
            page: Page number
            limit: Items per page
            user: Current user
            status: Optional status filter

        Returns:
            Dictionary with data and pagination info
        """
        filters = []
        if status:
            filters.append(Email.status == status)

        # Sales users only see their own emails
        if user.role == "sales":
            filters.append(Email.owner_id == user.id)

        result = await self.email_repo.get_with_names(
            page=page, limit=limit, filters=filters or None
        )

        # Transform data to include related names
        data = []
        for item in result["data"]:
            out = EmailOut.model_validate(item["email"]).model_dump(by_alias=True)
            out["ownerName"] = item["owner_name"]
            out["templateName"] = item["template_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_email_by_id(
        self,
        email_id: str,
    ) -> Dict[str, Any]:
        """
        Get a single email by ID.

        Args:
            email_id: Email ID

        Returns:
            Email dictionary

        Raises:
            NotFoundException: If email not found
        """
        email = await self.email_repo.get_by_id(email_id)
        if not email:
            raise NotFoundException("Email not found")

        return EmailOut.model_validate(email).model_dump(by_alias=True)

    async def create_email(
        self,
        email_data: EmailCreate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Create a new email.

        Args:
            email_data: Email creation data
            user: Current user

        Returns:
            Created email dictionary
        """
        data = email_data.model_dump(exclude_unset=True)

        # Set owner_id to current user if not provided
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user.id

        email = await self.email_repo.create(data)

        return EmailOut.model_validate(email).model_dump(by_alias=True)

    async def update_email(
        self,
        email_id: str,
        email_data: EmailUpdate,
    ) -> Dict[str, Any]:
        """
        Update an existing email.

        Args:
            email_id: Email ID
            email_data: Email update data

        Returns:
            Updated email dictionary

        Raises:
            NotFoundException: If email not found
        """
        update_data = email_data.model_dump(exclude_unset=True)
        email = await self.email_repo.update(email_id, update_data)

        if not email:
            raise NotFoundException("Email not found")

        return EmailOut.model_validate(email).model_dump(by_alias=True)

    async def send_email(
        self,
        email_id: str,
    ) -> Dict[str, Any]:
        """
        Mark an email as sent.

        Args:
            email_id: Email ID

        Returns:
            Updated email dictionary

        Raises:
            NotFoundException: If email not found
        """
        email = await self.email_repo.update(
            email_id,
            {
                "status": "sent",
                "sent_at": datetime.now(timezone.utc),
            },
        )

        if not email:
            raise NotFoundException("Email not found")

        return EmailOut.model_validate(email).model_dump(by_alias=True)

    async def delete_email(
        self,
        email_id: str,
    ) -> bool:
        """
        Delete an email.

        Args:
            email_id: Email ID

        Returns:
            True if deleted successfully

        Raises:
            NotFoundException: If email not found
        """
        deleted = await self.email_repo.delete(email_id)

        if not deleted:
            raise NotFoundException("Email not found")

        return True
