from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import BadRequestException
from app.middleware.rbac import require_admin
from app.middleware.security import get_current_user
from app.models.User import User

router = APIRouter()


@router.get("/")
async def list_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("SELECT * FROM settings ORDER BY category, key"))
    rows = result.mappings().all()
    return [
        {k: (str(v) if hasattr(v, "hex") else v) for k, v in dict(row).items()}
        for row in rows
    ]


@router.put("/")
async def update_setting(
    body: dict,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    key = body.get("key")
    value = body.get("value")
    if not key:
        raise BadRequestException("Key is required")

    # Upsert
    result = await db.execute(
        text("SELECT id FROM settings WHERE key = :key"),
        {"key": key},
    )
    existing = result.first()

    if existing:
        await db.execute(
            text(
                "UPDATE settings SET value = :value, updated_by = :user_id, "
                "updated_at = NOW() WHERE key = :key"
            ),
            {"value": value, "user_id": admin.id, "key": key},
        )
    else:
        await db.execute(
            text(
                "INSERT INTO settings (key, value, updated_by) "
                "VALUES (:key, :value, :user_id)"
            ),
            {"key": key, "value": value, "user_id": admin.id},
        )

    return {"success": True, "key": key, "value": value}
