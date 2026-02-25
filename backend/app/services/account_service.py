"""
Account Service Layer

This service handles all business logic for account management,
following the Service Layer pattern and SOLID principles.

Responsibilities:
- Business logic and validation
- Orchestration of repository calls
- Data transformation and formatting
- Activity logging
- Access control enforcement
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.models.account import Account
from app.models.user import User
from app.repositories.account_repository import AccountRepository
from app.repositories.contact_repository import ContactRepository
from app.repositories.deal_repository import DealRepository
from app.schemas.account_schema import AccountCreate, AccountOut, AccountUpdate
from app.schemas.contact_schema import ContactOut
from app.schemas.deal_schema import DealOut
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import enforce_scope, get_scoped_user_ids


class AccountService:
    """Service for account-related business operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.account_repo = AccountRepository(db)
        self.contact_repo = ContactRepository(db)
        self.deal_repo = DealRepository(db)

    async def list_accounts(
        self,
        page: int,
        limit: int,
        user: User,
        status: Optional[str] = None,
        industry: Optional[str] = None,
        search: Optional[str] = None,
        account_type: Optional[str] = None,
        tag: Optional[str] = None,
        type_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List accounts with filtering and pagination.

        Args:
            page: Page number (1-indexed)
            limit: Items per page
            user: Current authenticated user
            status: Optional status filter
            industry: Optional industry filter
            search: Optional search term for account name
            account_type: Optional account type filter (Channel Partner/End Customer)
            tag: Optional tag filter (Digital Account/Existing Account)
            type_filter: Optional type filter (Hunting/Farming/Cold)

        Returns:
            Dictionary with 'data' (list of accounts) and 'pagination' metadata
        """
        # Build filters
        filters = []
        if status:
            filters.append(Account.status == status)
        if industry:
            filters.append(Account.industry == industry)
        if search:
            filters.append(Account.name.ilike(f"%{search}%"))
        if account_type:
            filters.append(Account.account_type == account_type)
        if tag:
            filters.append(Account.tag == tag)
        if type_filter:
            filters.append(Account.type == type_filter)

        # Apply access control: non-admin users only see their team's accounts
        scoped_ids = await get_scoped_user_ids(user, self.db)
        if scoped_ids is not None:
            filters.append(Account.owner_id.in_(scoped_ids))

        # Fetch from repository
        result = await self.account_repo.get_with_owner(
            page=page, limit=limit, filters=filters or None
        )

        # Transform data
        data = []
        for item in result["data"]:
            out = AccountOut.model_validate(item["account"]).model_dump(by_alias=True)
            out["ownerName"] = item["owner_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def get_account_by_id(self, account_id: str, user: User) -> Dict[str, Any]:
        """
        Get a single account by ID.

        Args:
            account_id: Account UUID
            user: Current authenticated user

        Returns:
            Account data as dictionary

        Raises:
            NotFoundException: If account not found
        """
        account = await self.account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundException("Account not found")

        # Enforce access control
        await enforce_scope(account, "owner_id", user, self.db, resource_name="account")

        return AccountOut.model_validate(account).model_dump(by_alias=True)

    async def create_account(
        self, account_data: AccountCreate, user: User
    ) -> Dict[str, Any]:
        """
        Create a new account.

        Args:
            account_data: Account creation data
            user: Current authenticated user

        Returns:
            Created account data
        """
        data = account_data.model_dump(exclude_unset=True)

        # Set owner to current user if not specified
        if "owner_id" not in data or data["owner_id"] is None:
            data["owner_id"] = user.id

        # Create account
        account = await self.account_repo.create(data)

        # Log activity
        await log_activity(
            self.db, user, "create", "account", str(account.id), account.name
        )

        return AccountOut.model_validate(account).model_dump(by_alias=True)

    async def create_account_with_contact(
        self, account_data: Dict[str, Any], contact_data: Dict[str, Any], user: User
    ) -> Dict[str, Any]:
        """
        Create an account with an associated contact in a single transaction.

        Args:
            account_data: Account creation data
            contact_data: Contact creation data
            user: Current authenticated user

        Returns:
            Created account data
        """
        # Set owner to current user if not specified
        if "owner_id" not in account_data or not account_data.get("owner_id"):
            account_data["owner_id"] = str(user.id)

        # Create account
        account = await self.account_repo.create(account_data)

        # Create contact linked to account
        contact_data["account_id"] = str(account.id)
        if "owner_id" not in contact_data or not contact_data.get("owner_id"):
            contact_data["owner_id"] = str(user.id)
        await self.contact_repo.create(contact_data)

        # Log activity
        await log_activity(
            self.db, user, "create", "account", str(account.id), account.name
        )

        return AccountOut.model_validate(account).model_dump(by_alias=True)

    async def update_account(
        self, account_id: str, account_data: AccountUpdate, user: User
    ) -> Dict[str, Any]:
        """
        Update an existing account.

        Args:
            account_id: Account UUID
            account_data: Account update data
            user: Current authenticated user

        Returns:
            Updated account data

        Raises:
            NotFoundException: If account not found
        """
        # Get existing account
        old = await self.account_repo.get_by_id(account_id)
        if not old:
            raise NotFoundException("Account not found")

        # Enforce access control
        await enforce_scope(old, "owner_id", user, self.db, resource_name="account")

        # Track changes for audit log
        old_data = model_to_dict(old)

        # Update account
        account = await self.account_repo.update(
            account_id, account_data.model_dump(exclude_unset=True)
        )

        # Log activity with changes
        changes = compute_changes(old_data, model_to_dict(account))
        await log_activity(
            self.db, user, "update", "account", str(account.id), account.name, changes
        )

        return AccountOut.model_validate(account).model_dump(by_alias=True)

    async def delete_account(self, account_id: str, user: User) -> bool:
        """
        Delete an account.

        Args:
            account_id: Account UUID
            user: Current authenticated user

        Returns:
            True if successful

        Raises:
            NotFoundException: If account not found
        """
        # Get existing account
        account = await self.account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundException("Account not found")

        # Enforce access control
        await enforce_scope(account, "owner_id", user, self.db, resource_name="account")

        # Store name before deletion
        account_name = account.name

        # Delete account
        await self.account_repo.delete(account_id)

        # Log activity
        await log_activity(self.db, user, "delete", "account", account_id, account_name)

        return True

    async def list_account_contacts(
        self, account_id: str, page: int, limit: int, user: User
    ) -> Dict[str, Any]:
        """
        List all contacts for a specific account.

        Args:
            account_id: Account UUID
            page: Page number
            limit: Items per page
            user: Current authenticated user

        Returns:
            Dictionary with 'data' and 'pagination'
        """
        result = await self.contact_repo.get_by_account(
            account_id=account_id, page=page, limit=limit
        )

        # Transform data
        data = []
        for item in result["data"]:
            out = ContactOut.model_validate(item["contact"]).model_dump(by_alias=True)
            out["accountName"] = item["account_name"]
            out["ownerName"] = item["owner_name"]
            data.append(out)

        return {"data": data, "pagination": result["pagination"]}

    async def list_account_deals(
        self, account_id: str, user: User
    ) -> List[Dict[str, Any]]:
        """
        List all deals for a specific account.

        Args:
            account_id: Account UUID
            user: Current authenticated user

        Returns:
            List of deals
        """
        items = await self.deal_repo.get_by_account(account_id=account_id)

        # Transform data
        data = []
        for item in items:
            out = DealOut.model_validate(item["deal"]).model_dump(by_alias=True)
            out["accountName"] = item["account_name"]
            out["contactName"] = item["contact_name"]
            out["ownerName"] = item["owner_name"]
            data.append(out)

        return data
