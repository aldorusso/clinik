"""Inventory movements endpoints."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.core.security import get_current_active_user as get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import InventoryMovement
from app.schemas.inventory import InventoryMovement as InventoryMovementSchema

router = APIRouter()


@router.get("/movements/", response_model=List[InventoryMovementSchema])
async def get_inventory_movements(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    product_id: Optional[str] = Query(None),
    movement_type: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener movimientos de inventario"""

    query = db.query(InventoryMovement).options(
        joinedload(InventoryMovement.product)
    ).filter(
        InventoryMovement.tenant_id == current_user.current_tenant_id
    )

    if product_id:
        query = query.filter(InventoryMovement.product_id == product_id)

    if movement_type:
        query = query.filter(InventoryMovement.movement_type == movement_type)

    if start_date:
        query = query.filter(InventoryMovement.created_at >= start_date)

    if end_date:
        query = query.filter(InventoryMovement.created_at <= end_date)

    movements = query.order_by(desc(InventoryMovement.created_at)).offset(skip).limit(limit).all()
    return movements
