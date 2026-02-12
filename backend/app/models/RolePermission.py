import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as pg_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "entity", name="uq_role_permissions_role_entity"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        pg_UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        pg_UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    entity: Mapped[str] = mapped_column(String(50), nullable=False)
    can_view: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    can_create: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    can_edit: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    can_delete: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
