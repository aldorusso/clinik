"""Lead helper functions for filtering and computed fields."""
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.user import User
from app.models.lead import Lead as LeadModel, LeadStatus
from app.models.service import Service
from app.schemas.lead import LeadFilters


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
