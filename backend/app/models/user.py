from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from typing import Optional, ClassVar, Any, TYPE_CHECKING

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.tenant_membership import TenantMembership


class UserRole(str, enum.Enum):
    """
    Roles del sistema de gestión de leads médicos:
    - superadmin: Administrador global de la plataforma (sin tenant)
    - tenant_admin: Administrador de clínica/centro médico (admin_clinica)
    - manager: Gestor de leads y supervisor comercial
    - medico: Médico/especialista (recibe leads asignados)
    - closer: Comercial/Closer (primer contacto con leads, cierra ventas)
    - recepcionista: Personal de recepción (agenda, registro manual)
    - patient: Paciente real que accede al portal de pacientes
    """
    superadmin = "superadmin"
    tenant_admin = "tenant_admin"
    manager = "manager"
    medico = "medico"
    closer = "closer"
    recepcionista = "recepcionista"
    patient = "patient"


class User(Base):
    __tablename__ = "users"
    __allow_unmapped__ = True  # Permite atributos de clase sin Mapped[]

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
    # NOTA: 'role' y 'tenant_id' se mantienen para compatibilidad hacia atrás
    # El nuevo sistema usa TenantMembership para gestionar roles por tenant
    # Para usuarios con múltiples tenants, role/tenant_id se inyectan desde el JWT
    role = Column(SQLEnum(UserRole), default=UserRole.medico, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Flag para identificar superadmins (independiente del sistema de membresías)
    is_superadmin_flag = Column(Boolean, default=False, nullable=False)

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
    # Relación con objetivos comerciales (usando lazy loading para evitar dependencias circulares)
    objectives = relationship("CommercialObjective",
                            foreign_keys="[CommercialObjective.commercial_id]",
                            back_populates="commercial",
                            lazy="dynamic")

    # Membresías en múltiples tenants
    memberships = relationship(
        "TenantMembership",
        back_populates="user",
        foreign_keys="TenantMembership.user_id",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )

    # Atributos inyectados desde JWT para contexto de sesión
    # Estos se establecen en get_current_user cuando el usuario tiene múltiples membresías
    _current_tenant_id: Optional[uuid.UUID] = None
    _current_role: Optional[UserRole] = None
    _current_membership_id: Optional[uuid.UUID] = None

    def __repr__(self):
        return f"<User {self.email} ({self.current_role.value if self.current_role else 'no-role'})>"

    # ============================================
    # Propiedades de contexto de sesión
    # Permiten acceder al tenant_id y role desde el JWT
    # cuando el usuario tiene múltiples membresías
    # ============================================

    @property
    def current_tenant_id(self) -> Optional[uuid.UUID]:
        """
        Retorna el tenant_id del contexto actual (inyectado desde JWT).
        Si no hay contexto, retorna el tenant_id directo del usuario.
        """
        if self._current_tenant_id is not None:
            return self._current_tenant_id
        return self.tenant_id

    @property
    def current_role(self) -> Optional[UserRole]:
        """
        Retorna el rol del contexto actual (inyectado desde JWT).
        Si no hay contexto, retorna el rol directo del usuario.
        """
        if self._current_role is not None:
            return self._current_role
        return self.role

    def set_session_context(
        self,
        tenant_id: Optional[uuid.UUID] = None,
        role: Optional[UserRole] = None,
        membership_id: Optional[uuid.UUID] = None
    ):
        """
        Establece el contexto de sesión desde el JWT.
        Usado por get_current_user en security.py
        """
        self._current_tenant_id = tenant_id
        self._current_role = role
        self._current_membership_id = membership_id

    def get_active_memberships(self):
        """Retorna las membresías activas del usuario"""
        return self.memberships.filter_by(is_active=True).all()

    def get_membership_for_tenant(self, tenant_id: uuid.UUID):
        """Retorna la membresía para un tenant específico"""
        return self.memberships.filter_by(tenant_id=tenant_id, is_active=True).first()

    def has_membership_in_tenant(self, tenant_id: uuid.UUID) -> bool:
        """Verifica si el usuario tiene membresía activa en un tenant"""
        return self.memberships.filter_by(tenant_id=tenant_id, is_active=True).count() > 0

    # ============================================
    # Propiedades de rol (usan current_role para compatibilidad)
    # ============================================

    @property
    def is_superadmin(self) -> bool:
        """Verifica si es superadmin (flag directo, no depende de membresía)"""
        return self.is_superadmin_flag or self.role == UserRole.superadmin

    @property
    def is_tenant_admin(self) -> bool:
        return self.current_role == UserRole.tenant_admin

    @property
    def is_manager(self) -> bool:
        return self.current_role == UserRole.manager

    @property
    def is_medico(self) -> bool:
        return self.current_role == UserRole.medico

    @property
    def is_closer(self) -> bool:
        return self.current_role == UserRole.closer

    @property
    def is_recepcionista(self) -> bool:
        return self.current_role == UserRole.recepcionista

    @property
    def is_patient(self) -> bool:
        return self.current_role == UserRole.patient

    @property
    def belongs_to_tenant(self) -> bool:
        return self.current_tenant_id is not None

    # Propiedades de conveniencia para el sistema de leads médicos
    @property
    def is_admin_clinica(self) -> bool:
        """Alias para tenant_admin en contexto médico"""
        return self.current_role == UserRole.tenant_admin

    @property
    def is_gestor_leads(self) -> bool:
        """Alias para manager en contexto médico"""
        return self.current_role == UserRole.manager

    @property
    def is_comercial(self) -> bool:
        """Alias para closer en contexto médico"""
        return self.current_role == UserRole.closer
