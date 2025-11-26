from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.db.session import Base


class Plan(Base):
    """
    Modelo para planes/suscripciones disponibles en la plataforma.
    """
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Información del plan
    name = Column(String(100), nullable=False)  # Nombre del plan (ej: "Free", "Basic", "Pro")
    slug = Column(String(50), unique=True, nullable=False)  # Identificador único (ej: "free", "basic", "pro")
    description = Column(Text, nullable=True)  # Descripción del plan

    # Precios
    price_monthly = Column(Numeric(10, 2), default=0, nullable=False)  # Precio mensual
    price_yearly = Column(Numeric(10, 2), default=0, nullable=False)  # Precio anual
    currency = Column(String(3), default="USD", nullable=False)  # Moneda (USD, EUR, etc.)

    # Límites
    max_users = Column(Integer, default=5, nullable=False)  # Máximo de usuarios internos
    max_clients = Column(Integer, default=10, nullable=False)  # Máximo de clientes
    max_storage_gb = Column(Integer, default=1, nullable=False)  # Almacenamiento en GB

    # Características (JSON con features habilitadas)
    features = Column(Text, nullable=True)  # JSON: {"api_access": true, "custom_branding": false, ...}

    # Estado y orden
    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)  # Plan por defecto para nuevos tenants
    display_order = Column(Integer, default=0, nullable=False)  # Orden de visualización

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Plan {self.name} ({self.slug})>"
