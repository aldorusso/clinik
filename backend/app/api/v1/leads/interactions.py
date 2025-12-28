"""Lead interaction endpoints."""
from typing import List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_tenant_member
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead as LeadModel, LeadInteraction, LeadStatus
from app.schemas.lead import (
    LeadInteraction as LeadInteractionSchema,
    LeadInteractionCreate,
)

router = APIRouter()


@router.get("/{lead_id}/interactions", response_model=List[LeadInteractionSchema])
async def list_lead_interactions(
    lead_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """List all interactions for a lead"""
    # Verify lead access
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

    # Get interactions
    interactions = db.query(LeadInteraction).filter(
        LeadInteraction.lead_id == lead_id
    ).order_by(
        LeadInteraction.created_at.desc()
    ).offset(skip).limit(limit).all()

    # Build response with user info
    interaction_items = []
    for interaction in interactions:
        user = db.query(User).filter(User.id == interaction.user_id).first()
        interaction_dict = interaction.__dict__.copy()
        interaction_dict['user_name'] = user.full_name or f"{user.first_name} {user.last_name or ''}".strip() if user else "Usuario eliminado"
        interaction_dict['user_email'] = user.email if user else ""
        interaction_items.append(LeadInteractionSchema(**interaction_dict))

    return interaction_items


@router.post("/{lead_id}/interactions", response_model=LeadInteractionSchema, status_code=status.HTTP_201_CREATED)
async def create_lead_interaction(
    lead_id: UUID,
    interaction_in: LeadInteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Create a new interaction for a lead"""
    # Verify lead access
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

    # Create interaction
    interaction_data = interaction_in.model_dump()
    interaction_data['lead_id'] = lead_id
    interaction_data['user_id'] = current_user.id

    db_interaction = LeadInteraction(**interaction_data)
    db.add(db_interaction)

    # Update lead's contact timestamps
    now = datetime.utcnow()
    if not lead.first_contact_at:
        lead.first_contact_at = now
    lead.last_contact_at = now

    # Update lead status if first contact
    if lead.status == LeadStatus.nuevo:
        lead.status = LeadStatus.contactado

    db.commit()
    db.refresh(db_interaction)

    # Build response with user info
    interaction_dict = db_interaction.__dict__.copy()
    interaction_dict['user_name'] = current_user.full_name or f"{current_user.first_name} {current_user.last_name or ''}".strip()
    interaction_dict['user_email'] = current_user.email

    return LeadInteractionSchema(**interaction_dict)
