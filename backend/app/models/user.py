from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from app.db.session import Base


class UserRole(str, enum.Enum):
    """
    Roles del sistema de gestión de leads médicos:
    - superadmin: Administrador global de la plataforma (sin tenant)
    - tenant_admin: Administrador de clínica/centro médico (admin_clinica)
    - manager: Gestor de leads y supervisor comercial
    - user: Médico/especialista (recibe leads asignados)
    - client: Comercial (primer contacto con leads)
    - recepcionista: Personal de recepción (agenda, registro manual)
    """
    superadmin = "superadmin"
    tenant_admin = "tenant_admin"
    manager = "manager"
    user = "user"
    client = "client"
    recepcionista = "recepcionista"


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

    # Información de negocio
    company_name = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=True)  # Cargo/posición

    # Información adicional (empresa externa del usuario si aplica)
    client_company_name = Column(String(255), nullable=True)
    client_tax_id = Column(String(100), nullable=True)

    profile_photo = Column(String, nullable=True)

    # Control de acceso
    role = Column(SQLEnum(UserRole), default=UserRole.user, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Reset de contraseña
    reset_password_token = Column(String(255), nullable=True)
    reset_password_token_expires = Column(DateTime, nullable=True)

    # Invitaciones
    invitation_token = Column(String(255), nullable=True, unique=True, index=True)
    invitation_token_expires = Column(DateTime, nullable=True)
    invited_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    invitation_accepted_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    patient_histories = relationship("MedicalHistory", foreign_keys="MedicalHistory.patient_id", back_populates="patient")
    medic_histories = relationship("MedicalHistory", foreign_keys="MedicalHistory.medic_id", back_populates="medic")
    # Relación con objetivos comerciales (usando string para evitar dependencias circulares)
    objectives = relationship("CommercialObjective", foreign_keys="CommercialObjective.commercial_id", back_populates="commercial")

    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"

    @property
    def is_superadmin(self) -> bool:
        return self.role == UserRole.superadmin

    @property
    def is_tenant_admin(self) -> bool:
        return self.role == UserRole.tenant_admin

    @property
    def is_manager(self) -> bool:
        return self.role == UserRole.manager

    @property
    def is_user(self) -> bool:
        return self.role == UserRole.user

    @property
    def is_client(self) -> bool:
        return self.role == UserRole.client

    @property
    def is_recepcionista(self) -> bool:
        return self.role == UserRole.recepcionista

    @property
    def belongs_to_tenant(self) -> bool:
        return self.tenant_id is not None

    # Propiedades de conveniencia para el sistema de leads médicos
    @property
    def is_admin_clinica(self) -> bool:
        """Alias para tenant_admin en contexto médico"""
        return self.role == UserRole.tenant_admin

    @property
    def is_gestor_leads(self) -> bool:
        """Alias para manager en contexto médico"""
        return self.role == UserRole.manager

    @property
    def is_medico(self) -> bool:
        """Alias para user en contexto médico"""
        return self.role == UserRole.user

    @property
    def is_comercial(self) -> bool:
        """Alias para client en contexto médico"""
        return self.role == UserRole.client
