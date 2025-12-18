from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os
import shutil
from datetime import datetime

from app import models, schemas
from app.db.session import get_db
from app.core.config import settings
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.medical_history import (
    MedicalHistoryCreate,
    MedicalHistoryUpdate,
    MedicalHistoryResponse,
    MedicalHistoryListResponse,
    MedicalAttachmentResponse
)

router = APIRouter()


@router.get("/patients/{patient_id}/history", response_model=MedicalHistoryListResponse)
def get_patient_medical_history(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    page: int = 1,
    per_page: int = 20
):
    """Get medical history for a patient"""
    # Verify user has access to patient
    if current_user.role not in ["medico", "manager", "tenant_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view medical history")
    
    # Verify patient exists and belongs to same tenant
    patient = db.query(models.User).filter(
        models.User.id == patient_id,
        models.User.tenant_id == current_user.tenant_id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get medical history
    query = db.query(models.MedicalHistory).filter(
        models.MedicalHistory.patient_id == patient_id,
        models.MedicalHistory.tenant_id == current_user.tenant_id
    )
    
    # If user is a doctor, only show their own entries
    if current_user.role == "medico":
        query = query.filter(models.MedicalHistory.medic_id == current_user.id)
    
    total = query.count()
    histories = query.order_by(models.MedicalHistory.created_at.desc())\
        .offset((page - 1) * per_page)\
        .limit(per_page)\
        .all()
    
    return {
        "items": histories,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }


@router.post("/patients/{patient_id}/history", response_model=MedicalHistoryResponse)
def create_medical_history(
    patient_id: UUID,
    history_in: MedicalHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create medical history entry for a patient"""
    # Only doctors can create medical history
    if current_user.role != "medico":
        raise HTTPException(status_code=403, detail="Only doctors can create medical history")
    
    # Verify patient exists and belongs to same tenant
    patient = db.query(models.User).filter(
        models.User.id == patient_id,
        models.User.tenant_id == current_user.tenant_id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create medical history
    db_history = models.MedicalHistory(
        tenant_id=current_user.tenant_id,
        patient_id=patient_id,
        medic_id=current_user.id,
        content=history_in.content
    )
    
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    
    return db_history


@router.put("/history/{history_id}", response_model=MedicalHistoryResponse)
def update_medical_history(
    history_id: UUID,
    history_in: MedicalHistoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update medical history entry"""
    # Get medical history
    history = db.query(models.MedicalHistory).filter(
        models.MedicalHistory.id == history_id,
        models.MedicalHistory.tenant_id == current_user.tenant_id
    ).first()
    
    if not history:
        raise HTTPException(status_code=404, detail="Medical history not found")
    
    # Only the doctor who created it can update
    if history.medic_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this history")
    
    # Update history
    if history_in.content is not None:
        history.content = history_in.content
    history.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(history)
    
    return history


@router.post("/history/{history_id}/attachments", response_model=MedicalAttachmentResponse)
async def upload_attachment(
    history_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload attachment to medical history"""
    # Get medical history
    history = db.query(models.MedicalHistory).filter(
        models.MedicalHistory.id == history_id,
        models.MedicalHistory.tenant_id == current_user.tenant_id
    ).first()
    
    if not history:
        raise HTTPException(status_code=404, detail="Medical history not found")
    
    # Only the doctor who created it can add attachments
    if history.medic_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add attachments")
    
    # Validate file type
    allowed_types = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".bmp"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed types: {allowed_types}")
    
    # Create upload directory
    upload_dir = f"uploads/{current_user.tenant_id}/medical/{history_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_path = f"{upload_dir}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Determine file type
    file_type = "pdf" if file_ext == ".pdf" else "image"
    
    # Create attachment record
    attachment = models.MedicalAttachment(
        tenant_id=current_user.tenant_id,
        medical_history_id=history_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=str(os.path.getsize(file_path)),
        uploaded_by_id=current_user.id
    )
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return attachment


@router.delete("/attachments/{attachment_id}")
def delete_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete attachment from medical history"""
    # Get attachment
    attachment = db.query(models.MedicalAttachment).filter(
        models.MedicalAttachment.id == attachment_id,
        models.MedicalAttachment.tenant_id == current_user.tenant_id
    ).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Get associated medical history
    history = db.query(models.MedicalHistory).filter(
        models.MedicalHistory.id == attachment.medical_history_id
    ).first()
    
    # Only the doctor who created the history can delete attachments
    if history.medic_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this attachment")
    
    # Delete file from filesystem
    if os.path.exists(attachment.file_path):
        os.remove(attachment.file_path)
    
    # Delete record
    db.delete(attachment)
    db.commit()
    
    return {"message": "Attachment deleted successfully"}