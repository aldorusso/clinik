"""Auto consume endpoints - automatic consumption of service products."""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.core.security import get_current_active_user as get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.inventory import (
    InventoryMovement, ServiceProduct,
    AppointmentInventoryUsage, MovementType
)
from app.models.appointment import Appointment

router = APIRouter()


@router.post("/appointments/{appointment_id}/auto-consume/")
async def auto_consume_service_products(
    appointment_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Consumir automáticamente productos asociados al servicio de la cita"""
    appointment = db.query(Appointment).options(
        joinedload(Appointment.service)
    ).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.tenant_id == current_user.current_tenant_id
        )
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if current_user.role not in ['tenant_admin', 'manager'] and appointment.medic_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para esta acción")

    if not appointment.service:
        raise HTTPException(status_code=400, detail="La cita no tiene un servicio asociado")

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

        if product.current_stock >= quantity_needed:
            existing_usage = db.query(AppointmentInventoryUsage).filter(
                and_(
                    AppointmentInventoryUsage.appointment_id == appointment_id,
                    AppointmentInventoryUsage.product_id == product.id
                )
            ).first()

            if existing_usage:
                if existing_usage.quantity_used < quantity_needed:
                    additional_quantity = quantity_needed - existing_usage.quantity_used
                    if product.current_stock >= additional_quantity:
                        existing_usage.quantity_used = quantity_needed
                        product.current_stock -= additional_quantity

                        movement = InventoryMovement(
                            tenant_id=current_user.current_tenant_id,
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
                usage = AppointmentInventoryUsage(
                    tenant_id=current_user.current_tenant_id,
                    appointment_id=appointment_id,
                    product_id=product.id,
                    quantity_used=quantity_needed,
                    notes=f"Consumo automático - {appointment.service.name}",
                    recorded_by_id=current_user.id
                )
                db.add(usage)

                product.current_stock -= quantity_needed

                movement = InventoryMovement(
                    tenant_id=current_user.current_tenant_id,
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
