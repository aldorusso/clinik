"""
Endpoints para la gestión del sistema de inventario médico
"""

from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func

from app.core.security import get_current_active_user as get_current_user, get_current_tenant_admin
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import (
    InventoryCategory, InventoryProduct, InventoryMovement, 
    ServiceProduct, AppointmentInventoryUsage, InventoryAlert,
    MovementType, UnitType
)
from app.schemas.inventory import (
    InventoryCategory as InventoryCategorySchema,
    InventoryCategoryCreate, InventoryCategoryUpdate,
    InventoryProduct as InventoryProductSchema,
    InventoryProductCreate, InventoryProductUpdate,
    InventoryProductStockUpdate, InventoryProductWithStats,
    InventoryMovement as InventoryMovementSchema,
    InventoryMovementCreate,
    ServiceProduct as ServiceProductSchema,
    ServiceProductCreate, ServiceProductUpdate,
    AppointmentInventoryUsage as AppointmentInventoryUsageSchema,
    AppointmentInventoryUsageCreate, AppointmentInventoryUsageUpdate,
    InventoryAlert as InventoryAlertSchema,
    InventoryStats, LowStockAlert, ProductUsageReport,
    BulkStockUpdate
)

router = APIRouter()


# ===================
# INVENTORY CATEGORIES
# ===================

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
        InventoryCategory.tenant_id == current_user.tenant_id
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
            InventoryCategory.tenant_id == current_user.tenant_id,
            InventoryCategory.name == category.name
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe una categoría con el nombre '{category.name}'"
        )
    
    db_category = InventoryCategory(
        tenant_id=current_user.tenant_id,
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
            InventoryCategory.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Verificar nombre único si se está cambiando
    if category.name and category.name != db_category.name:
        existing = db.query(InventoryCategory).filter(
            and_(
                InventoryCategory.tenant_id == current_user.tenant_id,
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


# ===================
# INVENTORY PRODUCTS
# ===================

@router.get("/products/", response_model=List[InventoryProductWithStats])
async def get_inventory_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    low_stock_only: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener productos del inventario con estadísticas"""
    
    query = db.query(InventoryProduct).options(
        joinedload(InventoryProduct.category)
    ).filter(
        InventoryProduct.tenant_id == current_user.tenant_id
    )
    
    if category_id:
        query = query.filter(InventoryProduct.category_id == category_id)
    
    if is_active is not None:
        query = query.filter(InventoryProduct.is_active == is_active)
    
    if low_stock_only:
        query = query.filter(InventoryProduct.current_stock <= InventoryProduct.minimum_stock)
    
    if search:
        query = query.filter(
            or_(
                InventoryProduct.name.icontains(search),
                InventoryProduct.description.icontains(search),
                InventoryProduct.sku.icontains(search),
                InventoryProduct.barcode.icontains(search)
            )
        )
    
    products = query.order_by(InventoryProduct.name).offset(skip).limit(limit).all()
    
    # Agregar estadísticas a cada producto
    products_with_stats = []
    for product in products:
        # Calcular estadísticas adicionales
        total_movements = db.query(func.count(InventoryMovement.id)).filter(
            InventoryMovement.product_id == product.id
        ).scalar() or 0
        
        last_movement = db.query(InventoryMovement).filter(
            InventoryMovement.product_id == product.id
        ).order_by(desc(InventoryMovement.created_at)).first()
        
        # Uso en el mes actual
        current_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        total_used_this_month = db.query(func.sum(InventoryMovement.quantity)).filter(
            and_(
                InventoryMovement.product_id == product.id,
                InventoryMovement.movement_type.in_([MovementType.OUT_USAGE]),
                InventoryMovement.created_at >= current_month
            )
        ).scalar() or 0

        # Días hasta vencimiento
        days_until_expiry = None
        if product.expiration_date:
            # Make sure both datetimes are timezone-aware
            now = datetime.now(timezone.utc)
            exp_date = product.expiration_date
            if exp_date.tzinfo is None:
                exp_date = exp_date.replace(tzinfo=timezone.utc)
            days_until_expiry = (exp_date - now).days
        
        # Crear el producto con estadísticas
        product_dict = {
            **{k: v for k, v in product.__dict__.items() if not k.startswith('_')},
            'is_low_stock': product.is_low_stock,
            'stock_percentage': product.stock_percentage,
            'total_movements': total_movements,
            'last_movement_date': last_movement.created_at if last_movement else None,
            'total_used_this_month': abs(total_used_this_month),
            'days_until_expiry': days_until_expiry
        }

        products_with_stats.append(InventoryProductWithStats(**product_dict))
    
    return products_with_stats


@router.get("/products/{product_id}", response_model=InventoryProductWithStats)
async def get_inventory_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener un producto específico del inventario"""
    
    product = db.query(InventoryProduct).options(
        joinedload(InventoryProduct.category)
    ).filter(
        and_(
            InventoryProduct.id == product_id,
            InventoryProduct.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Calcular estadísticas
    total_movements = db.query(func.count(InventoryMovement.id)).filter(
        InventoryMovement.product_id == product.id
    ).scalar() or 0
    
    last_movement = db.query(InventoryMovement).filter(
        InventoryMovement.product_id == product.id
    ).order_by(desc(InventoryMovement.created_at)).first()
    
    current_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    total_used_this_month = db.query(func.sum(InventoryMovement.quantity)).filter(
        and_(
            InventoryMovement.product_id == product.id,
            InventoryMovement.movement_type.in_([MovementType.OUT_USAGE]),
            InventoryMovement.created_at >= current_month
        )
    ).scalar() or 0

    days_until_expiry = None
    if product.expiration_date:
        # Make sure both datetimes are timezone-aware
        now = datetime.now(timezone.utc)
        exp_date = product.expiration_date
        if exp_date.tzinfo is None:
            exp_date = exp_date.replace(tzinfo=timezone.utc)
        days_until_expiry = (exp_date - now).days

    product_dict = {
        **{k: v for k, v in product.__dict__.items() if not k.startswith('_')},
        'is_low_stock': product.is_low_stock,
        'stock_percentage': product.stock_percentage,
        'total_movements': total_movements,
        'last_movement_date': last_movement.created_at if last_movement else None,
        'total_used_this_month': abs(total_used_this_month),
        'days_until_expiry': days_until_expiry
    }

    return InventoryProductWithStats(**product_dict)


@router.post("/products/", response_model=InventoryProductSchema)
async def create_inventory_product(
    product: InventoryProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Crear nuevo producto de inventario (solo admin)"""
    
    # Verificar que la categoría existe y pertenece al tenant
    category = db.query(InventoryCategory).filter(
        and_(
            InventoryCategory.id == product.category_id,
            InventoryCategory.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not category:
        raise HTTPException(status_code=400, detail="Categoría no válida")
    
    # Verificar SKU único si se proporciona
    if product.sku:
        existing_sku = db.query(InventoryProduct).filter(
            and_(
                InventoryProduct.tenant_id == current_user.tenant_id,
                InventoryProduct.sku == product.sku
            )
        ).first()
        
        if existing_sku:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un producto con el SKU '{product.sku}'"
            )
    
    db_product = InventoryProduct(
        tenant_id=current_user.tenant_id,
        **product.model_dump()
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Crear movimiento inicial de entrada si hay stock
    if db_product.current_stock > 0:
        movement = InventoryMovement(
            tenant_id=current_user.tenant_id,
            product_id=db_product.id,
            movement_type=MovementType.IN_ADJUSTMENT,
            quantity=db_product.current_stock,
            unit_cost=product.cost_per_unit,
            total_cost=product.cost_per_unit * db_product.current_stock if product.cost_per_unit else None,
            user_id=current_user.id,
            stock_after=db_product.current_stock,
            notes="Stock inicial"
        )
        db.add(movement)
        db.commit()
    
    return db_product


@router.put("/products/{product_id}", response_model=InventoryProductSchema)
async def update_inventory_product(
    product_id: str,
    product: InventoryProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """Actualizar producto de inventario"""
    
    db_product = db.query(InventoryProduct).filter(
        and_(
            InventoryProduct.id == product_id,
            InventoryProduct.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar categoría si se está cambiando
    if product.category_id:
        category = db.query(InventoryCategory).filter(
            and_(
                InventoryCategory.id == product.category_id,
                InventoryCategory.tenant_id == current_user.tenant_id
            )
        ).first()
        
        if not category:
            raise HTTPException(status_code=400, detail="Categoría no válida")
    
    # Verificar SKU único si se está cambiando
    if product.sku and product.sku != db_product.sku:
        existing_sku = db.query(InventoryProduct).filter(
            and_(
                InventoryProduct.tenant_id == current_user.tenant_id,
                InventoryProduct.sku == product.sku,
                InventoryProduct.id != product_id
            )
        ).first()
        
        if existing_sku:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un producto con el SKU '{product.sku}'"
            )
    
    # Actualizar campos
    for field, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/products/{product_id}/stock", response_model=InventoryProductSchema)
async def update_product_stock(
    product_id: str,
    stock_update: InventoryProductStockUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)  # TODO: Add manager support
):
    """Actualizar stock de un producto y crear movimiento"""
    
    db_product = db.query(InventoryProduct).filter(
        and_(
            InventoryProduct.id == product_id,
            InventoryProduct.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Calcular la diferencia de stock
    old_stock = db_product.current_stock
    new_stock = stock_update.current_stock
    quantity_change = new_stock - old_stock
    
    if quantity_change == 0:
        raise HTTPException(status_code=400, detail="El stock no ha cambiado")
    
    # Actualizar stock del producto
    db_product.current_stock = new_stock
    
    # Actualizar fecha de restock si es una entrada
    if quantity_change > 0 and stock_update.movement_type in [MovementType.IN_PURCHASE, MovementType.IN_DONATION, MovementType.IN_RETURN]:
        db_product.last_restock_date = datetime.now()
    
    # Crear movimiento de inventario
    movement = InventoryMovement(
        tenant_id=current_user.tenant_id,
        product_id=product_id,
        movement_type=stock_update.movement_type,
        quantity=quantity_change,
        unit_cost=stock_update.unit_cost,
        total_cost=stock_update.unit_cost * abs(quantity_change) if stock_update.unit_cost else None,
        user_id=current_user.id,
        stock_after=new_stock,
        notes=stock_update.notes,
        reference_number=stock_update.reference_number,
        supplier=stock_update.supplier
    )
    
    db.add(movement)
    db.commit()
    db.refresh(db_product)
    
    # Verificar alertas en segundo plano
    background_tasks.add_task(check_and_create_alerts, db, db_product)
    
    return db_product


# ===================
# INVENTORY MOVEMENTS
# ===================

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
        InventoryMovement.tenant_id == current_user.tenant_id
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


# ===================
# ALERTAS DE INVENTARIO
# ===================

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
        InventoryAlert.tenant_id == current_user.tenant_id
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
            InventoryAlert.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    
    alert.is_acknowledged = True
    alert.acknowledged_by_id = current_user.id
    alert.acknowledged_at = datetime.now()
    
    db.commit()
    return {"message": "Alerta reconocida exitosamente"}


# ===================
# ESTADÍSTICAS
# ===================

@router.get("/stats/", response_model=InventoryStats)
async def get_inventory_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas del inventario"""
    
    # Estadísticas básicas
    total_products = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.tenant_id,
            InventoryProduct.is_active == True
        )
    ).scalar() or 0
    
    total_categories = db.query(func.count(InventoryCategory.id)).filter(
        and_(
            InventoryCategory.tenant_id == current_user.tenant_id,
            InventoryCategory.is_active == True
        )
    ).scalar() or 0
    
    products_low_stock = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.tenant_id,
            InventoryProduct.current_stock <= InventoryProduct.minimum_stock,
            InventoryProduct.is_active == True
        )
    ).scalar() or 0
    
    products_out_of_stock = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.tenant_id,
            InventoryProduct.current_stock == 0,
            InventoryProduct.is_active == True
        )
    ).scalar() or 0
    
    # Productos vencidos y por vencer
    now = datetime.now()
    next_week = now + timedelta(days=7)
    
    products_expired = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.tenant_id,
            InventoryProduct.expiration_date < now,
            InventoryProduct.is_active == True
        )
    ).scalar() or 0
    
    products_expiring_soon = db.query(func.count(InventoryProduct.id)).filter(
        and_(
            InventoryProduct.tenant_id == current_user.tenant_id,
            InventoryProduct.expiration_date.between(now, next_week),
            InventoryProduct.is_active == True
        )
    ).scalar() or 0
    
    # Valor total del inventario
    total_inventory_value = db.query(
        func.sum(InventoryProduct.current_stock * InventoryProduct.cost_per_unit)
    ).filter(
        and_(
            InventoryProduct.tenant_id == current_user.tenant_id,
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
            InventoryProduct.tenant_id == current_user.tenant_id,
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
        InventoryMovement.tenant_id == current_user.tenant_id
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
            InventoryProduct.tenant_id == current_user.tenant_id,
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


# ===================
# FUNCIONES AUXILIARES
# ===================

async def check_and_create_alerts(db: Session, product: InventoryProduct):
    """Verificar y crear alertas para un producto"""
    
    # Verificar stock bajo
    if product.current_stock <= product.minimum_stock:
        # Verificar si ya existe una alerta activa
        existing_alert = db.query(InventoryAlert).filter(
            and_(
                InventoryAlert.product_id == product.id,
                InventoryAlert.alert_type == "low_stock",
                InventoryAlert.is_active == True,
                InventoryAlert.is_acknowledged == False
            )
        ).first()
        
        if not existing_alert:
            alert = InventoryAlert(
                tenant_id=product.tenant_id,
                product_id=product.id,
                alert_type="low_stock",
                title=f"Stock bajo: {product.name}",
                message=f"El producto '{product.name}' tiene stock bajo ({product.current_stock} {product.unit_type}). Stock mínimo: {product.minimum_stock} {product.unit_type}."
            )
            db.add(alert)
    
    # Verificar stock agotado
    if product.current_stock == 0:
        existing_alert = db.query(InventoryAlert).filter(
            and_(
                InventoryAlert.product_id == product.id,
                InventoryAlert.alert_type == "out_of_stock",
                InventoryAlert.is_active == True,
                InventoryAlert.is_acknowledged == False
            )
        ).first()
        
        if not existing_alert:
            alert = InventoryAlert(
                tenant_id=product.tenant_id,
                product_id=product.id,
                alert_type="out_of_stock",
                title=f"Sin stock: {product.name}",
                message=f"El producto '{product.name}' se ha agotado completamente."
            )
            db.add(alert)
    
    # Verificar próximo a vencer (7 días)
    if product.expiration_date:
        days_until_expiry = (product.expiration_date - datetime.now()).days
        
        if days_until_expiry <= 7 and days_until_expiry > 0:
            existing_alert = db.query(InventoryAlert).filter(
                and_(
                    InventoryAlert.product_id == product.id,
                    InventoryAlert.alert_type == "expiring_soon",
                    InventoryAlert.is_active == True,
                    InventoryAlert.is_acknowledged == False
                )
            ).first()
            
            if not existing_alert:
                alert = InventoryAlert(
                    tenant_id=product.tenant_id,
                    product_id=product.id,
                    alert_type="expiring_soon",
                    title=f"Próximo a vencer: {product.name}",
                    message=f"El producto '{product.name}' vence en {days_until_expiry} días ({product.expiration_date.strftime('%Y-%m-%d')})."
                )
                db.add(alert)
        
        # Verificar vencido
        elif days_until_expiry <= 0:
            existing_alert = db.query(InventoryAlert).filter(
                and_(
                    InventoryAlert.product_id == product.id,
                    InventoryAlert.alert_type == "expired",
                    InventoryAlert.is_active == True,
                    InventoryAlert.is_acknowledged == False
                )
            ).first()
            
            if not existing_alert:
                alert = InventoryAlert(
                    tenant_id=product.tenant_id,
                    product_id=product.id,
                    alert_type="expired",
                    title=f"Vencido: {product.name}",
                    message=f"El producto '{product.name}' está vencido desde el {product.expiration_date.strftime('%Y-%m-%d')}."
                )
                db.add(alert)
    
    db.commit()