"""Objective progress endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.core.security import get_current_tenant_member
from app.models.user import User, UserRole
from app.models.commercial_objectives import (
    CommercialObjective,
    ObjectiveProgress,
    ObjectiveStatus
)
from app.schemas.commercial_objectives import (
    ObjectiveProgressCreate,
    ObjectiveProgress as ObjectiveProgressResponse,
)

router = APIRouter()


@router.get("/objectives/{objective_id}/progress", response_model=List[ObjectiveProgressResponse])
async def get_objective_progress(
    objective_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get progress history for an objective"""
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.closer]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver el progreso de objetivos"
        )

    # Verify objective exists and user has access
    objective = db.query(CommercialObjective).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.current_tenant_id
    ).first()

    if not objective:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")

    # Check access for commercials
    if current_user.role == UserRole.closer and objective.commercial_id != current_user.id:
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
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.closer]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar el progreso de objetivos"
        )

    # Get objective
    objective = db.query(CommercialObjective).filter(
        CommercialObjective.id == objective_id,
        CommercialObjective.tenant_id == current_user.current_tenant_id
    ).first()

    if not objective:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")

    # Check if commercial can only update their own objectives
    if current_user.role == UserRole.closer and objective.commercial_id != current_user.id:
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
