import uuid
from typing import Optional
from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    base_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    commission_rate: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2), server_default="0"
    )
    stock: Mapped[int] = mapped_column(Integer, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
