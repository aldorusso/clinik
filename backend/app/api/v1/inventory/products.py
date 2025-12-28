"""Inventory products endpoints."""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func

from app.core.security import get_current_active_user as get_current_user, get_current_tenant_admin
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import (
    InventoryCategory, InventoryProduct, InventoryMovement,
    MovementType
)
from app.schemas.inventory import (
    InventoryProduct as InventoryProductSchema,
    InventoryProductCreate, InventoryProductUpdate,
    InventoryProductStockUpdate, InventoryProductWithStats,
)
from .helpers import check_and_create_alerts

router = APIRouter()


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
        InventoryProduct.tenant_id == current_user.current_tenant_id
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
            InventoryProduct.tenant_id == current_user.current_tenant_id
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
            InventoryCategory.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not category:
        raise HTTPException(status_code=400, detail="Categoría no válida")

    # Verificar SKU único si se proporciona
    if product.sku:
        existing_sku = db.query(InventoryProduct).filter(
            and_(
                InventoryProduct.tenant_id == current_user.current_tenant_id,
                InventoryProduct.sku == product.sku
            )
        ).first()

        if existing_sku:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un producto con el SKU '{product.sku}'"
            )

    db_product = InventoryProduct(
        tenant_id=current_user.current_tenant_id,
        **product.model_dump()
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # Crear movimiento inicial de entrada si hay stock
    if db_product.current_stock > 0:
        movement = InventoryMovement(
            tenant_id=current_user.current_tenant_id,
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
            InventoryProduct.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Verificar categoría si se está cambiando
    if product.category_id:
        category = db.query(InventoryCategory).filter(
            and_(
                InventoryCategory.id == product.category_id,
                InventoryCategory.tenant_id == current_user.current_tenant_id
            )
        ).first()

        if not category:
            raise HTTPException(status_code=400, detail="Categoría no válida")

    # Verificar SKU único si se está cambiando
    if product.sku and product.sku != db_product.sku:
        existing_sku = db.query(InventoryProduct).filter(
            and_(
                InventoryProduct.tenant_id == current_user.current_tenant_id,
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
    current_user: User = Depends(get_current_tenant_admin)
):
    """Actualizar stock de un producto y crear movimiento"""

    db_product = db.query(InventoryProduct).filter(
        and_(
            InventoryProduct.id == product_id,
            InventoryProduct.tenant_id == current_user.current_tenant_id
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
        tenant_id=current_user.current_tenant_id,
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
