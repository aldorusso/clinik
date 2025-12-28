"""add_tenant_assignment_email_type

Revision ID: bd306d1b2209
Revises: a05e9ac7d2ab
Create Date: 2025-12-28 17:10:23.672317

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bd306d1b2209'
down_revision = 'a05e9ac7d2ab'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new enum value to emailtemplatetype (uppercase to match existing values)
    op.execute("ALTER TYPE emailtemplatetype ADD VALUE IF NOT EXISTS 'TENANT_ASSIGNMENT'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values easily
    # This would require recreating the type and all columns using it
    pass
