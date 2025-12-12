from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.treatment import TreatmentStatus


# ============================================
# TREATMENT SCHEMAS
# ============================================

class TreatmentBase(BaseModel):
    patient_id: UUID = Field(..., description="ID del paciente")
    primary_provider_id: UUID = Field(..., description="ID del médico principal")
    service_id: UUID = Field(..., description="ID del servicio")
    appointment_id: Optional[UUID] = Field(None, description="ID de la cita inicial")
    treatment_name: str = Field(..., min_length=1, max_length=255, description="Nombre del tratamiento")
    description: Optional[str] = Field(None, description="Descripción del tratamiento")
    total_sessions_planned: int = Field(1, gt=0, le=100, description="Total de sesiones planificadas")
    planned_end_date: Optional[datetime] = Field(None, description="Fecha planificada de finalización")
    
    # Información médica
    diagnosis: Optional[str] = Field(None, description="Diagnóstico inicial")
    treatment_plan: Optional[str] = Field(None, description="Plan detallado de tratamiento")
    contraindications: Optional[str] = Field(None, description="Contraindicaciones específicas")
    allergies: Optional[str] = Field(None, description="Alergias del paciente")
    medical_history_notes: Optional[str] = Field(None, description="Historial médico relevante")
    
    # Área de tratamiento
    treatment_area: Optional[str] = Field(None, max_length=255, description="Área del tratamiento")
    affected_zones: Optional[List[str]] = Field(None, description="Zonas específicas")
    treatment_parameters: Optional[Dict[str, Any]] = Field(None, description="Parámetros del tratamiento")
    
    # Información comercial
    total_cost: Optional[float] = Field(None, ge=0, description="Costo total del tratamiento")
    payment_plan: Optional[Dict[str, Any]] = Field(None, description="Plan de pagos")
    insurance_covered: bool = Field(False, description="Cubierto por seguro")
    insurance_amount: Optional[float] = Field(None, ge=0, description="Monto del seguro")
    
    # Resultados esperados
    expected_results: Optional[str] = Field(None, description="Resultados esperados")
    
    # Instrucciones post-tratamiento
    aftercare_instructions: Optional[str] = Field(None, description="Instrucciones de cuidado posterior")
    restrictions: Optional[str] = Field(None, description="Restricciones de actividad")
    follow_up_needed: bool = Field(False, description="Requiere seguimiento")
    next_follow_up_date: Optional[datetime] = Field(None, description="Próxima fecha de seguimiento")


class TreatmentCreate(TreatmentBase):
    pass


class TreatmentUpdate(BaseModel):
    patient_id: Optional[UUID] = None
    primary_provider_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    treatment_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[TreatmentStatus] = None
    total_sessions_planned: Optional[int] = Field(None, gt=0, le=100)
    planned_end_date: Optional[datetime] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    contraindications: Optional[str] = None
    allergies: Optional[str] = None
    medical_history_notes: Optional[str] = None
    treatment_area: Optional[str] = Field(None, max_length=255)
    affected_zones: Optional[List[str]] = None
    treatment_parameters: Optional[Dict[str, Any]] = None
    total_cost: Optional[float] = Field(None, ge=0)
    amount_paid: Optional[float] = Field(None, ge=0)
    payment_plan: Optional[Dict[str, Any]] = None
    insurance_covered: Optional[bool] = None
    insurance_amount: Optional[float] = Field(None, ge=0)
    expected_results: Optional[str] = None
    actual_results: Optional[str] = None
    patient_satisfaction: Optional[int] = Field(None, ge=1, le=10)
    provider_notes: Optional[str] = None
    aftercare_instructions: Optional[str] = None
    restrictions: Optional[str] = None
    follow_up_needed: Optional[bool] = None
    next_follow_up_date: Optional[datetime] = None


class TreatmentStatusUpdate(BaseModel):
    status: TreatmentStatus = Field(..., description="Nuevo estado del tratamiento")
    notes: Optional[str] = Field(None, description="Notas sobre el cambio de estado")
    actual_end_date: Optional[datetime] = Field(None, description="Fecha real de finalización")


class TreatmentConsentUpdate(BaseModel):
    informed_consent_signed: bool = Field(..., description="Consentimiento informado firmado")
    informed_consent_date: Optional[datetime] = Field(None, description="Fecha del consentimiento")
    photo_consent_signed: bool = Field(False, description="Consentimiento fotográfico")


class TreatmentPhotosUpdate(BaseModel):
    before_photos: Optional[List[str]] = Field(None, description="URLs de fotos antes")
    during_photos: Optional[List[str]] = Field(None, description="URLs de fotos durante")
    after_photos: Optional[List[str]] = Field(None, description="URLs de fotos después")


class TreatmentInDB(TreatmentBase):
    id: UUID
    tenant_id: UUID
    status: TreatmentStatus
    sessions_completed: int
    start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    amount_paid: float
    informed_consent_signed: bool
    informed_consent_date: Optional[datetime] = None
    photo_consent_signed: bool
    before_photos: Optional[List[str]] = None
    during_photos: Optional[List[str]] = None
    after_photos: Optional[List[str]] = None
    actual_results: Optional[str] = None
    patient_satisfaction: Optional[int] = None
    provider_notes: Optional[str] = None
    side_effects_experienced: Optional[str] = None
    complications: Optional[str] = None
    adverse_reactions: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Treatment(TreatmentInDB):
    # Información relacionada
    patient_name: str
    patient_email: str
    provider_name: str
    provider_email: str
    service_name: str
    appointment_scheduled_at: Optional[datetime] = None
    
    # Campos computados
    progress_percentage: float
    remaining_sessions: int
    is_completed: bool
    is_in_progress: bool
    balance_due: float
    payment_status: str
    
    # Estadísticas de sesiones
    last_session_date: Optional[datetime] = None
    next_session_date: Optional[datetime] = None


class TreatmentDetailed(Treatment):
    # Información completa
    patient_details: Dict[str, Any]
    provider_details: Dict[str, Any]
    service_details: Dict[str, Any]
    
    # Sesiones del tratamiento
    sessions: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Registros médicos asociados
    medical_records: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Historial de cambios
    status_history: List[Dict[str, Any]] = Field(default_factory=list)


# ============================================
# TREATMENT SESSION SCHEMAS
# ============================================

class TreatmentSessionBase(BaseModel):
    treatment_id: UUID = Field(..., description="ID del tratamiento")
    provider_id: UUID = Field(..., description="ID del médico de la sesión")
    appointment_id: Optional[UUID] = Field(None, description="ID de la cita asociada")
    session_number: int = Field(..., gt=0, description="Número de sesión")
    session_date: datetime = Field(..., description="Fecha de la sesión")
    duration_minutes: Optional[int] = Field(None, gt=0, description="Duración en minutos")
    
    # Evaluación pre-sesión
    pre_session_assessment: Optional[str] = Field(None, description="Evaluación pre-sesión")
    pre_session_photos: Optional[List[str]] = Field(None, description="Fotos pre-sesión")
    
    # Parámetros de la sesión
    treatment_parameters: Optional[Dict[str, Any]] = Field(None, description="Configuración específica")
    equipment_used: Optional[List[str]] = Field(None, description="Equipos utilizados")
    products_used: Optional[List[str]] = Field(None, description="Productos aplicados")
    
    # Desarrollo de la sesión
    session_notes: Optional[str] = Field(None, description="Notas de la sesión")
    patient_comfort_level: Optional[int] = Field(None, ge=1, le=10, description="Nivel de comodidad")
    any_complications: Optional[str] = Field(None, description="Complicaciones")
    
    # Evaluación post-sesión
    immediate_response: Optional[str] = Field(None, description="Respuesta inmediata")
    post_session_photos: Optional[List[str]] = Field(None, description="Fotos post-sesión")
    post_session_instructions: Optional[str] = Field(None, description="Instrucciones post-sesión")
    
    # Próxima sesión
    next_session_planned: Optional[datetime] = Field(None, description="Próxima sesión planificada")
    next_session_notes: Optional[str] = Field(None, description="Notas para próxima sesión")
    
    # Costo
    session_cost: Optional[float] = Field(None, ge=0, description="Costo de la sesión")


class TreatmentSessionCreate(TreatmentSessionBase):
    pass


class TreatmentSessionUpdate(BaseModel):
    provider_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None
    session_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    pre_session_assessment: Optional[str] = None
    pre_session_photos: Optional[List[str]] = None
    treatment_parameters: Optional[Dict[str, Any]] = None
    equipment_used: Optional[List[str]] = None
    products_used: Optional[List[str]] = None
    session_notes: Optional[str] = None
    patient_comfort_level: Optional[int] = Field(None, ge=1, le=10)
    any_complications: Optional[str] = None
    immediate_response: Optional[str] = None
    post_session_photos: Optional[List[str]] = None
    post_session_instructions: Optional[str] = None
    next_session_planned: Optional[datetime] = None
    next_session_notes: Optional[str] = None
    session_cost: Optional[float] = Field(None, ge=0)
    is_completed: Optional[bool] = None


class TreatmentSessionInDB(TreatmentSessionBase):
    id: UUID
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TreatmentSession(TreatmentSessionInDB):
    # Información relacionada
    treatment_name: str
    patient_name: str
    provider_name: str
    appointment_scheduled_at: Optional[datetime] = None


# ============================================
# MEDICAL RECORD SCHEMAS
# ============================================

class MedicalRecordBase(BaseModel):
    patient_id: UUID = Field(..., description="ID del paciente")
    provider_id: UUID = Field(..., description="ID del médico")
    treatment_id: Optional[UUID] = Field(None, description="ID del tratamiento")
    record_type: str = Field(..., pattern="^(initial_assessment|progress_note|final_assessment)$", 
                           description="Tipo de registro")
    record_date: datetime = Field(..., description="Fecha del registro")
    
    # Información médica
    chief_complaint: Optional[str] = Field(None, description="Motivo de consulta")
    medical_history: Optional[str] = Field(None, description="Historial médico")
    current_medications: Optional[str] = Field(None, description="Medicamentos actuales")
    allergies: Optional[str] = Field(None, description="Alergias conocidas")
    
    # Examen físico
    physical_examination: Optional[str] = Field(None, description="Examen físico")
    vital_signs: Optional[Dict[str, Any]] = Field(None, description="Signos vitales")
    skin_assessment: Optional[str] = Field(None, description="Evaluación de la piel")
    
    # Diagnóstico
    primary_diagnosis: Optional[str] = Field(None, max_length=255, description="Diagnóstico principal")
    secondary_diagnosis: Optional[str] = Field(None, description="Diagnósticos secundarios")
    differential_diagnosis: Optional[str] = Field(None, description="Diagnóstico diferencial")
    
    # Plan de tratamiento
    treatment_plan: Optional[str] = Field(None, description="Plan de tratamiento")
    recommendations: Optional[str] = Field(None, description="Recomendaciones")
    contraindications: Optional[str] = Field(None, description="Contraindicaciones")
    
    # Documentos adjuntos
    clinical_photos: Optional[List[str]] = Field(None, description="Fotos clínicas")
    attached_documents: Optional[List[str]] = Field(None, description="Documentos adjuntos")
    consents_obtained: Optional[List[str]] = Field(None, description="Consentimientos obtenidos")
    
    # Notas del proveedor
    provider_notes: Optional[str] = Field(None, description="Notas del proveedor")
    private_notes: Optional[str] = Field(None, description="Notas privadas")


class MedicalRecordCreate(MedicalRecordBase):
    pass


class MedicalRecordUpdate(BaseModel):
    record_type: Optional[str] = Field(None, pattern="^(initial_assessment|progress_note|final_assessment)$")
    record_date: Optional[datetime] = None
    chief_complaint: Optional[str] = None
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    allergies: Optional[str] = None
    physical_examination: Optional[str] = None
    vital_signs: Optional[Dict[str, Any]] = None
    skin_assessment: Optional[str] = None
    primary_diagnosis: Optional[str] = Field(None, max_length=255)
    secondary_diagnosis: Optional[str] = None
    differential_diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    recommendations: Optional[str] = None
    contraindications: Optional[str] = None
    clinical_photos: Optional[List[str]] = None
    attached_documents: Optional[List[str]] = None
    consents_obtained: Optional[List[str]] = None
    provider_notes: Optional[str] = None
    private_notes: Optional[str] = None
    is_finalized: Optional[bool] = None


class MedicalRecordInDB(MedicalRecordBase):
    id: UUID
    tenant_id: UUID
    is_finalized: bool
    finalized_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MedicalRecord(MedicalRecordInDB):
    # Información relacionada
    patient_name: str
    patient_email: str
    provider_name: str
    provider_email: str
    treatment_name: Optional[str] = None


# ============================================
# TREATMENT FILTERS AND SEARCH
# ============================================

class TreatmentFilters(BaseModel):
    # Filtros básicos
    status: Optional[List[TreatmentStatus]] = Field(None, description="Filtrar por estados")
    patient_id: Optional[UUID] = Field(None, description="Filtrar por paciente")
    provider_id: Optional[UUID] = Field(None, description="Filtrar por proveedor")
    service_id: Optional[UUID] = Field(None, description="Filtrar por servicio")
    
    # Filtros de fecha
    start_date_from: Optional[datetime] = Field(None, description="Fecha de inicio desde")
    start_date_to: Optional[datetime] = Field(None, description="Fecha de inicio hasta")
    created_from: Optional[datetime] = Field(None, description="Creado desde")
    created_to: Optional[datetime] = Field(None, description="Creado hasta")
    
    # Filtros de progreso
    progress_min: Optional[float] = Field(None, ge=0, le=100, description="Progreso mínimo")
    progress_max: Optional[float] = Field(None, ge=0, le=100, description="Progreso máximo")
    
    # Filtros de pago
    payment_status: Optional[str] = Field(None, pattern="^(paid|partial|pending|no_cost)$")
    has_balance: Optional[bool] = Field(None, description="Tiene balance pendiente")
    
    # Filtros de seguimiento
    needs_follow_up: Optional[bool] = Field(None, description="Requiere seguimiento")
    overdue_follow_up: Optional[bool] = Field(None, description="Seguimiento vencido")
    
    # Filtros de consentimiento
    consent_signed: Optional[bool] = Field(None, description="Consentimiento firmado")
    photo_consent: Optional[bool] = Field(None, description="Consentimiento fotográfico")
    
    # Búsqueda
    search: Optional[str] = Field(None, min_length=1, description="Búsqueda en nombre, paciente")
    
    # Ordenamiento
    order_by: Optional[str] = Field("created_at", pattern="^(created_at|start_date|patient_name|progress_percentage)$")
    order_direction: Optional[str] = Field("desc", pattern="^(asc|desc)$")
    
    # Paginación
    page: int = Field(1, ge=1, description="Número de página")
    page_size: int = Field(20, ge=1, le=100, description="Elementos por página")


# ============================================
# TREATMENT STATISTICS
# ============================================

class TreatmentStats(BaseModel):
    """Estadísticas de tratamientos"""
    total_treatments: int
    active_treatments: int
    completed_treatments: int
    planned_treatments: int
    cancelled_treatments: int
    
    # Por estado
    treatments_by_status: Dict[str, int]
    
    # Por servicio
    treatments_by_service: Dict[str, int]
    
    # Por proveedor
    treatments_by_provider: Dict[str, int]
    
    # Métricas de performance
    average_completion_rate: float
    average_satisfaction_score: Optional[float] = None
    average_treatment_duration_days: float
    
    # Financiero
    total_revenue: float
    pending_revenue: float
    completion_revenue_rate: float


class ProviderTreatmentStats(BaseModel):
    """Estadísticas de tratamientos por proveedor"""
    provider_id: UUID
    provider_name: str
    active_treatments: int
    completed_treatments: int
    total_sessions: int
    completion_rate: float
    average_satisfaction: Optional[float] = None
    total_revenue: float
    specialties: List[str] = Field(default_factory=list)