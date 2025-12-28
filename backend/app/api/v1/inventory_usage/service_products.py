"""Service products endpoints - CRUD for products associated with services."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.core.security import get_current_active_user as get_current_user, get_current_tenant_admin
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import InventoryProduct, ServiceProduct
from app.models.service import Service
from app.schemas.inventory import (
    ServiceProduct as ServiceProductSchema,
    ServiceProductCreate, ServiceProductUpdate
)

router = APIRouter()


@router.get("/services/{service_id}/products/", response_model=List[ServiceProductSchema])
async def get_service_products(
    service_id: str,
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener productos asociados a un servicio"""
    service = db.query(Service).filter(
        and_(
            Service.id == service_id,
            Service.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    query = db.query(ServiceProduct).options(
        joinedload(ServiceProduct.product).joinedload(InventoryProduct.category)
    ).filter(
        ServiceProduct.service_id == service_id
    )

    if is_active is not None:
        query = query.filter(ServiceProduct.is_active == is_active)

    service_products = query.order_by(
        ServiceProduct.is_required.desc(),
        ServiceProduct.default_quantity.desc()
    ).all()
    return service_products


@router.post("/services/{service_id}/products/", response_model=ServiceProductSchema)
async def add_product_to_service(
    service_id: str,
    service_product: ServiceProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Asociar un producto a un servicio"""
    service = db.query(Service).filter(
        and_(
            Service.id == service_id,
            Service.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    product = db.query(InventoryProduct).filter(
        and_(
            InventoryProduct.id == service_product.product_id,
            InventoryProduct.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing = db.query(ServiceProduct).filter(
        and_(
            ServiceProduct.service_id == service_id,
            ServiceProduct.product_id == service_product.product_id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Este producto ya está asociado al servicio"
        )

    db_service_product = ServiceProduct(
        tenant_id=current_user.current_tenant_id,
        service_id=service_id,
        **service_product.model_dump()
    )
    db.add(db_service_product)
    db.commit()
    db.refresh(db_service_product)

    return db_service_product


@router.put("/services/{service_id}/products/{product_id}", response_model=ServiceProductSchema)
async def update_service_product(
    service_id: str,
    product_id: str,
    service_product_update: ServiceProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Actualizar la asociación producto-servicio"""
    service_product = db.query(ServiceProduct).filter(
        and_(
            ServiceProduct.service_id == service_id,
            ServiceProduct.product_id == product_id,
            ServiceProduct.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not service_product:
        raise HTTPException(status_code=404, detail="Asociación producto-servicio no encontrada")

    for field, value in service_product_update.model_dump(exclude_unset=True).items():
        setattr(service_product, field, value)

    db.commit()
    db.refresh(service_product)
    return service_product


@router.delete("/services/{service_id}/products/{product_id}")
async def remove_product_from_service(
    service_id: str,
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Remover un producto de un servicio"""
    service_product = db.query(ServiceProduct).filter(
        and_(
            ServiceProduct.service_id == service_id,
            ServiceProduct.product_id == product_id,
            ServiceProduct.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not service_product:
        raise HTTPException(status_code=404, detail="Asociación producto-servicio no encontrada")

    db.delete(service_product)
    db.commit()

    return {"message": "Producto removido del servicio exitosamente"}
