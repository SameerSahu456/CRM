from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.schemas.common import CamelModel
from app.schemas.DealLineItemSchema import DealLineItemOut, DealLineItemCreate


class DealOut(CamelModel):
    id: UUID
    title: str
    company: Optional[str] = None
    account_id: Optional[UUID] = None
    value: Optional[float] = None
    stage: str = "Cold"
    probability: Optional[int] = None
    owner_id: Optional[UUID] = None
    closing_date: Optional[date] = None
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    next_step: Optional[str] = None
    forecast: Optional[str] = None
    type: Optional[str] = None
    lead_source: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    account_name: Optional[str] = None
    contact_name: Optional[str] = None
    owner_name: Optional[str] = None

    # New fields
    sdp_no: Optional[str] = None
    sales_created_by_rm: Optional[UUID] = None
    lead_category: Optional[str] = None
    product_manager: Optional[str] = None
    expected_revenue: Optional[float] = None
    bandwidth_required: Optional[str] = None
    product_configuration: Optional[str] = None
    rental_duration: Optional[str] = None
    enter_product_details: Optional[str] = None
    product_name_and_part_number: Optional[str] = None
    specifications: Optional[str] = None
    show_subform: Optional[bool] = None
    billing_delivery_date: Optional[date] = None
    description_of_product: Optional[str] = None
    payment: Optional[str] = None
    payment_terms: Optional[str] = None
    po_number_or_mail_confirmation: Optional[str] = None
    integration_requirement: Optional[str] = None
    brand: Optional[str] = None
    orc_amount: Optional[float] = None
    product_warranty: Optional[str] = None
    ship_by: Optional[str] = None
    special_instruction: Optional[str] = None
    third_party_delivery_address: Optional[str] = None
    billing_company: Optional[str] = None
    email_subject: Optional[str] = None
    additional_information: Optional[str] = None
    da: Optional[str] = None
    delivery_address: Optional[str] = None
    billing_street: Optional[str] = None
    billing_state: Optional[str] = None
    billing_country: Optional[str] = None
    billing_city: Optional[str] = None
    billing_zip_code: Optional[str] = None
    tag: Optional[str] = None
    payment_flag: Optional[bool] = None
    # Contact/Display fields
    contact_no: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    next_follow_up: Optional[date] = None
    # Requirements
    requirement: Optional[str] = None
    quoted_requirement: Optional[str] = None
    line_items: Optional[list[DealLineItemOut]] = None


class DealCreate(CamelModel):
    title: str
    company: Optional[str] = None
    account_id: Optional[UUID] = None
    value: Optional[float] = None
    stage: str = "Cold"
    probability: Optional[int] = None
    owner_id: Optional[UUID] = None
    closing_date: Optional[date] = None
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    next_step: Optional[str] = None
    forecast: Optional[str] = None
    type: Optional[str] = None
    lead_source: Optional[str] = None

    # New fields
    sdp_no: Optional[str] = None
    sales_created_by_rm: Optional[UUID] = None
    lead_category: Optional[str] = None
    product_manager: Optional[str] = None
    expected_revenue: Optional[float] = None
    bandwidth_required: Optional[str] = None
    product_configuration: Optional[str] = None
    rental_duration: Optional[str] = None
    enter_product_details: Optional[str] = None
    product_name_and_part_number: Optional[str] = None
    specifications: Optional[str] = None
    show_subform: Optional[bool] = None
    billing_delivery_date: Optional[date] = None
    description_of_product: Optional[str] = None
    payment: Optional[str] = None
    payment_terms: Optional[str] = None
    po_number_or_mail_confirmation: Optional[str] = None
    integration_requirement: Optional[str] = None
    brand: Optional[str] = None
    orc_amount: Optional[float] = None
    product_warranty: Optional[str] = None
    ship_by: Optional[str] = None
    special_instruction: Optional[str] = None
    third_party_delivery_address: Optional[str] = None
    billing_company: Optional[str] = None
    email_subject: Optional[str] = None
    additional_information: Optional[str] = None
    da: Optional[str] = None
    delivery_address: Optional[str] = None
    billing_street: Optional[str] = None
    billing_state: Optional[str] = None
    billing_country: Optional[str] = None
    billing_city: Optional[str] = None
    billing_zip_code: Optional[str] = None
    tag: Optional[str] = None
    payment_flag: Optional[bool] = None
    # Contact/Display fields
    contact_no: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    next_follow_up: Optional[date] = None
    # Requirements
    requirement: Optional[str] = None
    quoted_requirement: Optional[str] = None
    line_items: list[DealLineItemCreate] = []


class DealUpdate(CamelModel):
    title: Optional[str] = None
    company: Optional[str] = None
    account_id: Optional[UUID] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    probability: Optional[int] = None
    owner_id: Optional[UUID] = None
    closing_date: Optional[date] = None
    description: Optional[str] = None
    contact_id: Optional[UUID] = None
    next_step: Optional[str] = None
    forecast: Optional[str] = None
    type: Optional[str] = None
    lead_source: Optional[str] = None

    # New fields
    sdp_no: Optional[str] = None
    sales_created_by_rm: Optional[UUID] = None
    lead_category: Optional[str] = None
    product_manager: Optional[str] = None
    expected_revenue: Optional[float] = None
    bandwidth_required: Optional[str] = None
    product_configuration: Optional[str] = None
    rental_duration: Optional[str] = None
    enter_product_details: Optional[str] = None
    product_name_and_part_number: Optional[str] = None
    specifications: Optional[str] = None
    show_subform: Optional[bool] = None
    billing_delivery_date: Optional[date] = None
    description_of_product: Optional[str] = None
    payment: Optional[str] = None
    payment_terms: Optional[str] = None
    po_number_or_mail_confirmation: Optional[str] = None
    integration_requirement: Optional[str] = None
    brand: Optional[str] = None
    orc_amount: Optional[float] = None
    product_warranty: Optional[str] = None
    ship_by: Optional[str] = None
    special_instruction: Optional[str] = None
    third_party_delivery_address: Optional[str] = None
    billing_company: Optional[str] = None
    email_subject: Optional[str] = None
    additional_information: Optional[str] = None
    da: Optional[str] = None
    delivery_address: Optional[str] = None
    billing_street: Optional[str] = None
    billing_state: Optional[str] = None
    billing_country: Optional[str] = None
    billing_city: Optional[str] = None
    billing_zip_code: Optional[str] = None
    tag: Optional[str] = None
    payment_flag: Optional[bool] = None
    # Contact/Display fields
    contact_no: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    next_follow_up: Optional[date] = None
    # Requirements
    requirement: Optional[str] = None
    quoted_requirement: Optional[str] = None
    line_items: Optional[list[DealLineItemCreate]] = None


class DealActivityOut(CamelModel):
    id: UUID
    deal_id: UUID
    activity_type: str
    title: str
    description: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    created_by_name: Optional[str] = None


class DealActivityCreate(CamelModel):
    activity_type: str
    title: str
    description: Optional[str] = None
