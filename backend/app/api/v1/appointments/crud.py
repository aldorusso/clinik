"""Appointment CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func, cast, Date
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID

from app.db.session import get_db
from app.core.security import get_current_tenant_member
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.service import Service
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    Appointment as AppointmentSchema,
    AppointmentDetailed,
)
from .helpers import build_appointment_response

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
    page_size: int = Query(20, ge=1, le=1000),
    # Ordenamiento
    order_by: str = Query("scheduled_at", pattern="^(scheduled_at|created_at|patient_name|provider_name)$"),
    order_direction: str = Query("asc", pattern="^(asc|desc)$")
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
        Appointment.tenant_id == current_user.current_tenant_id
    )

    # Si el usuario es médico, solo mostrar sus citas
    if current_user.role == UserRole.medico:
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
        result.append(build_appointment_response(appointment))

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
        User.tenant_id == current_user.current_tenant_id,
        User.role.in_(["tenant_admin", "manager", "medico", "closer", "recepcionista"])
    ).first()

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Proveedor no encontrado o no tiene permisos"
        )

    # Verificar que el servicio pertenece al tenant (opcional)
    if appointment_data.service_id:
        service = db.query(Service).filter(
            Service.id == appointment_data.service_id,
            Service.tenant_id == current_user.current_tenant_id,
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
        tenant_id=current_user.current_tenant_id,
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

    return build_appointment_response(appointment_with_relations)


@router.get("/{appointment_id}", response_model=AppointmentDetailed)
async def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Obtener detalles de una cita específica.
    """

    query = db.query(Appointment).options(
        joinedload(Appointment.service),
        joinedload(Appointment.provider),
        joinedload(Appointment.patient),
        joinedload(Appointment.lead),
        joinedload(Appointment.cancelled_by)
    ).filter(
        Appointment.id == appointment_id,
        Appointment.tenant_id == current_user.current_tenant_id
    )

    # Si el usuario es médico, solo puede ver sus propias citas
    if current_user.role == UserRole.medico:
        query = query.filter(Appointment.provider_id == current_user.id)

    appointment = query.first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    return build_appointment_response(appointment, include_details=True)


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
        Appointment.tenant_id == current_user.current_tenant_id
    )

    # Si el usuario es médico, solo puede editar sus propias citas
    if current_user.role == UserRole.medico:
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

    return build_appointment_response(appointment_with_relations)


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
        Appointment.tenant_id == current_user.current_tenant_id
    )

    # Si el usuario es médico, solo puede eliminar sus propias citas
    if current_user.role == UserRole.medico:
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
