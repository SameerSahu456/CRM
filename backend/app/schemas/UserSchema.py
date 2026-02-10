from __future__ import annotations

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class DashboardWidget(CamelModel):
    """Widget placement configuration"""
    id: str
    visible: bool = True
    order: int
    grid_position: Optional[Dict[str, int]] = None  # Future: {row: 1, col: 1, width: 1}


class DashboardPreferences(CamelModel):
    """User dashboard layout preferences"""
    widgets: List[DashboardWidget] = []
    last_modified: Optional[str] = None


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
    view_access: str = "presales"
    dashboard_preferences: Optional[DashboardPreferences] = None


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
    view_access: str = "presales"


class UserUpdate(CamelModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None
    monthly_target: Optional[float] = None
    view_access: Optional[str] = None


class ResetPasswordRequest(CamelModel):
    new_password: str


# Fix forward reference
LoginResponse.model_rebuild()
