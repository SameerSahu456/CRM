from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import Boolean, String, select, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import BadRequestException, NotFoundException
from app.middleware.rbac import require_admin
from app.middleware.security import get_current_user
from app.models.User import User

router = APIRouter()

# Master data table configs — entity name -> (table, columns)
ENTITY_MAP = {
    "verticals": "master_verticals",
    "oems": "master_oems",
    "partner-types": "master_partner_types",
    "locations": "master_locations",
    "categories": "master_categories",
}


async def _get_all(db: AsyncSession, table_name: str) -> list[dict]:
    result = await db.execute(text(f"SELECT * FROM {table_name} ORDER BY name"))
    rows = result.mappings().all()
    items = []
    for row in rows:
        item = {k: (str(v) if hasattr(v, "hex") else v) for k, v in dict(row).items()}
        items.append(item)
    return items


async def _get_locations(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        text("SELECT * FROM master_locations ORDER BY city")
    )
    rows = result.mappings().all()
    items = []
    for row in rows:
        item = {k: (str(v) if hasattr(v, "hex") else v) for k, v in dict(row).items()}
        items.append(item)
    return items


@router.get("/{entity}")
async def list_master_data(
    entity: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    table_name = ENTITY_MAP.get(entity)
    if not table_name:
        raise BadRequestException(f"Unknown entity: {entity}")

    if entity == "locations":
        return await _get_locations(db)
    return await _get_all(db, table_name)


@router.post("/{entity}")
async def create_master_data(
    entity: str,
    body: dict,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    table_name = ENTITY_MAP.get(entity)
    if not table_name:
        raise BadRequestException(f"Unknown entity: {entity}")

    if entity == "locations":
        city = body.get("city")
        state = body.get("state", "")
        region = body.get("region", "")
        if not city:
            raise BadRequestException("City is required")
        result = await db.execute(
            text(
                f"INSERT INTO {table_name} (city, state, region) "
                "VALUES (:city, :state, :region) RETURNING *"
            ),
            {"city": city, "state": state, "region": region},
        )
    elif entity == "categories":
        name = body.get("name")
        oem_id = body.get("oemId") or body.get("oem_id")
        if not name:
            raise BadRequestException("Name is required")
        params = {"name": name, "oem_id": oem_id}
        result = await db.execute(
            text(
                f"INSERT INTO {table_name} (name, oem_id) "
                "VALUES (:name, :oem_id) RETURNING *"
            ),
            params,
        )
    else:
        name = body.get("name")
        if not name:
            raise BadRequestException("Name is required")
        result = await db.execute(
            text(f"INSERT INTO {table_name} (name) VALUES (:name) RETURNING *"),
            {"name": name},
        )

    row = result.mappings().first()
    return {k: (str(v) if hasattr(v, "hex") else v) for k, v in dict(row).items()}


@router.put("/{entity}/{item_id}")
async def update_master_data(
    entity: str,
    item_id: str,
    body: dict,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    table_name = ENTITY_MAP.get(entity)
    if not table_name:
        raise BadRequestException(f"Unknown entity: {entity}")

    sets = []
    params = {"id": item_id}

    for key, value in body.items():
        # Convert camelCase to snake_case
        snake_key = ""
        for ch in key:
            if ch.isupper():
                snake_key += "_" + ch.lower()
            else:
                snake_key += ch
        col_name = snake_key.lstrip("_")
        if col_name in ("id",):
            continue
        sets.append(f"{col_name} = :{col_name}")
        params[col_name] = value

    if not sets:
        raise BadRequestException("No fields to update")

    set_clause = ", ".join(sets)
    result = await db.execute(
        text(f"UPDATE {table_name} SET {set_clause} WHERE id = :id RETURNING *"),
        params,
    )
    row = result.mappings().first()
    if not row:
        raise NotFoundException("Item not found")
    return {k: (str(v) if hasattr(v, "hex") else v) for k, v in dict(row).items()}


@router.delete("/{entity}/{item_id}")
async def delete_master_data(
    entity: str,
    item_id: str,
    admin: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    table_name = ENTITY_MAP.get(entity)
    if not table_name:
        raise BadRequestException(f"Unknown entity: {entity}")

    result = await db.execute(
        text(f"DELETE FROM {table_name} WHERE id = :id"),
        {"id": item_id},
    )
    if result.rowcount == 0:
        raise NotFoundException("Item not found")
    return {"success": True}
