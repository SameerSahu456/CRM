"""Create master_dropdowns table

Revision ID: create_master_dropdowns
Revises: 497a5a9511f7
Create Date: 2026-02-18 22:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_master_dropdowns'
down_revision = '497a5a9511f7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create master_dropdowns table
    op.create_table(
        'master_dropdowns',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('entity', sa.String(100), nullable=False),
        sa.Column('value', sa.String(255), nullable=False),
        sa.Column('label', sa.String(255), nullable=False),
        sa.Column('sort_order', sa.Integer, server_default='0'),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('metadata', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_master_dropdowns_entity', 'master_dropdowns', ['entity'])
    op.create_index('ix_master_dropdowns_entity_value', 'master_dropdowns', ['entity', 'value'], unique=True)

    # Seed default dropdown data
    op.execute("""
        INSERT INTO master_dropdowns (entity, value, label, sort_order, metadata) VALUES
        -- Deal Stages
        ('deal-stages', 'New', 'New', 0, '{"is_pipeline": true}'),
        ('deal-stages', 'Cold', 'Cold', 1, '{"is_pipeline": true}'),
        ('deal-stages', 'Proposal', 'Proposal', 2, '{"is_pipeline": true}'),
        ('deal-stages', 'Negotiation', 'Negotiation', 3, '{"is_pipeline": true}'),
        ('deal-stages', 'Closed Won', 'Closed Won', 4, '{"is_terminal": true}'),
        ('deal-stages', 'Closed Lost', 'Closed Lost', 5, '{"is_terminal": true}'),
        
        -- Deal Types
        ('deal-types', 'New Business', 'New Business', 1, NULL),
        ('deal-types', 'Existing Business', 'Existing Business', 2, NULL),
        ('deal-types', 'Renewal', 'Renewal', 3, NULL),
        
        -- Lead Sources
        ('lead-sources', 'Website', 'Website', 1, NULL),
        ('lead-sources', 'Referral', 'Referral', 2, NULL),
        ('lead-sources', 'Cold Call', 'Cold Call', 3, NULL),
        ('lead-sources', 'Trade Show', 'Trade Show', 4, NULL),
        ('lead-sources', 'LinkedIn', 'LinkedIn', 5, NULL),
        ('lead-sources', 'Email Campaign', 'Email Campaign', 6, NULL),
        ('lead-sources', 'Partner', 'Partner', 7, NULL),
        
        -- Forecast Options
        ('forecast-options', 'Pipeline', 'Pipeline', 1, NULL),
        ('forecast-options', 'Best Case', 'Best Case', 2, NULL),
        ('forecast-options', 'Commit', 'Commit', 3, NULL),
        ('forecast-options', 'Closed', 'Closed', 4, NULL),
        
        -- Task Statuses
        ('task-statuses', 'pending', 'Pending', 1, NULL),
        ('task-statuses', 'in_progress', 'In Progress', 2, NULL),
        ('task-statuses', 'completed', 'Completed', 3, NULL),
        ('task-statuses', 'cancelled', 'Cancelled', 4, NULL),
        
        -- Priorities
        ('priorities', 'Low', 'Low', 1, NULL),
        ('priorities', 'Medium', 'Medium', 2, NULL),
        ('priorities', 'High', 'High', 3, NULL),
        ('priorities', 'Urgent', 'Urgent', 4, NULL),
        
        -- Task Types
        ('task-types', 'Call', 'Call', 1, NULL),
        ('task-types', 'Email', 'Email', 2, NULL),
        ('task-types', 'Meeting', 'Meeting', 3, NULL),
        ('task-types', 'Follow-up', 'Follow-up', 4, NULL),
        ('task-types', 'Demo', 'Demo', 5, NULL),
        ('task-types', 'Proposal', 'Proposal', 6, NULL),
        
        -- Event Types
        ('event-types', 'meeting', 'Meeting', 1, NULL),
        ('event-types', 'call', 'Call', 2, NULL),
        ('event-types', 'task', 'Task', 3, NULL),
        ('event-types', 'reminder', 'Reminder', 4, NULL),
        
        -- Email Statuses
        ('email-statuses', 'draft', 'Draft', 1, NULL),
        ('email-statuses', 'sent', 'Sent', 2, NULL),
        ('email-statuses', 'delivered', 'Delivered', 3, NULL),
        ('email-statuses', 'failed', 'Failed', 4, NULL),
        
        -- Template Categories
        ('template-categories', 'Sales', 'Sales', 1, NULL),
        ('template-categories', 'Marketing', 'Marketing', 2, NULL),
        ('template-categories', 'Support', 'Support', 3, NULL),
        ('template-categories', 'General', 'General', 4, NULL),
        
        -- Contact Types
        ('contact-types', 'Primary', 'Primary', 1, NULL),
        ('contact-types', 'Secondary', 'Secondary', 2, NULL),
        ('contact-types', 'Billing', 'Billing', 3, NULL),
        ('contact-types', 'Technical', 'Technical', 4, NULL),
        
        -- Partner Tiers
        ('partner-tiers', 'new', 'New', 1, NULL),
        ('partner-tiers', 'bronze', 'Bronze', 2, NULL),
        ('partner-tiers', 'silver', 'Silver', 3, NULL),
        ('partner-tiers', 'gold', 'Gold', 4, NULL),
        ('partner-tiers', 'platinum', 'Platinum', 5, NULL),
        
        -- Partner Statuses
        ('partner-statuses', 'pending', 'Pending', 1, NULL),
        ('partner-statuses', 'approved', 'Approved', 2, NULL),
        ('partner-statuses', 'suspended', 'Suspended', 3, NULL),
        ('partner-statuses', 'inactive', 'Inactive', 4, NULL)
    """)


def downgrade() -> None:
    op.drop_index('ix_master_dropdowns_entity_value', 'master_dropdowns')
    op.drop_index('ix_master_dropdowns_entity', 'master_dropdowns')
    op.drop_table('master_dropdowns')

