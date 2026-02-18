"""Create accounts table

Revision ID: dfrkcp1o752c
Revises: lqyyk7bob5bn
Create Date: 2026-02-18 18:42:52

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'dfrkcp1o752c'
down_revision = 'lqyyk7bob5bn'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('industry', sa.String(100), nullable=True),
        sa.Column('website', sa.String(500), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('billing_address', sa.Text, nullable=True),
        sa.Column('shipping_address', sa.Text, nullable=True),
        sa.Column('status', sa.String(50), server_default='active'),
        sa.Column('partner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('partners.id', ondelete='SET NULL'), nullable=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_accounts_status', 'accounts', ['status'])
    op.create_index('ix_accounts_partner_id', 'accounts', ['partner_id'])
    


def downgrade() -> None:

    op.drop_index('ix_accounts_partner_id', 'accounts')
    op.drop_index('ix_accounts_status', 'accounts')
    op.drop_table('accounts')
    
