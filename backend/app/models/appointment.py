from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, DateTime, ForeignKey, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timedelta
import enum

from app.db.session import Base


class AppointmentStatus(str, enum.Enum):
    """
    Estados de las citas médicas:
    - scheduled: Cita programada
    - confirmed: Cita confirmada por el paciente
    - in_progress: Cita en curso
    - completed: Cita completada
    - no_show: Paciente no se presentó
    - cancelled_by_patient: Cancelada por el paciente
    - cancelled_by_clinic: Cancelada por la clínica
    - rescheduled: Reprogramada
    """
    scheduled = "scheduled"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    no_show = "no_show"
    cancelled_by_patient = "cancelled_by_patient"
    cancelled_by_clinic = "cancelled_by_clinic"
    rescheduled = "rescheduled"


class AppointmentType(str, enum.Enum):
    """
    Tipos de citas:
    - consultation: Consulta inicial/valoración
    - treatment: Sesión de tratamiento
    - follow_up: Seguimiento post-tratamiento
    - emergency: Emergencia o urgencia
    """
    consultation = "consultation"
    treatment = "treatment"
    follow_up = "follow_up"
    emergency = "emergency"


class Appointment(Base):
    """
    Citas médicas/estéticas programadas.
    Conecta leads, pacientes, médicos y servicios.
    """
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Relaciones principales
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)  # Lead original
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Paciente (puede ser diferente del lead)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)  # Médico/especialista
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=True)
    
    # Información de la cita
    type = Column(SQLEnum(AppointmentType), nullable=False, default=AppointmentType.consultation)
    status = Column(SQLEnum(AppointmentStatus), nullable=False, default=AppointmentStatus.scheduled)
    
    # Fecha y hora
    scheduled_at = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
    
    # Información adicional
    title = Column(String(255), nullable=True)  # Título personalizado
    notes = Column(Text, nullable=True)  # Notas de la cita
    internal_notes = Column(Text, nullable=True)  # Notas internas del staff
    
    # Información del paciente para la cita
    patient_name = Column(String(255), nullable=False)  # Nombre completo
    patient_phone = Column(String(50), nullable=False)
    patient_email = Column(String(255), nullable=True)
    
    # Recordatorios
    reminder_sent_at = Column(DateTime, nullable=True)
    reminder_24h_sent = Column(Boolean, default=False, nullable=False)
    reminder_2h_sent = Column(Boolean, default=False, nullable=False)
    
    # Confirmación
    confirmation_requested_at = Column(DateTime, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    confirmation_method = Column(String(50), nullable=True)  # phone, whatsapp, email, sms
    
    # Check-in y check-out
    checked_in_at = Column(DateTime, nullable=True)
    checked_out_at = Column(DateTime, nullable=True)
    actual_duration_minutes = Column(Integer, nullable=True)
    
    # Información comercial
    estimated_cost = Column(Float, nullable=True)
    quoted_price = Column(Float, nullable=True)
    deposit_required = Column(Float, nullable=True)
    deposit_paid = Column(Float, nullable=True)
    
    # Cancelación/Reprogramación
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(String(255), nullable=True)
    cancelled_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    rescheduled_from_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    reschedule_reason = Column(String(255), nullable=True)
    
    # No show
    no_show_fee = Column(Float, nullable=True)
    no_show_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    lead = relationship("Lead", back_populates="appointments")
    patient = relationship("User", foreign_keys=[patient_id])
    provider = relationship("User", foreign_keys=[provider_id])
    service = relationship("Service", back_populates="appointments")
    cancelled_by = relationship("User", foreign_keys=[cancelled_by_id])
    rescheduled_from = relationship("Appointment", remote_side=[id])
    treatment = relationship("Treatment", back_populates="appointment", uselist=False)

    def __repr__(self):
        return f"<Appointment {self.patient_name} - {self.scheduled_at.strftime('%Y-%m-%d %H:%M')}>"

    @property
    def scheduled_end_at(self) -> datetime:
        """Hora de finalización programada"""
        return self.scheduled_at + timedelta(minutes=self.duration_minutes)

    @property
    def is_today(self) -> bool:
        """Verifica si la cita es hoy"""
        return self.scheduled_at.date() == datetime.now().date()

    @property
    def is_past_due(self) -> bool:
        """Verifica si la cita ya pasó"""
        return self.scheduled_at < datetime.utcnow()

    @property
    def is_upcoming(self) -> bool:
        """Verifica si la cita es próxima (dentro de 24 horas)"""
        return (
            self.scheduled_at > datetime.utcnow() and 
            self.scheduled_at <= datetime.utcnow() + timedelta(hours=24)
        )

    @property
    def is_active(self) -> bool:
        """Verifica si la cita está activa (no cancelada ni completada)"""
        return self.status in [
            AppointmentStatus.scheduled,
            AppointmentStatus.confirmed,
            AppointmentStatus.in_progress
        ]

    @property
    def can_be_cancelled(self) -> bool:
        """Verifica si la cita puede ser cancelada"""
        return (
            self.is_active and 
            self.scheduled_at > datetime.utcnow() + timedelta(hours=2)  # Mínimo 2 horas antes
        )

    @property
    def can_be_rescheduled(self) -> bool:
        """Verifica si la cita puede ser reprogramada"""
        return self.can_be_cancelled

    @property
    def needs_confirmation(self) -> bool:
        """Verifica si la cita necesita confirmación"""
        return (
            self.status == AppointmentStatus.scheduled and
            self.confirmed_at is None and
            self.is_upcoming
        )

    @property
    def needs_reminder(self) -> bool:
        """Verifica si la cita necesita recordatorio"""
        hours_until = (self.scheduled_at - datetime.utcnow()).total_seconds() / 3600
        return (
            self.is_active and
            (
                (hours_until <= 24 and not self.reminder_24h_sent) or
                (hours_until <= 2 and not self.reminder_2h_sent)
            )
        )

    @property
    def status_color(self) -> str:
        """Color para mostrar en UI según el estado"""
        status_colors = {
            AppointmentStatus.scheduled: "blue",
            AppointmentStatus.confirmed: "green",
            AppointmentStatus.in_progress: "yellow",
            AppointmentStatus.completed: "emerald",
            AppointmentStatus.no_show: "red",
            AppointmentStatus.cancelled_by_patient: "gray",
            AppointmentStatus.cancelled_by_clinic: "gray",
            AppointmentStatus.rescheduled: "orange"
        }
        return status_colors.get(self.status, "gray")


class AppointmentAvailability(Base):
    """
    Disponibilidad de horarios para citas.
    Define cuando cada médico está disponible.
    """
    __tablename__ = "appointment_availability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant y Proveedor
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Día de la semana (0=Lunes, 6=Domingo)
    day_of_week = Column(Integer, nullable=False)
    
    # Horarios
    start_time = Column(String(5), nullable=False)  # HH:MM formato 24h
    end_time = Column(String(5), nullable=False)  # HH:MM formato 24h
    
    # Configuración
    slot_duration_minutes = Column(Integer, nullable=False, default=60)  # Duración de cada slot
    break_duration_minutes = Column(Integer, nullable=False, default=0)  # Descanso entre citas
    max_concurrent_appointments = Column(Integer, nullable=False, default=1)
    
    # Fechas de vigencia
    effective_from = Column(DateTime, nullable=True)
    effective_until = Column(DateTime, nullable=True)
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    provider = relationship("User")

    def __repr__(self):
        days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        return f"<AppointmentAvailability {self.provider.full_name} - {days[self.day_of_week]} {self.start_time}-{self.end_time}>"


class AppointmentBlock(Base):
    """
    Bloqueos de agenda para vacaciones, reuniones, etc.
    """
    __tablename__ = "appointment_blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant y Proveedor
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Información del bloqueo
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Fechas y horas
    start_at = Column(DateTime, nullable=False, index=True)
    end_at = Column(DateTime, nullable=False)
    is_all_day = Column(Boolean, default=False, nullable=False)
    
    # Tipo de bloqueo
    block_type = Column(String(50), nullable=False)  # vacation, meeting, emergency, personal, maintenance
    
    # Recurrencia
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_pattern = Column(JSON, nullable=True)  # Patrón de recurrencia
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    provider = relationship("User")

    def __repr__(self):
        return f"<AppointmentBlock {self.title} - {self.start_at.strftime('%Y-%m-%d')}>"

    @property
    def duration_hours(self) -> float:
        """Duración del bloqueo en horas"""
        delta = self.end_at - self.start_at
        return delta.total_seconds() / 3600

    @property
    def is_current(self) -> bool:
        """Verifica si el bloqueo está activo ahora"""
        now = datetime.utcnow()
        return self.start_at <= now <= self.end_at

    @property
    def is_future(self) -> bool:
        """Verifica si el bloqueo es futuro"""
        return self.start_at > datetime.utcnow()