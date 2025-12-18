"""add_tenant_memberships_multi_tenant

Revision ID: a05e9ac7d2ab
Revises: b2c3d4e5f6g7
Create Date: 2025-12-18 20:28:07.877626

Este migration:
1. Crea la tabla tenant_memberships para el sistema multi-tenant
2. Agrega is_superadmin_flag a users
3. Migra los usuarios existentes a la nueva tabla de membresías
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = 'a05e9ac7d2ab'
down_revision = 'b2c3d4e5f6g7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Crear tabla tenant_memberships
    op.create_table('tenant_memberships',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('role', postgresql.ENUM('superadmin', 'tenant_admin', 'manager', 'medico', 'closer', 'recepcionista', 'patient', name='userrole', create_type=False), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('last_access_at', sa.DateTime(), nullable=True),
        sa.Column('invited_by_id', sa.UUID(), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['invited_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'tenant_id', name='uq_user_tenant_membership')
    )
    op.create_index(op.f('ix_tenant_memberships_tenant_id'), 'tenant_memberships', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_tenant_memberships_user_id'), 'tenant_memberships', ['user_id'], unique=False)

    # 2. Agregar columna is_superadmin_flag con valor por defecto false
    op.add_column('users', sa.Column('is_superadmin_flag', sa.Boolean(), nullable=False, server_default='false'))

    # 3. Migrar datos: Crear membresías para usuarios existentes con tenant_id
    # Y marcar superadmins
    connection = op.get_bind()

    # Marcar usuarios superadmin
    connection.execute(sa.text("""
        UPDATE users
        SET is_superadmin_flag = true
        WHERE role = 'superadmin'
    """))

    # Crear membresías para usuarios que tienen tenant_id (no superadmins)
    connection.execute(sa.text("""
        INSERT INTO tenant_memberships (id, user_id, tenant_id, role, is_active, is_default, joined_at, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            id,
            tenant_id,
            role,
            is_active,
            true,
            created_at,
            NOW(),
            NOW()
        FROM users
        WHERE tenant_id IS NOT NULL
        AND role != 'superadmin'
    """))


def downgrade() -> None:
    # Eliminar membresías y columna
    op.drop_column('users', 'is_superadmin_flag')
    op.drop_index(op.f('ix_tenant_memberships_user_id'), table_name='tenant_memberships')
    op.drop_index(op.f('ix_tenant_memberships_tenant_id'), table_name='tenant_memberships')
    op.drop_table('tenant_memberships')
