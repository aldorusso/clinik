from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.lead import LeadSource, LeadStatus, LeadPriority


# Base schema for Lead
class LeadBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=255, description="Nombre del lead")
    last_name: Optional[str] = Field(None, max_length=255, description="Apellido del lead")
    email: Optional[EmailStr] = Field(None, description="Email del lead")
    phone: str = Field(..., min_length=10, max_length=50, description="Teléfono del lead")
    
    # Información demográfica
    age: Optional[int] = Field(None, ge=0, le=120, description="Edad del lead")
    gender: Optional[str] = Field(None, pattern="^(masculino|femenino|otro)$", description="Género")
    country: Optional[str] = Field(None, max_length=100, description="País")
    city: Optional[str] = Field(None, max_length=100, description="Ciudad")
    address: Optional[str] = Field(None, max_length=500, description="Dirección")
    
    # Información del lead
    source: LeadSource = Field(..., description="Fuente del lead")
    priority: LeadPriority = Field(LeadPriority.media, description="Prioridad del lead")
    
    # Servicio de interés
    service_interest_id: Optional[UUID] = Field(None, description="ID del servicio de interés")
    
    # Información comercial
    budget_range_min: Optional[float] = Field(None, ge=0, description="Presupuesto mínimo")
    budget_range_max: Optional[float] = Field(None, ge=0, description="Presupuesto máximo")
    urgency: Optional[str] = Field(None, pattern="^(inmediata|1_mes|3_meses|6_meses|sin_prisa)$", description="Urgencia")
    
    # Contacto preferido
    preferred_contact_method: Optional[str] = Field(None, pattern="^(phone|whatsapp|email)$", description="Método de contacto preferido")
    preferred_contact_time: Optional[str] = Field(None, max_length=100, description="Hora preferida de contacto")
    
    # Notas
    initial_notes: Optional[str] = Field(None, description="Notas iniciales del lead")
    
    # Marketing
    utm_source: Optional[str] = Field(None, max_length=255, description="Fuente UTM")
    utm_medium: Optional[str] = Field(None, max_length=255, description="Medio UTM")
    utm_campaign: Optional[str] = Field(None, max_length=255, description="Campaña UTM")
    utm_content: Optional[str] = Field(None, max_length=255, description="Contenido UTM")

    @validator('budget_range_max')
    def validate_budget_range(cls, v, values):
        if v is not None and 'budget_range_min' in values and values['budget_range_min'] is not None:
            if v < values['budget_range_min']:
                raise ValueError('budget_range_max must be greater than or equal to budget_range_min')
        return v


# Schema for creating a new lead
class LeadCreate(LeadBase):
    pass


# Schema for updating a lead
class LeadUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=255)
    last_name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=50)
    age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[str] = Field(None, pattern="^(masculino|femenino|otro)$")
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=500)
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    service_interest_id: Optional[UUID] = None
    budget_range_min: Optional[float] = Field(None, ge=0)
    budget_range_max: Optional[float] = Field(None, ge=0)
    urgency: Optional[str] = Field(None, pattern="^(inmediata|1_mes|3_meses|6_meses|sin_prisa)$")
    preferred_contact_method: Optional[str] = Field(None, pattern="^(phone|whatsapp|email)$")
    preferred_contact_time: Optional[str] = Field(None, max_length=100)
    initial_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    utm_source: Optional[str] = Field(None, max_length=255)
    utm_medium: Optional[str] = Field(None, max_length=255)
    utm_campaign: Optional[str] = Field(None, max_length=255)
    utm_content: Optional[str] = Field(None, max_length=255)


# Schema for lead assignment
class LeadAssign(BaseModel):
    assigned_to_id: UUID = Field(..., description="ID del usuario al que se asigna")
    reason: Optional[str] = Field(None, max_length=255, description="Motivo de la asignación")
    notes: Optional[str] = Field(None, description="Notas adicionales")


# Schema for lead status update
class LeadStatusUpdate(BaseModel):
    status: LeadStatus = Field(..., description="Nuevo estado del lead")
    notes: Optional[str] = Field(None, description="Notas sobre el cambio de estado")


# Schema for lead in database with all relationships
class LeadInDB(LeadBase):
    id: UUID
    tenant_id: UUID
    status: LeadStatus
    assigned_to_id: Optional[UUID] = None
    assigned_at: Optional[datetime] = None
    lead_score: Optional[int] = None
    is_active: bool
    is_duplicate: bool
    original_lead_id: Optional[UUID] = None
    first_contact_at: Optional[datetime] = None
    last_contact_at: Optional[datetime] = None
    conversion_date: Optional[datetime] = None
    internal_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Schema for lead response with additional computed fields
class Lead(LeadInDB):
    # Campos computados
    full_name: str
    is_assigned: bool
    is_contacted: bool
    is_converted: bool
    is_lost: bool
    days_since_created: int
    days_since_last_contact: int
    
    # Información del servicio de interés (si existe)
    service_interest_name: Optional[str] = None
    
    # Información del usuario asignado (si existe)
    assigned_to_name: Optional[str] = None
    assigned_to_email: Optional[str] = None


# Schema for lead with tenant information
class LeadWithTenant(Lead):
    tenant_name: str
    tenant_slug: str


# Schema for lead list response with pagination
class LeadListResponse(BaseModel):
    items: List[Lead]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================
# LEAD INTERACTION SCHEMAS
# ============================================

class LeadInteractionBase(BaseModel):
    type: str = Field(..., pattern="^(call|whatsapp|email|sms|visit|note)$", description="Tipo de interacción")
    direction: str = Field(..., pattern="^(inbound|outbound)$", description="Dirección de la interacción")
    title: str = Field(..., min_length=1, max_length=255, description="Título de la interacción")
    description: Optional[str] = Field(None, description="Descripción detallada")
    duration_minutes: Optional[int] = Field(None, ge=0, description="Duración en minutos")
    was_successful: Optional[bool] = Field(None, description="Si fue exitosa la interacción")
    next_follow_up: Optional[datetime] = Field(None, description="Próximo seguimiento")
    next_follow_up_notes: Optional[str] = Field(None, description="Notas para el próximo seguimiento")


class LeadInteractionCreate(LeadInteractionBase):
    pass


class LeadInteractionUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(call|whatsapp|email|sms|visit|note)$")
    direction: Optional[str] = Field(None, pattern="^(inbound|outbound)$")
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    was_successful: Optional[bool] = None
    next_follow_up: Optional[datetime] = None
    next_follow_up_notes: Optional[str] = None


class LeadInteractionInDB(LeadInteractionBase):
    id: UUID
    lead_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class LeadInteraction(LeadInteractionInDB):
    # Información del usuario que realizó la interacción
    user_name: str
    user_email: str


# ============================================
# LEAD ASSIGNMENT SCHEMAS
# ============================================

class LeadAssignmentBase(BaseModel):
    reason: Optional[str] = Field(None, max_length=255, description="Motivo de la asignación")
    notes: Optional[str] = Field(None, description="Notas de la asignación")


class LeadAssignmentCreate(LeadAssignmentBase):
    assigned_to_id: UUID = Field(..., description="Usuario al que se asigna")


class LeadAssignmentInDB(LeadAssignmentBase):
    id: UUID
    lead_id: UUID
    assigned_to_id: UUID
    assigned_by_id: UUID
    assigned_at: datetime
    reassigned_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadAssignment(LeadAssignmentInDB):
    # Información de los usuarios
    assigned_to_name: str
    assigned_to_email: str
    assigned_by_name: str
    assigned_by_email: str


# ============================================
# LEAD FILTERS AND SEARCH
# ============================================

class LeadFilters(BaseModel):
    # Filtros básicos
    status: Optional[List[LeadStatus]] = Field(None, description="Filtrar por estados")
    source: Optional[List[LeadSource]] = Field(None, description="Filtrar por fuentes")
    priority: Optional[List[LeadPriority]] = Field(None, description="Filtrar por prioridades")
    assigned_to_id: Optional[UUID] = Field(None, description="Filtrar por usuario asignado")
    service_interest_id: Optional[UUID] = Field(None, description="Filtrar por servicio de interés")
    
    # Filtros de fecha
    created_from: Optional[datetime] = Field(None, description="Fecha de creación desde")
    created_to: Optional[datetime] = Field(None, description="Fecha de creación hasta")
    last_contact_from: Optional[datetime] = Field(None, description="Último contacto desde")
    last_contact_to: Optional[datetime] = Field(None, description="Último contacto hasta")
    
    # Filtros de rango
    age_min: Optional[int] = Field(None, ge=0, le=120, description="Edad mínima")
    age_max: Optional[int] = Field(None, ge=0, le=120, description="Edad máxima")
    budget_min: Optional[float] = Field(None, ge=0, description="Presupuesto mínimo")
    budget_max: Optional[float] = Field(None, ge=0, description="Presupuesto máximo")
    
    # Filtros de texto
    search: Optional[str] = Field(None, min_length=1, description="Búsqueda en nombre, email, teléfono")
    city: Optional[str] = Field(None, description="Filtrar por ciudad")
    
    # Filtros booleanos
    is_assigned: Optional[bool] = Field(None, description="Tiene usuario asignado")
    is_contacted: Optional[bool] = Field(None, description="Ya fue contactado")
    is_converted: Optional[bool] = Field(None, description="Se convirtió en paciente")
    
    # Ordenamiento
    order_by: Optional[str] = Field("created_at", pattern="^(created_at|updated_at|last_contact_at|lead_score|first_name)$")
    order_direction: Optional[str] = Field("desc", pattern="^(asc|desc)$")
    
    # Paginación
    page: int = Field(1, ge=1, description="Número de página")
    page_size: int = Field(20, ge=1, le=100, description="Elementos por página")


# ============================================
# LEAD STATISTICS AND REPORTS
# ============================================

class LeadStats(BaseModel):
    """Estadísticas generales de leads"""
    total_leads: int
    new_leads_today: int
    new_leads_this_week: int
    new_leads_this_month: int
    
    # Por estado
    leads_by_status: dict[str, int]
    
    # Por fuente
    leads_by_source: dict[str, int]
    
    # Por prioridad
    leads_by_priority: dict[str, int]
    
    # Métricas de conversión
    conversion_rate: float
    average_conversion_time_days: Optional[float]
    
    # Asignación
    unassigned_leads: int
    overdue_follow_ups: int
    
    # Tendencias
    leads_trend_last_30_days: List[dict]  # {"date": "2023-01-01", "count": 5}


class LeadFunnelStats(BaseModel):
    """Estadísticas del funnel de conversión"""
    nuevo: int
    contactado: int
    calificado: int
    cita_agendada: int
    vino_a_cita: int
    en_tratamiento: int
    completado: int
    
    # Tasas de conversión entre etapas
    contactado_rate: float
    calificado_rate: float
    cita_rate: float
    show_up_rate: float
    conversion_rate: float
    completion_rate: float


class LeadSourcePerformance(BaseModel):
    """Performance por fuente de leads"""
    source: LeadSource
    total_leads: int
    conversion_rate: float
    average_lead_score: float
    cost_per_lead: Optional[float] = None
    cost_per_conversion: Optional[float] = None
    roi: Optional[float] = None


# ============================================
# LEAD TO PATIENT CONVERSION SCHEMAS
# ============================================

class LeadToPatientConversion(BaseModel):
    """Schema para convertir lead en paciente"""
    create_user_account: bool = Field(default=True, description="Crear cuenta de usuario para el paciente")
    send_welcome_email: bool = Field(default=True, description="Enviar email de bienvenida")
    password: Optional[str] = Field(None, min_length=8, description="Contraseña para el paciente (opcional, se genera automática)")
    conversion_notes: Optional[str] = Field(None, description="Notas sobre la conversión")
    initial_service_id: Optional[UUID] = Field(None, description="Servicio inicial que tomará el paciente")


class LeadConversionResponse(BaseModel):
    """Respuesta de conversión de lead a paciente"""
    success: bool
    message: str
    patient_user_id: Optional[UUID] = None
    patient_email: Optional[str] = None
    conversion_date: datetime
    generated_password: Optional[str] = None  # Solo si se genera automáticamente