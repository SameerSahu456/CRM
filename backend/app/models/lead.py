import uuid
from typing import Optional
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Lead(TimestampMixin, Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stage: Mapped[str] = mapped_column(String(50), server_default="New")
    priority: Mapped[str] = mapped_column(String(20), server_default="Medium")
    estimated_value: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    product_interest: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_close_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    lost_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    won_sale_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    next_follow_up: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Lead Information (Extended)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    mobile: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    mobile_alternate: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phone_alternate: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    campaign_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    account_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lead_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Order Info
    product_list: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    type_of_order: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_delivery_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    order_product_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    po_number_or_mail_confirmation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    orc_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    product_warranty: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ship_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    special_instruction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    third_party_delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    billing_company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Forms Info
    enter_product_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rental_duration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    product_configuration: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bandwidth_required: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    product_name_and_part_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    specifications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    form_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Billing Address
    billing_street: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    billing_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Description Info
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lead_time: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    product_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    receiver_mobile_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sender_landline_no: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sender_landline_no_alt: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    call_duration: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lead_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    query_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    mcat_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Tag: Channel or End Customer
    tag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Designation and Location
    designation: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Requirements
    requirement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quoted_requirement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Lead Image
    lead_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Kanban ordering
    kanban_order: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
