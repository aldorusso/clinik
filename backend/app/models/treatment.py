from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, DateTime, ForeignKey, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from app.db.session import Base


class TreatmentStatus(str, enum.Enum):
    """
    Estados del tratamiento:
    - planned: Tratamiento planificado pero no iniciado
    - active: Tratamiento en curso
    - paused: Tratamiento pausado temporalmente
    - completed: Tratamiento completado exitosamente
    - cancelled: Tratamiento cancelado
    - abandoned: Paciente abandonó el tratamiento
    """
    planned = "planned"
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"
    abandoned = "abandoned"


class Treatment(Base):
    """
    Tratamientos médicos/estéticos realizados a pacientes.
    Un tratamiento puede requerir múltiples sesiones.
    """
    __tablename__ = "treatments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Relaciones principales
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    primary_provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Médico principal
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)  # Cita inicial
    
    # Información del tratamiento
    treatment_name = Column(String(255), nullable=False)  # Nombre personalizado del tratamiento
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TreatmentStatus), nullable=False, default=TreatmentStatus.planned)
    
    # Sesiones
    total_sessions_planned = Column(Integer, nullable=False, default=1)
    sessions_completed = Column(Integer, nullable=False, default=0)
    
    # Fechas
    start_date = Column(DateTime, nullable=True)  # Fecha real de inicio
    planned_end_date = Column(DateTime, nullable=True)  # Fecha planificada de finalización
    actual_end_date = Column(DateTime, nullable=True)  # Fecha real de finalización
    
    # Información médica
    diagnosis = Column(Text, nullable=True)  # Diagnóstico inicial
    treatment_plan = Column(Text, nullable=True)  # Plan detallado de tratamiento
    contraindications = Column(Text, nullable=True)  # Contraindicaciones específicas del paciente
    allergies = Column(Text, nullable=True)  # Alergias del paciente
    medical_history_notes = Column(Text, nullable=True)  # Historial médico relevante
    
    # Área de tratamiento
    treatment_area = Column(String(255), nullable=True)  # Ej: "Rostro completo", "Piernas", etc.
    affected_zones = Column(JSON, nullable=True)  # Array de zonas específicas
    
    # Parámetros del tratamiento (específicos por tipo)
    treatment_parameters = Column(JSON, nullable=True)  # Intensidad, frecuencia, etc.
    
    # Información comercial
    total_cost = Column(Float, nullable=True)
    amount_paid = Column(Float, nullable=True, default=0)
    payment_plan = Column(JSON, nullable=True)  # Plan de pagos
    insurance_covered = Column(Boolean, default=False, nullable=False)
    insurance_amount = Column(Float, nullable=True)
    
    # Consentimientos
    informed_consent_signed = Column(Boolean, default=False, nullable=False)
    informed_consent_date = Column(DateTime, nullable=True)
    photo_consent_signed = Column(Boolean, default=False, nullable=False)
    
    # Fotografías clínicas
    before_photos = Column(JSON, nullable=True)  # URLs de fotos antes
    during_photos = Column(JSON, nullable=True)  # URLs de fotos durante el proceso
    after_photos = Column(JSON, nullable=True)  # URLs de fotos después
    
    # Seguimiento
    expected_results = Column(Text, nullable=True)  # Resultados esperados
    actual_results = Column(Text, nullable=True)  # Resultados obtenidos
    patient_satisfaction = Column(Integer, nullable=True)  # 1-10
    provider_notes = Column(Text, nullable=True)  # Notas del médico
    
    # Efectos adversos y complicaciones
    side_effects_experienced = Column(Text, nullable=True)
    complications = Column(Text, nullable=True)
    adverse_reactions = Column(Text, nullable=True)
    
    # Instrucciones post-tratamiento
    aftercare_instructions = Column(Text, nullable=True)
    restrictions = Column(Text, nullable=True)  # Restricciones de actividad
    follow_up_needed = Column(Boolean, default=False, nullable=False)
    next_follow_up_date = Column(DateTime, nullable=True)
    
    # Estado del tratamiento
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    patient = relationship("User", foreign_keys=[patient_id])
    primary_provider = relationship("User", foreign_keys=[primary_provider_id])
    service = relationship("Service", back_populates="treatments")
    appointment = relationship("Appointment", back_populates="treatment")
    sessions = relationship("TreatmentSession", back_populates="treatment", cascade="all, delete-orphan")
    medical_records = relationship("MedicalRecord", back_populates="treatment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Treatment {self.treatment_name} - {self.patient.full_name}>"

    @property
    def progress_percentage(self) -> float:
        """Porcentaje de progreso del tratamiento"""
        if self.total_sessions_planned == 0:
            return 0
        return (self.sessions_completed / self.total_sessions_planned) * 100

    @property
    def remaining_sessions(self) -> int:
        """Sesiones restantes"""
        return max(0, self.total_sessions_planned - self.sessions_completed)

    @property
    def is_completed(self) -> bool:
        """Verifica si el tratamiento está completado"""
        return self.status == TreatmentStatus.completed

    @property
    def is_in_progress(self) -> bool:
        """Verifica si el tratamiento está en progreso"""
        return self.status in [TreatmentStatus.active, TreatmentStatus.paused]

    @property
    def balance_due(self) -> float:
        """Balance pendiente de pago"""
        if self.total_cost and self.amount_paid:
            return max(0, self.total_cost - self.amount_paid)
        return self.total_cost or 0

    @property
    def payment_status(self) -> str:
        """Estado del pago"""
        if not self.total_cost:
            return "no_cost"
        elif self.balance_due == 0:
            return "paid"
        elif self.amount_paid and self.amount_paid > 0:
            return "partial"
        else:
            return "pending"


class TreatmentSession(Base):
    """
    Sesiones individuales dentro de un tratamiento.
    """
    __tablename__ = "treatment_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relaciones
    treatment_id = Column(UUID(as_uuid=True), ForeignKey("treatments.id"), nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Médico de la sesión
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)  # Cita asociada
    
    # Información de la sesión
    session_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    session_date = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Evaluación pre-sesión
    pre_session_assessment = Column(Text, nullable=True)
    pre_session_photos = Column(JSON, nullable=True)
    
    # Parámetros específicos de la sesión
    treatment_parameters = Column(JSON, nullable=True)  # Configuración específica
    equipment_used = Column(JSON, nullable=True)  # Equipos utilizados
    products_used = Column(JSON, nullable=True)  # Productos aplicados
    
    # Desarrollo de la sesión
    session_notes = Column(Text, nullable=True)
    patient_comfort_level = Column(Integer, nullable=True)  # 1-10
    any_complications = Column(Text, nullable=True)
    
    # Evaluación post-sesión
    immediate_response = Column(Text, nullable=True)
    post_session_photos = Column(JSON, nullable=True)
    post_session_instructions = Column(Text, nullable=True)
    
    # Próxima sesión
    next_session_planned = Column(DateTime, nullable=True)
    next_session_notes = Column(Text, nullable=True)
    
    # Costo de la sesión
    session_cost = Column(Float, nullable=True)
    
    # Estado
    is_completed = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    treatment = relationship("Treatment", back_populates="sessions")
    provider = relationship("User")
    appointment = relationship("Appointment")

    def __repr__(self):
        return f"<TreatmentSession {self.session_number} - {self.treatment.treatment_name}>"


class MedicalRecord(Base):
    """
    Registros médicos y fichas clínicas de pacientes.
    """
    __tablename__ = "medical_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Relaciones principales
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    treatment_id = Column(UUID(as_uuid=True), ForeignKey("treatments.id"), nullable=True)
    
    # Tipo de registro
    record_type = Column(String(50), nullable=False)  # initial_assessment, progress_note, final_assessment
    
    # Información médica
    chief_complaint = Column(Text, nullable=True)  # Motivo de consulta
    medical_history = Column(Text, nullable=True)  # Historial médico
    current_medications = Column(Text, nullable=True)  # Medicamentos actuales
    allergies = Column(Text, nullable=True)  # Alergias conocidas
    
    # Examen físico
    physical_examination = Column(Text, nullable=True)
    vital_signs = Column(JSON, nullable=True)  # Signos vitales
    skin_assessment = Column(Text, nullable=True)  # Evaluación de la piel
    
    # Diagnóstico
    primary_diagnosis = Column(String(255), nullable=True)
    secondary_diagnosis = Column(Text, nullable=True)
    differential_diagnosis = Column(Text, nullable=True)
    
    # Plan de tratamiento
    treatment_plan = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    contraindications = Column(Text, nullable=True)
    
    # Fotografías y documentos
    clinical_photos = Column(JSON, nullable=True)
    attached_documents = Column(JSON, nullable=True)
    
    # Consentimientos
    consents_obtained = Column(JSON, nullable=True)  # Lista de consentimientos
    
    # Notas del proveedor
    provider_notes = Column(Text, nullable=True)
    private_notes = Column(Text, nullable=True)  # Notas privadas del médico
    
    # Estado del registro
    is_finalized = Column(Boolean, default=False, nullable=False)
    finalized_at = Column(DateTime, nullable=True)
    
    # Timestamps
    record_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    patient = relationship("User", foreign_keys=[patient_id])
    provider = relationship("User", foreign_keys=[provider_id])
    treatment = relationship("Treatment", back_populates="medical_records")

    def __repr__(self):
        return f"<MedicalRecord {self.record_type} - {self.patient.full_name} - {self.record_date.strftime('%Y-%m-%d')}>"