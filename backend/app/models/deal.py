import uuid
from typing import Optional
from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Deal(TimestampMixin, Base):
    __tablename__ = "deals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    value: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    stage: Mapped[str] = mapped_column(String(50), server_default="New")
    probability: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    closing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    next_step: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    forecast: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lead_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Deal Information
    sdp_no: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sales_created_by_rm: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    lead_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    product_manager: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    expected_revenue: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)

    # Order Info
    type_of_order: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Forms Info
    bandwidth_required: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    product_configuration: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rental_duration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    enter_product_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    product_name_and_part_number: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    specifications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Other Info
    show_subform: Mapped[Optional[bool]] = mapped_column(Boolean, server_default="false")
    billing_delivery_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    description_of_product: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    payment_terms: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    po_number_or_mail_confirmation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    integration_requirement: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    orc_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    product_warranty: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ship_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    special_instruction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    third_party_delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    billing_company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email_subject: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    additional_information: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    da: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Tag: Channel or End Customer
    tag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    payment_flag: Mapped[Optional[bool]] = mapped_column(Boolean, server_default="false")

    # Contact/Display fields
    contact_no: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    next_follow_up: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Requirements
    requirement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quoted_requirement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Billing Address
    billing_street: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    billing_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
