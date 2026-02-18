"""Create sales_entries table

Revision ID: qv03u53t048j
Revises: 3i7951jum9km
Create Date: 2026-02-18 18:43:04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'qv03u53t048j'
down_revision = '3i7951jum9km'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'sales_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('entry_number', sa.String(100), unique=True, nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=True),
        sa.Column('entry_date', sa.Date, nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('status', sa.String(50), server_default='pending'),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_sales_entries_entry_number', 'sales_entries', ['entry_number'])
    op.create_index('ix_sales_entries_account_id', 'sales_entries', ['account_id'])
    op.create_index('ix_sales_entries_status', 'sales_entries', ['status'])
    


def downgrade() -> None:

    op.drop_index('ix_sales_entries_status', 'sales_entries')
    op.drop_index('ix_sales_entries_account_id', 'sales_entries')
    op.drop_index('ix_sales_entries_entry_number', 'sales_entries')
    op.drop_table('sales_entries')
    
