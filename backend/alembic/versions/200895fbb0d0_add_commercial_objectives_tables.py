"""Add commercial objectives tables

Revision ID: 200895fbb0d0
Revises: 9f0a6042a6de
Create Date: 2025-12-15 11:26:50.641719

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '200895fbb0d0'
down_revision = '9f0a6042a6de'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ENUM types for objectives are already created manually
    # Skip creating them here to avoid conflicts

    # Create commercial_objectives table
    op.create_table('commercial_objectives',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('commercial_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', postgresql.ENUM('leads', 'conversions', 'revenue', 'appointments', 'calls', 'meetings', 'satisfaction', name='objectivetype'), nullable=False),
        sa.Column('period', postgresql.ENUM('weekly', 'monthly', 'quarterly', 'yearly', name='objectiveperiod'), nullable=False),
        sa.Column('target_value', sa.Float(), nullable=False),
        sa.Column('current_value', sa.Float(), nullable=False, server_default='0'),
        sa.Column('unit', sa.String(length=50), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('auto_calculate', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('reward_description', sa.Text(), nullable=True),
        sa.Column('reward_amount', sa.Float(), nullable=True),
        sa.Column('status', postgresql.ENUM('active', 'completed', 'paused', 'cancelled', 'overdue', name='objectivestatus'), nullable=False, server_default='active'),
        sa.Column('completion_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['commercial_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_commercial_objectives_tenant_id'), 'commercial_objectives', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_commercial_objectives_commercial_id'), 'commercial_objectives', ['commercial_id'], unique=False)
    op.create_index(op.f('ix_commercial_objectives_type'), 'commercial_objectives', ['type'], unique=False)
    op.create_index(op.f('ix_commercial_objectives_period'), 'commercial_objectives', ['period'], unique=False)
    op.create_index(op.f('ix_commercial_objectives_status'), 'commercial_objectives', ['status'], unique=False)

    # Create objective_progress table
    op.create_table('objective_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('objective_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('previous_value', sa.Float(), nullable=False),
        sa.Column('new_value', sa.Float(), nullable=False),
        sa.Column('increment', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recorded_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_automatic', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('progress_metadata', sa.JSON(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['objective_id'], ['commercial_objectives.id'], ),
        sa.ForeignKeyConstraint(['recorded_by_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_objective_progress_objective_id'), 'objective_progress', ['objective_id'], unique=False)

    # Create commercial_performance table
    op.create_table('commercial_performance',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('commercial_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('period', postgresql.ENUM('weekly', 'monthly', 'quarterly', 'yearly', name='objectiveperiod'), nullable=False),
        sa.Column('period_start', sa.DateTime(), nullable=False),
        sa.Column('period_end', sa.DateTime(), nullable=False),
        sa.Column('total_leads', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('qualified_leads', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('conversions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('appointments_scheduled', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('appointments_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('calls_made', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('meetings_held', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('revenue_generated', sa.Float(), nullable=False, server_default='0'),
        sa.Column('average_satisfaction_score', sa.Float(), nullable=True),
        sa.Column('objectives_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('objectives_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('performance_score', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['commercial_id'], ['users.id'], ),
        sa.UniqueConstraint('commercial_id', 'period', 'period_start', 'period_end', name='_commercial_period_uc')
    )
    op.create_index(op.f('ix_commercial_performance_tenant_id'), 'commercial_performance', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_commercial_performance_commercial_id'), 'commercial_performance', ['commercial_id'], unique=False)

    # Create objective_templates table
    op.create_table('objective_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', postgresql.ENUM('leads', 'conversions', 'revenue', 'appointments', 'calls', 'meetings', 'satisfaction', name='objectivetype'), nullable=False),
        sa.Column('period', postgresql.ENUM('weekly', 'monthly', 'quarterly', 'yearly', name='objectiveperiod'), nullable=False),
        sa.Column('default_target_value', sa.Float(), nullable=False),
        sa.Column('default_unit', sa.String(length=50), nullable=True),
        sa.Column('default_reward_description', sa.Text(), nullable=True),
        sa.Column('default_reward_amount', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_objective_templates_tenant_id'), 'objective_templates', ['tenant_id'], unique=False)


def downgrade() -> None:
    # Drop tables
    op.drop_table('objective_templates')
    op.drop_table('commercial_performance')
    op.drop_table('objective_progress')
    op.drop_table('commercial_objectives')
    
    # Drop ENUM types
    op.execute('DROP TYPE IF EXISTS objectivestatus')
    op.execute('DROP TYPE IF EXISTS objectiveperiod')
    op.execute('DROP TYPE IF EXISTS objectivetype')
