"""Inventory categories endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.security import get_current_active_user as get_current_user, get_current_tenant_admin
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import InventoryCategory
from app.schemas.inventory import (
    InventoryCategory as InventoryCategorySchema,
    InventoryCategoryCreate, InventoryCategoryUpdate,
)

router = APIRouter()


@router.get("/categories/", response_model=List[InventoryCategorySchema])
async def get_inventory_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener categorías de inventario del tenant actual"""

    query = db.query(InventoryCategory).filter(
        InventoryCategory.tenant_id == current_user.current_tenant_id
    )

    if is_active is not None:
        query = query.filter(InventoryCategory.is_active == is_active)

    if search:
        query = query.filter(
            or_(
                InventoryCategory.name.icontains(search),
                InventoryCategory.description.icontains(search)
            )
        )

    categories = query.order_by(InventoryCategory.name).offset(skip).limit(limit).all()
    return categories


@router.post("/categories/", response_model=InventoryCategorySchema)
async def create_inventory_category(
    category: InventoryCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Crear nueva categoría de inventario (solo admin)"""

    # Verificar si ya existe una categoría con el mismo nombre
    existing = db.query(InventoryCategory).filter(
        and_(
            InventoryCategory.tenant_id == current_user.current_tenant_id,
            InventoryCategory.name == category.name
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe una categoría con el nombre '{category.name}'"
        )

    db_category = InventoryCategory(
        tenant_id=current_user.current_tenant_id,
        **category.model_dump()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/categories/{category_id}", response_model=InventoryCategorySchema)
async def update_inventory_category(
    category_id: str,
    category: InventoryCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Actualizar categoría de inventario"""

    db_category = db.query(InventoryCategory).filter(
        and_(
            InventoryCategory.id == category_id,
            InventoryCategory.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not db_category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    # Verificar nombre único si se está cambiando
    if category.name and category.name != db_category.name:
        existing = db.query(InventoryCategory).filter(
            and_(
                InventoryCategory.tenant_id == current_user.current_tenant_id,
                InventoryCategory.name == category.name,
                InventoryCategory.id != category_id
            )
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una categoría con el nombre '{category.name}'"
            )

    # Actualizar campos
    for field, value in category.model_dump(exclude_unset=True).items():
        setattr(db_category, field, value)

    db.commit()
    db.refresh(db_category)
    return db_category
