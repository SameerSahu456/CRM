"""Create deals table

Revision ID: wg09g53bhzk0
Revises: kdgneknnm8tb
Create Date: 2026-02-18 18:43:01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'wg09g53bhzk0'
down_revision = 'kdgneknnm8tb'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'deals',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=True),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('stage', sa.String(50), server_default='qualification'),
        sa.Column('probability', sa.Integer, nullable=True),
        sa.Column('expected_close_date', sa.Date, nullable=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('source', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_deals_stage', 'deals', ['stage'])
    op.create_index('ix_deals_account_id', 'deals', ['account_id'])
    op.create_index('ix_deals_owner_id', 'deals', ['owner_id'])
    


def downgrade() -> None:

    op.drop_index('ix_deals_owner_id', 'deals')
    op.drop_index('ix_deals_account_id', 'deals')
    op.drop_index('ix_deals_stage', 'deals')
    op.drop_table('deals')
    
