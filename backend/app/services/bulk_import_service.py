"""
Bulk Import Service Layer

This module contains all business logic for bulk CSV import operations.
Handles validation, type casting, and bulk insertion for multiple entity types.
"""

from __future__ import annotations

import csv
import io
import uuid
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.partner import Partner
from app.models.product import Product
from app.models.sales_entry import SalesEntry
from app.models.user import User
from app.utils.activity_logger import log_activity

# Entity configuration
ALLOWED_ENTITIES = {
    "accounts",
    "leads",
    "contacts",
    "deals",
    "partners",
    "sales_entries",
    "products",
}

ENTITY_COLUMNS: Dict[str, List[str]] = {
    "accounts": [
        "name",
        "industry",
        "phone",
        "email",
        "revenue",
        "type",
        "status",
        "location",
        "website",
    ],
    "leads": [
        "company_name",
        "contact_person",
        "email",
        "phone",
        "stage",
        "priority",
        "estimated_value",
        "source",
    ],
    "contacts": [
        "first_name",
        "last_name",
        "email",
        "phone",
        "job_title",
        "department",
        "status",
    ],
    "deals": [
        "title",
        "company",
        "value",
        "stage",
        "probability",
        "closing_date",
        "type",
    ],
    "partners": [
        "company_name",
        "contact_person",
        "email",
        "phone",
        "city",
        "state",
        "partner_type",
        "tier",
    ],
    "sales_entries": [
        "partner_id",
        "product_id",
        "amount",
        "sale_date",
        "customer_name",
        "quantity",
        "po_number",
        "payment_status",
    ],
    "products": [
        "name",
        "category",
        "base_price",
        "commission_rate",
    ],
}

ENTITY_SAMPLE_ROWS: Dict[str, List[str]] = {
    "accounts": [
        "# Acme Corp",
        "Technology",
        "+1-555-0100",
        "info@acme.com",
        "1000000.00",
        "customer",
        "active",
        "New York",
        "https://acme.com",
    ],
    "leads": [
        "# Beta Inc",
        "John Doe",
        "john@beta.com",
        "+1-555-0200",
        "New",
        "High",
        "50000.00",
        "website",
    ],
    "contacts": [
        "# Jane",
        "Smith",
        "jane@example.com",
        "+1-555-0300",
        "CTO",
        "Engineering",
        "active",
    ],
    "deals": [
        "# Enterprise License",
        "Acme Corp",
        "250000.00",
        "Qualification",
        "60",
        "2026-06-30",
        "new_business",
    ],
    "partners": [
        "# Gamma Solutions",
        "Alice Lee",
        "alice@gamma.com",
        "+1-555-0400",
        "Mumbai",
        "Maharashtra",
        "reseller",
        "silver",
    ],
    "sales_entries": [
        "# <partner-uuid>",
        "<product-uuid>",
        "15000.00",
        "2026-01-15",
        "Delta Corp",
        "10",
        "PO-2026-001",
        "pending",
    ],
    "products": [
        "# Widget Pro",
        "Hardware",
        "499.99",
        "8.50",
    ],
}

ENTITY_MODEL_MAP: Dict[str, type] = {
    "accounts": Account,
    "leads": Lead,
    "contacts": Contact,
    "deals": Deal,
    "partners": Partner,
    "sales_entries": SalesEntry,
    "products": Product,
}

REQUIRED_FIELDS: Dict[str, List[str]] = {
    "accounts": ["name"],
    "leads": ["company_name"],
    "contacts": ["first_name"],
    "deals": ["title"],
    "partners": ["company_name"],
    "sales_entries": ["partner_id", "product_id", "amount", "sale_date"],
    "products": ["name"],
}

NUMERIC_FIELDS = {
    "revenue",
    "amount",
    "value",
    "base_price",
    "commission_rate",
    "estimated_value",
}

INTEGER_FIELDS = {
    "probability",
    "quantity",
}

DATE_FIELDS = {
    "sale_date",
    "closing_date",
}

DEFAULTS: Dict[str, Dict[str, str]] = {
    "accounts": {"status": "active"},
    "contacts": {"status": "active"},
    "leads": {"stage": "New"},
    "deals": {"stage": "Qualification"},
    "partners": {"tier": "new"},
    "sales_entries": {"payment_status": "pending"},
}

# Maps entity -> list of (csv_field_name, model_field_name) for the current-user id.
USER_FIELDS: Dict[str, List[tuple]] = {
    "accounts": [("owner_id", "owner_id")],
    "leads": [("assigned_to", "assigned_to")],
    "contacts": [("owner_id", "owner_id")],
    "deals": [("owner_id", "owner_id")],
    "partners": [("assigned_to", "assigned_to")],
    "sales_entries": [("salesperson_id", "salesperson_id")],
    "products": [],
}


class BulkImportService:
    """Service for bulk CSV import operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _validate_entity(self, entity: str) -> None:
        """Validate entity name."""
        if entity not in ALLOWED_ENTITIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid entity '{entity}'. Allowed: {', '.join(sorted(ALLOWED_ENTITIES))}",
            )

    def _parse_uuid(self, value: str) -> uuid.UUID:
        """Parse a string as UUID, raising ValueError on failure."""
        return uuid.UUID(value.strip())

    def _cast_row(
        self,
        entity: str,
        row: Dict[str, str],
        row_index: int,
        errors: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """
        Validate and type-cast a single CSV row.

        Returns the cleaned dict ready for model construction, or None if the
        row has fatal validation errors.
        """
        data: Dict[str, Any] = {}
        row_has_error = False

        # Required field check
        for field in REQUIRED_FIELDS.get(entity, []):
            value = (row.get(field) or "").strip()
            if not value:
                errors.append(
                    {
                        "row": row_index,
                        "field": field,
                        "message": f"Required field '{field}' is missing or empty",
                    }
                )
                row_has_error = True

        if row_has_error:
            return None

        columns = ENTITY_COLUMNS[entity]
        for col in columns:
            raw = (row.get(col) or "").strip()
            if not raw:
                continue

            # Numeric (Decimal) fields
            if col in NUMERIC_FIELDS:
                try:
                    data[col] = Decimal(raw)
                except (InvalidOperation, ValueError):
                    errors.append(
                        {
                            "row": row_index,
                            "field": col,
                            "message": f"Invalid numeric value '{raw}'",
                        }
                    )
                    row_has_error = True
                continue

            # Integer fields
            if col in INTEGER_FIELDS:
                try:
                    data[col] = int(raw)
                except ValueError:
                    errors.append(
                        {
                            "row": row_index,
                            "field": col,
                            "message": f"Invalid integer value '{raw}'",
                        }
                    )
                    row_has_error = True
                continue

            # Date fields (YYYY-MM-DD)
            if col in DATE_FIELDS:
                try:
                    data[col] = date.fromisoformat(raw)
                except ValueError:
                    errors.append(
                        {
                            "row": row_index,
                            "field": col,
                            "message": f"Invalid date format '{raw}'. Expected YYYY-MM-DD",
                        }
                    )
                    row_has_error = True
                continue

            # UUID fields (partner_id, product_id in CSV)
            if col in ("partner_id", "product_id"):
                try:
                    data[col] = self._parse_uuid(raw)
                except ValueError:
                    errors.append(
                        {
                            "row": row_index,
                            "field": col,
                            "message": f"Invalid UUID '{raw}'",
                        }
                    )
                    row_has_error = True
                continue

            # Everything else is a plain string
            data[col] = raw

        if row_has_error:
            return None

        # Apply defaults
        for field, default in DEFAULTS.get(entity, {}).items():
            if field not in data:
                data[field] = default

        return data

    def get_template(self, entity: str) -> tuple[str, str]:
        """
        Generate CSV template for an entity.

        Args:
            entity: Entity name

        Returns:
            Tuple of (csv_content, filename)

        Raises:
            HTTPException: If entity is invalid
        """
        self._validate_entity(entity)

        columns = ENTITY_COLUMNS[entity]
        sample = ENTITY_SAMPLE_ROWS[entity]

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)
        writer.writerow(sample)
        output.seek(0)

        filename = f"{entity}_import_template.csv"
        return output.getvalue(), filename

    async def import_data(
        self, entity: str, file: UploadFile, user: User
    ) -> Dict[str, Any]:
        """
        Import CSV data for an entity.

        Args:
            entity: Entity name
            file: Uploaded CSV file
            user: User performing the import

        Returns:
            Dictionary with total, imported count, and errors

        Raises:
            HTTPException: If entity is invalid, file is not CSV, or import fails
        """
        self._validate_entity(entity)

        # Validate file type
        if not file.filename or not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only .csv files are accepted")

        # Read and decode CSV
        try:
            contents = await file.read()
            text = contents.decode("utf-8-sig")  # handles BOM from Excel exports
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File is not valid UTF-8 text")

        reader = csv.DictReader(io.StringIO(text))

        if reader.fieldnames is None:
            raise HTTPException(
                status_code=400,
                detail="CSV file appears to be empty or has no header row",
            )

        # Process rows
        errors: List[Dict[str, Any]] = []
        valid_rows: List[Dict[str, Any]] = []
        model_cls = ENTITY_MODEL_MAP[entity]
        user_id = user.id  # UUID of the current user

        for idx, row in enumerate(reader, start=2):  # row 1 is header
            # Skip comment/sample rows
            first_value = next(iter(row.values()), "") or ""
            if first_value.strip().startswith("#"):
                continue

            cleaned = self._cast_row(entity, row, idx, errors)
            if cleaned is None:
                continue

            # Inject user-related fields
            for _csv_field, model_field in USER_FIELDS.get(entity, []):
                cleaned[model_field] = user_id

            valid_rows.append(cleaned)

        # Bulk insert
        imported_count = 0
        if valid_rows:
            try:
                for row_data in valid_rows:
                    self.db.add(model_cls(**row_data))
                await self.db.flush()
                await self.db.commit()
                imported_count = len(valid_rows)
            except Exception as exc:
                await self.db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail=f"Database error during bulk insert: {str(exc)}",
                )

        # Log the import activity
        if imported_count > 0:
            await log_activity(
                db=self.db,
                user=user,
                action="bulk_import",
                entity_type=entity,
                entity_name=f"Imported {imported_count} {entity}",
                changes=[
                    {"field": "file", "old": None, "new": file.filename},
                    {"field": "imported", "old": None, "new": str(imported_count)},
                    {"field": "errors", "old": None, "new": str(len(errors))},
                ],
            )
            await self.db.commit()

        total = imported_count + len(errors)
        return {
            "total": total,
            "imported": imported_count,
            "errors": errors,
        }
