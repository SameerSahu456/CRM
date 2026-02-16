from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from app.schemas.common import CamelModel


class AccountOut(CamelModel):
    id: UUID
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    revenue: Optional[float] = None
    employees: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    status: str = "active"
    phone: Optional[str] = None
    email: Optional[str] = None
    health_score: Optional[int] = None
    description: Optional[str] = None
    owner_id: Optional[UUID] = None
    gstin_no: Optional[str] = None
    payment_terms: Optional[str] = None

    # Additional fields
    account_image: Optional[str] = None
    group_name: Optional[str] = None
    parent_account_id: Optional[UUID] = None
    endcustomer_category: Optional[str] = None
    products_selling_to_them: Optional[str] = None
    products_they_sell: Optional[str] = None
    pan_no: Optional[str] = None
    partner_id: Optional[UUID] = None
    lead_category: Optional[str] = None
    new_leads: Optional[int] = None
    references_doc: Optional[str] = None
    bank_statement_doc: Optional[str] = None
    tag: Optional[str] = None

    # Contact Information
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_designation: Optional[str] = None
    contact_designation_other: Optional[str] = None

    # Billing Address
    billing_street: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_code: Optional[str] = None
    billing_country: Optional[str] = None

    # Shipping Address
    shipping_street: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_code: Optional[str] = None
    shipping_country: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    owner_name: Optional[str] = None
    partner_name: Optional[str] = None


class AccountCreate(CamelModel):
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    revenue: Optional[float] = None
    employees: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    status: str = "active"
    phone: Optional[str] = None
    email: Optional[str] = None
    health_score: Optional[int] = None
    description: Optional[str] = None
    owner_id: Optional[UUID] = None
    gstin_no: Optional[str] = None
    payment_terms: Optional[str] = None

    # Additional fields
    account_image: Optional[str] = None
    group_name: Optional[str] = None
    parent_account_id: Optional[UUID] = None
    endcustomer_category: Optional[str] = None
    products_selling_to_them: Optional[str] = None
    products_they_sell: Optional[str] = None
    pan_no: Optional[str] = None
    partner_id: Optional[UUID] = None
    lead_category: Optional[str] = None
    new_leads: Optional[int] = None
    references_doc: Optional[str] = None
    bank_statement_doc: Optional[str] = None
    tag: Optional[str] = None

    # Contact Information
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_designation: Optional[str] = None
    contact_designation_other: Optional[str] = None

    # Billing Address
    billing_street: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_code: Optional[str] = None
    billing_country: Optional[str] = None

    # Shipping Address
    shipping_street: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_code: Optional[str] = None
    shipping_country: Optional[str] = None


class AccountUpdate(CamelModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    revenue: Optional[float] = None
    employees: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    health_score: Optional[int] = None
    description: Optional[str] = None
    owner_id: Optional[UUID] = None
    gstin_no: Optional[str] = None
    payment_terms: Optional[str] = None

    # Additional fields
    account_image: Optional[str] = None
    group_name: Optional[str] = None
    parent_account_id: Optional[UUID] = None
    endcustomer_category: Optional[str] = None
    products_selling_to_them: Optional[str] = None
    products_they_sell: Optional[str] = None
    pan_no: Optional[str] = None
    partner_id: Optional[UUID] = None
    lead_category: Optional[str] = None
    new_leads: Optional[int] = None
    references_doc: Optional[str] = None
    bank_statement_doc: Optional[str] = None
    tag: Optional[str] = None

    # Contact Information
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_designation: Optional[str] = None
    contact_designation_other: Optional[str] = None

    # Billing Address
    billing_street: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_code: Optional[str] = None
    billing_country: Optional[str] = None

    # Shipping Address
    shipping_street: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_code: Optional[str] = None
    shipping_country: Optional[str] = None
