"""Inventory helper functions."""
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.inventory import InventoryProduct, InventoryAlert


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
