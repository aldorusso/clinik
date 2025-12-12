from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.appointment import AppointmentStatus, AppointmentType


# ============================================
# APPOINTMENT SCHEMAS
# ============================================

class AppointmentBase(BaseModel):
    lead_id: Optional[UUID] = Field(None, description="ID del lead original")
    patient_id: Optional[UUID] = Field(None, description="ID del paciente (usuario)")
    provider_id: UUID = Field(..., description="ID del médico/proveedor")
    service_id: Optional[UUID] = Field(None, description="ID del servicio")
    type: AppointmentType = Field(AppointmentType.consultation, description="Tipo de cita")
    scheduled_at: datetime = Field(..., description="Fecha y hora programada")
    duration_minutes: int = Field(60, gt=0, le=480, description="Duración en minutos")
    title: Optional[str] = Field(None, max_length=255, description="Título personalizado")
    notes: Optional[str] = Field(None, description="Notas de la cita")
    
    # Información del paciente
    patient_name: str = Field(..., min_length=1, max_length=255, description="Nombre completo del paciente")
    patient_phone: str = Field(..., min_length=10, max_length=50, description="Teléfono del paciente")
    patient_email: Optional[EmailStr] = Field(None, description="Email del paciente")
    
    # Información comercial
    estimated_cost: Optional[float] = Field(None, ge=0, description="Costo estimado")
    quoted_price: Optional[float] = Field(None, ge=0, description="Precio cotizado")
    deposit_required: Optional[float] = Field(None, ge=0, description="Depósito requerido")


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    lead_id: Optional[UUID] = None
    patient_id: Optional[UUID] = None
    provider_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    type: Optional[AppointmentType] = None
    status: Optional[AppointmentStatus] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, gt=0, le=480)
    title: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    patient_name: Optional[str] = Field(None, min_length=1, max_length=255)
    patient_phone: Optional[str] = Field(None, min_length=10, max_length=50)
    patient_email: Optional[EmailStr] = None
    estimated_cost: Optional[float] = Field(None, ge=0)
    quoted_price: Optional[float] = Field(None, ge=0)
    deposit_required: Optional[float] = Field(None, ge=0)
    deposit_paid: Optional[float] = Field(None, ge=0)


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus = Field(..., description="Nuevo estado de la cita")
    notes: Optional[str] = Field(None, description="Notas sobre el cambio de estado")


class AppointmentReschedule(BaseModel):
    new_scheduled_at: datetime = Field(..., description="Nueva fecha y hora")
    reason: Optional[str] = Field(None, max_length=255, description="Motivo de la reprogramación")
    notify_patient: bool = Field(True, description="Notificar al paciente")


class AppointmentCancel(BaseModel):
    reason: str = Field(..., min_length=1, max_length=255, description="Motivo de la cancelación")
    cancelled_by_patient: bool = Field(False, description="Cancelada por el paciente")
    apply_fee: bool = Field(False, description="Aplicar tarifa de cancelación")
    fee_amount: Optional[float] = Field(None, ge=0, description="Monto de la tarifa")


class AppointmentCheckIn(BaseModel):
    notes: Optional[str] = Field(None, description="Notas del check-in")


class AppointmentCheckOut(BaseModel):
    actual_duration_minutes: Optional[int] = Field(None, gt=0, description="Duración real en minutos")
    notes: Optional[str] = Field(None, description="Notas del check-out")
    follow_up_needed: bool = Field(False, description="Requiere seguimiento")
    follow_up_date: Optional[datetime] = Field(None, description="Fecha de seguimiento")


class AppointmentInDB(AppointmentBase):
    id: UUID
    tenant_id: UUID
    status: AppointmentStatus
    internal_notes: Optional[str] = None
    
    # Recordatorios
    reminder_sent_at: Optional[datetime] = None
    reminder_24h_sent: bool = False
    reminder_2h_sent: bool = False
    
    # Confirmación
    confirmation_requested_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    confirmation_method: Optional[str] = None
    
    # Check-in y check-out
    checked_in_at: Optional[datetime] = None
    checked_out_at: Optional[datetime] = None
    actual_duration_minutes: Optional[int] = None
    
    # Depósito
    deposit_paid: Optional[float] = None
    
    # Cancelación/Reprogramación
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    cancelled_by_id: Optional[UUID] = None
    rescheduled_from_id: Optional[UUID] = None
    reschedule_reason: Optional[str] = None
    
    # No show
    no_show_fee: Optional[float] = None
    no_show_notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Appointment(AppointmentInDB):
    # Información relacionada
    service_name: str
    service_duration: int
    provider_name: str
    provider_email: str
    lead_full_name: Optional[str] = None
    patient_full_name: Optional[str] = None
    cancelled_by_name: Optional[str] = None
    
    # Campos computados
    scheduled_end_at: datetime
    is_today: bool
    is_past_due: bool
    is_upcoming: bool
    is_active: bool
    can_be_cancelled: bool
    can_be_rescheduled: bool
    needs_confirmation: bool
    needs_reminder: bool
    status_color: str


class AppointmentDetailed(Appointment):
    # Información completa del paciente y proveedor
    patient_details: Optional[dict] = None
    provider_details: Optional[dict] = None
    service_details: Optional[dict] = None
    lead_details: Optional[dict] = None
    
    # Historial de cambios
    status_history: List[dict] = Field(default_factory=list)
    
    # Archivos adjuntos
    attachments: List[dict] = Field(default_factory=list)


# ============================================
# APPOINTMENT AVAILABILITY SCHEMAS
# ============================================

class AppointmentAvailabilityBase(BaseModel):
    provider_id: UUID = Field(..., description="ID del proveedor")
    day_of_week: int = Field(..., ge=0, le=6, description="Día de la semana (0=Lunes, 6=Domingo)")
    start_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Hora de inicio (HH:MM)")
    end_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Hora de fin (HH:MM)")
    slot_duration_minutes: int = Field(60, gt=0, le=480, description="Duración de cada slot")
    break_duration_minutes: int = Field(0, ge=0, le=60, description="Descanso entre citas")
    max_concurrent_appointments: int = Field(1, gt=0, le=10, description="Máximo de citas simultáneas")
    effective_from: Optional[datetime] = Field(None, description="Efectivo desde")
    effective_until: Optional[datetime] = Field(None, description="Efectivo hasta")
    is_active: bool = Field(True, description="Si está activo")

    @validator('end_time')
    def validate_time_range(cls, v, values):
        if 'start_time' in values:
            start_hour, start_min = map(int, values['start_time'].split(':'))
            end_hour, end_min = map(int, v.split(':'))
            start_minutes = start_hour * 60 + start_min
            end_minutes = end_hour * 60 + end_min
            if end_minutes <= start_minutes:
                raise ValueError('end_time must be after start_time')
        return v


class AppointmentAvailabilityCreate(AppointmentAvailabilityBase):
    pass


class AppointmentAvailabilityUpdate(BaseModel):
    provider_id: Optional[UUID] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[str] = Field(None, pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: Optional[str] = Field(None, pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    slot_duration_minutes: Optional[int] = Field(None, gt=0, le=480)
    break_duration_minutes: Optional[int] = Field(None, ge=0, le=60)
    max_concurrent_appointments: Optional[int] = Field(None, gt=0, le=10)
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None
    is_active: Optional[bool] = None


class AppointmentAvailabilityInDB(AppointmentAvailabilityBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentAvailability(AppointmentAvailabilityInDB):
    provider_name: str


# ============================================
# APPOINTMENT BLOCK SCHEMAS
# ============================================

class AppointmentBlockBase(BaseModel):
    provider_id: UUID = Field(..., description="ID del proveedor")
    title: str = Field(..., min_length=1, max_length=255, description="Título del bloqueo")
    description: Optional[str] = Field(None, description="Descripción del bloqueo")
    start_at: datetime = Field(..., description="Inicio del bloqueo")
    end_at: datetime = Field(..., description="Fin del bloqueo")
    is_all_day: bool = Field(False, description="Es todo el día")
    block_type: str = Field(..., pattern="^(vacation|meeting|emergency|personal|maintenance)$", description="Tipo de bloqueo")
    is_recurring: bool = Field(False, description="Es recurrente")
    recurrence_pattern: Optional[dict] = Field(None, description="Patrón de recurrencia")
    is_active: bool = Field(True, description="Si está activo")

    @validator('end_at')
    def validate_time_range(cls, v, values):
        if 'start_at' in values and v <= values['start_at']:
            raise ValueError('end_at must be after start_at')
        return v


class AppointmentBlockCreate(AppointmentBlockBase):
    pass


class AppointmentBlockUpdate(BaseModel):
    provider_id: Optional[UUID] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    block_type: Optional[str] = Field(None, pattern="^(vacation|meeting|emergency|personal|maintenance)$")
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[dict] = None
    is_active: Optional[bool] = None


class AppointmentBlockInDB(AppointmentBlockBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentBlock(AppointmentBlockInDB):
    provider_name: str
    duration_hours: float
    is_current: bool
    is_future: bool


# ============================================
# APPOINTMENT FILTERS AND SEARCH
# ============================================

class AppointmentFilters(BaseModel):
    # Filtros básicos
    status: Optional[List[AppointmentStatus]] = Field(None, description="Filtrar por estados")
    type: Optional[List[AppointmentType]] = Field(None, description="Filtrar por tipos")
    provider_id: Optional[UUID] = Field(None, description="Filtrar por proveedor")
    service_id: Optional[UUID] = Field(None, description="Filtrar por servicio")
    lead_id: Optional[UUID] = Field(None, description="Filtrar por lead")
    patient_id: Optional[UUID] = Field(None, description="Filtrar por paciente")
    
    # Filtros de fecha
    date_from: Optional[datetime] = Field(None, description="Fecha desde")
    date_to: Optional[datetime] = Field(None, description="Fecha hasta")
    is_today: Optional[bool] = Field(None, description="Solo citas de hoy")
    is_upcoming: Optional[bool] = Field(None, description="Solo próximas citas")
    is_past_due: Optional[bool] = Field(None, description="Solo citas vencidas")
    
    # Filtros de estado
    needs_confirmation: Optional[bool] = Field(None, description="Necesita confirmación")
    needs_reminder: Optional[bool] = Field(None, description="Necesita recordatorio")
    is_checked_in: Optional[bool] = Field(None, description="Ya hizo check-in")
    
    # Filtros de pago
    has_deposit: Optional[bool] = Field(None, description="Tiene depósito pagado")
    deposit_pending: Optional[bool] = Field(None, description="Depósito pendiente")
    
    # Búsqueda de texto
    search: Optional[str] = Field(None, min_length=1, description="Búsqueda en nombre, email, teléfono")
    
    # Ordenamiento
    order_by: Optional[str] = Field("scheduled_at", pattern="^(scheduled_at|created_at|patient_name|provider_name)$")
    order_direction: Optional[str] = Field("asc", pattern="^(asc|desc)$")
    
    # Paginación
    page: int = Field(1, ge=1, description="Número de página")
    page_size: int = Field(20, ge=1, le=100, description="Elementos por página")


# ============================================
# APPOINTMENT SCHEDULING
# ============================================

class AvailableSlot(BaseModel):
    """Slot disponible para agendar cita"""
    datetime: datetime
    duration_minutes: int
    provider_id: UUID
    provider_name: str
    is_available: bool
    conflicts: List[str] = Field(default_factory=list)


class AvailabilityQuery(BaseModel):
    """Query para consultar disponibilidad"""
    provider_id: Optional[UUID] = Field(None, description="ID del proveedor específico")
    service_id: Optional[UUID] = Field(None, description="ID del servicio")
    date_from: datetime = Field(..., description="Fecha desde")
    date_to: datetime = Field(..., description="Fecha hasta")
    duration_minutes: Optional[int] = Field(None, gt=0, description="Duración requerida")
    
    @validator('date_to')
    def validate_date_range(cls, v, values):
        if 'date_from' in values and v <= values['date_from']:
            raise ValueError('date_to must be after date_from')
        return v


class AvailabilityResponse(BaseModel):
    """Respuesta de disponibilidad"""
    available_slots: List[AvailableSlot]
    total_slots: int
    providers: List[dict]
    blocked_periods: List[dict] = Field(default_factory=list)


# ============================================
# APPOINTMENT STATISTICS
# ============================================

class AppointmentStats(BaseModel):
    """Estadísticas de citas"""
    total_appointments: int
    today_appointments: int
    upcoming_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    no_show_appointments: int
    
    # Por estado
    appointments_by_status: dict[str, int]
    
    # Por tipo
    appointments_by_type: dict[str, int]
    
    # Por proveedor
    appointments_by_provider: dict[str, int]
    
    # Métricas de performance
    show_up_rate: float
    on_time_rate: float
    average_duration: float
    
    # Tendencias
    appointments_trend: List[dict]  # Últimos 30 días


class ProviderScheduleStats(BaseModel):
    """Estadísticas de agenda por proveedor"""
    provider_id: UUID
    provider_name: str
    total_slots: int
    booked_slots: int
    available_slots: int
    utilization_rate: float
    average_appointment_duration: float
    no_show_rate: float
    cancellation_rate: float