import uuid
from typing import Optional
from decimal import Decimal

from sqlalchemy import Integer, Numeric, String, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Account(TimestampMixin, Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    revenue: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    employees: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), server_default="active")
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    health_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    gstin_no: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    payment_terms: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Additional fields
    account_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    group_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    parent_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    endcustomer_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    products_selling_to_them: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    products_they_sell: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pan_no: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True
    )
    lead_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    new_leads: Mapped[Optional[int]] = mapped_column(Integer, server_default="0")
    references_doc: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    bank_statement_doc: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    account_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Contact Information
    contact_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_designation_other: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Billing Address
    billing_street: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    billing_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    billing_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Shipping Address
    shipping_street: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shipping_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    shipping_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    shipping_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    shipping_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
