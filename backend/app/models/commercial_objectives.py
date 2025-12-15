from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Float, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from enum import Enum

from app.db.session import Base


class ObjectiveType(str, Enum):
    """Tipos de objetivos comerciales"""
    leads = "leads"  # Capturar X leads
    conversions = "conversions"  # Convertir X leads en pacientes
    revenue = "revenue"  # Generar X ingresos
    appointments = "appointments"  # Agendar X citas
    calls = "calls"  # Realizar X llamadas
    meetings = "meetings"  # Tener X reuniones
    satisfaction = "satisfaction"  # Mantener X% satisfacción


class ObjectivePeriod(str, Enum):
    """Períodos de objetivos"""
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"


class ObjectiveStatus(str, Enum):
    """Estados del objetivo"""
    active = "active"
    completed = "completed"
    paused = "paused"
    cancelled = "cancelled"
    overdue = "overdue"


class CommercialObjective(Base):
    """
    Objetivos comerciales asignados por el administrador de la clínica.
    Cada objetivo tiene metas específicas y fechas de cumplimiento.
    """
    __tablename__ = "commercial_objectives"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Asignación del objetivo
    commercial_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)  # Usuario con rol 'client'
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Admin que lo creó
    
    # Información del objetivo
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(SQLEnum(ObjectiveType), nullable=False)
    period = Column(SQLEnum(ObjectivePeriod), nullable=False)
    
    # Métricas del objetivo
    target_value = Column(Float, nullable=False)  # Meta a alcanzar
    current_value = Column(Float, default=0.0, nullable=False)  # Progreso actual
    unit = Column(String(50), nullable=True)  # "leads", "MXN", "%", etc.
    
    # Fechas
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Configuración
    is_active = Column(Boolean, default=True, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)  # Si otros comerciales pueden verlo
    auto_calculate = Column(Boolean, default=True, nullable=False)  # Si se calcula automáticamente
    
    # Incentivos opcionales
    reward_description = Column(Text, nullable=True)
    reward_amount = Column(Float, nullable=True)
    
    # Estado
    status = Column(SQLEnum(ObjectiveStatus), default=ObjectiveStatus.active, nullable=False)
    completion_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    commercial = relationship("User", foreign_keys=[commercial_id], back_populates="objectives")
    created_by = relationship("User", foreign_keys=[created_by_id])
    progress_logs = relationship("ObjectiveProgress", back_populates="objective", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CommercialObjective {self.title} - {self.commercial_id}>"

    @property
    def progress_percentage(self) -> float:
        """Calcula el porcentaje de progreso"""
        if self.target_value <= 0:
            return 0.0
        return min((self.current_value / self.target_value) * 100, 100.0)

    @property
    def is_completed(self) -> bool:
        """Verifica si el objetivo está completado"""
        return self.current_value >= self.target_value

    @property
    def is_overdue(self) -> bool:
        """Verifica si el objetivo está vencido"""
        return datetime.utcnow() > self.end_date and not self.is_completed

    @property
    def days_remaining(self) -> int:
        """Días restantes para completar el objetivo"""
        remaining = (self.end_date - datetime.utcnow()).days
        return max(remaining, 0)


class ObjectiveProgress(Base):
    """
    Registro de progreso de objetivos comerciales.
    Permite tracking histórico del avance.
    """
    __tablename__ = "objective_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con objetivo
    objective_id = Column(UUID(as_uuid=True), ForeignKey("commercial_objectives.id"), nullable=False)
    
    # Progreso registrado
    previous_value = Column(Float, nullable=False)
    new_value = Column(Float, nullable=False)
    increment = Column(Float, nullable=False)  # Puede ser negativo
    
    # Información del registro
    notes = Column(Text, nullable=True)
    recorded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Quién lo registró
    is_automatic = Column(Boolean, default=False, nullable=False)  # Si fue automático o manual
    
    # Metadatos
    progress_metadata = Column(JSON, nullable=True)  # Información adicional como lead_id, appointment_id, etc.
    
    # Timestamps
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    objective = relationship("CommercialObjective", back_populates="progress_logs")
    recorded_by = relationship("User")

    def __repr__(self):
        return f"<ObjectiveProgress {self.objective_id}: {self.previous_value} -> {self.new_value}>"


class CommercialPerformance(Base):
    """
    Métricas de performance comercial agregadas por período.
    Se actualiza automáticamente para generar reportes rápidos.
    """
    __tablename__ = "commercial_performance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant y Comercial
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    commercial_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Período de la métrica
    period = Column(SQLEnum(ObjectivePeriod), nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Métricas de leads
    total_leads_assigned = Column(Integer, default=0, nullable=False)
    total_leads_contacted = Column(Integer, default=0, nullable=False)
    total_leads_converted = Column(Integer, default=0, nullable=False)
    conversion_rate = Column(Float, default=0.0, nullable=False)  # Porcentaje
    
    # Métricas de citas
    total_appointments_scheduled = Column(Integer, default=0, nullable=False)
    total_appointments_completed = Column(Integer, default=0, nullable=False)
    appointment_show_rate = Column(Float, default=0.0, nullable=False)  # Porcentaje
    
    # Métricas de ingresos
    total_revenue_generated = Column(Float, default=0.0, nullable=False)
    average_deal_size = Column(Float, default=0.0, nullable=False)
    
    # Métricas de actividad
    total_calls_made = Column(Integer, default=0, nullable=False)
    total_emails_sent = Column(Integer, default=0, nullable=False)
    total_meetings_held = Column(Integer, default=0, nullable=False)
    
    # Métricas de satisfacción
    average_satisfaction_score = Column(Float, default=0.0, nullable=False)  # 1-5
    total_satisfaction_surveys = Column(Integer, default=0, nullable=False)
    
    # Objetivos del período
    objectives_assigned = Column(Integer, default=0, nullable=False)
    objectives_completed = Column(Integer, default=0, nullable=False)
    objectives_completion_rate = Column(Float, default=0.0, nullable=False)  # Porcentaje
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    commercial = relationship("User")

    def __repr__(self):
        return f"<CommercialPerformance {self.commercial_id} - {self.period} {self.period_start}>"


class ObjectiveTemplate(Base):
    """
    Plantillas de objetivos que el administrador puede usar
    para crear objetivos recurrentes rápidamente.
    """
    __tablename__ = "objective_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Información de la plantilla
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(SQLEnum(ObjectiveType), nullable=False)
    period = Column(SQLEnum(ObjectivePeriod), nullable=False)
    
    # Configuración por defecto
    default_target_value = Column(Float, nullable=False)
    default_unit = Column(String(50), nullable=True)
    default_reward_description = Column(Text, nullable=True)
    default_reward_amount = Column(Float, nullable=True)
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)  # Cuántas veces se ha usado
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    created_by = relationship("User")

    def __repr__(self):
        return f"<ObjectiveTemplate {self.name}>"