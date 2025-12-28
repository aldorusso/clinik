"""Commercial objectives CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.core.security import get_current_tenant_admin, get_current_tenant_member
from app.models.user import User, UserRole
from app.models.commercial_objectives import (
    CommercialObjective,
    ObjectiveType,
    ObjectivePeriod,
    ObjectiveStatus
)
from app.schemas.commercial_objectives import (
    CommercialObjectiveCreate,
    CommercialObjectiveUpdate,
    CommercialObjective as CommercialObjectiveResponse,
)
from .helpers import build_objective_response

router = APIRouter()


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
    """
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.closer]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver objetivos"
        )

    query = db.query(CommercialObjective).options(
        joinedload(CommercialObjective.commercial),
        joinedload(CommercialObjective.created_by)
    ).filter(CommercialObjective.tenant_id == current_user.current_tenant_id)

    # Role-based filtering
    if current_user.role == UserRole.closer:
        query = query.filter(CommercialObjective.commercial_id == current_user.id)
    elif commercial_id:
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
        query = query.order_by(order_func(
            (CommercialObjective.current_value / CommercialObjective.target_value) * 100
        ))
    else:
        query = query.order_by(order_func(CommercialObjective.created_at))

    objectives = query.all()
    return [build_objective_response(obj) for obj in objectives]


@router.get("/objectives/{objective_id}", response_model=CommercialObjectiveResponse)
async def get_objective(
    objective_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get a specific objective by ID with role-based access control"""
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.closer]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver objetivos"
        )

    objective = db.query(CommercialObjective).options(
        joinedload(CommercialObjective.commercial),
        joinedload(CommercialObjective.created_by)
    ).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.current_tenant_id
    ).first()

    if not objective:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")

    if current_user.role == UserRole.closer and objective.commercial_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes ver tus propios objetivos"
        )

    return build_objective_response(objective)


@router.post("/objectives", response_model=CommercialObjectiveResponse, status_code=status.HTTP_201_CREATED)
async def create_objective(
    objective_in: CommercialObjectiveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Create a new commercial objective. Only accessible by tenant admins."""
    # Verify commercial exists and belongs to tenant
    commercial = db.query(User).filter(
        User.id == objective_in.commercial_id,
        User.tenant_id == current_user.current_tenant_id,
        User.role == UserRole.closer
    ).first()

    if not commercial:
        raise HTTPException(status_code=400, detail="Comercial no válido o no encontrado")

    # Create objective
    objective_data = objective_in.model_dump()
    objective = CommercialObjective(
        tenant_id=current_user.current_tenant_id,
        created_by_id=current_user.id,
        **objective_data
    )

    db.add(objective)
    db.commit()
    db.refresh(objective)

    # Load relationships for response
    objective = db.query(CommercialObjective).options(
        joinedload(CommercialObjective.commercial),
        joinedload(CommercialObjective.created_by)
    ).filter(CommercialObjective.id == objective.id).first()

    return build_objective_response(objective)


@router.put("/objectives/{objective_id}", response_model=CommercialObjectiveResponse)
async def update_objective(
    objective_id: UUID,
    objective_in: CommercialObjectiveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Update an objective. Only accessible by tenant admins."""
    objective = db.query(CommercialObjective).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.current_tenant_id
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

    # Load relationships for response
    objective = db.query(CommercialObjective).options(
        joinedload(CommercialObjective.commercial),
        joinedload(CommercialObjective.created_by)
    ).filter(CommercialObjective.id == objective.id).first()

    return build_objective_response(objective)


@router.delete("/objectives/{objective_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_objective(
    objective_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Delete an objective. Only accessible by tenant admins."""
    objective = db.query(CommercialObjective).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.current_tenant_id
    ).first()

    if not objective:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")

    db.delete(objective)
    db.commit()
