"""
Email Template Service

This module contains business logic for email template management.
Follows SOLID principles and service layer architecture.
"""

from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.email_template import EmailTemplate
from app.models.user import User
from app.repositories.email_template_repository import EmailTemplateRepository
from app.schemas.email_template_schema import (
    EmailTemplateCreate,
    EmailTemplateOut,
    EmailTemplateUpdate,
)


class EmailTemplateService:
    """
    Service layer for email template business logic.

    Handles:
    - Email template listing with pagination and filtering
    - Email template retrieval
    - Email template creation
    - Email template updates
    - Email template deletion
    - Access control (sales users only see their own templates)
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.template_repo = EmailTemplateRepository(db)

    async def list_email_templates(
        self,
        page: int,
        limit: int,
        user: User,
    ) -> Dict[str, Any]:
        """
        List email templates with filtering and pagination.

        Args:
            page: Page number
            limit: Items per page
            user: Current user

        Returns:
            Dictionary with data and pagination info
        """
        filters = []

        # Sales users only see their own templates
        if user.role == "sales":
            filters.append(EmailTemplate.owner_id == user.id)

        result = await self.template_repo.get_with_owner(
            page=page, limit=limit, filters=filters or None
        )

        # Transform data to include owner name
        data = []
        for item in result["data"]:
            out = EmailTemplateOut.model_validate(item["template"]).model_dump(
                by_alias=True
            )
            out["ownerName"] = item["owner_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_email_template_by_id(
        self,
        template_id: str,
    ) -> Dict[str, Any]:
        """
        Get a single email template by ID.

        Args:
            template_id: Email template ID

        Returns:
            Email template dictionary

        Raises:
            NotFoundException: If email template not found
        """
        template = await self.template_repo.get_by_id(template_id)
        if not template:
            raise NotFoundException("Email template not found")

        return EmailTemplateOut.model_validate(template).model_dump(by_alias=True)

    async def create_email_template(
        self,
        template_data: EmailTemplateCreate,
        user: User,
    ) -> Dict[str, Any]:
        """
        Create a new email template.

        Args:
            template_data: Email template creation data
            user: Current user

        Returns:
            Created email template dictionary
        """
        data = template_data.model_dump(exclude_unset=True)

        # Set owner_id to current user if not provided
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user.id

        template = await self.template_repo.create(data)

        return EmailTemplateOut.model_validate(template).model_dump(by_alias=True)

    async def update_email_template(
        self,
        template_id: str,
        template_data: EmailTemplateUpdate,
    ) -> Dict[str, Any]:
        """
        Update an existing email template.

        Args:
            template_id: Email template ID
            template_data: Email template update data

        Returns:
            Updated email template dictionary

        Raises:
            NotFoundException: If email template not found
        """
        update_data = template_data.model_dump(exclude_unset=True)
        template = await self.template_repo.update(template_id, update_data)

        if not template:
            raise NotFoundException("Email template not found")

        return EmailTemplateOut.model_validate(template).model_dump(by_alias=True)

    async def delete_email_template(
        self,
        template_id: str,
    ) -> bool:
        """
        Delete an email template.

        Args:
            template_id: Email template ID

        Returns:
            True if deleted successfully

        Raises:
            NotFoundException: If email template not found
        """
        deleted = await self.template_repo.delete(template_id)

        if not deleted:
            raise NotFoundException("Email template not found")

        return True
