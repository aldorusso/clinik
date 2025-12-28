"""Inventory statistics endpoints."""
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func

from app.core.security import get_current_active_user as get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import (
    InventoryCategory, InventoryProduct, InventoryMovement,
    MovementType
)
from app.schemas.inventory import InventoryStats, LowStockAlert

router = APIRouter()


@router.get("/stats/", response_model=InventoryStats)
async def get_inventory_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas del inventario"""

    # Estadísticas básicas
    total_products = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.current_tenant_id,
            InventoryProduct.is_active == True
        )
    ).scalar() or 0

    total_categories = db.query(func.count(InventoryCategory.id)).filter(
        and_(
            InventoryCategory.tenant_id == current_user.current_tenant_id,
            InventoryCategory.is_active == True
        )
    ).scalar() or 0

    products_low_stock = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.current_tenant_id,
            InventoryProduct.current_stock <= InventoryProduct.minimum_stock,
            InventoryProduct.is_active == True
        )
    ).scalar() or 0

    products_out_of_stock = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.current_tenant_id,
            InventoryProduct.current_stock == 0,
            InventoryProduct.is_active == True
        )
    ).scalar() or 0

    # Productos vencidos y por vencer
    now = datetime.now()
    next_week = now + timedelta(days=7)

    products_expired = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.current_tenant_id,
            InventoryProduct.expiration_date < now,
            InventoryProduct.is_active == True
        )
    ).scalar() or 0

    products_expiring_soon = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.current_tenant_id,
            InventoryProduct.expiration_date.between(now, next_week),
            InventoryProduct.is_active == True
        )
    ).scalar() or 0

    # Valor total del inventario
    total_inventory_value = db.query(
        func.sum(InventoryProduct.current_stock * InventoryProduct.cost_per_unit)
    ).filter(
        and_(
            InventoryProduct.tenant_id == current_user.current_tenant_id,
            InventoryProduct.is_active == True,
            InventoryProduct.cost_per_unit.isnot(None)
        )
    ).scalar() or 0.0

    # Productos más usados (últimos 30 días)
    thirty_days_ago = now - timedelta(days=30)
    most_used_query = db.query(
        InventoryProduct.name,
        func.sum(InventoryMovement.quantity).label('total_used')
    ).join(
        InventoryMovement
    ).filter(
        and_(
            InventoryProduct.tenant_id == current_user.current_tenant_id,
            InventoryMovement.movement_type == MovementType.OUT_USAGE,
            InventoryMovement.created_at >= thirty_days_ago
        )
    ).group_by(
        InventoryProduct.id, InventoryProduct.name
    ).order_by(
        desc('total_used')
    ).limit(5).all()

    most_used_products = [
        {"name": result.name, "total_used": abs(result.total_used)}
        for result in most_used_query
    ]

    # Movimientos recientes
    recent_movements_query = db.query(InventoryMovement).options(
        joinedload(InventoryMovement.product)
    ).filter(
        InventoryMovement.tenant_id == current_user.current_tenant_id
    ).order_by(
        desc(InventoryMovement.created_at)
    ).limit(10).all()

    recent_movements = [
        {
            "product_name": movement.product.name,
            "movement_type": movement.movement_type,
            "quantity": movement.quantity,
            "created_at": movement.created_at,
            "notes": movement.notes
        }
        for movement in recent_movements_query
    ]

    return InventoryStats(
        total_products=total_products,
        total_categories=total_categories,
        products_low_stock=products_low_stock,
        products_out_of_stock=products_out_of_stock,
        products_expired=products_expired,
        products_expiring_soon=products_expiring_soon,
        total_inventory_value=float(total_inventory_value),
        most_used_products=most_used_products,
        recent_movements=recent_movements
    )


@router.get("/low-stock-alerts/", response_model=List[LowStockAlert])
async def get_low_stock_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener alertas de stock bajo"""

    products = db.query(InventoryProduct).options(
        joinedload(InventoryProduct.category)
    ).filter(
        and_(
            InventoryProduct.tenant_id == current_user.current_tenant_id,
            InventoryProduct.current_stock <= InventoryProduct.minimum_stock,
            InventoryProduct.is_active == True
        )
    ).order_by(
        InventoryProduct.current_stock
    ).all()

    alerts = []
    for product in products:
        # Calcular días de suministro basado en uso promedio
        days_of_supply = None

        # Calcular uso promedio de los últimos 30 días
        thirty_days_ago = datetime.now() - timedelta(days=30)
        avg_daily_usage = db.query(
            func.avg(func.abs(InventoryMovement.quantity))
        ).filter(
            and_(
                InventoryMovement.product_id == product.id,
                InventoryMovement.movement_type == MovementType.OUT_USAGE,
                InventoryMovement.created_at >= thirty_days_ago
            )
        ).scalar()

        if avg_daily_usage and avg_daily_usage > 0:
            days_of_supply = int(product.current_stock / avg_daily_usage)

        alerts.append(LowStockAlert(
            product_id=product.id,
            product_name=product.name,
            current_stock=product.current_stock,
            minimum_stock=product.minimum_stock,
            category_name=product.category.name if product.category else "Sin categoría",
            unit_type=product.unit_type,
            days_of_supply=days_of_supply
        ))

    return alerts
