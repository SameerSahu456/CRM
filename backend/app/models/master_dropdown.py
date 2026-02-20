import uuid
from typing import Optional

from sqlalchemy import Boolean, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as pg_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class MasterDropdown(TimestampMixin, Base):
    __tablename__ = "master_dropdowns"
    __table_args__ = (
        UniqueConstraint("entity", "value", name="ix_master_dropdowns_entity_value"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        pg_UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    entity: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
