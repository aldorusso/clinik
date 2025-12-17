"""Rename user role to medico in UserRole enum

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2025-12-17 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL doesn't support renaming enum values directly
    # We need to recreate the enum

    # 1. Create a new enum type with 'medico' instead of 'user'
    op.execute("""
        CREATE TYPE userrole_new AS ENUM (
            'superadmin',
            'tenant_admin',
            'manager',
            'medico',
            'closer',
            'recepcionista',
            'patient'
        )
    """)

    # 2. Update the column to use text temporarily
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text")

    # 3. Update 'user' to 'medico' in the data
    op.execute("UPDATE users SET role = 'medico' WHERE role = 'user'")

    # 4. Convert to new enum type
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_new USING role::userrole_new")

    # 5. Drop old enum and rename new one
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")


def downgrade() -> None:
    # Reverse the process: recreate with 'user' instead of 'medico'
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

    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text")
    op.execute("UPDATE users SET role = 'user' WHERE role = 'medico'")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_new USING role::userrole_new")
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")
