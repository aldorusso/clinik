from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from app.db.session import Base


class UserRole(str, enum.Enum):
    """
    Roles del sistema multi-tenant:
    - SUPERADMIN: Administrador global de la plataforma (sin tenant)
    - ADMIN: Administrador de un tenant específico
    - USER: Usuario/empleado de un tenant
    - CLIENT: Cliente externo de un tenant (acceso limitado al portal)
    """
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    USER = "user"
    CLIENT = "client"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relación con Tenant (NULL para SUPERADMIN)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True, index=True)

    # Autenticación
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Información personal
    full_name = Column(String(255), nullable=True)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    # Ubicación
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    office_address = Column(String(500), nullable=True)

    # Información de negocio (para usuarios internos)
    company_name = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=True)  # Cargo/posición

    # Información adicional para CLIENTS
    client_company_name = Column(String(255), nullable=True)  # Empresa del cliente
    client_tax_id = Column(String(100), nullable=True)  # RUC/NIT del cliente

    profile_photo = Column(String, nullable=True)

    # Control de acceso
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Reset de contraseña
    reset_password_token = Column(String(255), nullable=True)
    reset_password_token_expires = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")

    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"

    @property
    def is_superadmin(self) -> bool:
        return self.role == UserRole.SUPERADMIN

    @property
    def is_tenant_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_tenant_user(self) -> bool:
        return self.role == UserRole.USER

    @property
    def is_client(self) -> bool:
        return self.role == UserRole.CLIENT

    @property
    def belongs_to_tenant(self) -> bool:
        return self.tenant_id is not None
