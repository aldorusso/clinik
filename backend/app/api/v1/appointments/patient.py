"""Patient appointment endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Optional
from datetime import datetime

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.appointment import Appointment, AppointmentStatus
from app.models.medical_history import MedicalHistory
from .helpers import get_current_patient

router = APIRouter()


@router.get("/my-appointments")
async def get_my_appointments(
    db: Session = Depends(get_db),
    current_patient: User = Depends(get_current_patient),
    status: Optional[str] = Query(None),
    upcoming_only: bool = Query(False)
):
    """
    Get all appointments for the current patient.
    """
    query = db.query(Appointment).filter(
        Appointment.patient_id == current_patient.id
    ).options(
        joinedload(Appointment.provider),
        joinedload(Appointment.service)
    )

    # Filter by status if provided
    if status:
        query = query.filter(Appointment.status == status)

    # Filter for upcoming appointments only
    if upcoming_only:
        query = query.filter(Appointment.scheduled_at >= datetime.now())

    # Order by date
    appointments = query.order_by(desc(Appointment.scheduled_at)).all()

    # Format response
    result = []
    for apt in appointments:
        result.append({
            "id": apt.id,
            "scheduled_at": apt.scheduled_at,
            "duration_minutes": apt.duration_minutes,
            "status": apt.status,
            "service_name": apt.service.name if apt.service else "Consulta General",
            "service_id": apt.service_id,
            "doctor_name": f"Dr. {apt.provider.first_name} {apt.provider.last_name}" if apt.provider else "Doctor",
            "doctor_id": apt.provider_id,
            "location": getattr(apt, 'location', 'Clínica'),
            "notes": apt.notes,
            "created_at": apt.created_at
        })

    return result


@router.get("/my-medical-history")
async def get_my_medical_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get complete medical history for the current patient.
    """
    # Add debugging info
    print(f"DEBUG: User accessing medical history: ID={current_user.id}, Email={current_user.email}, Role={current_user.role}")

    # Get medical histories
    medical_histories = db.query(MedicalHistory).filter(
        MedicalHistory.patient_id == current_user.id
    ).order_by(desc(MedicalHistory.created_at)).all()

    # Use the most recent medical history for detailed info
    latest_medical_history = medical_histories[0] if medical_histories else None

    # Get appointments with notes (consultations)
    consultations = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id,
        Appointment.status == AppointmentStatus.completed
    ).options(
        joinedload(Appointment.provider),
        joinedload(Appointment.service)
    ).order_by(desc(Appointment.scheduled_at)).all()

    # Format response
    result = {
        "consultations": [],
        "treatments": [],
        "medications": [],
        "allergies": [],
        "documents": [],
        "medical_conditions": [],
        "surgical_history": []
    }

    # Add consultations
    for apt in consultations:
        result["consultations"].append({
            "id": apt.id,
            "date": apt.scheduled_at,
            "doctor_name": f"Dr. {apt.provider.first_name} {apt.provider.last_name}" if apt.provider else "Doctor",
            "type": apt.service.name if apt.service else "Consulta General",
            "diagnosis": getattr(apt, 'diagnosis', ''),
            "notes": apt.notes,
            "status": "completed"
        })

    # Add medical history data if exists
    if latest_medical_history:
        result["medical_conditions"].append({
            "date": latest_medical_history.created_at,
            "content": latest_medical_history.content,
            "doctor_name": f"Dr. {latest_medical_history.created_by.first_name} {latest_medical_history.created_by.last_name}" if latest_medical_history.created_by else "Doctor"
        })

    return result
