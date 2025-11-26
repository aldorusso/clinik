from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_superadmin, get_current_active_user
from app.db.session import get_db
from app.models.plan import Plan
from app.models.user import User
from app.schemas.plan import Plan as PlanSchema, PlanCreate, PlanUpdate

router = APIRouter()


@router.get("/", response_model=List[PlanSchema])
async def list_plans(
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Listar todos los planes disponibles.
    Por defecto solo muestra planes activos.
    Superadmins pueden ver todos los planes.
    """
    query = db.query(Plan)

    # Solo superadmins pueden ver planes inactivos
    if not include_inactive or current_user.role.value != "superadmin":
        query = query.filter(Plan.is_active == True)

    plans = query.order_by(Plan.display_order, Plan.name).offset(skip).limit(limit).all()
    return plans


@router.get("/{plan_id}", response_model=PlanSchema)
async def get_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener un plan por ID."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan no encontrado"
        )
    return plan


@router.post("/", response_model=PlanSchema, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan_in: PlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Crear un nuevo plan. Solo superadmins."""
    # Verificar que el slug no exista
    existing = db.query(Plan).filter(Plan.slug == plan_in.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un plan con ese slug"
        )

    # Si es default, quitar default de otros
    if plan_in.is_default:
        db.query(Plan).filter(Plan.is_default == True).update({"is_default": False})

    db_plan = Plan(**plan_in.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    return db_plan


@router.put("/{plan_id}", response_model=PlanSchema)
async def update_plan(
    plan_id: UUID,
    plan_in: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Actualizar un plan. Solo superadmins."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan no encontrado"
        )

    update_data = plan_in.model_dump(exclude_unset=True)

    # Si se está estableciendo como default, quitar default de otros
    if update_data.get("is_default"):
        db.query(Plan).filter(Plan.is_default == True, Plan.id != plan_id).update({"is_default": False})

    for field, value in update_data.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)

    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Eliminar un plan. Solo superadmins."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan no encontrado"
        )

    # No permitir eliminar el plan por defecto
    if plan.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el plan por defecto. Establece otro plan como default primero."
        )

    db.delete(plan)
    db.commit()

    return None
