from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.commercial_objectives import ObjectiveType, ObjectivePeriod, ObjectiveStatus


# ============================================
# COMMERCIAL OBJECTIVES SCHEMAS
# ============================================

class CommercialObjectiveBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Título del objetivo")
    description: Optional[str] = Field(None, description="Descripción detallada del objetivo")
    type: ObjectiveType = Field(..., description="Tipo de objetivo")
    period: ObjectivePeriod = Field(..., description="Período del objetivo")
    target_value: float = Field(..., gt=0, description="Valor meta a alcanzar")
    unit: Optional[str] = Field(None, max_length=50, description="Unidad de medida")
    start_date: datetime = Field(..., description="Fecha de inicio")
    end_date: datetime = Field(..., description="Fecha de finalización")
    is_public: bool = Field(True, description="Si otros comerciales pueden ver el objetivo")
    auto_calculate: bool = Field(True, description="Si el progreso se calcula automáticamente")
    reward_description: Optional[str] = Field(None, description="Descripción del incentivo")
    reward_amount: Optional[float] = Field(None, ge=0, description="Monto del incentivo")

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class CommercialObjectiveCreate(CommercialObjectiveBase):
    commercial_id: UUID = Field(..., description="ID del comercial al que se asigna")


class CommercialObjectiveUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    target_value: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, max_length=50)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    auto_calculate: Optional[bool] = None
    reward_description: Optional[str] = None
    reward_amount: Optional[float] = Field(None, ge=0)
    status: Optional[ObjectiveStatus] = None


class CommercialObjectiveInDB(CommercialObjectiveBase):
    id: UUID
    tenant_id: UUID
    commercial_id: UUID
    created_by_id: UUID
    current_value: float
    is_active: bool
    status: ObjectiveStatus
    completion_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommercialObjective(CommercialObjectiveInDB):
    # Información del comercial
    commercial_name: str
    commercial_email: str
    
    # Información del creador
    created_by_name: str
    
    # Campos computados
    progress_percentage: float
    is_completed: bool
    is_overdue: bool
    days_remaining: int
    
    # Estadísticas del período
    period_stats: Optional[Dict[str, Any]] = None


class CommercialObjectiveDetailed(CommercialObjective):
    progress_history: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]
    completion_prediction: Optional[Dict[str, Any]]


# ============================================
# OBJECTIVE PROGRESS SCHEMAS
# ============================================

class ObjectiveProgressBase(BaseModel):
    increment: float = Field(..., description="Incremento en el progreso (puede ser negativo)")
    notes: Optional[str] = Field(None, description="Notas sobre el progreso")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Metadatos adicionales", alias="progress_metadata")


class ObjectiveProgressCreate(ObjectiveProgressBase):
    objective_id: UUID = Field(..., description="ID del objetivo")


class ObjectiveProgressUpdate(BaseModel):
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(None, alias="progress_metadata")


class ObjectiveProgressInDB(ObjectiveProgressBase):
    id: UUID
    objective_id: UUID
    previous_value: float
    new_value: float
    recorded_by_id: Optional[UUID]
    is_automatic: bool
    recorded_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class ObjectiveProgress(ObjectiveProgressInDB):
    recorded_by_name: Optional[str]
    objective_title: str


# ============================================
# COMMERCIAL PERFORMANCE SCHEMAS
# ============================================

class CommercialPerformanceBase(BaseModel):
    period: ObjectivePeriod = Field(..., description="Período de la métrica")
    period_start: datetime = Field(..., description="Inicio del período")
    period_end: datetime = Field(..., description="Fin del período")


class CommercialPerformanceCreate(CommercialPerformanceBase):
    commercial_id: UUID = Field(..., description="ID del comercial")


class CommercialPerformanceUpdate(BaseModel):
    # Métricas de leads
    total_leads_assigned: Optional[int] = Field(None, ge=0)
    total_leads_contacted: Optional[int] = Field(None, ge=0)
    total_leads_converted: Optional[int] = Field(None, ge=0)
    conversion_rate: Optional[float] = Field(None, ge=0, le=100)
    
    # Métricas de citas
    total_appointments_scheduled: Optional[int] = Field(None, ge=0)
    total_appointments_completed: Optional[int] = Field(None, ge=0)
    appointment_show_rate: Optional[float] = Field(None, ge=0, le=100)
    
    # Métricas de ingresos
    total_revenue_generated: Optional[float] = Field(None, ge=0)
    average_deal_size: Optional[float] = Field(None, ge=0)
    
    # Métricas de actividad
    total_calls_made: Optional[int] = Field(None, ge=0)
    total_emails_sent: Optional[int] = Field(None, ge=0)
    total_meetings_held: Optional[int] = Field(None, ge=0)
    
    # Métricas de satisfacción
    average_satisfaction_score: Optional[float] = Field(None, ge=1, le=5)
    total_satisfaction_surveys: Optional[int] = Field(None, ge=0)
    
    # Objetivos
    objectives_assigned: Optional[int] = Field(None, ge=0)
    objectives_completed: Optional[int] = Field(None, ge=0)
    objectives_completion_rate: Optional[float] = Field(None, ge=0, le=100)


class CommercialPerformanceInDB(CommercialPerformanceBase):
    id: UUID
    tenant_id: UUID
    commercial_id: UUID
    
    # Todas las métricas
    total_leads_assigned: int
    total_leads_contacted: int
    total_leads_converted: int
    conversion_rate: float
    total_appointments_scheduled: int
    total_appointments_completed: int
    appointment_show_rate: float
    total_revenue_generated: float
    average_deal_size: float
    total_calls_made: int
    total_emails_sent: int
    total_meetings_held: int
    average_satisfaction_score: float
    total_satisfaction_surveys: int
    objectives_assigned: int
    objectives_completed: int
    objectives_completion_rate: float
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommercialPerformance(CommercialPerformanceInDB):
    commercial_name: str
    commercial_email: str
    
    # Comparaciones con período anterior
    lead_growth_rate: Optional[float] = None
    revenue_growth_rate: Optional[float] = None
    conversion_improvement: Optional[float] = None


# ============================================
# OBJECTIVE TEMPLATE SCHEMAS
# ============================================

class ObjectiveTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Nombre de la plantilla")
    description: Optional[str] = Field(None, description="Descripción de la plantilla")
    type: ObjectiveType = Field(..., description="Tipo de objetivo")
    period: ObjectivePeriod = Field(..., description="Período por defecto")
    default_target_value: float = Field(..., gt=0, description="Valor meta por defecto")
    default_unit: Optional[str] = Field(None, max_length=50)
    default_reward_description: Optional[str] = None
    default_reward_amount: Optional[float] = Field(None, ge=0)


class ObjectiveTemplateCreate(ObjectiveTemplateBase):
    pass


class ObjectiveTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    default_target_value: Optional[float] = Field(None, gt=0)
    default_unit: Optional[str] = Field(None, max_length=50)
    default_reward_description: Optional[str] = None
    default_reward_amount: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ObjectiveTemplateInDB(ObjectiveTemplateBase):
    id: UUID
    tenant_id: UUID
    created_by_id: UUID
    is_active: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ObjectiveTemplate(ObjectiveTemplateInDB):
    created_by_name: str


# ============================================
# SUMMARY AND DASHBOARD SCHEMAS
# ============================================

class CommercialDashboard(BaseModel):
    """Dashboard completo para un comercial"""
    # Información del comercial
    commercial_id: UUID
    commercial_name: str
    
    # Objetivos activos
    active_objectives: List[CommercialObjective]
    completed_objectives_this_period: int
    overdue_objectives: int
    
    # Performance actual
    current_period_performance: Optional[CommercialPerformance]
    previous_period_performance: Optional[CommercialPerformance]
    
    # Métricas destacadas
    total_leads_this_month: int
    total_revenue_this_month: float
    conversion_rate_this_month: float
    objectives_completion_rate: float
    
    # Próximas metas
    upcoming_deadlines: List[Dict[str, Any]]
    suggestions: List[str]


class AdminObjectiveDashboard(BaseModel):
    """Dashboard para administrador gestionar objetivos de todos los comerciales"""
    # Resumen general
    total_commercials: int
    total_active_objectives: int
    overall_completion_rate: float
    
    # Performance por comercial
    commercial_rankings: List[Dict[str, Any]]
    
    # Objetivos por estado
    objectives_by_status: Dict[str, int]
    objectives_by_type: Dict[str, int]
    
    # Alertas
    overdue_objectives: List[CommercialObjective]
    underperforming_commercials: List[Dict[str, Any]]
    
    # Estadísticas del período
    period_summary: Dict[str, Any]


# ============================================
# FILTERS AND SEARCH
# ============================================

class ObjectiveFilters(BaseModel):
    commercial_id: Optional[UUID] = None
    type: Optional[ObjectiveType] = None
    period: Optional[ObjectivePeriod] = None
    status: Optional[ObjectiveStatus] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    search: Optional[str] = None
    order_by: Optional[str] = Field("created_at", pattern=r"^(created_at|end_date|progress_percentage|title)$")
    order_direction: Optional[str] = Field("desc", pattern=r"^(asc|desc)$")


class PerformanceFilters(BaseModel):
    commercial_id: Optional[UUID] = None
    period: Optional[ObjectivePeriod] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    order_by: Optional[str] = Field("period_start", pattern=r"^(period_start|total_revenue_generated|conversion_rate)$")
    order_direction: Optional[str] = Field("desc", pattern=r"^(asc|desc)$")