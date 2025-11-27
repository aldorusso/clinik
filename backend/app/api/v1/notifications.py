"""
Notifications API Endpoints

Este módulo maneja todos los endpoints relacionados con notificaciones in-app.
Las notificaciones informan a los usuarios sobre eventos importantes en el sistema.

Endpoints disponibles:
- GET /api/v1/notifications - Lista las notificaciones del usuario actual con paginación
- GET /api/v1/notifications/count - Obtiene el contador de notificaciones no leídas (para el badge)
- PATCH /api/v1/notifications/{notification_id}/read - Marca una notificación como leída
- POST /api/v1/notifications/mark-all-read - Marca todas las notificaciones como leídas

Todos los endpoints requieren autenticación y solo permiten acceso a las notificaciones
del usuario autenticado (aislamiento de datos).
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import (
    Notification as NotificationSchema,
    NotificationCount,
    NotificationList,
    NotificationUpdate
)
from app.core.notifications import (
    mark_notification_as_read,
    mark_all_as_read,
    get_unread_count
)

router = APIRouter()


@router.get("/", response_model=NotificationList)
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene la lista de notificaciones del usuario actual.

    Este endpoint retorna las notificaciones del usuario autenticado, ordenadas
    por fecha de creación (más recientes primero).

    Args:
        skip: Número de notificaciones a omitir (para paginación). Default: 0
        limit: Número máximo de notificaciones a retornar. Default: 20, Max: 100
        unread_only: Si es True, solo retorna notificaciones no leídas. Default: False
        db: Sesión de base de datos (inyectada)
        current_user: Usuario autenticado (inyectado)

    Returns:
        NotificationList: Objeto con las notificaciones, total y contador de no leídas
        {
            "notifications": [...],
            "total": 25,
            "unread_count": 5
        }

    Ejemplo de uso desde frontend:
        ```javascript
        // Obtener las primeras 20 notificaciones
        const response = await fetch('/api/v1/notifications?skip=0&limit=20');
        const data = await response.json();

        // Obtener solo las no leídas
        const unread = await fetch('/api/v1/notifications?unread_only=true');

        // Paginación
        const page2 = await fetch('/api/v1/notifications?skip=20&limit=20');
        ```

    Notas:
        - Solo se muestran las notificaciones del usuario autenticado
        - El límite máximo permitido es 100
        - Las notificaciones se ordenan por fecha descendente (más recientes primero)
    """
    # Validar límite máximo
    if limit > 100:
        limit = 100

    # Query base: notificaciones del usuario actual
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )

    # Filtrar solo no leídas si se solicita
    if unread_only:
        query = query.filter(Notification.is_read == False)

    # Obtener el total antes de aplicar paginación
    total = query.count()

    # Aplicar paginación y orden
    notifications = query.order_by(
        Notification.created_at.desc()
    ).offset(skip).limit(limit).all()

    # Obtener contador de no leídas
    unread_count = get_unread_count(db, current_user.id)

    return NotificationList(
        notifications=notifications,
        total=total,
        unread_count=unread_count
    )


@router.get("/count", response_model=NotificationCount)
async def get_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene el contador de notificaciones no leídas.

    Este endpoint es útil para el badge/campanita de notificaciones en el header.
    Es ligero y rápido, ideal para polling frecuente.

    Args:
        db: Sesión de base de datos (inyectada)
        current_user: Usuario autenticado (inyectado)

    Returns:
        NotificationCount: Objeto con el contador
        {
            "unread_count": 5
        }

    Ejemplo de uso desde frontend:
        ```javascript
        // Polling cada 30 segundos para actualizar el badge
        setInterval(async () => {
            const response = await fetch('/api/v1/notifications/count');
            const { unread_count } = await response.json();
            updateBadge(unread_count); // Actualizar el UI
        }, 30000);
        ```

    Notas:
        - Este endpoint es muy rápido gracias al índice en is_read
        - Ideal para actualizar el badge en tiempo real mediante polling
        - Solo cuenta las notificaciones del usuario autenticado
    """
    unread_count = get_unread_count(db, current_user.id)

    return NotificationCount(unread_count=unread_count)


@router.patch("/{notification_id}/read", response_model=NotificationSchema)
async def mark_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Marca una notificación específica como leída.

    Este endpoint se llama cuando el usuario hace click en una notificación
    o la visualiza en la lista.

    Args:
        notification_id: UUID de la notificación a marcar como leída
        db: Sesión de base de datos (inyectada)
        current_user: Usuario autenticado (inyectado)

    Returns:
        NotificationSchema: La notificación actualizada con is_read=True

    Raises:
        404: Si la notificación no existe o no pertenece al usuario actual

    Ejemplo de uso desde frontend:
        ```javascript
        // Al hacer click en una notificación
        async function handleNotificationClick(notificationId) {
            await fetch(`/api/v1/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });
            // Navegar a la URL de acción si existe
            if (notification.action_url) {
                router.push(notification.action_url);
            }
        }
        ```

    Seguridad:
        - Solo se permite marcar como leída las notificaciones del usuario autenticado
        - Si intentas acceder a una notificación de otro usuario, retorna 404
    """
    # Buscar la notificación
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    # Validar que existe
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )

    # IMPORTANTE: Validar que pertenece al usuario actual (seguridad)
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )

    # Marcar como leída usando la función helper
    updated_notification = mark_notification_as_read(db, notification)

    return updated_notification


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Marca todas las notificaciones del usuario como leídas.

    Este endpoint se llama cuando el usuario hace click en "Marcar todas como leídas"
    en el dropdown de notificaciones o en la página de notificaciones.

    Args:
        db: Sesión de base de datos (inyectada)
        current_user: Usuario autenticado (inyectado)

    Returns:
        dict: Mensaje de éxito con el número de notificaciones marcadas
        {
            "message": "5 notificaciones marcadas como leídas",
            "count": 5
        }

    Ejemplo de uso desde frontend:
        ```javascript
        // Botón "Marcar todas como leídas"
        async function handleMarkAllAsRead() {
            const response = await fetch('/api/v1/notifications/mark-all-read', {
                method: 'POST'
            });
            const data = await response.json();
            console.log(data.message); // "5 notificaciones marcadas como leídas"

            // Recargar la lista de notificaciones
            await fetchNotifications();
        }
        ```

    Notas:
        - Solo afecta las notificaciones del usuario autenticado
        - Es una operación atómica (todas se marcan en una sola transacción)
        - Si no hay notificaciones no leídas, retorna count=0
    """
    # Marcar todas como leídas usando la función helper
    count = mark_all_as_read(db, current_user.id)

    return {
        "message": f"{count} notificaciones marcadas como leídas",
        "count": count
    }


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Elimina una notificación específica.

    Este endpoint permite al usuario eliminar notificaciones que ya no quiere ver.

    Args:
        notification_id: UUID de la notificación a eliminar
        db: Sesión de base de datos (inyectada)
        current_user: Usuario autenticado (inyectado)

    Returns:
        dict: Mensaje de éxito
        {
            "message": "Notificación eliminada exitosamente"
        }

    Raises:
        404: Si la notificación no existe o no pertenece al usuario actual

    Ejemplo de uso desde frontend:
        ```javascript
        // Botón de eliminar en la notificación
        async function handleDeleteNotification(notificationId) {
            await fetch(`/api/v1/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            // Recargar la lista
            await fetchNotifications();
        }
        ```

    Seguridad:
        - Solo se permite eliminar las notificaciones del usuario autenticado
        - Si intentas eliminar una notificación de otro usuario, retorna 404
    """
    # Buscar la notificación
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    # Validar que existe
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )

    # IMPORTANTE: Validar que pertenece al usuario actual (seguridad)
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )

    # Eliminar la notificación
    db.delete(notification)
    db.commit()

    return {
        "message": "Notificación eliminada exitosamente"
    }
