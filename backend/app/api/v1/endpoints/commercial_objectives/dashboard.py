"""Commercial objectives dashboard endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.core.security import get_current_tenant_admin, get_current_tenant_member
from app.models.user import User, UserRole
from app.models.commercial_objectives import (
    CommercialObjective,
    ObjectiveType,
    ObjectiveStatus
)
from app.schemas.commercial_objectives import (
    CommercialDashboard,
    AdminObjectiveDashboard,
)
from .helpers import build_objective_response

router = APIRouter()


@router.get("/dashboard/commercial", response_model=CommercialDashboard)
async def get_commercial_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member),
    commercial_id: Optional[UUID] = Query(None, description="Commercial ID (for managers/admins)")
):
    """
    Get commercial dashboard with performance metrics and objectives.
    Commercials can only see their own dashboard.
    """
    # Determine which commercial's dashboard to show
    target_commercial_id = commercial_id
    if current_user.role == UserRole.closer:
        target_commercial_id = current_user.id
    elif commercial_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe especificar el ID del comercial"
        )

    # Verify commercial exists
    commercial = db.query(User).filter(
        User.id == target_commercial_id,
        User.tenant_id == current_user.current_tenant_id,
        User.role == UserRole.closer
    ).first()

    if not commercial:
        raise HTTPException(status_code=404, detail="Comercial no encontrado")

    # Get active objectives with relationships loaded
    active_objectives_raw = db.query(CommercialObjective).options(
        joinedload(CommercialObjective.commercial),
        joinedload(CommercialObjective.created_by)
    ).filter(
        CommercialObjective.commercial_id == target_commercial_id,
        CommercialObjective.is_active == True,
        CommercialObjective.status == ObjectiveStatus.active
    ).all()

    active_objectives = [build_objective_response(obj) for obj in active_objectives_raw]

    # Get completed objectives this period
    current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    completed_this_period = db.query(func.count(CommercialObjective.id)).filter(
        CommercialObjective.commercial_id == target_commercial_id,
        CommercialObjective.status == ObjectiveStatus.completed,
        CommercialObjective.completion_date >= current_month_start
    ).scalar()

    # Get overdue objectives
    overdue_count = db.query(func.count(CommercialObjective.id)).filter(
        CommercialObjective.commercial_id == target_commercial_id,
        CommercialObjective.end_date < datetime.utcnow(),
        CommercialObjective.status.in_([ObjectiveStatus.active, ObjectiveStatus.overdue])
    ).scalar()

    dashboard = CommercialDashboard(
        commercial_id=target_commercial_id,
        commercial_name=commercial.full_name or commercial.email,
        active_objectives=active_objectives,
        completed_objectives_this_period=completed_this_period or 0,
        overdue_objectives=overdue_count or 0,
        current_period_performance=None,
        previous_period_performance=None,
        total_leads_this_month=0,
        total_revenue_this_month=0.0,
        conversion_rate_this_month=0.0,
        objectives_completion_rate=0.0,
        upcoming_deadlines=[],
        suggestions=[]
    )

    return dashboard


@router.get("/dashboard/admin", response_model=AdminObjectiveDashboard)
async def get_admin_objectives_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Get admin dashboard for managing all commercial objectives.
    Only accessible by tenant admins.
    """
    # Get total commercials
    total_commercials = db.query(func.count(User.id)).filter(
        User.tenant_id == current_user.current_tenant_id,
        User.role == UserRole.closer,
        User.is_active == True
    ).scalar()

    # Get total active objectives
    total_active_objectives = db.query(func.count(CommercialObjective.id)).filter(
        CommercialObjective.tenant_id == current_user.current_tenant_id,
        CommercialObjective.is_active == True,
        CommercialObjective.status == ObjectiveStatus.active
    ).scalar()

    # Get overdue objectives with relationships loaded
    overdue_objectives_raw = db.query(CommercialObjective).options(
        joinedload(CommercialObjective.commercial),
        joinedload(CommercialObjective.created_by)
    ).filter(
        CommercialObjective.tenant_id == current_user.current_tenant_id,
        CommercialObjective.end_date < datetime.utcnow(),
        CommercialObjective.status.in_([ObjectiveStatus.active, ObjectiveStatus.overdue])
    ).all()

    overdue_objectives = [build_objective_response(obj) for obj in overdue_objectives_raw]

    # Get objectives by status
    objectives_by_status = {}
    for status_value in ObjectiveStatus:
        count = db.query(func.count(CommercialObjective.id)).filter(
            CommercialObjective.tenant_id == current_user.current_tenant_id,
            CommercialObjective.status == status_value
        ).scalar()
        objectives_by_status[status_value.value] = count or 0

    # Get objectives by type
    objectives_by_type = {}
    for type_value in ObjectiveType:
        count = db.query(func.count(CommercialObjective.id)).filter(
            CommercialObjective.tenant_id == current_user.current_tenant_id,
            CommercialObjective.type == type_value
        ).scalar()
        objectives_by_type[type_value.value] = count or 0

    # Calculate overall completion rate
    total_objectives = sum(objectives_by_status.values())
    completed_objectives = objectives_by_status.get(ObjectiveStatus.completed.value, 0)
    overall_completion_rate = (completed_objectives / total_objectives * 100) if total_objectives > 0 else 0.0

    dashboard = AdminObjectiveDashboard(
        total_commercials=total_commercials or 0,
        total_active_objectives=total_active_objectives or 0,
        overall_completion_rate=overall_completion_rate,
        commercial_rankings=[],
        objectives_by_status=objectives_by_status,
        objectives_by_type=objectives_by_type,
        overdue_objectives=overdue_objectives,
        underperforming_commercials=[],
        period_summary={}
    )

    return dashboard
