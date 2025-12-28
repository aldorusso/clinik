"""Appointment inventory usage endpoints - CRUD for inventory usage in appointments."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.core.security import get_current_active_user as get_current_user, get_current_tenant_admin
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import (
    InventoryProduct, InventoryMovement,
    AppointmentInventoryUsage, MovementType
)
from app.models.appointment import Appointment
from app.schemas.inventory import (
    AppointmentInventoryUsage as AppointmentInventoryUsageSchema,
    AppointmentInventoryUsageCreate, AppointmentInventoryUsageUpdate
)

router = APIRouter()


@router.get("/appointments/{appointment_id}/usage/", response_model=List[AppointmentInventoryUsageSchema])
async def get_appointment_inventory_usage(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener el uso de inventario de una cita específica"""
    appointment = db.query(Appointment).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

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
    appointment = db.query(Appointment).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if current_user.role not in ['tenant_admin', 'manager'] and appointment.medic_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No tiene permisos para registrar uso de inventario en esta cita"
        )

    product = db.query(InventoryProduct).filter(
        and_(
            InventoryProduct.id == usage.product_id,
            InventoryProduct.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if product.current_stock < usage.quantity_used:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente. Disponible: {product.current_stock} {product.unit_type}, Solicitado: {usage.quantity_used} {product.unit_type}"
        )

    db_usage = AppointmentInventoryUsage(
        tenant_id=current_user.current_tenant_id,
        appointment_id=appointment_id,
        product_id=usage.product_id,
        quantity_used=usage.quantity_used,
        notes=usage.notes,
        recorded_by_id=current_user.id
    )
    db.add(db_usage)

    product.current_stock -= usage.quantity_used

    movement = InventoryMovement(
        tenant_id=current_user.current_tenant_id,
        product_id=usage.product_id,
        movement_type=MovementType.OUT_USAGE,
        quantity=-usage.quantity_used,
        appointment_id=appointment_id,
        user_id=current_user.id,
        stock_after=product.current_stock,
        notes=f"Usado en cita - {usage.notes}" if usage.notes else "Usado en cita médica"
    )
    db.add(movement)

    db.commit()
    db.refresh(db_usage)

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
    current_user: User = Depends(get_current_tenant_admin)
):
    """Actualizar registro de uso de inventario (solo admin/manager)"""
    db_usage = db.query(AppointmentInventoryUsage).filter(
        and_(
            AppointmentInventoryUsage.id == usage_id,
            AppointmentInventoryUsage.appointment_id == appointment_id,
            AppointmentInventoryUsage.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not db_usage:
        raise HTTPException(status_code=404, detail="Registro de uso no encontrado")

    product = db.query(InventoryProduct).filter(
        InventoryProduct.id == db_usage.product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if usage_update.quantity_used is not None and usage_update.quantity_used != db_usage.quantity_used:
        old_quantity = db_usage.quantity_used
        new_quantity = usage_update.quantity_used
        quantity_difference = new_quantity - old_quantity

        if quantity_difference > 0 and product.current_stock < quantity_difference:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para el ajuste. Disponible: {product.current_stock} {product.unit_type}"
            )

        product.current_stock -= quantity_difference

        movement = InventoryMovement(
            tenant_id=current_user.current_tenant_id,
            product_id=db_usage.product_id,
            movement_type=MovementType.OUT_ADJUSTMENT if quantity_difference > 0 else MovementType.IN_ADJUSTMENT,
            quantity=-quantity_difference,
            appointment_id=appointment_id,
            user_id=current_user.id,
            stock_after=product.current_stock,
            notes=f"Ajuste de uso en cita (anterior: {old_quantity}, nuevo: {new_quantity})"
        )
        db.add(movement)

        db_usage.quantity_used = new_quantity

        from app.api.v1.inventory import check_and_create_alerts
        background_tasks.add_task(check_and_create_alerts, db, product)

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
    current_user: User = Depends(get_current_tenant_admin)
):
    """Eliminar registro de uso de inventario y restaurar stock"""
    db_usage = db.query(AppointmentInventoryUsage).filter(
        and_(
            AppointmentInventoryUsage.id == usage_id,
            AppointmentInventoryUsage.appointment_id == appointment_id,
            AppointmentInventoryUsage.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not db_usage:
        raise HTTPException(status_code=404, detail="Registro de uso no encontrado")

    product = db.query(InventoryProduct).filter(
        InventoryProduct.id == db_usage.product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    product.current_stock += db_usage.quantity_used

    movement = InventoryMovement(
        tenant_id=current_user.current_tenant_id,
        product_id=db_usage.product_id,
        movement_type=MovementType.IN_RETURN,
        quantity=db_usage.quantity_used,
        appointment_id=appointment_id,
        user_id=current_user.id,
        stock_after=product.current_stock,
        notes=f"Reversión de uso registrado en cita (cantidad: {db_usage.quantity_used})"
    )
    db.add(movement)

    db.delete(db_usage)

    db.commit()

    return {"message": "Registro de uso eliminado y stock restaurado exitosamente"}
