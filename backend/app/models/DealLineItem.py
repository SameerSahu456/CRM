import uuid
from typing import Optional
from decimal import Decimal

from sqlalchemy import Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class DealLineItem(Base):
    __tablename__ = "deal_line_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    deal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    product_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    product_sub_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    part_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, server_default="1")
    pricing: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    total_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    warehouse: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    total_rental: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    rental_per_unit: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, server_default="0")
