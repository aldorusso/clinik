from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func, cast, Date
from typing import List, Optional
from datetime import datetime, date, timedelta
from uuid import UUID

from app.db.session import get_db
from app.core.security import get_current_tenant_member
from app.models.user import User
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType, AppointmentAvailability, AppointmentBlock
from app.models.service import Service
from app.models.lead import Lead
from app.schemas.appointment import (
    AppointmentCreate, 
    AppointmentUpdate, 
    Appointment as AppointmentSchema,
    AppointmentDetailed,
    AppointmentFilters,
    AppointmentStats,
    AppointmentStatusUpdate,
    AppointmentReschedule,
    AppointmentCancel,
    AppointmentCheckIn,
    AppointmentCheckOut,
    AvailabilityQuery,
    AvailabilityResponse,
    AvailableSlot
)

router = APIRouter()


@router.get("/", response_model=List[AppointmentSchema])
async def get_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member),
    # Filtros básicos
    status: Optional[List[AppointmentStatus]] = Query(None),
    type: Optional[List[AppointmentType]] = Query(None),
    provider_id: Optional[UUID] = Query(None),
    service_id: Optional[UUID] = Query(None),
    patient_id: Optional[UUID] = Query(None),
    lead_id: Optional[UUID] = Query(None),
    # Filtros de fecha
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    is_today: Optional[bool] = Query(None),
    # Búsqueda
    search: Optional[str] = Query(None),
    # Paginación
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    # Ordenamiento
    order_by: str = Query("scheduled_at", regex="^(scheduled_at|created_at|patient_name|provider_name)$"),
    order_direction: str = Query("asc", regex="^(asc|desc)$")
):
    """
    Obtener lista de citas del tenant.
    Filtros disponibles: estado, tipo, proveedor, servicio, fechas, búsqueda.
    """
    
    query = db.query(Appointment).options(
        joinedload(Appointment.service),
        joinedload(Appointment.provider),
        joinedload(Appointment.patient),
        joinedload(Appointment.lead)
    ).filter(
        Appointment.tenant_id == current_user.tenant_id
    )
    
    # Si el usuario es médico (role = "user"), solo mostrar sus citas
    if current_user.role == "user":
        query = query.filter(Appointment.provider_id == current_user.id)
    
    # Aplicar filtros
    if status:
        query = query.filter(Appointment.status.in_(status))
    
    if type:
        query = query.filter(Appointment.type.in_(type))
    
    if provider_id:
        query = query.filter(Appointment.provider_id == provider_id)
    
    if service_id:
        query = query.filter(Appointment.service_id == service_id)
    
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    
    if lead_id:
        query = query.filter(Appointment.lead_id == lead_id)
    
    # Filtros de fecha
    if date_from:
        query = query.filter(cast(Appointment.scheduled_at, Date) >= date_from)
    
    if date_to:
        query = query.filter(cast(Appointment.scheduled_at, Date) <= date_to)
    
    if is_today:
        today = datetime.now().date()
        query = query.filter(cast(Appointment.scheduled_at, Date) == today)
    
    # Búsqueda en nombre, email, teléfono
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(Appointment.patient_name).like(search_term),
                func.lower(Appointment.patient_email).like(search_term),
                func.lower(Appointment.patient_phone).like(search_term),
                func.lower(Appointment.notes).like(search_term)
            )
        )
    
    # Ordenamiento
    if order_direction == "desc":
        order_func = desc
    else:
        order_func = asc
    
    if order_by == "patient_name":
        query = query.order_by(order_func(Appointment.patient_name))
    elif order_by == "provider_name":
        query = query.join(User, Appointment.provider_id == User.id).order_by(order_func(User.first_name))
    elif order_by == "created_at":
        query = query.order_by(order_func(Appointment.created_at))
    else:  # scheduled_at
        query = query.order_by(order_func(Appointment.scheduled_at))
    
    # Paginación
    offset = (page - 1) * page_size
    appointments = query.offset(offset).limit(page_size).all()
    
    # Construir respuesta con información adicional
    result = []
    for appointment in appointments:
        data = {
            **appointment.__dict__,
            # Información del servicio
            "service_name": appointment.service.name if appointment.service else "Servicio eliminado",
            "service_duration": appointment.service.duration_minutes if appointment.service else appointment.duration_minutes,
            # Información del proveedor
            "provider_name": appointment.provider.full_name if appointment.provider else "Proveedor eliminado",
            "provider_email": appointment.provider.email if appointment.provider else "",
            # Información del lead/paciente
            "lead_full_name": appointment.lead.full_name if appointment.lead else None,
            "patient_full_name": appointment.patient.full_name if appointment.patient else None,
            # Campos computados
            "scheduled_end_at": appointment.scheduled_end_at,
            "is_today": appointment.is_today,
            "is_past_due": appointment.is_past_due,
            "is_upcoming": appointment.is_upcoming,
            "is_active": appointment.is_active,
            "can_be_cancelled": appointment.can_be_cancelled,
            "can_be_rescheduled": appointment.can_be_rescheduled,
            "needs_confirmation": appointment.needs_confirmation,
            "needs_reminder": appointment.needs_reminder,
            "status_color": appointment.status_color
        }
        result.append(data)
    
    return result


@router.post("/", response_model=AppointmentSchema)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Crear nueva cita médica.
    """
    
    # Verificar que el proveedor pertenece al mismo tenant
    provider = db.query(User).filter(
        User.id == appointment_data.provider_id,
        User.tenant_id == current_user.tenant_id,
        User.role.in_(["tenant_admin", "manager", "user"])  # user = médico
    ).first()
    
    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Proveedor no encontrado o no tiene permisos"
        )
    
    # Verificar que el servicio pertenece al tenant (opcional)
    service = None
    if appointment_data.service_id:
        service = db.query(Service).filter(
            Service.id == appointment_data.service_id,
            Service.tenant_id == current_user.tenant_id,
            Service.is_active == True
        ).first()
        
        if not service:
            raise HTTPException(
                status_code=404,
                detail="Servicio no encontrado o no está activo"
            )
    
    # Verificar disponibilidad del horario (simple check)
    existing_appointment = db.query(Appointment).filter(
        Appointment.provider_id == appointment_data.provider_id,
        Appointment.scheduled_at == appointment_data.scheduled_at,
        Appointment.status.in_([
            AppointmentStatus.scheduled,
            AppointmentStatus.confirmed,
            AppointmentStatus.in_progress
        ])
    ).first()
    
    if existing_appointment:
        raise HTTPException(
            status_code=409,
            detail="El proveedor ya tiene una cita programada en ese horario"
        )
    
    # Crear la cita
    appointment = Appointment(
        tenant_id=current_user.tenant_id,
        **appointment_data.model_dump()
    )
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    # Cargar relaciones para la respuesta
    appointment_with_relations = db.query(Appointment).options(
        joinedload(Appointment.service),
        joinedload(Appointment.provider)
    ).filter(Appointment.id == appointment.id).first()
    
    # Construir respuesta
    result = {
        **appointment_with_relations.__dict__,
        "service_name": appointment_with_relations.service.name if appointment_with_relations.service else "Consulta General",
        "service_duration": appointment_with_relations.service.duration_minutes if appointment_with_relations.service else appointment_with_relations.duration_minutes,
        "provider_name": appointment_with_relations.provider.full_name,
        "provider_email": appointment_with_relations.provider.email,
        "scheduled_end_at": appointment_with_relations.scheduled_end_at,
        "is_today": appointment_with_relations.is_today,
        "is_past_due": appointment_with_relations.is_past_due,
        "is_upcoming": appointment_with_relations.is_upcoming,
        "is_active": appointment_with_relations.is_active,
        "can_be_cancelled": appointment_with_relations.can_be_cancelled,
        "can_be_rescheduled": appointment_with_relations.can_be_rescheduled,
        "needs_confirmation": appointment_with_relations.needs_confirmation,
        "needs_reminder": appointment_with_relations.needs_reminder,
        "status_color": appointment_with_relations.status_color
    }
    
    return result


@router.get("/{appointment_id}", response_model=AppointmentDetailed)
async def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Obtener detalles de una cita específica.
    """
    
    appointment = db.query(Appointment).options(
        joinedload(Appointment.service),
        joinedload(Appointment.provider),
        joinedload(Appointment.patient),
        joinedload(Appointment.lead),
        joinedload(Appointment.cancelled_by)
    ).filter(
        Appointment.id == appointment_id,
        Appointment.tenant_id == current_user.tenant_id
    )
    
    # Si el usuario es médico, solo puede ver sus propias citas
    if current_user.role == "user":
        appointment = appointment.filter(Appointment.provider_id == current_user.id)
    
    appointment = appointment.first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Construir respuesta detallada
    result = {
        **appointment.__dict__,
        "service_name": appointment.service.name if appointment.service else "Servicio eliminado",
        "service_duration": appointment.service.duration_minutes if appointment.service else appointment.duration_minutes,
        "provider_name": appointment.provider.full_name if appointment.provider else "Proveedor eliminado",
        "provider_email": appointment.provider.email if appointment.provider else "",
        "lead_full_name": appointment.lead.full_name if appointment.lead else None,
        "patient_full_name": appointment.patient.full_name if appointment.patient else None,
        "cancelled_by_name": appointment.cancelled_by.full_name if appointment.cancelled_by else None,
        "scheduled_end_at": appointment.scheduled_end_at,
        "is_today": appointment.is_today,
        "is_past_due": appointment.is_past_due,
        "is_upcoming": appointment.is_upcoming,
        "is_active": appointment.is_active,
        "can_be_cancelled": appointment.can_be_cancelled,
        "can_be_rescheduled": appointment.can_be_rescheduled,
        "needs_confirmation": appointment.needs_confirmation,
        "needs_reminder": appointment.needs_reminder,
        "status_color": appointment.status_color,
        # Detalles adicionales
        "patient_details": appointment.patient.__dict__ if appointment.patient else None,
        "provider_details": appointment.provider.__dict__ if appointment.provider else None,
        "service_details": appointment.service.__dict__ if appointment.service else None,
        "lead_details": appointment.lead.__dict__ if appointment.lead else None,
        "status_history": [],  # TODO: Implementar historial de estados
        "attachments": []  # TODO: Implementar archivos adjuntos
    }
    
    return result


@router.put("/{appointment_id}", response_model=AppointmentSchema)
async def update_appointment(
    appointment_id: UUID,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Actualizar una cita existente.
    """
    
    query = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.tenant_id == current_user.tenant_id
    )
    
    # Si el usuario es médico, solo puede editar sus propias citas
    if current_user.role == "user":
        query = query.filter(Appointment.provider_id == current_user.id)
    
    appointment = query.first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Verificar que la cita puede ser editada
    if not appointment.can_be_cancelled and appointment_data.scheduled_at:
        raise HTTPException(
            status_code=400,
            detail="No se puede modificar una cita que ya pasó o está en proceso"
        )
    
    # Actualizar campos
    update_data = appointment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    appointment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(appointment)
    
    # Respuesta con relaciones
    appointment_with_relations = db.query(Appointment).options(
        joinedload(Appointment.service),
        joinedload(Appointment.provider)
    ).filter(Appointment.id == appointment.id).first()
    
    result = {
        **appointment_with_relations.__dict__,
        "service_name": appointment_with_relations.service.name if appointment_with_relations.service else "Consulta General",
        "service_duration": appointment_with_relations.service.duration_minutes if appointment_with_relations.service else appointment_with_relations.duration_minutes,
        "provider_name": appointment_with_relations.provider.full_name,
        "provider_email": appointment_with_relations.provider.email,
        "scheduled_end_at": appointment_with_relations.scheduled_end_at,
        "is_today": appointment_with_relations.is_today,
        "is_past_due": appointment_with_relations.is_past_due,
        "is_upcoming": appointment_with_relations.is_upcoming,
        "is_active": appointment_with_relations.is_active,
        "can_be_cancelled": appointment_with_relations.can_be_cancelled,
        "can_be_rescheduled": appointment_with_relations.can_be_rescheduled,
        "needs_confirmation": appointment_with_relations.needs_confirmation,
        "needs_reminder": appointment_with_relations.needs_reminder,
        "status_color": appointment_with_relations.status_color
    }
    
    return result


@router.patch("/{appointment_id}/status", response_model=AppointmentSchema)
async def update_appointment_status(
    appointment_id: UUID,
    status_data: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Actualizar solo el estado de una cita.
    """
    
    query = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.tenant_id == current_user.tenant_id
    )
    
    # Si el usuario es médico, solo puede actualizar sus propias citas
    if current_user.role == "user":
        query = query.filter(Appointment.provider_id == current_user.id)
    
    appointment = query.first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Actualizar estado
    appointment.status = status_data.status
    if status_data.notes:
        appointment.internal_notes = status_data.notes
    
    # Manejar estados especiales
    if status_data.status == AppointmentStatus.confirmed:
        appointment.confirmed_at = datetime.utcnow()
        appointment.confirmation_method = "manual"
    elif status_data.status == AppointmentStatus.in_progress:
        appointment.checked_in_at = datetime.utcnow()
    elif status_data.status == AppointmentStatus.completed:
        if appointment.checked_in_at and not appointment.checked_out_at:
            appointment.checked_out_at = datetime.utcnow()
            # Calcular duración real
            duration = appointment.checked_out_at - appointment.checked_in_at
            appointment.actual_duration_minutes = int(duration.total_seconds() / 60)
    
    appointment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(appointment)
    
    # Respuesta con relaciones
    appointment_with_relations = db.query(Appointment).options(
        joinedload(Appointment.service),
        joinedload(Appointment.provider)
    ).filter(Appointment.id == appointment.id).first()
    
    result = {
        **appointment_with_relations.__dict__,
        "service_name": appointment_with_relations.service.name if appointment_with_relations.service else "Consulta General",
        "service_duration": appointment_with_relations.service.duration_minutes if appointment_with_relations.service else appointment_with_relations.duration_minutes,
        "provider_name": appointment_with_relations.provider.full_name,
        "provider_email": appointment_with_relations.provider.email,
        "scheduled_end_at": appointment_with_relations.scheduled_end_at,
        "is_today": appointment_with_relations.is_today,
        "is_past_due": appointment_with_relations.is_past_due,
        "is_upcoming": appointment_with_relations.is_upcoming,
        "is_active": appointment_with_relations.is_active,
        "can_be_cancelled": appointment_with_relations.can_be_cancelled,
        "can_be_rescheduled": appointment_with_relations.can_be_rescheduled,
        "needs_confirmation": appointment_with_relations.needs_confirmation,
        "needs_reminder": appointment_with_relations.needs_reminder,
        "status_color": appointment_with_relations.status_color
    }
    
    return result


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Eliminar una cita (soft delete).
    """
    
    query = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.tenant_id == current_user.tenant_id
    )
    
    # Si el usuario es médico, solo puede eliminar sus propias citas
    if current_user.role == "user":
        query = query.filter(Appointment.provider_id == current_user.id)
    
    appointment = query.first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Verificar que la cita puede ser eliminada
    if not appointment.can_be_cancelled:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar una cita que ya pasó o está en proceso"
        )
    
    # Cambiar estado a cancelada en lugar de eliminar
    appointment.status = AppointmentStatus.cancelled_by_clinic
    appointment.cancelled_at = datetime.utcnow()
    appointment.cancelled_by_id = current_user.id
    appointment.cancellation_reason = "Eliminada por staff"
    appointment.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Cita cancelada correctamente"}


@router.get("/stats/summary", response_model=AppointmentStats)
async def get_appointment_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None)
):
    """
    Obtener estadísticas de citas del tenant.
    """
    
    # Base query
    query = db.query(Appointment).filter(
        Appointment.tenant_id == current_user.tenant_id
    )
    
    # Aplicar filtro de fechas si se proporciona
    if date_from:
        query = query.filter(cast(Appointment.scheduled_at, Date) >= date_from)
    if date_to:
        query = query.filter(cast(Appointment.scheduled_at, Date) <= date_to)
    
    appointments = query.all()
    
    today = datetime.now().date()
    
    # Calcular estadísticas
    total_appointments = len(appointments)
    today_appointments = len([a for a in appointments if a.scheduled_at.date() == today])
    upcoming_appointments = len([a for a in appointments if a.is_upcoming])
    completed_appointments = len([a for a in appointments if a.status == AppointmentStatus.completed])
    cancelled_appointments = len([a for a in appointments if a.status in [
        AppointmentStatus.cancelled_by_patient,
        AppointmentStatus.cancelled_by_clinic
    ]])
    no_show_appointments = len([a for a in appointments if a.status == AppointmentStatus.no_show])
    
    # Estadísticas por estado
    appointments_by_status = {}
    for status in AppointmentStatus:
        count = len([a for a in appointments if a.status == status])
        appointments_by_status[status.value] = count
    
    # Estadísticas por tipo
    appointments_by_type = {}
    for type_val in AppointmentType:
        count = len([a for a in appointments if a.type == type_val])
        appointments_by_type[type_val.value] = count
    
    # Métricas de performance
    total_scheduled = total_appointments - cancelled_appointments
    show_up_rate = 0.0
    if total_scheduled > 0:
        show_ups = completed_appointments + len([a for a in appointments if a.status == AppointmentStatus.in_progress])
        show_up_rate = (show_ups / total_scheduled) * 100
    
    # Duración promedio
    completed_with_duration = [a for a in appointments if a.actual_duration_minutes and a.status == AppointmentStatus.completed]
    average_duration = 0.0
    if completed_with_duration:
        average_duration = sum(a.actual_duration_minutes for a in completed_with_duration) / len(completed_with_duration)
    
    return AppointmentStats(
        total_appointments=total_appointments,
        today_appointments=today_appointments,
        upcoming_appointments=upcoming_appointments,
        completed_appointments=completed_appointments,
        cancelled_appointments=cancelled_appointments,
        no_show_appointments=no_show_appointments,
        appointments_by_status=appointments_by_status,
        appointments_by_type=appointments_by_type,
        appointments_by_provider={},  # TODO: Implementar
        show_up_rate=show_up_rate,
        on_time_rate=0.0,  # TODO: Implementar
        average_duration=average_duration,
        appointments_trend=[]  # TODO: Implementar
    )