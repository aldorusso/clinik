"""Add lead to patient conversion fields

Revision ID: 005_lead_conversion
Revises: 004_add_lead_management_system
Create Date: 2024-12-12 17:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005_lead_conversion'
down_revision = '004_add_lead_management_system'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add conversion fields to leads table
    op.add_column('leads', sa.Column('patient_user_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('leads', sa.Column('converted_by_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('leads', sa.Column('conversion_notes', sa.Text(), nullable=True))
    
    # Create foreign key constraints
    op.create_foreign_key(
        'fk_leads_patient_user_id',
        'leads', 'users',
        ['patient_user_id'], ['id']
    )
    op.create_foreign_key(
        'fk_leads_converted_by_id', 
        'leads', 'users',
        ['converted_by_id'], ['id']
    )


def downgrade() -> None:
    # Drop foreign key constraints
    op.drop_constraint('fk_leads_converted_by_id', 'leads', type_='foreignkey')
    op.drop_constraint('fk_leads_patient_user_id', 'leads', type_='foreignkey')
    
    # Drop columns
    op.drop_column('leads', 'conversion_notes')
    op.drop_column('leads', 'converted_by_id') 
    op.drop_column('leads', 'patient_user_id')