"""Add lead management system models

Revision ID: 004_add_lead_management_system
Revises: 003_add_audit_logs
Create Date: 2025-12-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004_add_lead_management_system'
down_revision: Union[str, None] = '375f86775a0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### Update UserRole enum to add 'recepcionista' ###
    # First, add the new enum value
    op.execute("ALTER TYPE userrole ADD VALUE 'recepcionista'")
    
    # ### Create service_categories table ###
    op.create_table('service_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=100), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_categories_tenant_id'), 'service_categories', ['tenant_id'], unique=False)
    
    # ### Create services table ###
    op.create_table('services',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('short_description', sa.String(length=500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_min', sa.Float(), nullable=True),
        sa.Column('price_max', sa.Float(), nullable=True),
        sa.Column('price_consultation', sa.Float(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('session_count_min', sa.Integer(), nullable=True),
        sa.Column('session_count_max', sa.Integer(), nullable=True),
        sa.Column('requires_consultation', sa.Boolean(), nullable=False),
        sa.Column('requires_preparation', sa.Boolean(), nullable=False),
        sa.Column('has_contraindications', sa.Boolean(), nullable=False),
        sa.Column('preparation_instructions', sa.Text(), nullable=True),
        sa.Column('aftercare_instructions', sa.Text(), nullable=True),
        sa.Column('contraindications', sa.Text(), nullable=True),
        sa.Column('side_effects', sa.Text(), nullable=True),
        sa.Column('booking_buffer_before', sa.Integer(), nullable=True),
        sa.Column('booking_buffer_after', sa.Integer(), nullable=True),
        sa.Column('max_daily_bookings', sa.Integer(), nullable=True),
        sa.Column('target_age_min', sa.Integer(), nullable=True),
        sa.Column('target_age_max', sa.Integer(), nullable=True),
        sa.Column('target_gender', sa.String(length=20), nullable=True),
        sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('meta_title', sa.String(length=255), nullable=True),
        sa.Column('meta_description', sa.String(length=500), nullable=True),
        sa.Column('featured_image', sa.String(), nullable=True),
        sa.Column('gallery_images', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('video_url', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_featured', sa.Boolean(), nullable=False),
        sa.Column('is_online_bookable', sa.Boolean(), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['service_categories.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_services_tenant_id'), 'services', ['tenant_id'], unique=False)
    
    # ### Create service_packages table ###
    op.create_table('service_packages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('session_count', sa.Integer(), nullable=False),
        sa.Column('validity_months', sa.Integer(), nullable=False),
        sa.Column('original_price', sa.Float(), nullable=False),
        sa.Column('package_price', sa.Float(), nullable=False),
        sa.Column('discount_percentage', sa.Float(), nullable=True),
        sa.Column('transferable', sa.Boolean(), nullable=False),
        sa.Column('refundable', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_packages_tenant_id'), 'service_packages', ['tenant_id'], unique=False)
    
    # ### Create service_providers table ###
    op.create_table('service_providers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('experience_years', sa.Integer(), nullable=True),
        sa.Column('certification', sa.String(length=255), nullable=True),
        sa.Column('hourly_rate', sa.Float(), nullable=True),
        sa.Column('commission_percentage', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # ### Create leads table ###
    op.create_table('leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('first_name', sa.String(length=255), nullable=False),
        sa.Column('last_name', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('source', sa.Enum('facebook', 'google', 'website', 'whatsapp', 'phone', 'referral', 'walk_in', 'email', 'sms', 'other', name='leadsource'), nullable=False),
        sa.Column('status', sa.Enum('nuevo', 'contactado', 'calificado', 'cita_agendada', 'vino_a_cita', 'en_tratamiento', 'completado', 'perdido', 'no_contesta', 'no_califica', 'no_show', 'rechazo_presupuesto', 'abandono', name='leadstatus'), nullable=False),
        sa.Column('priority', sa.Enum('alta', 'media', 'baja', name='leadpriority'), nullable=False),
        sa.Column('assigned_to_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_at', sa.DateTime(), nullable=True),
        sa.Column('service_interest_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('budget_range_min', sa.Float(), nullable=True),
        sa.Column('budget_range_max', sa.Float(), nullable=True),
        sa.Column('urgency', sa.String(length=50), nullable=True),
        sa.Column('preferred_contact_method', sa.String(length=50), nullable=True),
        sa.Column('preferred_contact_time', sa.String(length=100), nullable=True),
        sa.Column('initial_notes', sa.Text(), nullable=True),
        sa.Column('internal_notes', sa.Text(), nullable=True),
        sa.Column('lead_score', sa.Integer(), nullable=True),
        sa.Column('utm_source', sa.String(length=255), nullable=True),
        sa.Column('utm_medium', sa.String(length=255), nullable=True),
        sa.Column('utm_campaign', sa.String(length=255), nullable=True),
        sa.Column('utm_content', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_duplicate', sa.Boolean(), nullable=False),
        sa.Column('original_lead_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('first_contact_at', sa.DateTime(), nullable=True),
        sa.Column('last_contact_at', sa.DateTime(), nullable=True),
        sa.Column('conversion_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['original_lead_id'], ['leads.id'], ),
        sa.ForeignKeyConstraint(['service_interest_id'], ['services.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leads_assigned_to_id'), 'leads', ['assigned_to_id'], unique=False)
    op.create_index(op.f('ix_leads_email'), 'leads', ['email'], unique=False)
    op.create_index(op.f('ix_leads_phone'), 'leads', ['phone'], unique=False)
    op.create_index(op.f('ix_leads_tenant_id'), 'leads', ['tenant_id'], unique=False)
    
    # ### Create lead_assignments table ###
    op.create_table('lead_assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assigned_to_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assigned_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(), nullable=False),
        sa.Column('reassigned_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lead_assignments_lead_id'), 'lead_assignments', ['lead_id'], unique=False)
    
    # ### Create lead_interactions table ###
    op.create_table('lead_interactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('direction', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('was_successful', sa.Boolean(), nullable=True),
        sa.Column('next_follow_up', sa.DateTime(), nullable=True),
        sa.Column('next_follow_up_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lead_interactions_lead_id'), 'lead_interactions', ['lead_id'], unique=False)
    
    # ### Create appointments table ###
    op.create_table('appointments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('consultation', 'treatment', 'follow_up', 'emergency', name='appointmenttype'), nullable=False),
        sa.Column('status', sa.Enum('scheduled', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled_by_patient', 'cancelled_by_clinic', 'rescheduled', name='appointmentstatus'), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('internal_notes', sa.Text(), nullable=True),
        sa.Column('patient_name', sa.String(length=255), nullable=False),
        sa.Column('patient_phone', sa.String(length=50), nullable=False),
        sa.Column('patient_email', sa.String(length=255), nullable=True),
        sa.Column('reminder_sent_at', sa.DateTime(), nullable=True),
        sa.Column('reminder_24h_sent', sa.Boolean(), nullable=False),
        sa.Column('reminder_2h_sent', sa.Boolean(), nullable=False),
        sa.Column('confirmation_requested_at', sa.DateTime(), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('confirmation_method', sa.String(length=50), nullable=True),
        sa.Column('checked_in_at', sa.DateTime(), nullable=True),
        sa.Column('checked_out_at', sa.DateTime(), nullable=True),
        sa.Column('actual_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('estimated_cost', sa.Float(), nullable=True),
        sa.Column('quoted_price', sa.Float(), nullable=True),
        sa.Column('deposit_required', sa.Float(), nullable=True),
        sa.Column('deposit_paid', sa.Float(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),
        sa.Column('cancellation_reason', sa.String(length=255), nullable=True),
        sa.Column('cancelled_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('rescheduled_from_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reschedule_reason', sa.String(length=255), nullable=True),
        sa.Column('no_show_fee', sa.Float(), nullable=True),
        sa.Column('no_show_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['cancelled_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['rescheduled_from_id'], ['appointments.id'], ),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointments_provider_id'), 'appointments', ['provider_id'], unique=False)
    op.create_index(op.f('ix_appointments_scheduled_at'), 'appointments', ['scheduled_at'], unique=False)
    op.create_index(op.f('ix_appointments_tenant_id'), 'appointments', ['tenant_id'], unique=False)
    
    # ### Create appointment_availability table ###
    op.create_table('appointment_availability',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.String(length=5), nullable=False),
        sa.Column('end_time', sa.String(length=5), nullable=False),
        sa.Column('slot_duration_minutes', sa.Integer(), nullable=False),
        sa.Column('break_duration_minutes', sa.Integer(), nullable=False),
        sa.Column('max_concurrent_appointments', sa.Integer(), nullable=False),
        sa.Column('effective_from', sa.DateTime(), nullable=True),
        sa.Column('effective_until', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointment_availability_provider_id'), 'appointment_availability', ['provider_id'], unique=False)
    op.create_index(op.f('ix_appointment_availability_tenant_id'), 'appointment_availability', ['tenant_id'], unique=False)
    
    # ### Create appointment_blocks table ###
    op.create_table('appointment_blocks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_at', sa.DateTime(), nullable=False),
        sa.Column('end_at', sa.DateTime(), nullable=False),
        sa.Column('is_all_day', sa.Boolean(), nullable=False),
        sa.Column('block_type', sa.String(length=50), nullable=False),
        sa.Column('is_recurring', sa.Boolean(), nullable=False),
        sa.Column('recurrence_pattern', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointment_blocks_start_at'), 'appointment_blocks', ['start_at'], unique=False)
    op.create_index(op.f('ix_appointment_blocks_tenant_id'), 'appointment_blocks', ['tenant_id'], unique=False)
    
    # ### Create treatments table ###
    op.create_table('treatments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('primary_provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('appointment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('treatment_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('planned', 'active', 'paused', 'completed', 'cancelled', 'abandoned', name='treatmentstatus'), nullable=False),
        sa.Column('total_sessions_planned', sa.Integer(), nullable=False),
        sa.Column('sessions_completed', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('planned_end_date', sa.DateTime(), nullable=True),
        sa.Column('actual_end_date', sa.DateTime(), nullable=True),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('treatment_plan', sa.Text(), nullable=True),
        sa.Column('contraindications', sa.Text(), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('medical_history_notes', sa.Text(), nullable=True),
        sa.Column('treatment_area', sa.String(length=255), nullable=True),
        sa.Column('affected_zones', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('treatment_parameters', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('total_cost', sa.Float(), nullable=True),
        sa.Column('amount_paid', sa.Float(), nullable=True),
        sa.Column('payment_plan', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('insurance_covered', sa.Boolean(), nullable=False),
        sa.Column('insurance_amount', sa.Float(), nullable=True),
        sa.Column('informed_consent_signed', sa.Boolean(), nullable=False),
        sa.Column('informed_consent_date', sa.DateTime(), nullable=True),
        sa.Column('photo_consent_signed', sa.Boolean(), nullable=False),
        sa.Column('before_photos', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('during_photos', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('after_photos', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('expected_results', sa.Text(), nullable=True),
        sa.Column('actual_results', sa.Text(), nullable=True),
        sa.Column('patient_satisfaction', sa.Integer(), nullable=True),
        sa.Column('provider_notes', sa.Text(), nullable=True),
        sa.Column('side_effects_experienced', sa.Text(), nullable=True),
        sa.Column('complications', sa.Text(), nullable=True),
        sa.Column('adverse_reactions', sa.Text(), nullable=True),
        sa.Column('aftercare_instructions', sa.Text(), nullable=True),
        sa.Column('restrictions', sa.Text(), nullable=True),
        sa.Column('follow_up_needed', sa.Boolean(), nullable=False),
        sa.Column('next_follow_up_date', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['primary_provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_treatments_patient_id'), 'treatments', ['patient_id'], unique=False)
    op.create_index(op.f('ix_treatments_tenant_id'), 'treatments', ['tenant_id'], unique=False)
    
    # ### Create treatment_sessions table ###
    op.create_table('treatment_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('treatment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('appointment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('session_number', sa.Integer(), nullable=False),
        sa.Column('session_date', sa.DateTime(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('pre_session_assessment', sa.Text(), nullable=True),
        sa.Column('pre_session_photos', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('treatment_parameters', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('equipment_used', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('products_used', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('session_notes', sa.Text(), nullable=True),
        sa.Column('patient_comfort_level', sa.Integer(), nullable=True),
        sa.Column('any_complications', sa.Text(), nullable=True),
        sa.Column('immediate_response', sa.Text(), nullable=True),
        sa.Column('post_session_photos', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('post_session_instructions', sa.Text(), nullable=True),
        sa.Column('next_session_planned', sa.DateTime(), nullable=True),
        sa.Column('next_session_notes', sa.Text(), nullable=True),
        sa.Column('session_cost', sa.Float(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['treatment_id'], ['treatments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_treatment_sessions_session_date'), 'treatment_sessions', ['session_date'], unique=False)
    op.create_index(op.f('ix_treatment_sessions_treatment_id'), 'treatment_sessions', ['treatment_id'], unique=False)
    
    # ### Create medical_records table ###
    op.create_table('medical_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('treatment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('record_type', sa.String(length=50), nullable=False),
        sa.Column('chief_complaint', sa.Text(), nullable=True),
        sa.Column('medical_history', sa.Text(), nullable=True),
        sa.Column('current_medications', sa.Text(), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('physical_examination', sa.Text(), nullable=True),
        sa.Column('vital_signs', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('skin_assessment', sa.Text(), nullable=True),
        sa.Column('primary_diagnosis', sa.String(length=255), nullable=True),
        sa.Column('secondary_diagnosis', sa.Text(), nullable=True),
        sa.Column('differential_diagnosis', sa.Text(), nullable=True),
        sa.Column('treatment_plan', sa.Text(), nullable=True),
        sa.Column('recommendations', sa.Text(), nullable=True),
        sa.Column('contraindications', sa.Text(), nullable=True),
        sa.Column('clinical_photos', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('attached_documents', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('consents_obtained', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('provider_notes', sa.Text(), nullable=True),
        sa.Column('private_notes', sa.Text(), nullable=True),
        sa.Column('is_finalized', sa.Boolean(), nullable=False),
        sa.Column('finalized_at', sa.DateTime(), nullable=True),
        sa.Column('record_date', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['treatment_id'], ['treatments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medical_records_patient_id'), 'medical_records', ['patient_id'], unique=False)
    op.create_index(op.f('ix_medical_records_record_date'), 'medical_records', ['record_date'], unique=False)
    op.create_index(op.f('ix_medical_records_tenant_id'), 'medical_records', ['tenant_id'], unique=False)


def downgrade() -> None:
    # ### Remove all tables in reverse order ###
    op.drop_index(op.f('ix_medical_records_tenant_id'), table_name='medical_records')
    op.drop_index(op.f('ix_medical_records_record_date'), table_name='medical_records')
    op.drop_index(op.f('ix_medical_records_patient_id'), table_name='medical_records')
    op.drop_table('medical_records')
    
    op.drop_index(op.f('ix_treatment_sessions_treatment_id'), table_name='treatment_sessions')
    op.drop_index(op.f('ix_treatment_sessions_session_date'), table_name='treatment_sessions')
    op.drop_table('treatment_sessions')
    
    op.drop_index(op.f('ix_treatments_tenant_id'), table_name='treatments')
    op.drop_index(op.f('ix_treatments_patient_id'), table_name='treatments')
    op.drop_table('treatments')
    
    op.drop_index(op.f('ix_appointment_blocks_tenant_id'), table_name='appointment_blocks')
    op.drop_index(op.f('ix_appointment_blocks_start_at'), table_name='appointment_blocks')
    op.drop_table('appointment_blocks')
    
    op.drop_index(op.f('ix_appointment_availability_tenant_id'), table_name='appointment_availability')
    op.drop_index(op.f('ix_appointment_availability_provider_id'), table_name='appointment_availability')
    op.drop_table('appointment_availability')
    
    op.drop_index(op.f('ix_appointments_tenant_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_scheduled_at'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_provider_id'), table_name='appointments')
    op.drop_table('appointments')
    
    op.drop_index(op.f('ix_lead_interactions_lead_id'), table_name='lead_interactions')
    op.drop_table('lead_interactions')
    
    op.drop_index(op.f('ix_lead_assignments_lead_id'), table_name='lead_assignments')
    op.drop_table('lead_assignments')
    
    op.drop_index(op.f('ix_leads_tenant_id'), table_name='leads')
    op.drop_index(op.f('ix_leads_phone'), table_name='leads')
    op.drop_index(op.f('ix_leads_email'), table_name='leads')
    op.drop_index(op.f('ix_leads_assigned_to_id'), table_name='leads')
    op.drop_table('leads')
    
    op.drop_table('service_providers')
    
    op.drop_index(op.f('ix_service_packages_tenant_id'), table_name='service_packages')
    op.drop_table('service_packages')
    
    op.drop_index(op.f('ix_services_tenant_id'), table_name='services')
    op.drop_table('services')
    
    op.drop_index(op.f('ix_service_categories_tenant_id'), table_name='service_categories')
    op.drop_table('service_categories')
    
    # ### Drop enums ###
    sa.Enum('planned', 'active', 'paused', 'completed', 'cancelled', 'abandoned', name='treatmentstatus').drop(op.get_bind())
    sa.Enum('consultation', 'treatment', 'follow_up', 'emergency', name='appointmenttype').drop(op.get_bind())
    sa.Enum('scheduled', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled_by_patient', 'cancelled_by_clinic', 'rescheduled', name='appointmentstatus').drop(op.get_bind())
    sa.Enum('alta', 'media', 'baja', name='leadpriority').drop(op.get_bind())
    sa.Enum('nuevo', 'contactado', 'calificado', 'cita_agendada', 'vino_a_cita', 'en_tratamiento', 'completado', 'perdido', 'no_contesta', 'no_califica', 'no_show', 'rechazo_presupuesto', 'abandono', name='leadstatus').drop(op.get_bind())
    sa.Enum('facebook', 'google', 'website', 'whatsapp', 'phone', 'referral', 'walk_in', 'email', 'sms', 'other', name='leadsource').drop(op.get_bind())
    
    # ### Remove 'recepcionista' from UserRole enum ###
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require more complex migration for production use