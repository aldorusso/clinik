"""Appointment status update endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from uuid import UUID

from app.db.session import get_db
from app.core.security import get_current_tenant_member
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import (
    Appointment as AppointmentSchema,
    AppointmentStatusUpdate,
)
from .helpers import build_appointment_response

router = APIRouter()


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
        Appointment.tenant_id == current_user.current_tenant_id
    )

    # Si el usuario es médico, solo puede actualizar sus propias citas
    if current_user.role == UserRole.medico:
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

    return build_appointment_response(appointment_with_relations)
