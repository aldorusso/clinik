"""
Endpoints para el uso de inventario en citas médicas
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func

from app.core.security import get_current_active_user as get_current_user, get_current_tenant_admin
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import (
    InventoryProduct, InventoryMovement, ServiceProduct, 
    AppointmentInventoryUsage, MovementType
)
from app.models.appointment import Appointment
from app.models.service import Service
from app.schemas.inventory import (
    ServiceProduct as ServiceProductSchema,
    ServiceProductCreate, ServiceProductUpdate,
    AppointmentInventoryUsage as AppointmentInventoryUsageSchema,
    AppointmentInventoryUsageCreate, AppointmentInventoryUsageUpdate
)

router = APIRouter()


# ===================
# SERVICE PRODUCTS (Productos por servicio)
# ===================

@router.get("/services/{service_id}/products/", response_model=List[ServiceProductSchema])
async def get_service_products(
    service_id: str,
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener productos asociados a un servicio"""
    
    # Verificar que el servicio existe y pertenece al tenant
    service = db.query(Service).filter(
        and_(
            Service.id == service_id,
            Service.tenant_id == current_user.tenant_id
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
    
    service_products = query.order_by(ServiceProduct.is_required.desc(), ServiceProduct.default_quantity.desc()).all()
    return service_products


@router.post("/services/{service_id}/products/", response_model=ServiceProductSchema)
async def add_product_to_service(
    service_id: str,
    service_product: ServiceProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)  # TODO: Add manager support
):
    """Asociar un producto a un servicio"""
    
    # Verificar que el servicio existe y pertenece al tenant
    service = db.query(Service).filter(
        and_(
            Service.id == service_id,
            Service.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Verificar que el producto existe y pertenece al tenant
    product = db.query(InventoryProduct).filter(
        and_(
            InventoryProduct.id == service_product.product_id,
            InventoryProduct.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar que no existe ya esta asociación
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
    
    # Crear la asociación
    db_service_product = ServiceProduct(
        tenant_id=current_user.tenant_id,
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
    current_user: User = Depends(get_current_tenant_admin)  # TODO: Add manager support
):
    """Actualizar la asociación producto-servicio"""
    
    service_product = db.query(ServiceProduct).filter(
        and_(
            ServiceProduct.service_id == service_id,
            ServiceProduct.product_id == product_id,
            ServiceProduct.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not service_product:
        raise HTTPException(status_code=404, detail="Asociación producto-servicio no encontrada")
    
    # Actualizar campos
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
    current_user: User = Depends(get_current_tenant_admin)  # TODO: Add manager support
):
    """Remover un producto de un servicio"""
    
    service_product = db.query(ServiceProduct).filter(
        and_(
            ServiceProduct.service_id == service_id,
            ServiceProduct.product_id == product_id,
            ServiceProduct.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not service_product:
        raise HTTPException(status_code=404, detail="Asociación producto-servicio no encontrada")
    
    db.delete(service_product)
    db.commit()
    
    return {"message": "Producto removido del servicio exitosamente"}


# ===================
# APPOINTMENT INVENTORY USAGE (Uso en citas)
# ===================

@router.get("/appointments/{appointment_id}/usage/", response_model=List[AppointmentInventoryUsageSchema])
async def get_appointment_inventory_usage(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener el uso de inventario de una cita específica"""
    
    # Verificar que la cita existe y el usuario tiene acceso
    appointment = db.query(Appointment).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Verificar permisos: admin, manager, o doctor asignado a la cita
    if current_user.role not in ['tenant_admin', 'manager'] and appointment.medic_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver esta información")
    
    usage = db.query(AppointmentInventoryUsage).options(
        joinedload(AppointmentInventoryUsage.product).joinedload(InventoryProduct.category)
    ).filter(
        AppointmentInventoryUsage.appointment_id == appointment_id
    ).order_by(AppointmentInventoryUsage.created_at).all()
    
    return usage


@router.post("/appointments/{appointment_id}/usage/", response_model=AppointmentInventoryUsageSchema)
async def record_inventory_usage(
    appointment_id: str,
    usage: AppointmentInventoryUsageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registrar uso de inventario en una cita (solo médicos y admins)"""
    
    # Verificar que la cita existe y el usuario tiene acceso
    appointment = db.query(Appointment).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Verificar permisos: admin, manager, o doctor asignado a la cita
    if current_user.role not in ['tenant_admin', 'manager'] and appointment.medic_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para registrar uso de inventario en esta cita")
    
    # Verificar que el producto existe y pertenece al tenant
    product = db.query(InventoryProduct).filter(
        and_(
            InventoryProduct.id == usage.product_id,
            InventoryProduct.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar que hay suficiente stock
    if product.current_stock < usage.quantity_used:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente. Disponible: {product.current_stock} {product.unit_type}, Solicitado: {usage.quantity_used} {product.unit_type}"
        )
    
    # Registrar el uso
    db_usage = AppointmentInventoryUsage(
        tenant_id=current_user.tenant_id,
        appointment_id=appointment_id,
        product_id=usage.product_id,
        quantity_used=usage.quantity_used,
        notes=usage.notes,
        recorded_by_id=current_user.id
    )
    db.add(db_usage)
    
    # Descontar del inventario
    product.current_stock -= usage.quantity_used
    
    # Crear movimiento de inventario
    movement = InventoryMovement(
        tenant_id=current_user.tenant_id,
        product_id=usage.product_id,
        movement_type=MovementType.OUT_USAGE,
        quantity=-usage.quantity_used,  # Negativo porque es salida
        appointment_id=appointment_id,
        user_id=current_user.id,
        stock_after=product.current_stock,
        notes=f"Usado en cita - {usage.notes}" if usage.notes else "Usado en cita médica"
    )
    db.add(movement)
    
    db.commit()
    db.refresh(db_usage)
    
    # Verificar alertas en segundo plano
    from app.api.v1.inventory import check_and_create_alerts
    background_tasks.add_task(check_and_create_alerts, db, product)
    
    return db_usage


@router.put("/appointments/{appointment_id}/usage/{usage_id}", response_model=AppointmentInventoryUsageSchema)
async def update_inventory_usage(
    appointment_id: str,
    usage_id: str,
    usage_update: AppointmentInventoryUsageUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)  # TODO: Add manager support
):
    """Actualizar registro de uso de inventario (solo admin/manager)"""
    
    # Buscar el uso existente
    db_usage = db.query(AppointmentInventoryUsage).filter(
        and_(
            AppointmentInventoryUsage.id == usage_id,
            AppointmentInventoryUsage.appointment_id == appointment_id,
            AppointmentInventoryUsage.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not db_usage:
        raise HTTPException(status_code=404, detail="Registro de uso no encontrado")
    
    # Obtener el producto
    product = db.query(InventoryProduct).filter(
        InventoryProduct.id == db_usage.product_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Si se está actualizando la cantidad, ajustar el inventario
    if usage_update.quantity_used is not None and usage_update.quantity_used != db_usage.quantity_used:
        old_quantity = db_usage.quantity_used
        new_quantity = usage_update.quantity_used
        quantity_difference = new_quantity - old_quantity
        
        # Verificar que hay suficiente stock para el ajuste
        if quantity_difference > 0 and product.current_stock < quantity_difference:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para el ajuste. Disponible: {product.current_stock} {product.unit_type}"
            )
        
        # Ajustar inventario
        product.current_stock -= quantity_difference
        
        # Crear movimiento de ajuste
        movement = InventoryMovement(
            tenant_id=current_user.tenant_id,
            product_id=db_usage.product_id,
            movement_type=MovementType.OUT_ADJUSTMENT if quantity_difference > 0 else MovementType.IN_ADJUSTMENT,
            quantity=-quantity_difference,  # Negativo si es salida adicional
            appointment_id=appointment_id,
            user_id=current_user.id,
            stock_after=product.current_stock,
            notes=f"Ajuste de uso en cita (anterior: {old_quantity}, nuevo: {new_quantity})"
        )
        db.add(movement)
        
        # Actualizar el registro
        db_usage.quantity_used = new_quantity
        
        # Verificar alertas
        from app.api.v1.inventory import check_and_create_alerts
        background_tasks.add_task(check_and_create_alerts, db, product)
    
    # Actualizar notas si se proporcionan
    if usage_update.notes is not None:
        db_usage.notes = usage_update.notes
    
    db.commit()
    db.refresh(db_usage)
    
    return db_usage


@router.delete("/appointments/{appointment_id}/usage/{usage_id}")
async def delete_inventory_usage(
    appointment_id: str,
    usage_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)  # TODO: Add manager support
):
    """Eliminar registro de uso de inventario y restaurar stock"""
    
    # Buscar el uso existente
    db_usage = db.query(AppointmentInventoryUsage).filter(
        and_(
            AppointmentInventoryUsage.id == usage_id,
            AppointmentInventoryUsage.appointment_id == appointment_id,
            AppointmentInventoryUsage.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not db_usage:
        raise HTTPException(status_code=404, detail="Registro de uso no encontrado")
    
    # Obtener el producto
    product = db.query(InventoryProduct).filter(
        InventoryProduct.id == db_usage.product_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Restaurar stock
    product.current_stock += db_usage.quantity_used
    
    # Crear movimiento de reversión
    movement = InventoryMovement(
        tenant_id=current_user.tenant_id,
        product_id=db_usage.product_id,
        movement_type=MovementType.IN_RETURN,
        quantity=db_usage.quantity_used,
        appointment_id=appointment_id,
        user_id=current_user.id,
        stock_after=product.current_stock,
        notes=f"Reversión de uso registrado en cita (cantidad: {db_usage.quantity_used})"
    )
    db.add(movement)
    
    # Eliminar el registro
    db.delete(db_usage)
    
    db.commit()
    
    return {"message": "Registro de uso eliminado y stock restaurado exitosamente"}


# ===================
# ENDPOINTS AUTOMÁTICOS
# ===================

@router.post("/appointments/{appointment_id}/auto-consume/")
async def auto_consume_service_products(
    appointment_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Consumir automáticamente productos asociados al servicio de la cita"""
    
    # Verificar que la cita existe
    appointment = db.query(Appointment).options(
        joinedload(Appointment.service)
    ).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Verificar permisos
    if current_user.role not in ['tenant_admin', 'manager'] and appointment.medic_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para esta acción")
    
    if not appointment.service:
        raise HTTPException(status_code=400, detail="La cita no tiene un servicio asociado")
    
    # Obtener productos del servicio
    service_products = db.query(ServiceProduct).options(
        joinedload(ServiceProduct.product)
    ).filter(
        and_(
            ServiceProduct.service_id == appointment.service_id,
            ServiceProduct.is_active == True
        )
    ).all()
    
    if not service_products:
        return {"message": "No hay productos asociados al servicio", "consumed_products": []}
    
    consumed_products = []
    insufficient_stock = []
    
    for service_product in service_products:
        product = service_product.product
        quantity_needed = service_product.default_quantity
        
        # Verificar stock
        if product.current_stock >= quantity_needed:
            # Verificar si ya se registró uso de este producto
            existing_usage = db.query(AppointmentInventoryUsage).filter(
                and_(
                    AppointmentInventoryUsage.appointment_id == appointment_id,
                    AppointmentInventoryUsage.product_id == product.id
                )
            ).first()
            
            if existing_usage:
                # Actualizar cantidad si es necesario
                if existing_usage.quantity_used < quantity_needed:
                    additional_quantity = quantity_needed - existing_usage.quantity_used
                    if product.current_stock >= additional_quantity:
                        existing_usage.quantity_used = quantity_needed
                        product.current_stock -= additional_quantity
                        
                        # Crear movimiento
                        movement = InventoryMovement(
                            tenant_id=current_user.tenant_id,
                            product_id=product.id,
                            movement_type=MovementType.OUT_USAGE,
                            quantity=-additional_quantity,
                            appointment_id=appointment_id,
                            user_id=current_user.id,
                            stock_after=product.current_stock,
                            notes=f"Consumo automático adicional - {appointment.service.name}"
                        )
                        db.add(movement)
                        
                        consumed_products.append({
                            "product_name": product.name,
                            "quantity": additional_quantity,
                            "action": "updated"
                        })
                else:
                    consumed_products.append({
                        "product_name": product.name,
                        "quantity": 0,
                        "action": "already_consumed"
                    })
            else:
                # Crear nuevo registro de uso
                usage = AppointmentInventoryUsage(
                    tenant_id=current_user.tenant_id,
                    appointment_id=appointment_id,
                    product_id=product.id,
                    quantity_used=quantity_needed,
                    notes=f"Consumo automático - {appointment.service.name}",
                    recorded_by_id=current_user.id
                )
                db.add(usage)
                
                # Descontar stock
                product.current_stock -= quantity_needed
                
                # Crear movimiento
                movement = InventoryMovement(
                    tenant_id=current_user.tenant_id,
                    product_id=product.id,
                    movement_type=MovementType.OUT_USAGE,
                    quantity=-quantity_needed,
                    appointment_id=appointment_id,
                    user_id=current_user.id,
                    stock_after=product.current_stock,
                    notes=f"Consumo automático - {appointment.service.name}"
                )
                db.add(movement)
                
                consumed_products.append({
                    "product_name": product.name,
                    "quantity": quantity_needed,
                    "action": "consumed"
                })
                
                # Verificar alertas
                from app.api.v1.inventory import check_and_create_alerts
                background_tasks.add_task(check_and_create_alerts, db, product)
        else:
            insufficient_stock.append({
                "product_name": product.name,
                "requested": quantity_needed,
                "available": product.current_stock,
                "unit_type": product.unit_type
            })
    
    db.commit()
    
    response = {
        "message": "Consumo automático completado",
        "consumed_products": consumed_products
    }
    
    if insufficient_stock:
        response["insufficient_stock"] = insufficient_stock
        response["warning"] = "Algunos productos no pudieron ser consumidos por stock insuficiente"
    
    return response