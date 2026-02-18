"""Create leads table

Revision ID: 5hqnp1zprabv
Revises: trgmjrvsvhge
Create Date: 2026-02-18 18:42:54

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '5hqnp1zprabv'
down_revision = 'trgmjrvsvhge'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('contact_name', sa.String(200), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('source', sa.String(100), nullable=True),
        sa.Column('status', sa.String(50), server_default='new'),
        sa.Column('industry', sa.String(100), nullable=True),
        sa.Column('estimated_value', sa.Numeric(15, 2), nullable=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_leads_status', 'leads', ['status'])
    op.create_index('ix_leads_assigned_to', 'leads', ['assigned_to'])
    


def downgrade() -> None:

    op.drop_index('ix_leads_assigned_to', 'leads')
    op.drop_index('ix_leads_status', 'leads')
    op.drop_table('leads')
    
