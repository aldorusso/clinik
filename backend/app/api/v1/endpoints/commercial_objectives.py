from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, and_, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.db.session import get_db
from app.core.security import get_current_tenant_admin, get_current_tenant_member
from app.models.user import User, UserRole
from app.models.commercial_objectives import (
    CommercialObjective, 
    ObjectiveProgress, 
    CommercialPerformance,
    ObjectiveTemplate,
    ObjectiveType,
    ObjectivePeriod,
    ObjectiveStatus
)
from app.schemas.commercial_objectives import (
    CommercialObjectiveCreate,
    CommercialObjectiveUpdate,
    CommercialObjective as CommercialObjectiveResponse,
    ObjectiveProgressCreate,
    ObjectiveProgress as ObjectiveProgressResponse,
    CommercialPerformanceUpdate,
    CommercialPerformance as CommercialPerformanceResponse,
    ObjectiveTemplateCreate,
    ObjectiveTemplate as ObjectiveTemplateResponse,
    CommercialDashboard,
    AdminObjectiveDashboard,
    ObjectiveFilters,
    PerformanceFilters
)

router = APIRouter()


# ============================================
# COMMERCIAL OBJECTIVES ENDPOINTS
# ============================================

@router.get("/objectives", response_model=List[CommercialObjectiveResponse])
async def get_objectives(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member),
    commercial_id: Optional[UUID] = Query(None, description="Filter by commercial"),
    type: Optional[ObjectiveType] = Query(None, description="Filter by objective type"),
    period: Optional[ObjectivePeriod] = Query(None, description="Filter by period"),
    status: Optional[ObjectiveStatus] = Query(None, description="Filter by status"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    order_by: str = Query("created_at", pattern=r"^(created_at|end_date|progress_percentage|title)$"),
    order_direction: str = Query("desc", pattern=r"^(asc|desc)$")
):
    """
    Get objectives with role-based filtering:
    - tenant_admin/manager: Can see all objectives in tenant
    - client (commercial): Can only see their own objectives
    - Others: No access
    """
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.client]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver objetivos"
        )
    
    query = db.query(CommercialObjective).options(
        joinedload(CommercialObjective.commercial),
        joinedload(CommercialObjective.created_by)
    ).filter(CommercialObjective.tenant_id == current_user.tenant_id)
    
    # Role-based filtering
    if current_user.role == UserRole.client:
        # Commercials can only see their own objectives
        query = query.filter(CommercialObjective.commercial_id == current_user.id)
    elif commercial_id:
        # Admins and managers can filter by commercial
        query = query.filter(CommercialObjective.commercial_id == commercial_id)
    
    # Apply filters
    if type:
        query = query.filter(CommercialObjective.type == type)
    if period:
        query = query.filter(CommercialObjective.period == period)
    if status:
        query = query.filter(CommercialObjective.status == status)
    if is_active is not None:
        query = query.filter(CommercialObjective.is_active == is_active)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                CommercialObjective.title.ilike(search_term),
                CommercialObjective.description.ilike(search_term)
            )
        )
    
    # Apply ordering
    order_func = desc if order_direction == "desc" else asc
    if order_by == "title":
        query = query.order_by(order_func(CommercialObjective.title))
    elif order_by == "end_date":
        query = query.order_by(order_func(CommercialObjective.end_date))
    elif order_by == "progress_percentage":
        # Calculate progress percentage for ordering
        query = query.order_by(order_func(
            (CommercialObjective.current_value / CommercialObjective.target_value) * 100
        ))
    else:  # created_at
        query = query.order_by(order_func(CommercialObjective.created_at))
    
    objectives = query.all()
    return objectives


@router.get("/objectives/{objective_id}", response_model=CommercialObjectiveResponse)
async def get_objective(
    objective_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get a specific objective by ID with role-based access control"""
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.client]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver objetivos"
        )
    
    objective = db.query(CommercialObjective).options(
        joinedload(CommercialObjective.commercial),
        joinedload(CommercialObjective.created_by)
    ).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.tenant_id
    ).first()
    
    if not objective:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")
    
    # Check if commercial can only see their own objectives
    if current_user.role == UserRole.client and objective.commercial_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes ver tus propios objetivos"
        )
    
    return objective


@router.post("/objectives", response_model=CommercialObjectiveResponse, status_code=status.HTTP_201_CREATED)
async def create_objective(
    objective_in: CommercialObjectiveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Create a new commercial objective.
    Only accessible by tenant admins.
    """
    # Verify commercial exists and belongs to tenant
    commercial = db.query(User).filter(
        User.id == objective_in.commercial_id,
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.client
    ).first()
    
    if not commercial:
        raise HTTPException(status_code=400, detail="Comercial no válido o no encontrado")
    
    # Create objective
    objective_data = objective_in.model_dump()
    objective = CommercialObjective(
        tenant_id=current_user.tenant_id,
        created_by_id=current_user.id,
        **objective_data
    )
    
    db.add(objective)
    db.commit()
    db.refresh(objective)
    
    return objective


@router.put("/objectives/{objective_id}", response_model=CommercialObjectiveResponse)
async def update_objective(
    objective_id: UUID,
    objective_in: CommercialObjectiveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Update an objective.
    Only accessible by tenant admins.
    """
    objective = db.query(CommercialObjective).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.tenant_id
    ).first()
    
    if not objective:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")
    
    # Update fields
    update_data = objective_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(objective, field, value)
    
    # Update status based on completion
    if objective.is_completed and objective.status == ObjectiveStatus.active:
        objective.status = ObjectiveStatus.completed
        objective.completion_date = datetime.utcnow()
    elif objective.is_overdue and objective.status == ObjectiveStatus.active:
        objective.status = ObjectiveStatus.overdue
    
    db.commit()
    db.refresh(objective)
    
    return objective


@router.delete("/objectives/{objective_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_objective(
    objective_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Delete an objective.
    Only accessible by tenant admins.
    """
    objective = db.query(CommercialObjective).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.tenant_id
    ).first()
    
    if not objective:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")
    
    db.delete(objective)
    db.commit()


# ============================================
# OBJECTIVE PROGRESS ENDPOINTS
# ============================================

@router.get("/objectives/{objective_id}/progress", response_model=List[ObjectiveProgressResponse])
async def get_objective_progress(
    objective_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get progress history for an objective"""
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.client]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver el progreso de objetivos"
        )
    
    # Verify objective exists and user has access
    objective = db.query(CommercialObjective).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.tenant_id
    ).first()
    
    if not objective:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")
    
    # Check access for commercials
    if current_user.role == UserRole.client and objective.commercial_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes ver el progreso de tus propios objetivos"
        )
    
    progress_records = db.query(ObjectiveProgress).options(
        joinedload(ObjectiveProgress.recorded_by),
        joinedload(ObjectiveProgress.objective)
    ).filter(
        ObjectiveProgress.objective_id == objective_id
    ).order_by(desc(ObjectiveProgress.recorded_at)).all()
    
    return progress_records


@router.post("/objectives/{objective_id}/progress", response_model=ObjectiveProgressResponse, status_code=status.HTTP_201_CREATED)
async def add_objective_progress(
    objective_id: UUID,
    progress_in: ObjectiveProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Add progress to an objective"""
    # Only commercials, managers, and admins can add progress
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.client]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar el progreso de objetivos"
        )
    
    # Get objective
    objective = db.query(CommercialObjective).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.tenant_id
    ).first()
    
    if not objective:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")
    
    # Check if commercial can only update their own objectives
    if current_user.role == UserRole.client and objective.commercial_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes actualizar tus propios objetivos"
        )
    
    # Calculate new values
    previous_value = objective.current_value
    new_value = previous_value + progress_in.increment
    
    # Ensure new value is not negative
    if new_value < 0:
        new_value = 0
        progress_in.increment = -previous_value
    
    # Create progress record
    progress = ObjectiveProgress(
        objective_id=objective_id,
        previous_value=previous_value,
        new_value=new_value,
        increment=progress_in.increment,
        notes=progress_in.notes,
        progress_metadata=progress_in.metadata,
        recorded_by_id=current_user.id,
        is_automatic=False
    )
    
    # Update objective
    objective.current_value = new_value
    
    # Update status if completed
    if objective.is_completed and objective.status == ObjectiveStatus.active:
        objective.status = ObjectiveStatus.completed
        objective.completion_date = datetime.utcnow()
    
    db.add(progress)
    db.commit()
    db.refresh(progress)
    
    return progress


# ============================================
# COMMERCIAL DASHBOARD ENDPOINTS
# ============================================

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
    if current_user.role == UserRole.client:
        # Commercials can only see their own dashboard
        target_commercial_id = current_user.id
    elif commercial_id is None:
        # If no commercial specified and user is not a commercial, return error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe especificar el ID del comercial"
        )
    
    # Verify commercial exists
    commercial = db.query(User).filter(
        User.id == target_commercial_id,
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.client
    ).first()
    
    if not commercial:
        raise HTTPException(status_code=404, detail="Comercial no encontrado")
    
    # Get active objectives
    active_objectives = db.query(CommercialObjective).filter(
        CommercialObjective.commercial_id == target_commercial_id,
        CommercialObjective.is_active == True,
        CommercialObjective.status == ObjectiveStatus.active
    ).all()
    
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
    
    # TODO: Add actual performance calculation based on leads, appointments, etc.
    # For now, return placeholder dashboard
    dashboard = CommercialDashboard(
        commercial_id=target_commercial_id,
        commercial_name=commercial.full_name or commercial.email,
        active_objectives=active_objectives,
        completed_objectives_this_period=completed_this_period or 0,
        overdue_objectives=overdue_count or 0,
        current_period_performance=None,
        previous_period_performance=None,
        total_leads_this_month=0,  # TODO: Calculate from leads table
        total_revenue_this_month=0.0,  # TODO: Calculate from appointments/treatments
        conversion_rate_this_month=0.0,  # TODO: Calculate
        objectives_completion_rate=0.0,  # TODO: Calculate
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
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.client,
        User.is_active == True
    ).scalar()
    
    # Get total active objectives
    total_active_objectives = db.query(func.count(CommercialObjective.id)).filter(
        CommercialObjective.tenant_id == current_user.tenant_id,
        CommercialObjective.is_active == True,
        CommercialObjective.status == ObjectiveStatus.active
    ).scalar()
    
    # Get overdue objectives
    overdue_objectives = db.query(CommercialObjective).options(
        joinedload(CommercialObjective.commercial)
    ).filter(
        CommercialObjective.tenant_id == current_user.tenant_id,
        CommercialObjective.end_date < datetime.utcnow(),
        CommercialObjective.status.in_([ObjectiveStatus.active, ObjectiveStatus.overdue])
    ).all()
    
    # Get objectives by status
    objectives_by_status = {}
    for status_value in ObjectiveStatus:
        count = db.query(func.count(CommercialObjective.id)).filter(
            CommercialObjective.tenant_id == current_user.tenant_id,
            CommercialObjective.status == status_value
        ).scalar()
        objectives_by_status[status_value.value] = count or 0
    
    # Get objectives by type
    objectives_by_type = {}
    for type_value in ObjectiveType:
        count = db.query(func.count(CommercialObjective.id)).filter(
            CommercialObjective.tenant_id == current_user.tenant_id,
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
        commercial_rankings=[],  # TODO: Calculate rankings
        objectives_by_status=objectives_by_status,
        objectives_by_type=objectives_by_type,
        overdue_objectives=overdue_objectives,
        underperforming_commercials=[],  # TODO: Calculate underperformers
        period_summary={}  # TODO: Add period summary
    )
    
    return dashboard


# ============================================
# OBJECTIVE TEMPLATES ENDPOINTS
# ============================================

@router.get("/templates", response_model=List[ObjectiveTemplateResponse])
async def get_objective_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin),
    is_active: Optional[bool] = Query(True, description="Filter by active templates")
):
    """
    Get objective templates for the tenant.
    Only accessible by tenant admins.
    """
    query = db.query(ObjectiveTemplate).options(
        joinedload(ObjectiveTemplate.created_by)
    ).filter(
        ObjectiveTemplate.tenant_id == current_user.tenant_id
    )
    
    if is_active is not None:
        query = query.filter(ObjectiveTemplate.is_active == is_active)
    
    templates = query.order_by(desc(ObjectiveTemplate.created_at)).all()
    return templates


@router.post("/templates", response_model=ObjectiveTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_objective_template(
    template_in: ObjectiveTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Create a new objective template.
    Only accessible by tenant admins.
    """
    template_data = template_in.model_dump()
    template = ObjectiveTemplate(
        tenant_id=current_user.tenant_id,
        created_by_id=current_user.id,
        **template_data
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template