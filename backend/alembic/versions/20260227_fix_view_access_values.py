"""Fix view_access values: normalize 'all', 'team', 'own' to valid values

Revision ID: fix_view_access_values
Revises: add_deal_id_to_quotes
Create Date: 2026-02-27
"""
from alembic import op

revision = 'fix_view_access_values'
down_revision = 'add_deal_id_to_quotes'
branch_labels = None
depends_on = None


def upgrade():
    # Map legacy data-scope values to valid UI view-access values
    # 'all' -> 'both' (can see everything)
    # 'team' -> 'both' (managers should see everything)
    # 'own' -> 'both' (sales reps - admin can restrict later via admin panel)
    op.execute("UPDATE users SET view_access = 'both' WHERE view_access = 'all'")
    op.execute("UPDATE users SET view_access = 'both' WHERE view_access = 'team'")
    op.execute("UPDATE users SET view_access = 'both' WHERE view_access = 'own'")


def downgrade():
    pass
