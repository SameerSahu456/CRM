"""
Contact Service Layer

This module contains all business logic for contact management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.contact import Contact
from app.models.user import User
from app.repositories.contact_repository import ContactRepository
from app.schemas.contact_schema import ContactCreate, ContactOut, ContactUpdate
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import enforce_scope, get_scoped_user_ids


class ContactService:
    """
    Service class for contact business logic.

    Responsibilities:
    - Contact CRUD operations with business rules
    - Access control and scoping
    - Activity logging and audit trails
    - Data transformation and validation
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize ContactService.

        Args:
            db: Database session
        """
        self.db = db
        self.contact_repo = ContactRepository(db)

    async def list_contacts(
        self,
        page: int,
        limit: int,
        user: User,
        account_id: Optional[str] = None,
        status: Optional[str] = None,
        type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List contacts with filtering, pagination, and access control.

        Args:
            page: Page number
            limit: Items per page
            user: Current authenticated user
            account_id: Optional filter by account
            status: Optional filter by status
            type: Optional filter by type
            search: Optional search term for name

        Returns:
            Dictionary with 'data' and 'pagination'
        """
        # Build filters
        filters = []
        if account_id:
            filters.append(Contact.account_id == account_id)
        if status:
            filters.append(Contact.status == status)
        if type:
            filters.append(Contact.type == type)
        if search:
            filters.append(
                or_(
                    Contact.first_name.ilike(f"%{search}%"),
                    Contact.last_name.ilike(f"%{search}%"),
                )
            )

        # Apply access control scoping
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Contact.owner_id.in_(scoped_ids))

        # Get data from repository
        result = await self.contact_repo.get_with_names(
            page=page, limit=limit, filters=filters or None
        )

        # Transform data
        data = []
        for item in result["data"]:
            out = ContactOut.model_validate(item["contact"]).model_dump(by_alias=True)
            out["accountName"] = item["account_name"]
            out["ownerName"] = item["owner_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_contact_by_id(self, contact_id: str, user: User) -> Dict[str, Any]:
        """
        Get a single contact by ID with access control.

        Args:
            contact_id: Contact UUID
            user: Current authenticated user

        Returns:
            Contact data

        Raises:
            NotFoundException: If contact not found
        """
        contact = await self.contact_repo.get_by_id(contact_id)
        if not contact:
            raise NotFoundException("Contact not found")

        # Enforce access control
        await enforce_scope(contact, "owner_id", user, self.db, resource_name="contact")

        return ContactOut.model_validate(contact).model_dump(by_alias=True)

    async def create_contact(
        self, contact_data: ContactCreate, user: User
    ) -> Dict[str, Any]:
        """
        Create a new contact.

        Args:
            contact_data: Contact creation data
            user: Current authenticated user

        Returns:
            Created contact data
        """
        # Prepare data
        data = contact_data.model_dump(exclude_unset=True)

        # Set owner to current user if not specified
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user.id

        # Create contact
        contact = await self.contact_repo.create(data)

        # Build contact name for logging
        cname = (
            f"{contact.first_name} {getattr(contact, 'last_name', '') or ''}".strip()
        )

        # Log activity
        await log_activity(self.db, user, "create", "contact", str(contact.id), cname)

        return ContactOut.model_validate(contact).model_dump(by_alias=True)

    async def update_contact(
        self, contact_id: str, contact_data: ContactUpdate, user: User
    ) -> Dict[str, Any]:
        """
        Update an existing contact.

        Args:
            contact_id: Contact UUID
            contact_data: Contact update data
            user: Current authenticated user

        Returns:
            Updated contact data

        Raises:
            NotFoundException: If contact not found
        """
        # Get existing contact
        old = await self.contact_repo.get_by_id(contact_id)
        if not old:
            raise NotFoundException("Contact not found")

        # Enforce access control
        await enforce_scope(old, "owner_id", user, self.db, resource_name="contact")

        # Track changes for audit log
        old_data = model_to_dict(old)

        # Update contact
        contact = await self.contact_repo.update(
            contact_id, contact_data.model_dump(exclude_unset=True)
        )

        # Build contact name for logging
        cname = (
            f"{contact.first_name} {getattr(contact, 'last_name', '') or ''}".strip()
        )

        # Log activity with changes
        changes = compute_changes(old_data, model_to_dict(contact))
        await log_activity(
            self.db, user, "update", "contact", str(contact.id), cname, changes
        )

        return ContactOut.model_validate(contact).model_dump(by_alias=True)

    async def delete_contact(self, contact_id: str, user: User) -> bool:
        """
        Delete a contact.

        Args:
            contact_id: Contact UUID
            user: Current authenticated user

        Returns:
            True if successful

        Raises:
            NotFoundException: If contact not found
        """
        # Get existing contact
        contact = await self.contact_repo.get_by_id(contact_id)
        if not contact:
            raise NotFoundException("Contact not found")

        # Enforce access control
        await enforce_scope(contact, "owner_id", user, self.db, resource_name="contact")

        # Build contact name for logging
        cname = (
            f"{contact.first_name} {getattr(contact, 'last_name', '') or ''}".strip()
        )

        # Delete contact
        await self.contact_repo.delete(contact_id)

        # Log activity
        await log_activity(self.db, user, "delete", "contact", contact_id, cname)

        return True
