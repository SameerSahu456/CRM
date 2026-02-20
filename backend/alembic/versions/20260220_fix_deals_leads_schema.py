"""Fix stage defaults and ensure all extended fields exist on deals and leads

Revision ID: fix_deals_leads_schema
Revises: create_master_dropdowns
Create Date: 2026-02-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'fix_deals_leads_schema'
down_revision = 'create_master_dropdowns'
branch_labels = None
depends_on = None


def _column_exists(table: str, column: str) -> bool:
    """Check if a column exists on a table."""
    from alembic import context
    bind = context.get_bind()
    result = bind.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :column"
        ),
        {"table": table, "column": column},
    )
    return result.fetchone() is not None


def _add_column_if_missing(table: str, column: sa.Column) -> None:
    if not _column_exists(table, column.name):
        op.add_column(table, column)


def upgrade() -> None:
    # Fix stage defaults to 'New' for both deals and leads
    op.alter_column('deals', 'stage', existing_type=sa.String(50), server_default='New')
    op.alter_column('leads', 'stage', existing_type=sa.String(50), server_default='New')

    # --- DEALS: ensure core columns exist ---
    _add_column_if_missing('deals', sa.Column('company', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('next_step', sa.String(500), nullable=True))
    _add_column_if_missing('deals', sa.Column('forecast', sa.String(50), nullable=True))
    _add_column_if_missing('deals', sa.Column('type', sa.String(50), nullable=True))

    # --- DEALS: extended fields ---
    _add_column_if_missing('deals', sa.Column('sdp_no', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('sales_created_by_rm', postgresql.UUID(as_uuid=True), nullable=True))
    _add_column_if_missing('deals', sa.Column('lead_category', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('product_manager', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('expected_revenue', sa.Numeric(15, 2), nullable=True))
    _add_column_if_missing('deals', sa.Column('bandwidth_required', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('product_configuration', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('rental_duration', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('enter_product_details', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('product_name_and_part_number', sa.String(500), nullable=True))
    _add_column_if_missing('deals', sa.Column('specifications', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('show_subform', sa.Boolean(), server_default='false'))
    _add_column_if_missing('deals', sa.Column('billing_delivery_date', sa.Date(), nullable=True))
    _add_column_if_missing('deals', sa.Column('description_of_product', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('payment', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('payment_terms', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('po_number_or_mail_confirmation', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('integration_requirement', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('brand', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('orc_amount', sa.Numeric(15, 2), nullable=True))
    _add_column_if_missing('deals', sa.Column('product_warranty', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('ship_by', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('special_instruction', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('third_party_delivery_address', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('billing_company', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('email_subject', sa.String(500), nullable=True))
    _add_column_if_missing('deals', sa.Column('additional_information', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('da', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('delivery_address', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('tag', sa.String(50), nullable=True))
    _add_column_if_missing('deals', sa.Column('payment_flag', sa.Boolean(), server_default='false'))
    _add_column_if_missing('deals', sa.Column('contact_no', sa.String(50), nullable=True))
    _add_column_if_missing('deals', sa.Column('designation', sa.String(200), nullable=True))
    _add_column_if_missing('deals', sa.Column('email', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('location', sa.String(255), nullable=True))
    _add_column_if_missing('deals', sa.Column('next_follow_up', sa.Date(), nullable=True))
    _add_column_if_missing('deals', sa.Column('requirement', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('quoted_requirement', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('billing_street', sa.Text(), nullable=True))
    _add_column_if_missing('deals', sa.Column('billing_state', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('billing_country', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('billing_city', sa.String(100), nullable=True))
    _add_column_if_missing('deals', sa.Column('billing_zip_code', sa.String(20), nullable=True))

    # --- LEADS: extended fields ---
    _add_column_if_missing('leads', sa.Column('first_name', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('last_name', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('mobile', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('mobile_alternate', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('phone_alternate', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('campaign_source', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('website', sa.String(500), nullable=True))
    _add_column_if_missing('leads', sa.Column('account_type', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('lead_category', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('product_list', sa.String(255), nullable=True))
    _add_column_if_missing('leads', sa.Column('type_of_order', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('billing_delivery_date', sa.Date(), nullable=True))
    _add_column_if_missing('leads', sa.Column('order_product_details', sa.Text(), nullable=True))
    _add_column_if_missing('leads', sa.Column('payment', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('po_number_or_mail_confirmation', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('brand', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('orc_amount', sa.Numeric(15, 2), nullable=True))
    _add_column_if_missing('leads', sa.Column('product_warranty', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('ship_by', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('special_instruction', sa.Text(), nullable=True))
    _add_column_if_missing('leads', sa.Column('third_party_delivery_address', sa.Text(), nullable=True))
    _add_column_if_missing('leads', sa.Column('billing_company', sa.String(255), nullable=True))
    _add_column_if_missing('leads', sa.Column('enter_product_details', sa.Text(), nullable=True))
    _add_column_if_missing('leads', sa.Column('rental_duration', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('product_configuration', sa.Text(), nullable=True))
    _add_column_if_missing('leads', sa.Column('bandwidth_required', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('product_name_and_part_number', sa.String(255), nullable=True))
    _add_column_if_missing('leads', sa.Column('specifications', sa.Text(), nullable=True))
    _add_column_if_missing('leads', sa.Column('form_name', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('billing_street', sa.String(255), nullable=True))
    _add_column_if_missing('leads', sa.Column('billing_city', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('billing_state', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('billing_country', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('billing_zip_code', sa.String(20), nullable=True))
    _add_column_if_missing('leads', sa.Column('description', sa.Text(), nullable=True))
    _add_column_if_missing('leads', sa.Column('lead_time', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('product_name', sa.String(255), nullable=True))
    _add_column_if_missing('leads', sa.Column('receiver_mobile_number', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('subject', sa.String(500), nullable=True))
    _add_column_if_missing('leads', sa.Column('sender_landline_no', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('sender_landline_no_alt', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('call_duration', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('lead_type', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('query_id', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('mcat_name', sa.String(100), nullable=True))
    _add_column_if_missing('leads', sa.Column('tag', sa.String(50), nullable=True))
    _add_column_if_missing('leads', sa.Column('designation', sa.String(200), nullable=True))
    _add_column_if_missing('leads', sa.Column('location', sa.String(255), nullable=True))
    _add_column_if_missing('leads', sa.Column('requirement', sa.Text(), nullable=True))
    _add_column_if_missing('leads', sa.Column('quoted_requirement', sa.Text(), nullable=True))
    _add_column_if_missing('leads', sa.Column('lead_image', sa.Text(), nullable=True))


def downgrade() -> None:
    op.alter_column('leads', 'stage', existing_type=sa.String(50), server_default='Cold')
    op.alter_column('deals', 'stage', existing_type=sa.String(50), server_default='Cold')
