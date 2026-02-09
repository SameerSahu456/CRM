from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.schemas.common import CamelModel


class LeadOut(CamelModel):
    id: UUID
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    stage: str = "New"
    priority: str = "Medium"
    estimated_value: Optional[float] = None
    product_interest: Optional[str] = None
    assigned_to: Optional[UUID] = None
    partner_id: Optional[UUID] = None
    notes: Optional[str] = None
    expected_close_date: Optional[date] = None
    lost_reason: Optional[str] = None
    won_sale_id: Optional[UUID] = None
    next_follow_up: Optional[date] = None

    # Lead Information (Extended)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None
    mobile_alternate: Optional[str] = None
    phone_alternate: Optional[str] = None
    campaign_source: Optional[str] = None
    website: Optional[str] = None
    account_type: Optional[str] = None
    lead_category: Optional[str] = None

    # Order Info
    product_list: Optional[str] = None
    type_of_order: Optional[str] = None
    billing_delivery_date: Optional[date] = None
    order_product_details: Optional[str] = None
    payment: Optional[str] = None
    po_number_or_mail_confirmation: Optional[str] = None
    brand: Optional[str] = None
    orc_amount: Optional[float] = None
    product_warranty: Optional[str] = None
    ship_by: Optional[str] = None
    special_instruction: Optional[str] = None
    third_party_delivery_address: Optional[str] = None
    billing_company: Optional[str] = None

    # Forms Info
    enter_product_details: Optional[str] = None
    rental_duration: Optional[str] = None
    product_configuration: Optional[str] = None
    bandwidth_required: Optional[str] = None
    product_name_and_part_number: Optional[str] = None
    specifications: Optional[str] = None
    form_name: Optional[str] = None

    # Billing Address
    billing_street: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_country: Optional[str] = None
    billing_zip_code: Optional[str] = None

    # Description Info
    description: Optional[str] = None
    lead_time: Optional[str] = None
    product_name: Optional[str] = None
    receiver_mobile_number: Optional[str] = None
    subject: Optional[str] = None
    sender_landline_no: Optional[str] = None
    sender_landline_no_alt: Optional[str] = None
    call_duration: Optional[str] = None
    lead_type: Optional[str] = None
    query_id: Optional[str] = None
    mcat_name: Optional[str] = None

    # Lead Image
    lead_image: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assigned_to_name: Optional[str] = None


class LeadCreate(CamelModel):
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    stage: str = "New"
    priority: str = "Medium"
    estimated_value: Optional[float] = None
    product_interest: Optional[str] = None
    assigned_to: Optional[UUID] = None
    partner_id: Optional[UUID] = None
    notes: Optional[str] = None
    expected_close_date: Optional[date] = None
    next_follow_up: Optional[date] = None

    # Lead Information (Extended)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None
    mobile_alternate: Optional[str] = None
    phone_alternate: Optional[str] = None
    campaign_source: Optional[str] = None
    website: Optional[str] = None
    account_type: Optional[str] = None
    lead_category: Optional[str] = None

    # Order Info
    product_list: Optional[str] = None
    type_of_order: Optional[str] = None
    billing_delivery_date: Optional[date] = None
    order_product_details: Optional[str] = None
    payment: Optional[str] = None
    po_number_or_mail_confirmation: Optional[str] = None
    brand: Optional[str] = None
    orc_amount: Optional[float] = None
    product_warranty: Optional[str] = None
    ship_by: Optional[str] = None
    special_instruction: Optional[str] = None
    third_party_delivery_address: Optional[str] = None
    billing_company: Optional[str] = None

    # Forms Info
    enter_product_details: Optional[str] = None
    rental_duration: Optional[str] = None
    product_configuration: Optional[str] = None
    bandwidth_required: Optional[str] = None
    product_name_and_part_number: Optional[str] = None
    specifications: Optional[str] = None
    form_name: Optional[str] = None

    # Billing Address
    billing_street: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_country: Optional[str] = None
    billing_zip_code: Optional[str] = None

    # Description Info
    description: Optional[str] = None
    lead_time: Optional[str] = None
    product_name: Optional[str] = None
    receiver_mobile_number: Optional[str] = None
    subject: Optional[str] = None
    sender_landline_no: Optional[str] = None
    sender_landline_no_alt: Optional[str] = None
    call_duration: Optional[str] = None
    lead_type: Optional[str] = None
    query_id: Optional[str] = None
    mcat_name: Optional[str] = None

    # Lead Image
    lead_image: Optional[str] = None


class LeadUpdate(CamelModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    estimated_value: Optional[float] = None
    product_interest: Optional[str] = None
    assigned_to: Optional[UUID] = None
    partner_id: Optional[UUID] = None
    notes: Optional[str] = None
    expected_close_date: Optional[date] = None
    lost_reason: Optional[str] = None
    next_follow_up: Optional[date] = None

    # Lead Information (Extended)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None
    mobile_alternate: Optional[str] = None
    phone_alternate: Optional[str] = None
    campaign_source: Optional[str] = None
    website: Optional[str] = None
    account_type: Optional[str] = None
    lead_category: Optional[str] = None

    # Order Info
    product_list: Optional[str] = None
    type_of_order: Optional[str] = None
    billing_delivery_date: Optional[date] = None
    order_product_details: Optional[str] = None
    payment: Optional[str] = None
    po_number_or_mail_confirmation: Optional[str] = None
    brand: Optional[str] = None
    orc_amount: Optional[float] = None
    product_warranty: Optional[str] = None
    ship_by: Optional[str] = None
    special_instruction: Optional[str] = None
    third_party_delivery_address: Optional[str] = None
    billing_company: Optional[str] = None

    # Forms Info
    enter_product_details: Optional[str] = None
    rental_duration: Optional[str] = None
    product_configuration: Optional[str] = None
    bandwidth_required: Optional[str] = None
    product_name_and_part_number: Optional[str] = None
    specifications: Optional[str] = None
    form_name: Optional[str] = None

    # Billing Address
    billing_street: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_country: Optional[str] = None
    billing_zip_code: Optional[str] = None

    # Description Info
    description: Optional[str] = None
    lead_time: Optional[str] = None
    product_name: Optional[str] = None
    receiver_mobile_number: Optional[str] = None
    subject: Optional[str] = None
    sender_landline_no: Optional[str] = None
    sender_landline_no_alt: Optional[str] = None
    call_duration: Optional[str] = None
    lead_type: Optional[str] = None
    query_id: Optional[str] = None
    mcat_name: Optional[str] = None

    # Lead Image
    lead_image: Optional[str] = None


class LeadActivityOut(CamelModel):
    id: UUID
    lead_id: UUID
    activity_type: str
    title: str
    description: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    created_by_name: Optional[str] = None


class LeadActivityCreate(CamelModel):
    activity_type: str
    title: str
    description: Optional[str] = None


class LeadConvertRequest(CamelModel):
    partner_id: UUID
    product_id: UUID
    amount: float
    sale_date: date
    customer_name: Optional[str] = None
