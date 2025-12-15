from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.session import Base


class Tenant(Base):
    """
    Modelo para organizaciones/empresas (tenants) en el sistema multi-tenant.
    Cada tenant representa una empresa que usa la plataforma.
    """
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Información básica
    name = Column(String(255), nullable=False)  # Nombre de la empresa
    slug = Column(String(100), unique=True, index=True, nullable=False)  # URL-friendly identifier

    # Información de contacto
    email = Column(String(255), nullable=True)  # Email de contacto principal
    phone = Column(String(50), nullable=True)

    # Dirección
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(String(500), nullable=True)

    # Información fiscal/legal
    tax_id = Column(String(100), nullable=True)  # RUC, NIT, RFC, etc.
    legal_name = Column(String(255), nullable=True)  # Razón social

    # Branding
    logo = Column(String, nullable=True)  # URL o base64 del logo
    primary_color = Column(String(7), nullable=True)  # Color hex (#FFFFFF)

    # Configuración
    settings = Column(Text, nullable=True)  # JSON con configuraciones personalizadas

    # Plan/Suscripción (para futuro billing)
    plan = Column(String(50), default="free", nullable=False)

    # Estado
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    users = relationship("User", back_populates="tenant", lazy="dynamic")
    notifications = relationship("Notification", back_populates="tenant", cascade="all, delete-orphan")
    
    # Lead Management System Relationships
    leads = relationship("Lead", back_populates="tenant", cascade="all, delete-orphan")
    service_categories = relationship("ServiceCategory", cascade="all, delete-orphan")
    services = relationship("Service", cascade="all, delete-orphan")
    service_packages = relationship("ServicePackage", cascade="all, delete-orphan")
    appointments = relationship("Appointment", cascade="all, delete-orphan")
    treatments = relationship("Treatment", cascade="all, delete-orphan")
    appointment_availability = relationship("AppointmentAvailability", cascade="all, delete-orphan")
    appointment_blocks = relationship("AppointmentBlock", cascade="all, delete-orphan")
    medical_records = relationship("MedicalRecord", cascade="all, delete-orphan")
    medical_histories = relationship("MedicalHistory", back_populates="tenant", cascade="all, delete-orphan")
    medical_attachments = relationship("MedicalAttachment", back_populates="tenant", cascade="all, delete-orphan")
    
    # Inventory System Relationships
    inventory_categories = relationship("InventoryCategory", back_populates="tenant", cascade="all, delete-orphan")
    inventory_products = relationship("InventoryProduct", back_populates="tenant", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Tenant {self.name} ({self.slug})>"
