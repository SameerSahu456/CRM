import uuid
from typing import Optional

from sqlalchemy import String, Text, text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Contact(TimestampMixin, Base):
    __tablename__ = "contacts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()")
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    mobile: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), server_default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preferred_contact: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Contact Image
    image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Description Information
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_group: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Extended Contact Information
    ctsipl_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    pan: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    gstin_no: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    product_interested: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    product_interested_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lead_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    lead_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    vendor_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    new_leads: Mapped[Optional[bool]] = mapped_column(Boolean, server_default="false")

    # Document URLs
    gst_certificate_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    msme_certificate_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pan_card_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    aadhar_card_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Forms Info
    bandwidth_required: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    product_configuration: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    product_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rental_duration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    product_name_part_number: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specifications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Mailing Address
    mailing_street: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mailing_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    mailing_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    mailing_zip: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    mailing_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Other Address
    other_street: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    other_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    other_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    other_zip: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    other_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
