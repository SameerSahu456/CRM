import uuid
from typing import Optional
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class SalesEntry(TimestampMixin, Base):
    __tablename__ = "sales_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    partner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    salesperson_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    customer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, server_default="1")
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    po_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    invoice_no: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(50), server_default="pending")
    commission_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2), server_default="0"
    )
    sale_date: Mapped[date] = mapped_column(Date, nullable=False)
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    vertical_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deal_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deals.id"), nullable=True
    )
    product_ids: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True, server_default=text("'[]'::jsonb"))
