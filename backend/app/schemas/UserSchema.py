from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class LoginRequest(CamelModel):
    email: str
    password: str


class LoginResponse(CamelModel):
    token: str
    user: UserOut


class ChangePasswordRequest(CamelModel):
    current_password: str
    new_password: str


class UserOut(CamelModel):
    id: UUID
    email: str
    name: str
    role: str
    department: Optional[str] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    is_active: bool = True
    monthly_target: Optional[float] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None


class UserCreate(CamelModel):
    email: str
    password: str
    name: str
    role: str = "salesperson"
    department: Optional[str] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    manager_id: Optional[str] = None
    monthly_target: Optional[float] = None


class UserUpdate(CamelModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None
    monthly_target: Optional[float] = None


class ResetPasswordRequest(CamelModel):
    new_password: str


# Fix forward reference
LoginResponse.model_rebuild()
