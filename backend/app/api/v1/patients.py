from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.core.security import (
    get_current_tenant_member, 
    get_current_medical_staff,
    get_current_doctor_only
)
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.schemas.user import User as UserSchema

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """
    Get patients list with role-based access control.
    
    - Médicos (user role): Full patient details
    - Admin/Manager: Full patient details  
    - Comerciales/Recepcionistas: Limited info (name only + ability to schedule)
    """
    
    # For now, we'll consider "patients" as users with role "client" who have been converted from leads
    # Later this can be expanded to a dedicated Patient model
    
    # Base query for patients (users who were leads and are now patients)
    # This is a simplified version - in production you'd have a dedicated patients table
    query = db.query(User).filter(
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.client,
        User.is_active == True
    )
    
    # Apply search if provided
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(User.first_name).like(search_term),
                func.lower(User.last_name).like(search_term),
                func.lower(User.full_name).like(search_term),
                func.lower(User.email).like(search_term)
            )
        )
    
    # Pagination
    offset = (page - 1) * page_size
    patients = query.offset(offset).limit(page_size).all()
    
    # Determine access level based on user role
    is_medical_staff = current_user.role in [UserRole.superadmin, UserRole.tenant_admin, UserRole.manager, UserRole.user]
    
    result = []
    for patient in patients:
        if is_medical_staff:
            # Full access for medical staff
            patient_data = {
                "id": patient.id,
                "full_name": patient.full_name or f"{patient.first_name} {patient.last_name}",
                "first_name": patient.first_name,
                "last_name": patient.last_name,
                "email": patient.email,
                "phone": patient.phone,
                "client_company_name": patient.client_company_name,
                "client_tax_id": patient.client_tax_id,
                "city": patient.city,
                "country": patient.country,
                "created_at": patient.created_at,
                "is_active": patient.is_active,
                "access_level": "full",
                "can_view_details": True,
                "can_schedule": True
            }
        else:
            # Limited access for comerciales/recepcionistas
            patient_data = {
                "id": patient.id,
                "full_name": patient.full_name or f"{patient.first_name} {patient.last_name}",
                "first_name": patient.first_name,
                "last_name": patient.last_name,
                # Hide sensitive information
                "email": "***@***.***",  # Hidden
                "phone": "***-***-****",  # Hidden
                "client_company_name": None,
                "client_tax_id": None,
                "city": None,
                "country": None,
                "created_at": patient.created_at,
                "is_active": patient.is_active,
                "access_level": "limited",
                "can_view_details": False,
                "can_schedule": True  # They can still schedule appointments
            }
        
        result.append(patient_data)
    
    return result


@router.get("/{patient_id}/details", response_model=dict)
async def get_patient_details(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor_only)  # Only doctors can see full details
):
    """
    Get detailed patient information - ONLY for doctors and admins.
    This includes medical history, treatments, etc.
    """
    
    patient = db.query(User).filter(
        User.id == patient_id,
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.client
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )
    
    # Full patient details with medical information
    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "email": patient.email,
        "phone": patient.phone,
        "client_company_name": patient.client_company_name,
        "client_tax_id": patient.client_tax_id,
        "city": patient.city,
        "country": patient.country,
        "created_at": patient.created_at,
        "updated_at": patient.updated_at,
        "is_active": patient.is_active,
        # TODO: Add medical-specific fields when patient model is created
        # "medical_history": [],
        # "treatments": [],
        # "allergies": [],
        # "medications": [],
        # "notes": patient.medical_notes,
        "access_level": "medical_full"
    }


@router.get("/{patient_id}/basic", response_model=dict)
async def get_patient_basic_info(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Get basic patient information for scheduling purposes.
    Available to all staff members.
    """
    
    patient = db.query(User).filter(
        User.id == patient_id,
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.client
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )
    
    # Basic info for scheduling
    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "can_schedule": True,
        "access_level": "basic"
    }