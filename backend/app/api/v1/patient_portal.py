from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus
from app.models.treatment import Treatment
from app.models.medical_history import MedicalHistory
from app.schemas.appointment import Appointment as AppointmentSchema

router = APIRouter()


def get_current_patient(current_user: User = Depends(get_current_user)) -> User:
    """Verify that the current user is a patient."""
    if current_user.role != UserRole.patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this resource"
        )
    return current_user


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


@router.get("/my-treatments")
async def get_my_treatments(
    db: Session = Depends(get_db),
    current_patient: User = Depends(get_current_patient),
    active_only: bool = Query(False)
):
    """
    Get all treatments for the current patient.
    """
    query = db.query(Treatment).filter(
        Treatment.patient_id == current_patient.id
    ).options(
        joinedload(Treatment.primary_provider),
        joinedload(Treatment.service)
    )
    
    # Filter for active treatments only
    if active_only:
        query = query.filter(
            or_(
                Treatment.end_date == None,
                Treatment.end_date >= datetime.now()
            )
        )
    
    treatments = query.order_by(desc(Treatment.start_date)).all()
    
    # Format response
    result = []
    for treatment in treatments:
        # Calculate progress
        progress_percentage = 0
        if treatment.total_sessions_planned > 0:
            progress_percentage = (treatment.sessions_completed / treatment.total_sessions_planned) * 100
        
        # Determine status
        treatment_status = "active"
        if treatment.actual_end_date and treatment.actual_end_date < datetime.now():
            treatment_status = "completed"
        elif treatment.sessions_completed >= treatment.total_sessions_planned:
            treatment_status = "completed"
        
        result.append({
            "id": treatment.id,
            "name": treatment.service.name if treatment.service else "Tratamiento",
            "description": treatment.service.description if treatment.service else "",
            "status": treatment_status,
            "doctor_name": f"Dr. {treatment.primary_provider.first_name} {treatment.primary_provider.last_name}" if treatment.primary_provider else "Doctor",
            "start_date": treatment.start_date,
            "end_date": treatment.actual_end_date or treatment.planned_end_date,
            "total_sessions": treatment.total_sessions_planned,
            "completed_sessions": treatment.sessions_completed,
            "progress_percentage": progress_percentage,
            "total_amount": treatment.total_cost,
            "notes": treatment.notes,
            "before_photos": treatment.before_photos,
            "after_photos": treatment.after_photos
        })
    
    return result


@router.get("/my-medical-history")
async def get_my_medical_history(
    db: Session = Depends(get_db),
    current_patient: User = Depends(get_current_patient)
):
    """
    Get complete medical history for the current patient.
    """
    # Get medical histories
    medical_histories = db.query(MedicalHistory).filter(
        MedicalHistory.patient_id == current_patient.id
    ).order_by(desc(MedicalHistory.created_at)).all()
    
    # Use the most recent medical history for detailed info
    latest_medical_history = medical_histories[0] if medical_histories else None
    
    # Get appointments with notes (consultations)
    consultations = db.query(Appointment).filter(
        Appointment.patient_id == current_patient.id,
        Appointment.status == AppointmentStatus.completed
    ).options(
        joinedload(Appointment.provider),
        joinedload(Appointment.service)
    ).order_by(desc(Appointment.scheduled_at)).all()
    
    # Format response
    result = {
        "consultations": [],
        "treatments": [],  # Will be populated from treatments endpoint
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
            "doctor_name": f"Dr. {apt.medic.first_name} {apt.medic.last_name}" if apt.medic else "Doctor",
            "type": apt.service.name if apt.service else "Consulta General",
            "diagnosis": apt.diagnosis if hasattr(apt, 'diagnosis') else "",
            "notes": apt.notes,
            "status": "completed"
        })
    
    # Add medical history data if exists
    if latest_medical_history:
        # For now, parse the content field as text
        # In the future, this could be JSON with structured data
        result["medical_conditions"].append({
            "date": latest_medical_history.created_at,
            "content": latest_medical_history.content,
            "doctor_name": f"Dr. {latest_medical_history.medic.first_name} {latest_medical_history.medic.last_name}" if latest_medical_history.medic else "Doctor"
        })
    
    # Add documents from medical histories
    for history in medical_histories:
        if hasattr(history, 'attachments') and history.attachments:
            for attachment in history.attachments:
                result["documents"].append({
                    "id": str(attachment.id),
                    "name": attachment.filename,
                    "type": attachment.file_type,
                    "date": history.created_at,
                    "size": attachment.file_size or "Unknown"
                })
    
    return result


@router.get("/my-profile")
async def get_my_patient_profile(
    db: Session = Depends(get_db),
    current_patient: User = Depends(get_current_patient)
):
    """
    Get patient profile information.
    """
    # Get lead information if patient was converted from lead
    lead_info = None
    if hasattr(current_patient, 'converted_from_lead'):
        # Get lead data if exists
        from app.models.lead import Lead
        lead = db.query(Lead).filter(
            Lead.patient_user_id == current_patient.id
        ).first()
        
        if lead:
            lead_info = {
                "service_interest": lead.service_interest.name if lead.service_interest else None,
                "initial_notes": lead.initial_notes,
                "conversion_date": lead.conversion_date
            }
    
    return {
        "id": current_patient.id,
        "first_name": current_patient.first_name,
        "last_name": current_patient.last_name,
        "email": current_patient.email,
        "phone": current_patient.phone,
        "city": current_patient.city,
        "country": current_patient.country,
        "profile_photo": current_patient.profile_photo,
        "created_at": current_patient.created_at,
        "lead_info": lead_info,
        "emergency_contact": {
            "name": None,  # TODO: Add emergency contact fields to patient
            "phone": None,
            "relationship": None
        }
    }