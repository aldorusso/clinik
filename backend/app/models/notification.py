"""
Notification Model

Sistema de notificaciones in-app para usuarios del sistema multi-tenant.
Las notificaciones informan a los usuarios sobre eventos importantes como:
- Nuevos usuarios agregados al tenant
- Cambios de contraseña
- Activación/desactivación de cuentas
- Acciones administrativas

Cada notificación pertenece a un usuario específico y a un tenant (si aplica).
"""

import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class NotificationType(str, enum.Enum):
    """
    Tipos de notificaciones según su naturaleza y urgencia.

    - INFO: Información general (azul)
    - SUCCESS: Acciones exitosas (verde)
    - WARNING: Advertencias que requieren atención (amarillo)
    - ERROR: Errores o problemas críticos (rojo)
    """
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class Notification(Base):
    """
    Modelo de Notificación in-app.

    Atributos:
        id: Identificador único de la notificación
        user_id: ID del usuario destinatario (requerido)
        tenant_id: ID del tenant al que pertenece (puede ser NULL para superadmins)
        type: Tipo de notificación (info, success, warning, error)
        title: Título corto de la notificación (max 200 chars)
        message: Mensaje descriptivo completo (max 1000 chars)
        action_url: URL opcional a la que redirigir al hacer click
        is_read: Indica si el usuario ya leyó la notificación
        read_at: Fecha/hora en que se marcó como leída
        created_at: Fecha/hora de creación de la notificación

    Relaciones:
        user: Usuario destinatario de la notificación
        tenant: Tenant al que pertenece (opcional)

    Índices:
        - (user_id, is_read): Para consultas rápidas de notificaciones no leídas
        - (user_id, created_at): Para listado ordenado cronológicamente
        - (tenant_id): Para filtrado por tenant

    Ejemplos de uso:
        # Crear notificación de bienvenida
        notification = Notification(
            user_id=user.id,
            tenant_id=user.tenant_id,
            type=NotificationType.SUCCESS,
            title="¡Bienvenido al equipo!",
            message="Te has unido a Empresa Demo como Manager",
            action_url="/dashboard"
        )

        # Notificación de cambio de contraseña
        notification = Notification(
            user_id=user.id,
            tenant_id=user.tenant_id,
            type=NotificationType.WARNING,
            title="Contraseña actualizada",
            message="Tu contraseña fue cambiada el 27 Nov 2025 a las 14:30",
            action_url="/dashboard/profile?tab=security"
        )
    """
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Usuario destinatario (requerido)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Tenant (puede ser NULL para notificaciones de superadmin)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True, index=True)

    # Tipo de notificación
    type = Column(
        SQLEnum(NotificationType, name="notificationtype"),
        nullable=False,
        default=NotificationType.INFO,
        comment="Tipo: info (azul), success (verde), warning (amarillo), error (rojo)"
    )

    # Contenido de la notificación
    title = Column(
        String(200),
        nullable=False,
        comment="Título corto de la notificación"
    )

    message = Column(
        Text,
        nullable=False,
        comment="Mensaje descriptivo completo de la notificación"
    )

    # URL de acción opcional (a dónde ir al hacer click)
    action_url = Column(
        String(500),
        nullable=True,
        comment="URL opcional para redirección al hacer click en la notificación"
    )

    # Estado de lectura
    is_read = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Indica si la notificación fue leída por el usuario"
    )

    read_at = Column(
        DateTime,
        nullable=True,
        comment="Fecha/hora en que se marcó como leída"
    )

    # Timestamps
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="Fecha/hora de creación de la notificación"
    )

    # Relaciones
    user = relationship("User", back_populates="notifications")
    tenant = relationship("Tenant", back_populates="notifications")

    def __repr__(self):
        """Representación en string del modelo."""
        read_status = "leída" if self.is_read else "no leída"
        return f"<Notification {self.type.value}: '{self.title}' para user_id={self.user_id} ({read_status})>"

    def mark_as_read(self):
        """Marca la notificación como leída y registra la fecha/hora."""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
