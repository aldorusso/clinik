from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, DateTime, ForeignKey, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from app.db.session import Base


class LeadSource(str, enum.Enum):
    """
    Fuentes de captura de leads:
    - facebook: Facebook/Instagram Ads
    - google: Google Ads
    - website: Formulario en sitio web
    - whatsapp: WhatsApp Business
    - phone: Llamada telefónica directa
    - referral: Referido por otro paciente
    - walk_in: Llegada espontánea a la clínica
    - email: Email marketing
    - sms: Campañas SMS
    - other: Otras fuentes
    """
    facebook = "facebook"
    google = "google"
    website = "website"
    whatsapp = "whatsapp"
    phone = "phone"
    referral = "referral"
    walk_in = "walk_in"
    email = "email"
    sms = "sms"
    other = "other"


class LeadStatus(str, enum.Enum):
    """
    Estados del pipeline de conversión:
    - nuevo: Lead recién capturado
    - contactado: Primer contacto realizado
    - calificado: Lead con potencial confirmado
    - cita_agendada: Cita de valoración programada
    - vino_a_cita: Paciente asistió a la cita
    - en_tratamiento: Inició tratamiento
    - completado: Tratamiento finalizado
    - perdido: Lead no convirtió
    - no_contesta: No responde a contactos
    - no_califica: No tiene potencial
    - no_show: No asistió a la cita
    - rechazo_presupuesto: Rechazó el presupuesto
    - abandono: Abandonó durante tratamiento
    """
    nuevo = "nuevo"
    contactado = "contactado"
    calificado = "calificado"
    cita_agendada = "cita_agendada"
    vino_a_cita = "vino_a_cita"
    en_tratamiento = "en_tratamiento"
    completado = "completado"
    perdido = "perdido"
    no_contesta = "no_contesta"
    no_califica = "no_califica"
    no_show = "no_show"
    rechazo_presupuesto = "rechazo_presupuesto"
    abandono = "abandono"


class LeadPriority(str, enum.Enum):
    """
    Prioridad del lead basada en scoring:
    - alta: Lead con alta probabilidad de conversión
    - media: Lead con probabilidad moderada
    - baja: Lead con baja probabilidad
    """
    alta = "alta"
    media = "media"
    baja = "baja"


class Lead(Base):
    """
    Modelo principal para leads/prospectos del sistema médico.
    Cada lead pertenece a un tenant específico.
    """
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant (obligatorio para leads)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)

    # Información personal del lead
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=False, index=True)
    
    # Información demográfica
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)  # masculino, femenino, otro
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(String(500), nullable=True)

    # Información del lead
    source = Column(SQLEnum(LeadSource), nullable=False, default=LeadSource.other)
    status = Column(SQLEnum(LeadStatus), nullable=False, default=LeadStatus.nuevo)
    priority = Column(SQLEnum(LeadPriority), nullable=False, default=LeadPriority.media)
    
    # Asignación
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    assigned_at = Column(DateTime, nullable=True)
    
    # Servicio de interés
    service_interest_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=True)
    
    # Información comercial
    budget_range_min = Column(Float, nullable=True)  # Presupuesto mínimo
    budget_range_max = Column(Float, nullable=True)  # Presupuesto máximo
    urgency = Column(String(50), nullable=True)  # inmediata, 1_mes, 3_meses, 6_meses, sin_prisa
    
    # Contacto preferido
    preferred_contact_method = Column(String(50), nullable=True)  # phone, whatsapp, email
    preferred_contact_time = Column(String(100), nullable=True)  # mañana, tarde, noche, cualquier_hora
    
    # Notas y observaciones
    initial_notes = Column(Text, nullable=True)  # Notas iniciales del lead
    internal_notes = Column(Text, nullable=True)  # Notas internas del equipo
    
    # Score del lead (calculado automáticamente)
    lead_score = Column(Integer, nullable=True, default=0)  # 0-100
    
    # Marketing
    utm_source = Column(String(255), nullable=True)  # Fuente UTM
    utm_medium = Column(String(255), nullable=True)  # Medio UTM
    utm_campaign = Column(String(255), nullable=True)  # Campaña UTM
    utm_content = Column(String(255), nullable=True)  # Contenido UTM
    
    # Control y estado
    is_active = Column(Boolean, default=True, nullable=False)
    is_duplicate = Column(Boolean, default=False, nullable=False)
    original_lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)  # Para duplicados
    
    # Fechas importantes
    first_contact_at = Column(DateTime, nullable=True)
    last_contact_at = Column(DateTime, nullable=True)
    conversion_date = Column(DateTime, nullable=True)  # Fecha de conversión a paciente
    
    # Información de conversión a paciente
    patient_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Usuario paciente creado
    converted_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Quién hizo la conversión
    conversion_notes = Column(Text, nullable=True)  # Notas sobre la conversión
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="leads")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    service_interest = relationship("Service", back_populates="interested_leads")
    interactions = relationship("LeadInteraction", back_populates="lead", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="lead", cascade="all, delete-orphan")
    original_lead = relationship("Lead", remote_side=[id])  # Para duplicados
    
    # Relaciones para conversión a paciente
    patient_user = relationship("User", foreign_keys=[patient_user_id])
    converted_by = relationship("User", foreign_keys=[converted_by_id])

    def __repr__(self):
        return f"<Lead {self.first_name} {self.last_name} ({self.status.value})>"

    @property
    def full_name(self) -> str:
        """Nombre completo del lead"""
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name

    @property
    def is_assigned(self) -> bool:
        """Verifica si el lead está asignado"""
        return self.assigned_to_id is not None

    @property
    def is_contacted(self) -> bool:
        """Verifica si ya se hizo primer contacto"""
        return self.first_contact_at is not None

    @property
    def is_converted(self) -> bool:
        """Verifica si el lead se convirtió en paciente"""
        return self.status in [
            LeadStatus.en_tratamiento,
            LeadStatus.completado
        ]
    
    @property
    def has_patient_account(self) -> bool:
        """Verifica si el lead ya tiene una cuenta de paciente creada"""
        return self.patient_user_id is not None and self.conversion_date is not None

    @property
    def is_lost(self) -> bool:
        """Verifica si el lead se perdió"""
        return self.status in [
            LeadStatus.perdido,
            LeadStatus.no_contesta,
            LeadStatus.no_califica,
            LeadStatus.no_show,
            LeadStatus.rechazo_presupuesto,
            LeadStatus.abandono
        ]

    @property
    def days_since_created(self) -> int:
        """Días desde la creación del lead"""
        return (datetime.utcnow() - self.created_at).days

    @property
    def days_since_last_contact(self) -> int:
        """Días desde el último contacto"""
        if self.last_contact_at:
            return (datetime.utcnow() - self.last_contact_at).days
        return self.days_since_created


class LeadInteraction(Base):
    """
    Historial de interacciones con el lead.
    Cada contacto, llamada, mensaje, etc. se registra aquí.
    """
    __tablename__ = "lead_interactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relaciones
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Quien realizó la interacción
    
    # Tipo de interacción
    type = Column(String(50), nullable=False)  # call, whatsapp, email, sms, visit, note
    direction = Column(String(20), nullable=False)  # inbound, outbound
    
    # Contenido
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Duración (para llamadas)
    duration_minutes = Column(Integer, nullable=True)
    
    # Estado de la interacción
    was_successful = Column(Boolean, nullable=True)  # Si fue exitosa la interacción
    
    # Próximo seguimiento
    next_follow_up = Column(DateTime, nullable=True)
    next_follow_up_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    lead = relationship("Lead", back_populates="interactions")
    user = relationship("User")

    def __repr__(self):
        return f"<LeadInteraction {self.type} - {self.lead.full_name}>"


class LeadAssignment(Base):
    """
    Historial de asignaciones de leads.
    Permite rastrear quién ha tenido el lead en diferentes momentos.
    """
    __tablename__ = "lead_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relaciones
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False, index=True)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Información de la asignación
    reason = Column(String(255), nullable=True)  # Motivo de la asignación
    notes = Column(Text, nullable=True)
    
    # Fechas
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reassigned_at = Column(DateTime, nullable=True)  # Cuando se reasignó

    # Relationships
    lead = relationship("Lead")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

    def __repr__(self):
        return f"<LeadAssignment {self.lead.full_name} -> {self.assigned_to.full_name}>"