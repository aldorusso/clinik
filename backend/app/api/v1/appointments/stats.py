"""Appointment statistics endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date
from typing import Optional
from datetime import datetime, date

from app.db.session import get_db
from app.core.security import get_current_tenant_member
from app.models.user import User
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.schemas.appointment import AppointmentStats

router = APIRouter()


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
        Appointment.tenant_id == current_user.current_tenant_id
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
