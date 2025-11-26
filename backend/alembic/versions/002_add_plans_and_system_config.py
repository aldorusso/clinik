"""Add plans and system_config tables

Revision ID: 002_add_plans_and_system_config
Revises: 001_add_multi_tenancy
Create Date: 2024-11-25
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_plans_and_system_config'
down_revision = '001_add_multi_tenancy'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create plans table
    op.create_table(
        'plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_monthly', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('price_yearly', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('max_users', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('max_clients', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('max_storage_gb', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('features', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )

    # Create system_configs table
    op.create_table(
        'system_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('category', sa.String(50), nullable=False, server_default='general'),
        sa.Column('value_type', sa.String(20), nullable=False, server_default='string'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )

    # Create index on system_configs.key
    op.create_index('ix_system_configs_key', 'system_configs', ['key'])

    # Insert default plans
    op.execute("""
        INSERT INTO plans (id, name, slug, description, price_monthly, price_yearly, currency, max_users, max_clients, max_storage_gb, features, is_active, is_default, display_order)
        VALUES
        (gen_random_uuid(), 'Free', 'free', 'Plan gratuito con funcionalidades basicas', 0, 0, 'USD', 2, 5, 1, '{"api_access": false, "custom_branding": false, "priority_support": false}', true, true, 1),
        (gen_random_uuid(), 'Basic', 'basic', 'Plan basico para pequenas empresas', 29.99, 299.99, 'USD', 5, 20, 5, '{"api_access": true, "custom_branding": false, "priority_support": false}', true, false, 2),
        (gen_random_uuid(), 'Pro', 'pro', 'Plan profesional con todas las funcionalidades', 99.99, 999.99, 'USD', 20, 100, 25, '{"api_access": true, "custom_branding": true, "priority_support": true}', true, false, 3),
        (gen_random_uuid(), 'Enterprise', 'enterprise', 'Plan empresarial con soporte dedicado', 299.99, 2999.99, 'USD', -1, -1, 100, '{"api_access": true, "custom_branding": true, "priority_support": true, "dedicated_support": true}', true, false, 4);
    """)

    # Insert default system configs
    op.execute("""
        INSERT INTO system_configs (id, key, value, description, category, value_type)
        VALUES
        (gen_random_uuid(), 'app_name', 'Mi Aplicacion', 'Nombre de la aplicacion', 'general', 'string'),
        (gen_random_uuid(), 'app_description', 'Plataforma de gestion multi-tenant', 'Descripcion de la aplicacion', 'general', 'string'),
        (gen_random_uuid(), 'maintenance_mode', 'false', 'Modo mantenimiento activo', 'general', 'boolean'),
        (gen_random_uuid(), 'allow_registration', 'true', 'Permitir registro de nuevos tenants', 'security', 'boolean'),
        (gen_random_uuid(), 'max_login_attempts', '5', 'Intentos maximos de login antes de bloqueo', 'security', 'number'),
        (gen_random_uuid(), 'session_timeout_minutes', '60', 'Timeout de sesion en minutos', 'security', 'number'),
        (gen_random_uuid(), 'default_plan', 'free', 'Plan por defecto para nuevos tenants', 'billing', 'string'),
        (gen_random_uuid(), 'trial_days', '14', 'Dias de prueba para nuevos tenants', 'billing', 'number');
    """)


def downgrade() -> None:
    op.drop_index('ix_system_configs_key', 'system_configs')
    op.drop_table('system_configs')
    op.drop_table('plans')
