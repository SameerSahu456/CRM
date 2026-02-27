import uuid
from typing import Optional
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Numeric, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, server_default="sales")
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    employee_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    must_change_password: Mapped[bool] = mapped_column(Boolean, server_default="false")
    monthly_target: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    view_access: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default="presales"
    )  # Options: presales, postsales, both
    tag: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # Options: channel, endcustomer, both
    dashboard_preferences: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, server_default=text("'{\"widgets\": [], \"lastModified\": null}'::jsonb")
    )  # Stores user dashboard layout: widget IDs, order, visibility
