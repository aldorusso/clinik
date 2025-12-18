"""
Modelo TenantMembership para el sistema multi-tenant.
Permite que un usuario pertenezca a múltiples organizaciones con diferentes roles.
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.session import Base
from app.models.user import UserRole


class TenantMembership(Base):
    """
    Representa la membresía de un usuario en un tenant.
    Un usuario puede tener múltiples membresías (una por tenant).
    El rol puede variar por tenant (ej: médico en Clínica A, closer en Clínica B).
    """
    __tablename__ = "tenant_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relaciones principales
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Rol dentro de este tenant específico
    role = Column(SQLEnum(UserRole), nullable=False)

    # Estado de la membresía
    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)  # Tenant por defecto al login

    # Tracking
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_access_at = Column(DateTime, nullable=True)  # Última vez que accedió a este tenant

    # Quién invitó a este usuario al tenant
    invited_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Notas/metadata
    notes = Column(String(500), nullable=True)  # Notas sobre la membresía

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'tenant_id', name='uq_user_tenant_membership'),
    )

    # Relationships
    user = relationship(
        "User",
        back_populates="memberships",
        foreign_keys=[user_id]
    )
    tenant = relationship(
        "Tenant",
        back_populates="memberships"
    )
    invited_by = relationship(
        "User",
        foreign_keys=[invited_by_id]
    )

    def __repr__(self):
        return f"<TenantMembership user={self.user_id} tenant={self.tenant_id} role={self.role.value}>"

    @property
    def is_admin(self) -> bool:
        """Verifica si es admin del tenant"""
        return self.role == UserRole.tenant_admin

    @property
    def is_staff(self) -> bool:
        """Verifica si es staff interno (no paciente)"""
        return self.role not in [UserRole.patient, UserRole.superadmin]
