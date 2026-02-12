from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import NotFoundException
from app.middleware.security import get_current_user
from app.models.Task import Task
from app.models.User import User
from app.repositories.TaskRepository import TaskRepository
from app.schemas.TaskSchema import TaskOut, TaskCreate, TaskUpdate
from app.utils.activity_logger import compute_changes, log_activity, model_to_dict
from app.utils.scoping import get_scoped_user_ids, enforce_scope

router = APIRouter()


@router.get("/")
async def list_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    type: Optional[str] = None,
    assigned_to: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    filters = []
    if status:
        filters.append(Task.status == status)
    if priority:
        filters.append(Task.priority == priority)
    if type:
        filters.append(Task.type == type)
    if assigned_to:
        filters.append(Task.assigned_to == assigned_to)

    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        filters.append(Task.assigned_to.in_(scoped_ids))

    result = await repo.get_with_names(page=page, limit=limit, filters=filters or None)

    data = []
    for item in result["data"]:
        out = TaskOut.model_validate(item["task"]).model_dump(by_alias=True)
        out["assignedToName"] = item["assigned_to_name"]
        out["createdByName"] = item["created_by_name"]
        data.append(out)

    return {"data": data, "pagination": result["pagination"]}


@router.get("/stats")
async def task_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    filters = []
    scoped_ids = await get_scoped_user_ids(user, db)
    if scoped_ids is not None:
        filters.append(Task.assigned_to.in_(scoped_ids))
    return await repo.get_stats(filters=filters or None)


@router.get("/{task_id}")
async def get_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id)
    if not task:
        raise NotFoundException("Task not found")
    await enforce_scope(task, "assigned_to", user, db, resource_name="task")
    return TaskOut.model_validate(task).model_dump(by_alias=True)


@router.post("/")
async def create_task(
    body: TaskCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    data = body.model_dump(exclude_unset=True)
    if "created_by" not in data or data["created_by"] is None:
        data["created_by"] = user.id
    if "assigned_to" not in data or data["assigned_to"] is None:
        data["assigned_to"] = user.id
    task = await repo.create(data)
    await log_activity(db, user, "create", "task", str(task.id), task.title)
    return TaskOut.model_validate(task).model_dump(by_alias=True)


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    body: TaskUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    old = await repo.get_by_id(task_id)
    if not old:
        raise NotFoundException("Task not found")
    await enforce_scope(old, "assigned_to", user, db, resource_name="task")
    old_data = model_to_dict(old)
    task = await repo.update(task_id, body.model_dump(exclude_unset=True))
    changes = compute_changes(old_data, model_to_dict(task))
    await log_activity(db, user, "update", "task", str(task.id), task.title, changes)
    return TaskOut.model_validate(task).model_dump(by_alias=True)


@router.put("/{task_id}/complete")
async def complete_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    old = await repo.get_by_id(task_id)
    if not old:
        raise NotFoundException("Task not found")
    await enforce_scope(old, "assigned_to", user, db, resource_name="task")
    old_data = model_to_dict(old)
    task = await repo.update(task_id, {
        "status": "completed",
        "completed_at": datetime.now(timezone.utc),
    })
    changes = compute_changes(old_data, model_to_dict(task))
    await log_activity(db, user, "update", "task", str(task.id), task.title, changes)
    return TaskOut.model_validate(task).model_dump(by_alias=True)


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id)
    if not task:
        raise NotFoundException("Task not found")
    await enforce_scope(task, "assigned_to", user, db, resource_name="task")
    task_title = task.title
    await repo.delete(task_id)
    await log_activity(db, user, "delete", "task", task_id, task_title)
    return {"success": True}
