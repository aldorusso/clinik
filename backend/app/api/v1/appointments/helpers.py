"""Appointment helper functions."""
from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.user import User, UserRole


def get_current_patient(current_user: User = Depends(get_current_user)) -> User:
    """Verify that the current user is a patient."""
    if current_user.role != UserRole.patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this resource"
        )
    return current_user


def build_appointment_response(appointment, include_details=False):
    """Build a standardized appointment response with computed fields."""
    result = {
        **{k: v for k, v in appointment.__dict__.items() if not k.startswith('_')},
        # Información del servicio
        "service_name": appointment.service.name if appointment.service else "Servicio eliminado",
        "service_duration": appointment.service.duration_minutes if appointment.service else appointment.duration_minutes,
        # Información del proveedor
        "provider_name": (appointment.provider.full_name or f"{appointment.provider.first_name} {appointment.provider.last_name}") if appointment.provider else "Proveedor eliminado",
        "provider_email": appointment.provider.email if appointment.provider else "",
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

    # Add optional fields if relationships exist
    if hasattr(appointment, 'lead') and appointment.lead:
        result["lead_full_name"] = appointment.lead.full_name
    else:
        result["lead_full_name"] = None

    if hasattr(appointment, 'patient') and appointment.patient:
        result["patient_full_name"] = appointment.patient.full_name
    else:
        result["patient_full_name"] = None

    if include_details:
        if hasattr(appointment, 'cancelled_by') and appointment.cancelled_by:
            result["cancelled_by_name"] = appointment.cancelled_by.full_name
        else:
            result["cancelled_by_name"] = None

        result["patient_details"] = appointment.patient.__dict__ if appointment.patient else None
        result["provider_details"] = appointment.provider.__dict__ if appointment.provider else None
        result["service_details"] = appointment.service.__dict__ if appointment.service else None
        result["lead_details"] = appointment.lead.__dict__ if appointment.lead else None
        result["status_history"] = []  # TODO: Implementar historial de estados
        result["attachments"] = []  # TODO: Implementar archivos adjuntos

    return result
