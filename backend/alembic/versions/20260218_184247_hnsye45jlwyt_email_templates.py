"""Create email_templates table

Revision ID: hnsye45jlwyt
Revises: 952qs98dj1h2
Create Date: 2026-02-18 18:42:47

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'hnsye45jlwyt'
down_revision = '952qs98dj1h2'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'email_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('body', sa.Text, nullable=False),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_email_templates_category', 'email_templates', ['category'])
    


def downgrade() -> None:

    op.drop_index('ix_email_templates_category', 'email_templates')
    op.drop_table('email_templates')
    
