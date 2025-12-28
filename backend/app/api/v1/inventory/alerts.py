"""Inventory alerts endpoints."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc

from app.core.security import get_current_active_user as get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import InventoryAlert
from app.schemas.inventory import InventoryAlert as InventoryAlertSchema

router = APIRouter()


@router.get("/alerts/", response_model=List[InventoryAlertSchema])
async def get_inventory_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    is_acknowledged: Optional[bool] = Query(None),
    alert_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener alertas de inventario"""

    query = db.query(InventoryAlert).options(
        joinedload(InventoryAlert.product)
    ).filter(
        InventoryAlert.tenant_id == current_user.current_tenant_id
    )

    if is_active is not None:
        query = query.filter(InventoryAlert.is_active == is_active)

    if is_acknowledged is not None:
        query = query.filter(InventoryAlert.is_acknowledged == is_acknowledged)

    if alert_type:
        query = query.filter(InventoryAlert.alert_type == alert_type)

    alerts = query.order_by(desc(InventoryAlert.created_at)).offset(skip).limit(limit).all()
    return alerts


@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marcar alerta como reconocida"""

    alert = db.query(InventoryAlert).filter(
        and_(
            InventoryAlert.id == alert_id,
            InventoryAlert.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    alert.is_acknowledged = True
    alert.acknowledged_by_id = current_user.id
    alert.acknowledged_at = datetime.now()

    db.commit()
    return {"message": "Alerta reconocida exitosamente"}
