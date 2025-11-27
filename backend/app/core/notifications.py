"""
Notification Helper Functions

Funciones auxiliares para crear y gestionar notificaciones en el sistema.
Estas funciones simplifican la creación de notificaciones desde cualquier parte del código.
"""

from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationCreate


async def create_notification(
    db: Session,
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    tenant_id: Optional[UUID] = None
) -> Notification:
    """
    Crea una nueva notificación para un usuario.

    Esta es la función principal que se debe usar en todo el código
    para crear notificaciones de manera consistente.

    Args:
        db: Sesión de base de datos SQLAlchemy
        user_id: UUID del usuario destinatario
        type: Tipo de notificación (INFO, SUCCESS, WARNING, ERROR)
        title: Título corto de la notificación (max 200 chars)
        message: Mensaje descriptivo completo (max 1000 chars)
        action_url: URL opcional para redirección (max 500 chars)
        tenant_id: UUID del tenant (opcional, se infiere del usuario si no se proporciona)

    Returns:
        Notification: La notificación creada

    Ejemplo de uso:
        ```python
        # Notificación de bienvenida cuando acepta invitación
        await create_notification(
            db=db,
            user_id=user.id,
            type=NotificationType.SUCCESS,
            title="¡Bienvenido al equipo!",
            message=f"Te has unido a {tenant.name} como {role}",
            action_url="/dashboard",
            tenant_id=user.tenant_id
        )

        # Notificación de cambio de contraseña
        await create_notification(
            db=db,
            user_id=user.id,
            type=NotificationType.WARNING,
            title="Contraseña actualizada",
            message="Tu contraseña fue cambiada exitosamente",
            action_url="/dashboard/profile?tab=security",
            tenant_id=user.tenant_id
        )

        # Notificación para admin cuando alguien acepta invitación
        await create_notification(
            db=db,
            user_id=admin.id,
            type=NotificationType.INFO,
            title="Nuevo miembro en el equipo",
            message=f"{user.first_name} ha aceptado tu invitación",
            action_url="/dashboard/admin/usuarios",
            tenant_id=admin.tenant_id
        )
        ```

    Notas:
        - La notificación se crea como no leída (is_read=False)
        - El tenant_id se puede omitir y se asignará automáticamente
        - Las notificaciones se eliminan en cascada si se elimina el usuario o tenant
    """
    # Crear la notificación
    notification = Notification(
        user_id=user_id,
        tenant_id=tenant_id,
        type=type,
        title=title,
        message=message,
        action_url=action_url,
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


async def create_notification_for_multiple_users(
    db: Session,
    user_ids: list[UUID],
    type: NotificationType,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    tenant_id: Optional[UUID] = None
) -> list[Notification]:
    """
    Crea la misma notificación para múltiples usuarios.

    Útil para notificar a todos los admins de un tenant o a un grupo de usuarios.

    Args:
        db: Sesión de base de datos SQLAlchemy
        user_ids: Lista de UUIDs de usuarios destinatarios
        type: Tipo de notificación
        title: Título de la notificación
        message: Mensaje de la notificación
        action_url: URL opcional para redirección
        tenant_id: UUID del tenant (opcional)

    Returns:
        list[Notification]: Lista de notificaciones creadas

    Ejemplo:
        ```python
        # Notificar a todos los admins cuando se crea un cliente
        admin_ids = [admin.id for admin in tenant.admins]
        await create_notification_for_multiple_users(
            db=db,
            user_ids=admin_ids,
            type=NotificationType.INFO,
            title="Nuevo cliente registrado",
            message=f"El cliente {client.name} fue agregado al sistema",
            action_url="/dashboard/admin/clientes",
            tenant_id=tenant.id
        )
        ```
    """
    notifications = []

    for user_id in user_ids:
        notification = await create_notification(
            db=db,
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            action_url=action_url,
            tenant_id=tenant_id
        )
        notifications.append(notification)

    return notifications


def mark_notification_as_read(db: Session, notification: Notification) -> Notification:
    """
    Marca una notificación como leída.

    Args:
        db: Sesión de base de datos
        notification: La notificación a marcar como leída

    Returns:
        Notification: La notificación actualizada

    Ejemplo:
        ```python
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if notification and not notification.is_read:
            mark_notification_as_read(db, notification)
        ```
    """
    notification.mark_as_read()
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_as_read(db: Session, user_id: UUID) -> int:
    """
    Marca todas las notificaciones de un usuario como leídas.

    Args:
        db: Sesión de base de datos
        user_id: UUID del usuario

    Returns:
        int: Cantidad de notificaciones marcadas como leídas

    Ejemplo:
        ```python
        # Marcar todas como leídas al hacer click en "Marcar todas como leídas"
        count = mark_all_as_read(db, current_user.id)
        print(f"{count} notificaciones marcadas como leídas")
        ```
    """
    from datetime import datetime

    updated_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })

    db.commit()
    return updated_count


def get_unread_count(db: Session, user_id: UUID) -> int:
    """
    Obtiene el número de notificaciones no leídas de un usuario.

    Args:
        db: Sesión de base de datos
        user_id: UUID del usuario

    Returns:
        int: Cantidad de notificaciones no leídas

    Ejemplo:
        ```python
        # Mostrar contador en el badge
        unread = get_unread_count(db, current_user.id)
        # Retorna: 5
        ```
    """
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()
