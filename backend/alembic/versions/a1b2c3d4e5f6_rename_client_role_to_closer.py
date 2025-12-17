"""Rename client role to closer in UserRole enum

Revision ID: a1b2c3d4e5f6
Revises: 9e4b78e2a31f
Create Date: 2025-12-17 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '9e4b78e2a31f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL doesn't support renaming enum values directly and requires
    # that new enum values be committed before use.
    # We need to use a different approach: recreate the enum

    # 1. Create a new enum type with 'closer' instead of 'client'
    op.execute("""
        CREATE TYPE userrole_new AS ENUM (
            'superadmin',
            'tenant_admin',
            'manager',
            'user',
            'closer',
            'recepcionista',
            'patient'
        )
    """)

    # 2. Update the column to use the new type
    # First, alter the column to text
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text")

    # 3. Update 'client' to 'closer' in the data
    op.execute("UPDATE users SET role = 'closer' WHERE role = 'client'")

    # 4. Convert to new enum type
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_new USING role::userrole_new")

    # 5. Drop old enum and rename new one
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")


def downgrade() -> None:
    # Reverse the process: recreate with 'client' instead of 'closer'
    op.execute("""
        CREATE TYPE userrole_new AS ENUM (
            'superadmin',
            'tenant_admin',
            'manager',
            'user',
            'client',
            'recepcionista',
            'patient'
        )
    """)

    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text")
    op.execute("UPDATE users SET role = 'client' WHERE role = 'closer'")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_new USING role::userrole_new")
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")
