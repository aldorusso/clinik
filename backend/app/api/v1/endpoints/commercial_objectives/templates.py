"""Objective templates endpoints."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_tenant_admin
from app.models.user import User
from app.models.commercial_objectives import ObjectiveTemplate
from app.schemas.commercial_objectives import (
    ObjectiveTemplateCreate,
    ObjectiveTemplate as ObjectiveTemplateResponse,
)

router = APIRouter()


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
        ObjectiveTemplate.tenant_id == current_user.current_tenant_id
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
        tenant_id=current_user.current_tenant_id,
        created_by_id=current_user.id,
        **template_data
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    return template
