import uuid
from typing import Optional
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Quote(TimestampMixin, Base):
    __tablename__ = "quotes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    quote_number: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True)
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    valid_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(15, 2), server_default="0")
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), server_default="18")
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), server_default="0")
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), server_default="0")
    total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), server_default="0")
    status: Mapped[str] = mapped_column(String(50), server_default="draft")
    terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
