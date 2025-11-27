"""
Notification Schemas

Schemas de Pydantic para validación y serialización de notificaciones.
Estos schemas definen la estructura de datos para crear, actualizar y leer notificaciones.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    """
    Schema base para notificaciones.
    Contiene los campos comunes a todas las operaciones.
    """
    type: NotificationType = Field(
        default=NotificationType.INFO,
        description="Tipo de notificación: info, success, warning, error"
    )
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Título corto de la notificación"
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Mensaje descriptivo completo"
    )
    action_url: Optional[str] = Field(
        None,
        max_length=500,
        description="URL opcional para redirección al hacer click"
    )


class NotificationCreate(NotificationBase):
    """
    Schema para crear una notificación.

    Usado internamente por la función helper create_notification().
    No requiere user_id ni tenant_id porque se pasan como parámetros separados.

    Ejemplo:
        notification_data = NotificationCreate(
            type=NotificationType.SUCCESS,
            title="¡Bienvenido!",
            message="Te has unido al equipo",
            action_url="/dashboard"
        )
    """
    pass


class NotificationUpdate(BaseModel):
    """
    Schema para actualizar una notificación.

    Actualmente solo se usa para marcar como leída/no leída.
    Todos los campos son opcionales.

    Ejemplo:
        # Marcar como leída
        update_data = NotificationUpdate(is_read=True)
    """
    is_read: Optional[bool] = Field(
        None,
        description="Marcar como leída (true) o no leída (false)"
    )


class Notification(NotificationBase):
    """
    Schema para leer una notificación (respuesta de API).

    Incluye todos los campos de la notificación almacenada en la base de datos.
    Este es el schema que se retorna en los endpoints GET.

    Atributos:
        id: UUID único de la notificación
        user_id: ID del usuario destinatario
        tenant_id: ID del tenant (puede ser None para superadmins)
        is_read: Si fue leída o no
        read_at: Fecha/hora en que se marcó como leída (puede ser None)
        created_at: Fecha/hora de creación
    """
    id: UUID
    user_id: UUID
    tenant_id: Optional[UUID] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationWithRelations(Notification):
    """
    Schema extendido con información de relaciones (opcional).

    Podría incluir información del usuario o tenant si se necesita.
    Por ahora, simplemente extiende Notification para uso futuro.
    """
    pass


class NotificationCount(BaseModel):
    """
    Schema para contar notificaciones no leídas.

    Usado en el badge del campanita de notificaciones.

    Ejemplo de respuesta:
        {
            "unread_count": 5
        }
    """
    unread_count: int = Field(
        ...,
        ge=0,
        description="Cantidad de notificaciones no leídas"
    )


class NotificationList(BaseModel):
    """
    Schema para lista paginada de notificaciones.

    Retorna las notificaciones junto con metadatos de paginación.

    Ejemplo de respuesta:
        {
            "notifications": [...],
            "total": 25,
            "unread_count": 5
        }
    """
    notifications: list[Notification] = Field(
        ...,
        description="Lista de notificaciones"
    )
    total: int = Field(
        ...,
        ge=0,
        description="Total de notificaciones del usuario"
    )
    unread_count: int = Field(
        ...,
        ge=0,
        description="Cantidad de notificaciones no leídas"
    )
