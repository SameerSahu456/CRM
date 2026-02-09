from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class ContactOut(CamelModel):
    id: UUID
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    account_id: Optional[UUID] = None
    type: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None
    preferred_contact: Optional[str] = None
    owner_id: Optional[UUID] = None

    # Contact Image
    image: Optional[str] = None

    # Description Information
    description: Optional[str] = None
    contact_group: Optional[str] = None

    # Extended Contact Information
    ctsipl_email: Optional[str] = None
    pan: Optional[str] = None
    gstin_no: Optional[str] = None
    product_interested: Optional[str] = None
    product_interested_text: Optional[str] = None
    lead_source: Optional[str] = None
    lead_category: Optional[str] = None
    designation: Optional[str] = None
    vendor_name: Optional[str] = None
    partner_id: Optional[UUID] = None
    new_leads: Optional[bool] = None

    # Forms Info
    bandwidth_required: Optional[str] = None
    product_configuration: Optional[str] = None
    product_details: Optional[str] = None
    rental_duration: Optional[str] = None
    product_name_part_number: Optional[str] = None
    specifications: Optional[str] = None

    # Mailing Address
    mailing_street: Optional[str] = None
    mailing_city: Optional[str] = None
    mailing_state: Optional[str] = None
    mailing_zip: Optional[str] = None
    mailing_country: Optional[str] = None

    # Other Address
    other_street: Optional[str] = None
    other_city: Optional[str] = None
    other_state: Optional[str] = None
    other_zip: Optional[str] = None
    other_country: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    account_name: Optional[str] = None
    owner_name: Optional[str] = None


class ContactCreate(CamelModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    account_id: Optional[UUID] = None
    type: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None
    preferred_contact: Optional[str] = None
    owner_id: Optional[UUID] = None

    # Contact Image
    image: Optional[str] = None

    # Description Information
    description: Optional[str] = None
    contact_group: Optional[str] = None

    # Extended Contact Information
    ctsipl_email: Optional[str] = None
    pan: Optional[str] = None
    gstin_no: Optional[str] = None
    product_interested: Optional[str] = None
    product_interested_text: Optional[str] = None
    lead_source: Optional[str] = None
    lead_category: Optional[str] = None
    designation: Optional[str] = None
    vendor_name: Optional[str] = None
    partner_id: Optional[UUID] = None
    new_leads: Optional[bool] = None

    # Forms Info
    bandwidth_required: Optional[str] = None
    product_configuration: Optional[str] = None
    product_details: Optional[str] = None
    rental_duration: Optional[str] = None
    product_name_part_number: Optional[str] = None
    specifications: Optional[str] = None

    # Mailing Address
    mailing_street: Optional[str] = None
    mailing_city: Optional[str] = None
    mailing_state: Optional[str] = None
    mailing_zip: Optional[str] = None
    mailing_country: Optional[str] = None

    # Other Address
    other_street: Optional[str] = None
    other_city: Optional[str] = None
    other_state: Optional[str] = None
    other_zip: Optional[str] = None
    other_country: Optional[str] = None


class ContactUpdate(CamelModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    account_id: Optional[UUID] = None
    type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    preferred_contact: Optional[str] = None
    owner_id: Optional[UUID] = None

    # Contact Image
    image: Optional[str] = None

    # Description Information
    description: Optional[str] = None
    contact_group: Optional[str] = None

    # Extended Contact Information
    ctsipl_email: Optional[str] = None
    pan: Optional[str] = None
    gstin_no: Optional[str] = None
    product_interested: Optional[str] = None
    product_interested_text: Optional[str] = None
    lead_source: Optional[str] = None
    lead_category: Optional[str] = None
    designation: Optional[str] = None
    vendor_name: Optional[str] = None
    partner_id: Optional[UUID] = None
    new_leads: Optional[bool] = None

    # Forms Info
    bandwidth_required: Optional[str] = None
    product_configuration: Optional[str] = None
    product_details: Optional[str] = None
    rental_duration: Optional[str] = None
    product_name_part_number: Optional[str] = None
    specifications: Optional[str] = None

    # Mailing Address
    mailing_street: Optional[str] = None
    mailing_city: Optional[str] = None
    mailing_state: Optional[str] = None
    mailing_zip: Optional[str] = None
    mailing_country: Optional[str] = None

    # Other Address
    other_street: Optional[str] = None
    other_city: Optional[str] = None
    other_state: Optional[str] = None
    other_zip: Optional[str] = None
    other_country: Optional[str] = None
