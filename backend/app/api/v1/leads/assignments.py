"""Lead assignment endpoints."""
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_tenant_admin, get_current_tenant_member
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead as LeadModel, LeadAssignment, LeadStatus
from app.schemas.lead import Lead, LeadAssign
from .helpers import get_lead_computed_fields

router = APIRouter()


@router.post("/{lead_id}/assign", response_model=Lead)
async def assign_lead(
    lead_id: UUID,
    assignment: LeadAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Assign lead to a user.
    Accessible by tenant_admin and manager.
    """
    # Check role-based access for assignment
    if current_user.role not in [UserRole.superadmin, UserRole.tenant_admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para asignar leads"
        )
    # Get lead
    lead = db.query(LeadModel).filter(
        LeadModel.id == lead_id,
        LeadModel.tenant_id == current_user.current_tenant_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )

    # Validate assigned user
    assigned_user = db.query(User).filter(
        User.id == assignment.assigned_to_id,
        User.tenant_id == current_user.current_tenant_id,
        User.is_active == True
    ).first()

    if not assigned_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Create assignment record
    assignment_record = LeadAssignment(
        lead_id=lead.id,
        assigned_to_id=assignment.assigned_to_id,
        assigned_by_id=current_user.id,
        reason=assignment.reason,
        notes=assignment.notes,
        assigned_at=datetime.utcnow()
    )

    # Update lead
    lead.assigned_to_id = assignment.assigned_to_id
    lead.assigned_at = datetime.utcnow()

    # Update status if it's still new
    if lead.status == LeadStatus.nuevo:
        lead.status = LeadStatus.contactado

    db.add(assignment_record)
    db.commit()
    db.refresh(lead)

    # Get computed fields
    computed_fields = get_lead_computed_fields(lead, db)
    lead_dict = lead.__dict__.copy()
    lead_dict.update(computed_fields)

    return Lead(**lead_dict)


@router.post("/{lead_id}/unassign", response_model=Lead)
async def unassign_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Remove assignment from lead.
    Accessible by tenant_admin and manager.
    """
    lead = db.query(LeadModel).filter(
        LeadModel.id == lead_id,
        LeadModel.tenant_id == current_user.current_tenant_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )

    # Remove assignment
    lead.assigned_to_id = None
    lead.assigned_at = None

    # Revert status to nuevo if it was contactado and just assigned
    if lead.status == LeadStatus.contactado and lead.assigned_to_id is not None:
        lead.status = LeadStatus.nuevo

    db.commit()
    db.refresh(lead)

    # Get computed fields
    computed_fields = get_lead_computed_fields(lead, db)
    lead_dict = lead.__dict__.copy()
    lead_dict.update(computed_fields)

    return Lead(**lead_dict)
