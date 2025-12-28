"""Lead CRUD endpoints."""
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_tenant_member
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead as LeadModel, LeadStatus
from app.models.service import Service
from app.schemas.lead import (
    Lead,
    LeadCreate,
    LeadUpdate,
    LeadFilters,
    LeadListResponse,
)
from .helpers import apply_lead_filters, get_lead_computed_fields

router = APIRouter()


@router.get("/", response_model=LeadListResponse)
async def list_leads(
    filters: LeadFilters = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    List leads with filtering, search, and pagination.

    Accessible by:
    - tenant_admin: All leads in tenant
    - manager (gestor_leads): All leads in tenant
    - user (medico): Only leads assigned to them
    - client (comercial): Only leads assigned to them
    - recepcionista: All leads in tenant
    """
    # Base query with tenant filtering
    query = db.query(LeadModel).filter(LeadModel.tenant_id == current_user.current_tenant_id)

    # Role-based filtering
    if current_user.role in [UserRole.medico, UserRole.closer]:
        # médicos and comerciales only see their assigned leads
        query = query.filter(LeadModel.assigned_to_id == current_user.id)

    # Apply filters
    query = apply_lead_filters(query, filters)

    # Count total before pagination
    total = query.count()

    # Apply ordering
    order_field = getattr(LeadModel, filters.order_by, LeadModel.created_at)
    if filters.order_direction == "asc":
        query = query.order_by(order_field.asc())
    else:
        query = query.order_by(order_field.desc())

    # Apply pagination
    offset = (filters.page - 1) * filters.page_size
    leads = query.offset(offset).limit(filters.page_size).all()

    # Build response with computed fields
    lead_items = []
    for lead in leads:
        computed_fields = get_lead_computed_fields(lead, db)
        lead_dict = lead.__dict__.copy()
        lead_dict.update(computed_fields)
        lead_items.append(Lead(**lead_dict))

    total_pages = (total + filters.page_size - 1) // filters.page_size

    return LeadListResponse(
        items=lead_items,
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        total_pages=total_pages
    )


@router.post("/", response_model=Lead, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Create a new lead.

    Accessible by tenant_admin, manager, user, client, recepcionista
    """
    # Validate service interest exists in same tenant
    if lead_in.service_interest_id:
        service = db.query(Service).filter(
            Service.id == lead_in.service_interest_id,
            Service.tenant_id == current_user.current_tenant_id
        ).first()
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio de interés no encontrado"
            )

    # Create lead
    lead_data = lead_in.model_dump()
    lead_data['tenant_id'] = current_user.current_tenant_id
    lead_data['status'] = LeadStatus.nuevo
    lead_data['is_active'] = True
    lead_data['is_duplicate'] = False
    lead_data['lead_score'] = 50  # Default score

    db_lead = LeadModel(**lead_data)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)

    # Get computed fields for response
    computed_fields = get_lead_computed_fields(db_lead, db)
    lead_dict = db_lead.__dict__.copy()
    lead_dict.update(computed_fields)

    return Lead(**lead_dict)


@router.get("/{lead_id}", response_model=Lead)
async def get_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get lead by ID"""
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

    # Get computed fields
    computed_fields = get_lead_computed_fields(lead, db)
    lead_dict = lead.__dict__.copy()
    lead_dict.update(computed_fields)

    return Lead(**lead_dict)


@router.put("/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: UUID,
    lead_update: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Update lead by ID"""
    lead = db.query(LeadModel).filter(
        LeadModel.id == lead_id,
        LeadModel.tenant_id == current_user.current_tenant_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )

    # Check role-based access for updates
    if current_user.role in [UserRole.medico, UserRole.closer]:
        if lead.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este lead"
            )

    # Validate service interest if provided
    update_data = lead_update.model_dump(exclude_unset=True)
    if 'service_interest_id' in update_data and update_data['service_interest_id']:
        service = db.query(Service).filter(
            Service.id == update_data['service_interest_id'],
            Service.tenant_id == current_user.current_tenant_id
        ).first()
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio de interés no encontrado"
            )

    # Update lead
    for field, value in update_data.items():
        if hasattr(lead, field):
            setattr(lead, field, value)

    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)

    # Get computed fields
    computed_fields = get_lead_computed_fields(lead, db)
    lead_dict = lead.__dict__.copy()
    lead_dict.update(computed_fields)

    return Lead(**lead_dict)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Delete lead by ID.
    Only accessible by tenant_admin and manager.
    """
    # Check role-based access for deletion
    if current_user.role not in [UserRole.superadmin, UserRole.tenant_admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar leads"
        )
    lead = db.query(LeadModel).filter(
        LeadModel.id == lead_id,
        LeadModel.tenant_id == current_user.current_tenant_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )

    # Soft delete - mark as inactive
    lead.is_active = False
    db.commit()

    return None
