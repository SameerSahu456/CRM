"""
Master Data Service Layer

This module contains all business logic for master data management.
Handles multiple entity types including verticals, OEMs, partner types,
locations, categories, and dropdown entities.
"""

from __future__ import annotations

from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestException, NotFoundException
from app.models.user import User

# Master data table configs — entity name -> table name
ENTITY_MAP = {
    "verticals": "master_verticals",
    "oems": "master_oems",
    "partner-types": "master_partner_types",
    "locations": "master_locations",
    "categories": "master_categories",
}

# Dropdown entities stored in the generic master_dropdowns table
DROPDOWN_ENTITIES = [
    "deal-stages",
    "deal-types",
    "lead-sources",
    "forecast-options",
    "task-statuses",
    "priorities",
    "task-types",
    "event-types",
    "email-statuses",
    "template-categories",
    "contact-types",
    "partner-tiers",
    "partner-statuses",
]


class MasterDataService:
    """Service for master data management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _convert_row(self, row: Any) -> Dict:
        """Convert database row to dict with UUID to string conversion."""
        return {k: (str(v) if hasattr(v, "hex") else v) for k, v in dict(row).items()}

    async def _get_all(self, table_name: str) -> List[Dict]:
        """Get all records from a table ordered by name."""
        result = await self.db.execute(
            text(f"SELECT * FROM {table_name} ORDER BY name")
        )
        rows = result.mappings().all()
        return [self._convert_row(row) for row in rows]

    async def _get_locations(self) -> List[Dict]:
        """Get all locations ordered by city."""
        result = await self.db.execute(
            text("SELECT * FROM master_locations ORDER BY city")
        )
        rows = result.mappings().all()
        return [self._convert_row(row) for row in rows]

    async def _get_dropdowns(self, entity: str) -> List[Dict]:
        """Get dropdown items for a specific entity."""
        try:
            async with self.db.begin_nested():
                result = await self.db.execute(
                    text(
                        "SELECT id, entity, value, label, sort_order, is_active, metadata "
                        "FROM master_dropdowns "
                        "WHERE entity = :entity AND is_active = TRUE "
                        "ORDER BY sort_order"
                    ),
                    {"entity": entity},
                )
                rows = result.mappings().all()
        except Exception:
            await self._ensure_table_and_seed()
            result = await self.db.execute(
                text(
                    "SELECT id, entity, value, label, sort_order, is_active, metadata "
                    "FROM master_dropdowns "
                    "WHERE entity = :entity AND is_active = TRUE "
                    "ORDER BY sort_order"
                ),
                {"entity": entity},
            )
            rows = result.mappings().all()
        return [self._convert_row(row) for row in rows]

    async def _ensure_table_and_seed(self) -> None:
        """Create master_dropdowns table if missing and seed default data."""
        # Create table if it doesn't exist
        await self.db.execute(text("""
            CREATE TABLE IF NOT EXISTS master_dropdowns (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                entity VARCHAR(100) NOT NULL,
                value VARCHAR(255) NOT NULL,
                label VARCHAR(255) NOT NULL,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now(),
                UNIQUE (entity, value)
            )
        """))
        await self.db.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_master_dropdowns_entity "
            "ON master_dropdowns (entity)"
        ))
        # Remove obsolete stages
        await self.db.execute(text(
            "DELETE FROM master_dropdowns "
            "WHERE entity = 'deal-stages' AND value = 'Need Analysis'"
        ))
        # Seed default data
        await self.db.execute(text("""
            INSERT INTO master_dropdowns (entity, value, label, sort_order, metadata) VALUES
            ('deal-stages', 'New', 'New', 0, '{"is_pipeline": true}'),
            ('deal-stages', 'Cold', 'Cold', 1, '{"is_pipeline": true}'),
            ('deal-stages', 'Proposal', 'Proposal', 2, '{"is_pipeline": true}'),
            ('deal-stages', 'Negotiation', 'Negotiation', 3, '{"is_pipeline": true}'),
            ('deal-stages', 'Closed Won', 'Closed Won', 4, '{"is_terminal": true}'),
            ('deal-stages', 'Closed Lost', 'Closed Lost', 5, '{"is_terminal": true}'),
            ('deal-types', 'New Business', 'New Business', 1, NULL),
            ('deal-types', 'Existing Business', 'Existing Business', 2, NULL),
            ('deal-types', 'Renewal', 'Renewal', 3, NULL),
            ('lead-sources', 'Website', 'Website', 1, NULL),
            ('lead-sources', 'Referral', 'Referral', 2, NULL),
            ('lead-sources', 'Cold Call', 'Cold Call', 3, NULL),
            ('lead-sources', 'Trade Show', 'Trade Show', 4, NULL),
            ('lead-sources', 'LinkedIn', 'LinkedIn', 5, NULL),
            ('lead-sources', 'Email Campaign', 'Email Campaign', 6, NULL),
            ('lead-sources', 'Partner', 'Partner', 7, NULL),
            ('forecast-options', 'Pipeline', 'Pipeline', 1, NULL),
            ('forecast-options', 'Best Case', 'Best Case', 2, NULL),
            ('forecast-options', 'Commit', 'Commit', 3, NULL),
            ('forecast-options', 'Closed', 'Closed', 4, NULL),
            ('task-statuses', 'pending', 'Pending', 1, NULL),
            ('task-statuses', 'in_progress', 'In Progress', 2, NULL),
            ('task-statuses', 'completed', 'Completed', 3, NULL),
            ('task-statuses', 'cancelled', 'Cancelled', 4, NULL),
            ('priorities', 'Low', 'Low', 1, NULL),
            ('priorities', 'Medium', 'Medium', 2, NULL),
            ('priorities', 'High', 'High', 3, NULL),
            ('priorities', 'Urgent', 'Urgent', 4, NULL),
            ('task-types', 'Call', 'Call', 1, NULL),
            ('task-types', 'Email', 'Email', 2, NULL),
            ('task-types', 'Meeting', 'Meeting', 3, NULL),
            ('task-types', 'Follow-up', 'Follow-up', 4, NULL),
            ('task-types', 'Demo', 'Demo', 5, NULL),
            ('task-types', 'Proposal', 'Proposal', 6, NULL),
            ('event-types', 'meeting', 'Meeting', 1, NULL),
            ('event-types', 'call', 'Call', 2, NULL),
            ('event-types', 'task', 'Task', 3, NULL),
            ('event-types', 'reminder', 'Reminder', 4, NULL),
            ('email-statuses', 'draft', 'Draft', 1, NULL),
            ('email-statuses', 'sent', 'Sent', 2, NULL),
            ('email-statuses', 'delivered', 'Delivered', 3, NULL),
            ('email-statuses', 'failed', 'Failed', 4, NULL),
            ('template-categories', 'Sales', 'Sales', 1, NULL),
            ('template-categories', 'Marketing', 'Marketing', 2, NULL),
            ('template-categories', 'Support', 'Support', 3, NULL),
            ('template-categories', 'General', 'General', 4, NULL),
            ('contact-types', 'Primary', 'Primary', 1, NULL),
            ('contact-types', 'Secondary', 'Secondary', 2, NULL),
            ('contact-types', 'Billing', 'Billing', 3, NULL),
            ('contact-types', 'Technical', 'Technical', 4, NULL),
            ('partner-tiers', 'new', 'New', 1, NULL),
            ('partner-tiers', 'bronze', 'Bronze', 2, NULL),
            ('partner-tiers', 'silver', 'Silver', 3, NULL),
            ('partner-tiers', 'gold', 'Gold', 4, NULL),
            ('partner-tiers', 'platinum', 'Platinum', 5, NULL),
            ('partner-statuses', 'pending', 'Pending', 1, NULL),
            ('partner-statuses', 'approved', 'Approved', 2, NULL),
            ('partner-statuses', 'suspended', 'Suspended', 3, NULL),
            ('partner-statuses', 'inactive', 'Inactive', 4, NULL)
            ON CONFLICT (entity, value) DO NOTHING
        """))
        await self.db.commit()

    async def list_all_dropdowns(self) -> Dict[str, List[Dict]]:
        """
        Get all dropdown entities grouped by entity type.
        Auto-creates table and seeds data if needed.

        Returns:
            Dictionary with entity names as keys and lists of dropdown items as values
        """
        try:
            async with self.db.begin_nested():
                # Clean up obsolete stages
                await self.db.execute(text(
                    "DELETE FROM master_dropdowns "
                    "WHERE entity = 'deal-stages' AND value = 'Need Analysis'"
                ))
                result = await self.db.execute(
                    text(
                        "SELECT id, entity, value, label, sort_order, is_active, metadata "
                        "FROM master_dropdowns "
                        "WHERE is_active = TRUE "
                        "ORDER BY entity, sort_order"
                    )
                )
                rows = result.mappings().all()
        except Exception:
            # Table likely doesn't exist — create and seed it
            await self._ensure_table_and_seed()
            result = await self.db.execute(
                text(
                    "SELECT id, entity, value, label, sort_order, is_active, metadata "
                    "FROM master_dropdowns "
                    "WHERE is_active = TRUE "
                    "ORDER BY entity, sort_order"
                )
            )
            rows = result.mappings().all()

        # Auto-seed if table exists but is empty
        if not rows:
            await self._ensure_table_and_seed()
            result = await self.db.execute(
                text(
                    "SELECT id, entity, value, label, sort_order, is_active, metadata "
                    "FROM master_dropdowns "
                    "WHERE is_active = TRUE "
                    "ORDER BY entity, sort_order"
                )
            )
            rows = result.mappings().all()

        grouped = {}
        for row in rows:
            item = self._convert_row(row)
            entity = item["entity"]
            if entity not in grouped:
                grouped[entity] = []
            grouped[entity].append(item)

        return grouped

    async def list_master_data(self, entity: str) -> List[Dict]:
        """
        Get master data for a specific entity.

        Args:
            entity: Entity name (e.g., 'verticals', 'locations', 'deal-stages')

        Returns:
            List of master data items

        Raises:
            BadRequestException: If entity is unknown
        """
        if entity in DROPDOWN_ENTITIES:
            return await self._get_dropdowns(entity)

        table_name = ENTITY_MAP.get(entity)
        if not table_name:
            raise BadRequestException(f"Unknown entity: {entity}")

        if entity == "locations":
            return await self._get_locations()
        return await self._get_all(table_name)

    async def create_master_data(self, entity: str, data: Dict, admin: User) -> Dict:
        """
        Create a new master data item.

        Args:
            entity: Entity name
            data: Item data
            admin: Admin user creating the item

        Returns:
            Created item

        Raises:
            BadRequestException: If entity is unknown or required fields are missing
        """
        # Handle dropdown entities
        if entity in DROPDOWN_ENTITIES:
            value = data.get("value")
            label = data.get("label", value)
            sort_order = data.get("sortOrder", data.get("sort_order", 0))
            metadata = data.get("metadata", {})
            if not value:
                raise BadRequestException("Value is required")

            result = await self.db.execute(
                text(
                    "INSERT INTO master_dropdowns (entity, value, label, sort_order, metadata) "
                    "VALUES (:entity, :value, :label, :sort_order, :metadata::jsonb) RETURNING *"
                ),
                {
                    "entity": entity,
                    "value": value,
                    "label": label,
                    "sort_order": sort_order,
                    "metadata": (
                        str(metadata).replace("'", '"')
                        if isinstance(metadata, dict)
                        else metadata
                    ),
                },
            )
            row = result.mappings().first()
            return self._convert_row(row)

        # Handle regular entities
        table_name = ENTITY_MAP.get(entity)
        if not table_name:
            raise BadRequestException(f"Unknown entity: {entity}")

        # Handle locations
        if entity == "locations":
            city = data.get("city")
            state = data.get("state", "")
            region = data.get("region", "")
            if not city:
                raise BadRequestException("City is required")
            result = await self.db.execute(
                text(
                    f"INSERT INTO {table_name} (city, state, region) "
                    "VALUES (:city, :state, :region) RETURNING *"
                ),
                {"city": city, "state": state, "region": region},
            )
        # Handle categories
        elif entity == "categories":
            name = data.get("name")
            oem_id = data.get("oemId") or data.get("oem_id")
            if not name:
                raise BadRequestException("Name is required")
            result = await self.db.execute(
                text(
                    f"INSERT INTO {table_name} (name, oem_id) "
                    "VALUES (:name, :oem_id) RETURNING *"
                ),
                {"name": name, "oem_id": oem_id},
            )
        # Handle other entities (verticals, oems, partner-types)
        else:
            name = data.get("name")
            if not name:
                raise BadRequestException("Name is required")
            result = await self.db.execute(
                text(f"INSERT INTO {table_name} (name) VALUES (:name) RETURNING *"),
                {"name": name},
            )

        row = result.mappings().first()
        return self._convert_row(row)

    def _camel_to_snake(self, camel_str: str) -> str:
        """Convert camelCase to snake_case."""
        snake_str = ""
        for ch in camel_str:
            if ch.isupper():
                snake_str += "_" + ch.lower()
            else:
                snake_str += ch
        return snake_str.lstrip("_")

    async def update_master_data(
        self, entity: str, item_id: str, data: Dict, admin: User
    ) -> Dict:
        """
        Update a master data item.

        Args:
            entity: Entity name
            item_id: Item ID to update
            data: Update data
            admin: Admin user updating the item

        Returns:
            Updated item

        Raises:
            BadRequestException: If entity is unknown or no fields to update
            NotFoundException: If item not found
        """
        # Handle dropdown entities
        if entity in DROPDOWN_ENTITIES:
            sets = []
            params = {"id": item_id}
            allowed = {"value", "label", "sort_order", "is_active", "metadata"}

            for key, val in data.items():
                col = self._camel_to_snake(key)
                if col in allowed:
                    if col == "metadata":
                        sets.append("metadata = :metadata::jsonb")
                        params["metadata"] = (
                            str(val).replace("'", '"') if isinstance(val, dict) else val
                        )
                    else:
                        sets.append(f"{col} = :{col}")
                        params[col] = val

            if not sets:
                raise BadRequestException("No fields to update")

            result = await self.db.execute(
                text(
                    f"UPDATE master_dropdowns SET {', '.join(sets)} WHERE id = :id RETURNING *"
                ),
                params,
            )
            row = result.mappings().first()
            if not row:
                raise NotFoundException("Item not found")
            return self._convert_row(row)

        # Handle regular entities
        table_name = ENTITY_MAP.get(entity)
        if not table_name:
            raise BadRequestException(f"Unknown entity: {entity}")

        sets = []
        params = {"id": item_id}

        for key, value in data.items():
            col_name = self._camel_to_snake(key)
            if col_name in ("id",):
                continue
            sets.append(f"{col_name} = :{col_name}")
            params[col_name] = value

        if not sets:
            raise BadRequestException("No fields to update")

        set_clause = ", ".join(sets)
        result = await self.db.execute(
            text(f"UPDATE {table_name} SET {set_clause} WHERE id = :id RETURNING *"),
            params,
        )
        row = result.mappings().first()
        if not row:
            raise NotFoundException("Item not found")
        return self._convert_row(row)

    async def delete_master_data(self, entity: str, item_id: str, admin: User) -> bool:
        """
        Delete a master data item.

        Args:
            entity: Entity name
            item_id: Item ID to delete
            admin: Admin user deleting the item

        Returns:
            True if successful

        Raises:
            BadRequestException: If entity is unknown
            NotFoundException: If item not found
        """
        # Handle dropdown entities
        if entity in DROPDOWN_ENTITIES:
            result = await self.db.execute(
                text("DELETE FROM master_dropdowns WHERE id = :id"),
                {"id": item_id},
            )
            if result.rowcount == 0:
                raise NotFoundException("Item not found")
            return True

        # Handle regular entities
        table_name = ENTITY_MAP.get(entity)
        if not table_name:
            raise BadRequestException(f"Unknown entity: {entity}")

        result = await self.db.execute(
            text(f"DELETE FROM {table_name} WHERE id = :id"),
            {"id": item_id},
        )
        if result.rowcount == 0:
            raise NotFoundException("Item not found")
        return True
