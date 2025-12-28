"""Lead status update endpoints."""
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_tenant_member
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead as LeadModel, LeadStatus
from app.schemas.lead import Lead, LeadStatusUpdate
from .helpers import get_lead_computed_fields

router = APIRouter()


@router.put("/{lead_id}/status", response_model=Lead)
async def update_lead_status(
    lead_id: UUID,
    status_update: LeadStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Update lead status with notes"""
    lead = db.query(LeadModel).filter(
        LeadModel.id == lead_id,
        LeadModel.tenant_id == current_user.current_tenant_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )

    # Check role-based access
    if current_user.role in [UserRole.medico, UserRole.closer]:
        if lead.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este lead"
            )

    # Update status
    old_status = lead.status
    lead.status = status_update.status

    # Set conversion date if converting to patient
    if status_update.status == LeadStatus.en_tratamiento and not lead.conversion_date:
        lead.conversion_date = datetime.utcnow()

    # Add status change to internal notes
    status_note = f"Estado cambiado de {old_status} a {status_update.status}"
    if status_update.notes:
        status_note += f": {status_update.notes}"

    if lead.internal_notes:
        lead.internal_notes += f"\n[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {status_note}"
    else:
        lead.internal_notes = f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {status_note}"

    db.commit()
    db.refresh(lead)

    # Get computed fields
    computed_fields = get_lead_computed_fields(lead, db)
    lead_dict = lead.__dict__.copy()
    lead_dict.update(computed_fields)

    return Lead(**lead_dict)
