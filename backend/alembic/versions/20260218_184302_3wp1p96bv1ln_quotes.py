"""Create quotes table

Revision ID: 3wp1p96bv1ln
Revises: wg09g53bhzk0
Create Date: 2026-02-18 18:43:02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3wp1p96bv1ln'
down_revision = 'wg09g53bhzk0'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'quotes',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('quote_number', sa.String(100), unique=True, nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=True),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('subject', sa.String(255), nullable=True),
        sa.Column('status', sa.String(50), server_default='draft'),
        sa.Column('valid_until', sa.Date, nullable=True),
        sa.Column('subtotal', sa.Numeric(15, 2), nullable=True),
        sa.Column('tax_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('total_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('discount_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_quotes_quote_number', 'quotes', ['quote_number'])
    op.create_index('ix_quotes_status', 'quotes', ['status'])
    op.create_index('ix_quotes_account_id', 'quotes', ['account_id'])
    


def downgrade() -> None:

    op.drop_index('ix_quotes_account_id', 'quotes')
    op.drop_index('ix_quotes_status', 'quotes')
    op.drop_index('ix_quotes_quote_number', 'quotes')
    op.drop_table('quotes')
    
