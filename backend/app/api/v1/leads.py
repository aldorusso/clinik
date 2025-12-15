from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, case

from app.core.security import (
    get_current_tenant_admin,
    get_current_tenant_member,
    get_current_active_user,
    filter_by_tenant,
    get_password_hash,
)
from app.core.email import send_welcome_email
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead as LeadModel, LeadInteraction, LeadAssignment, LeadStatus, LeadSource, LeadPriority
from app.models.service import Service
from app.schemas.lead import (
    Lead,
    LeadCreate,
    LeadUpdate,
    LeadInDB,
    LeadAssign,
    LeadStatusUpdate,
    LeadInteraction as LeadInteractionSchema,
    LeadInteractionCreate,
    LeadInteractionUpdate,
    LeadAssignment as LeadAssignmentSchema,
    LeadAssignmentCreate,
    LeadFilters,
    LeadToPatientConversion,
    LeadConversionResponse,
    LeadStats,
    LeadFunnelStats,
    LeadSourcePerformance,
    LeadListResponse,
)

router = APIRouter()


# ============================================
# HELPER FUNCTIONS
# ============================================

def apply_lead_filters(query, filters: LeadFilters):
    """Apply filters to lead query"""
    
    # Status filters
    if filters.status:
        query = query.filter(LeadModel.status.in_(filters.status))
    
    # Source filters
    if filters.source:
        query = query.filter(LeadModel.source.in_(filters.source))
    
    # Priority filters
    if filters.priority:
        query = query.filter(LeadModel.priority.in_(filters.priority))
    
    # Assignment filters
    if filters.assigned_to_id:
        query = query.filter(LeadModel.assigned_to_id == filters.assigned_to_id)
    
    # Service interest filter
    if filters.service_interest_id:
        query = query.filter(LeadModel.service_interest_id == filters.service_interest_id)
    
    # Date filters
    if filters.created_from:
        query = query.filter(LeadModel.created_at >= filters.created_from)
    if filters.created_to:
        query = query.filter(LeadModel.created_at <= filters.created_to)
    if filters.last_contact_from:
        query = query.filter(LeadModel.last_contact_at >= filters.last_contact_from)
    if filters.last_contact_to:
        query = query.filter(LeadModel.last_contact_at <= filters.last_contact_to)
    
    # Range filters
    if filters.age_min:
        query = query.filter(LeadModel.age >= filters.age_min)
    if filters.age_max:
        query = query.filter(LeadModel.age <= filters.age_max)
    if filters.budget_min:
        query = query.filter(LeadModel.budget_range_min >= filters.budget_min)
    if filters.budget_max:
        query = query.filter(LeadModel.budget_range_max <= filters.budget_max)
    
    # Boolean filters
    if filters.is_assigned is not None:
        if filters.is_assigned:
            query = query.filter(LeadModel.assigned_to_id.isnot(None))
        else:
            query = query.filter(LeadModel.assigned_to_id.is_(None))
    
    if filters.is_contacted is not None:
        if filters.is_contacted:
            query = query.filter(LeadModel.first_contact_at.isnot(None))
        else:
            query = query.filter(LeadModel.first_contact_at.is_(None))
    
    if filters.is_converted is not None:
        if filters.is_converted:
            query = query.filter(LeadModel.conversion_date.isnot(None))
        else:
            query = query.filter(LeadModel.conversion_date.is_(None))
    
    # Text search
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            or_(
                LeadModel.first_name.ilike(search_term),
                LeadModel.last_name.ilike(search_term),
                LeadModel.email.ilike(search_term),
                LeadModel.phone.ilike(search_term),
                func.concat(LeadModel.first_name, ' ', LeadModel.last_name).ilike(search_term)
            )
        )
    
    # City filter
    if filters.city:
        query = query.filter(LeadModel.city.ilike(f"%{filters.city}%"))
    
    return query


def get_lead_computed_fields(lead: LeadModel, db: Session) -> dict:
    """Get computed fields for a lead"""
    now = datetime.utcnow()
    
    # Full name
    full_name = f"{lead.first_name} {lead.last_name or ''}".strip()
    
    # Status booleans
    is_assigned = lead.assigned_to_id is not None
    is_contacted = lead.first_contact_at is not None
    is_converted = lead.conversion_date is not None
    is_lost = lead.status in [LeadStatus.perdido, LeadStatus.no_califica, LeadStatus.no_contesta, LeadStatus.no_show, LeadStatus.rechazo_presupuesto, LeadStatus.abandono]
    
    # Days calculations
    days_since_created = (now - lead.created_at).days
    days_since_last_contact = (
        (now - lead.last_contact_at).days 
        if lead.last_contact_at else days_since_created
    )
    
    # Service interest info
    service_interest_name = None
    if lead.service_interest_id:
        service = db.query(Service).filter(Service.id == lead.service_interest_id).first()
        if service:
            service_interest_name = service.name
    
    # Assigned user info
    assigned_to_name = None
    assigned_to_email = None
    if lead.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == lead.assigned_to_id).first()
        if assigned_user:
            assigned_to_name = assigned_user.full_name or f"{assigned_user.first_name} {assigned_user.last_name or ''}".strip()
            assigned_to_email = assigned_user.email
    
    return {
        'full_name': full_name,
        'is_assigned': is_assigned,
        'is_contacted': is_contacted,
        'is_converted': is_converted,
        'is_lost': is_lost,
        'days_since_created': days_since_created,
        'days_since_last_contact': days_since_last_contact,
        'service_interest_name': service_interest_name,
        'assigned_to_name': assigned_to_name,
        'assigned_to_email': assigned_to_email
    }


# ============================================
# LEAD CRUD ENDPOINTS
# ============================================

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
    query = db.query(LeadModel).filter(LeadModel.tenant_id == current_user.tenant_id)
    
    # Role-based filtering
    if current_user.role in [UserRole.user, UserRole.client]:
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
            Service.tenant_id == current_user.tenant_id
        ).first()
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio de interés no encontrado"
            )
    
    # Create lead
    lead_data = lead_in.model_dump()
    lead_data['tenant_id'] = current_user.tenant_id
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
        LeadModel.tenant_id == current_user.tenant_id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )
    
    # Check role-based access
    if current_user.role in [UserRole.user, UserRole.client]:
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
        LeadModel.tenant_id == current_user.tenant_id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )
    
    # Check role-based access for updates
    if current_user.role in [UserRole.user, UserRole.client]:
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
            Service.tenant_id == current_user.tenant_id
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
        LeadModel.tenant_id == current_user.tenant_id
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


# ============================================
# LEAD ASSIGNMENT ENDPOINTS
# ============================================

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
        LeadModel.tenant_id == current_user.tenant_id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )
    
    # Validate assigned user
    assigned_user = db.query(User).filter(
        User.id == assignment.assigned_to_id,
        User.tenant_id == current_user.tenant_id,
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
        LeadModel.tenant_id == current_user.tenant_id
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


# ============================================
# LEAD STATUS UPDATE ENDPOINTS
# ============================================

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
        LeadModel.tenant_id == current_user.tenant_id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )
    
    # Check role-based access
    if current_user.role in [UserRole.user, UserRole.client]:
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


# ============================================
# LEAD INTERACTION ENDPOINTS
# ============================================

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
        LeadModel.tenant_id == current_user.tenant_id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )
    
    # Check role-based access
    if current_user.role in [UserRole.user, UserRole.client]:
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
        LeadModel.tenant_id == current_user.tenant_id
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )
    
    # Check role-based access
    if current_user.role in [UserRole.user, UserRole.client]:
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


# ============================================
# LEAD STATISTICS ENDPOINTS
# ============================================

@router.get("/stats/overview", response_model=LeadStats)
async def get_lead_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get lead statistics overview"""
    # Base query with tenant filtering
    base_query = db.query(LeadModel).filter(
        LeadModel.tenant_id == current_user.tenant_id,
        LeadModel.is_active == True
    )
    
    # Role-based filtering
    if current_user.role in [UserRole.user, UserRole.client]:
        base_query = base_query.filter(LeadModel.assigned_to_id == current_user.id)
    
    now = datetime.utcnow()
    today = now.date()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Basic counts
    total_leads = base_query.count()
    new_leads_today = base_query.filter(func.date(LeadModel.created_at) == today).count()
    new_leads_this_week = base_query.filter(LeadModel.created_at >= week_ago).count()
    new_leads_this_month = base_query.filter(LeadModel.created_at >= month_ago).count()
    
    # By status
    status_counts = {}
    for status in LeadStatus:
        count = base_query.filter(LeadModel.status == status).count()
        status_counts[status.value] = count
    
    # By source
    source_counts = {}
    for source in LeadSource:
        count = base_query.filter(LeadModel.source == source).count()
        source_counts[source.value] = count
    
    # By priority
    priority_counts = {}
    for priority in LeadPriority:
        count = base_query.filter(LeadModel.priority == priority).count()
        priority_counts[priority.value] = count
    
    # Conversion metrics
    converted_count = base_query.filter(LeadModel.conversion_date.isnot(None)).count()
    conversion_rate = (converted_count / total_leads * 100) if total_leads > 0 else 0
    
    # Average conversion time
    avg_conversion_time = None
    if converted_count > 0:
        conversion_times = base_query.filter(
            LeadModel.conversion_date.isnot(None)
        ).with_entities(
            func.avg(func.extract('epoch', LeadModel.conversion_date - LeadModel.created_at) / 86400)
        ).scalar()
        avg_conversion_time = float(conversion_times) if conversion_times else None
    
    # Assignment stats
    unassigned_leads = base_query.filter(LeadModel.assigned_to_id.is_(None)).count()
    
    # Follow-up overdue (no contact in 7 days for assigned leads)
    overdue_follow_ups = base_query.filter(
        and_(
            LeadModel.assigned_to_id.isnot(None),
            or_(
                LeadModel.last_contact_at.is_(None),
                LeadModel.last_contact_at < (now - timedelta(days=7))
            ),
            LeadModel.status.notin_([LeadStatus.completado, LeadStatus.perdido, LeadStatus.no_califica, LeadStatus.no_contesta, LeadStatus.abandono])
        )
    ).count()
    
    # Trends (last 30 days)
    trends = []
    for i in range(30):
        date = (now - timedelta(days=i)).date()
        count = base_query.filter(func.date(LeadModel.created_at) == date).count()
        trends.append({"date": date.isoformat(), "count": count})
    
    trends.reverse()  # Oldest first
    
    return LeadStats(
        total_leads=total_leads,
        new_leads_today=new_leads_today,
        new_leads_this_week=new_leads_this_week,
        new_leads_this_month=new_leads_this_month,
        leads_by_status=status_counts,
        leads_by_source=source_counts,
        leads_by_priority=priority_counts,
        conversion_rate=round(conversion_rate, 2),
        average_conversion_time_days=avg_conversion_time,
        unassigned_leads=unassigned_leads,
        overdue_follow_ups=overdue_follow_ups,
        leads_trend_last_30_days=trends
    )


@router.get("/stats/funnel", response_model=LeadFunnelStats)
async def get_lead_funnel_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get lead funnel conversion statistics"""
    # Base query with tenant filtering
    base_query = db.query(LeadModel).filter(
        LeadModel.tenant_id == current_user.tenant_id,
        LeadModel.is_active == True
    )
    
    # Role-based filtering
    if current_user.role in [UserRole.user, UserRole.client]:
        base_query = base_query.filter(LeadModel.assigned_to_id == current_user.id)
    
    # Count by each funnel stage
    nuevo = base_query.filter(LeadModel.status == LeadStatus.nuevo).count()
    contactado = base_query.filter(LeadModel.status == LeadStatus.contactado).count()
    calificado = base_query.filter(LeadModel.status == LeadStatus.calificado).count()
    cita_agendada = base_query.filter(LeadModel.status == LeadStatus.cita_agendada).count()
    vino_a_cita = base_query.filter(LeadModel.status == LeadStatus.vino_a_cita).count()
    en_tratamiento = base_query.filter(LeadModel.status == LeadStatus.en_tratamiento).count()
    completado = base_query.filter(LeadModel.status == LeadStatus.completado).count()
    
    # Calculate conversion rates
    total = nuevo + contactado + calificado + cita_agendada + vino_a_cita + en_tratamiento + completado
    
    def safe_rate(numerator, denominator):
        return round((numerator / denominator * 100), 2) if denominator > 0 else 0
    
    contactado_rate = safe_rate(contactado + calificado + cita_agendada + vino_a_cita + en_tratamiento + completado, total)
    calificado_rate = safe_rate(calificado + cita_agendada + vino_a_cita + en_tratamiento + completado, total)
    cita_rate = safe_rate(cita_agendada + vino_a_cita + en_tratamiento + completado, total)
    show_up_rate = safe_rate(vino_a_cita + en_tratamiento + completado, total)
    conversion_rate = safe_rate(en_tratamiento + completado, total)
    completion_rate = safe_rate(completado, total)
    
    return LeadFunnelStats(
        nuevo=nuevo,
        contactado=contactado,
        calificado=calificado,
        cita_agendada=cita_agendada,
        vino_a_cita=vino_a_cita,
        en_tratamiento=en_tratamiento,
        completado=completado,
        contactado_rate=contactado_rate,
        calificado_rate=calificado_rate,
        cita_rate=cita_rate,
        show_up_rate=show_up_rate,
        conversion_rate=conversion_rate,
        completion_rate=completion_rate
    )


@router.get("/stats/source-performance", response_model=List[LeadSourcePerformance])
async def get_lead_source_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get performance statistics by lead source"""
    # Base query with tenant filtering
    base_query = db.query(LeadModel).filter(
        LeadModel.tenant_id == current_user.tenant_id,
        LeadModel.is_active == True
    )
    
    # Role-based filtering
    if current_user.role in [UserRole.user, UserRole.client]:
        base_query = base_query.filter(LeadModel.assigned_to_id == current_user.id)
    
    source_performance = []
    
    for source in LeadSource:
        source_leads = base_query.filter(LeadModel.source == source)
        total_leads = source_leads.count()
        
        if total_leads == 0:
            continue
        
        # Conversion count and rate
        converted_count = source_leads.filter(LeadModel.conversion_date.isnot(None)).count()
        conversion_rate = round((converted_count / total_leads * 100), 2) if total_leads > 0 else 0
        
        # Average lead score
        avg_score = source_leads.with_entities(func.avg(LeadModel.lead_score)).scalar()
        average_lead_score = round(float(avg_score), 2) if avg_score else 0
        
        source_performance.append(LeadSourcePerformance(
            source=source,
            total_leads=total_leads,
            conversion_rate=conversion_rate,
            average_lead_score=average_lead_score,
            cost_per_lead=None,  # Would need marketing cost data
            cost_per_conversion=None,  # Would need marketing cost data
            roi=None  # Would need revenue and cost data
        ))
    
    # Sort by conversion rate descending
    source_performance.sort(key=lambda x: x.conversion_rate, reverse=True)
    
    return source_performance


# ============================================
# LEAD TO PATIENT CONVERSION
# ============================================

@router.post("/{lead_id}/convert-to-patient", response_model=LeadConversionResponse)
async def convert_lead_to_patient(
    lead_id: UUID,
    conversion_data: LeadToPatientConversion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Convert a lead into a patient with optional user account creation.
    Only accessible by tenant_admin, manager, user (medico), and recepcionista.
    """
    # Get the lead with tenant filtering
    lead = filter_by_tenant(
        db.query(LeadModel).filter(LeadModel.id == lead_id),
        LeadModel,
        current_user
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )
    
    # Check if lead can be converted
    if lead.has_patient_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este lead ya ha sido convertido en paciente"
        )
    
    # Check if lead is in a convertible state
    if lead.status in [LeadStatus.perdido, LeadStatus.no_califica, LeadStatus.rechazo_presupuesto]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede convertir un lead en estado perdido o rechazado"
        )
    
    # Verify email is available for user account creation
    patient_user = None
    generated_password = None
    
    if conversion_data.create_user_account:
        if not lead.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El lead debe tener un email para crear la cuenta de paciente"
            )
        
        # Check if email is already in use
        existing_user = db.query(User).filter(User.email == lead.email).first()
        if existing_user:
            # If user already exists, link it as patient
            if existing_user.tenant_id != current_user.tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un usuario con este email en otro tenant"
                )
            patient_user = existing_user
        else:
            # Create new patient user account
            if conversion_data.password:
                password = conversion_data.password
            else:
                # Generate secure random password
                characters = string.ascii_letters + string.digits + "!@#$%^&*"
                generated_password = ''.join(secrets.choice(characters) for _ in range(12))
                password = generated_password
            
            hashed_password = get_password_hash(password)
            
            # Create patient user
            patient_user = User(
                email=lead.email,
                hashed_password=hashed_password,
                first_name=lead.first_name,
                last_name=lead.last_name,
                full_name=lead.full_name,
                phone=lead.phone,
                role=UserRole.client,  # Patients are stored as 'client' role
                tenant_id=current_user.tenant_id,
                is_active=True
            )
            
            db.add(patient_user)
            db.flush()  # Get the user ID
    
    # Update lead with conversion information
    conversion_time = datetime.utcnow()
    lead.conversion_date = conversion_time
    lead.converted_by_id = current_user.id
    lead.conversion_notes = conversion_data.conversion_notes
    lead.status = LeadStatus.en_tratamiento  # Update status to in treatment
    
    if patient_user:
        lead.patient_user_id = patient_user.id
    
    # Save changes
    db.commit()
    db.refresh(lead)
    
    # Send welcome email if requested and user account was created
    if conversion_data.send_welcome_email and patient_user and not existing_user:
        try:
            await send_welcome_email(
                db=db,
                email_to=patient_user.email,
                user_name=patient_user.full_name or patient_user.first_name or patient_user.email.split('@')[0]
            )
        except Exception as e:
            # Log error but don't fail the conversion
            print(f"Error sending welcome email to new patient: {e}")
    
    return LeadConversionResponse(
        success=True,
        message=f"Lead convertido exitosamente en paciente{' con cuenta de usuario' if patient_user else ''}",
        patient_user_id=patient_user.id if patient_user else None,
        patient_email=patient_user.email if patient_user else None,
        conversion_date=conversion_time,
        generated_password=generated_password  # Only returned if generated automatically
    )