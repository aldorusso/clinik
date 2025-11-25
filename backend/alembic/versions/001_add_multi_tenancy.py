"""Add multi-tenancy support with tenants table and update users

Revision ID: 001_add_multi_tenancy
Revises: 623713523069
Create Date: 2024-11-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_add_multi_tenancy'
down_revision: Union[str, None] = '623713523069'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('address', sa.String(500), nullable=True),
        sa.Column('tax_id', sa.String(100), nullable=True),
        sa.Column('legal_name', sa.String(255), nullable=True),
        sa.Column('logo', sa.String(), nullable=True),
        sa.Column('primary_color', sa.String(7), nullable=True),
        sa.Column('settings', sa.Text(), nullable=True),
        sa.Column('plan', sa.String(50), nullable=False, server_default='free'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tenants_slug', 'tenants', ['slug'], unique=True)

    # Add tenant_id column to users (nullable for superadmins)
    op.add_column('users', sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index('ix_users_tenant_id', 'users', ['tenant_id'])
    op.create_foreign_key('fk_users_tenant_id', 'users', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')

    # Add new columns to users
    op.add_column('users', sa.Column('job_title', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('client_company_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('client_tax_id', sa.String(100), nullable=True))

    # Step 1: Convert role column to text temporarily
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text")

    # Step 2: Update existing admin roles to superadmin
    op.execute("UPDATE users SET role = 'superadmin' WHERE role = 'admin'")

    # Step 3: Drop old enum type
    op.execute("DROP TYPE IF EXISTS userrole")

    # Step 4: Create new enum type with all 5 roles
    op.execute("CREATE TYPE userrole AS ENUM ('superadmin', 'tenant_admin', 'manager', 'user', 'client')")

    # Step 5: Convert role column back to enum
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")


def downgrade() -> None:
    # Step 1: Convert role column to text temporarily
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text")

    # Step 2: Convert roles back
    op.execute("UPDATE users SET role = 'admin' WHERE role IN ('superadmin', 'tenant_admin')")
    op.execute("UPDATE users SET role = 'user' WHERE role IN ('manager', 'user', 'client')")

    # Step 3: Drop new enum type
    op.execute("DROP TYPE IF EXISTS userrole")

    # Step 4: Create old enum type
    op.execute("CREATE TYPE userrole AS ENUM ('admin', 'user')")

    # Step 5: Convert role column back to enum
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")

    # Remove new columns from users
    op.drop_column('users', 'client_tax_id')
    op.drop_column('users', 'client_company_name')
    op.drop_column('users', 'job_title')

    # Remove tenant relationship
    op.drop_constraint('fk_users_tenant_id', 'users', type_='foreignkey')
    op.drop_index('ix_users_tenant_id', table_name='users')
    op.drop_column('users', 'tenant_id')

    # Drop tenants table
    op.drop_index('ix_tenants_slug', table_name='tenants')
    op.drop_table('tenants')
