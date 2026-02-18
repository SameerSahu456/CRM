from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.inspection import inspect


SKIP_FIELDS = {"id", "created_at", "updated_at"}


def model_to_dict(obj: Any) -> dict:
    """Convert a SQLAlchemy model instance to a plain dict.

    UUID, datetime, date, and Decimal values are converted to strings
    so the result is JSON-serialisable.
    """
    if obj is None:
        return {}

    mapper = inspect(type(obj))
    result: dict[str, Any] = {}
    for col in mapper.columns:
        value = getattr(obj, col.key, None)
        if isinstance(value, uuid.UUID):
            value = str(value)
        elif isinstance(value, (datetime, date)):
            value = value.isoformat()
        elif isinstance(value, Decimal):
            value = str(value)
        result[col.key] = value
    return result


def compute_changes(old_data: dict, new_data: dict) -> list:
    """Compare two dicts and return a list of ``{field, old, new}`` entries
    for every field whose value changed.

    Fields listed in *SKIP_FIELDS* are ignored.  All values are stored as
    strings so they serialise cleanly into JSONB.
    """
    changes: list[dict[str, Any]] = []
    all_keys = set(old_data.keys()) | set(new_data.keys())

    for key in sorted(all_keys):
        if key in SKIP_FIELDS:
            continue

        old_val = old_data.get(key)
        new_val = new_data.get(key)

        # Normalise to comparable strings
        old_str = str(old_val) if old_val is not None else None
        new_str = str(new_val) if new_val is not None else None

        if old_str != new_str:
            changes.append({
                "field": key,
                "old": old_str,
                "new": new_str,
            })

    return changes


async def log_activity(
    db: AsyncSession,
    user: Any,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    entity_name: Optional[str] = None,
    changes: Optional[list] = None,
) -> None:
    """Insert a row into the ``activity_logs`` table."""
    from app.models.activity_log import ActivityLog

    user_id = None
    user_name = None
    if user is not None:
        user_id = getattr(user, "id", None)
        name = getattr(user, "name", None)
        email = getattr(user, "email", None)
        user_name = name or email or str(user_id)

    stmt = insert(ActivityLog).values(
        id=uuid.uuid4(),
        user_id=user_id,
        user_name=user_name,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        entity_name=entity_name,
        changes=changes,
    )

    await db.execute(stmt)
    await db.flush()
