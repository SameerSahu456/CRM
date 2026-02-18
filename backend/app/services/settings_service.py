"""
Settings Service Layer

This module contains all business logic for settings management.
Following SOLID principles with clear separation of concerns.
"""

from __future__ import annotations

from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestException
from app.models.user import User


class SettingsService:
    """Service for settings management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_settings(self) -> List[Dict[str, Any]]:
        """
        Get all settings.

        Returns:
            List of all settings
        """
        result = await self.db.execute(
            text("SELECT * FROM settings ORDER BY category, key")
        )
        rows = result.mappings().all()
        return [
            {k: (str(v) if hasattr(v, "hex") else v) for k, v in dict(row).items()}
            for row in rows
        ]

    async def update_setting(
        self, key: str, value: Any, admin: User
    ) -> Dict[str, Any]:
        """
        Update or create a setting (upsert).

        Args:
            key: Setting key
            value: Setting value
            admin: Admin user performing the action

        Returns:
            Success status with key and value

        Raises:
            BadRequestException: If key is missing
        """
        if not key:
            raise BadRequestException("Key is required")

        # Check if setting exists
        result = await self.db.execute(
            text("SELECT id FROM settings WHERE key = :key"),
            {"key": key},
        )
        existing = result.first()

        if existing:
            # Update existing setting
            await self.db.execute(
                text(
                    "UPDATE settings SET value = :value, updated_by = :user_id, "
                    "updated_at = NOW() WHERE key = :key"
                ),
                {"value": value, "user_id": admin.id, "key": key},
            )
        else:
            # Insert new setting
            await self.db.execute(
                text(
                    "INSERT INTO settings (key, value, updated_by) "
                    "VALUES (:key, :value, :user_id)"
                ),
                {"key": key, "value": value, "user_id": admin.id},
            )

        return {"success": True, "key": key, "value": value}

