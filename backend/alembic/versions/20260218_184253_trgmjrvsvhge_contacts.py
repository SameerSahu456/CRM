"""Create contacts table

Revision ID: trgmjrvsvhge
Revises: dfrkcp1o752c
Create Date: 2026-02-18 18:42:53

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'trgmjrvsvhge'
down_revision = 'dfrkcp1o752c'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'contacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('mobile', sa.String(50), nullable=True),
        sa.Column('title', sa.String(100), nullable=True),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=True),
        sa.Column('is_primary', sa.Boolean, server_default='false'),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_contacts_account_id', 'contacts', ['account_id'])
    op.create_index('ix_contacts_email', 'contacts', ['email'])
    


def downgrade() -> None:

    op.drop_index('ix_contacts_email', 'contacts')
    op.drop_index('ix_contacts_account_id', 'contacts')
    op.drop_table('contacts')
    
