from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.db.session import Base


class SystemConfig(Base):
    """
    Modelo para configuraciones globales del sistema.
    Almacena pares clave-valor para configuraciones del sistema.
    """
    __tablename__ = "system_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Clave única de configuración
    key = Column(String(100), unique=True, nullable=False, index=True)

    # Valor (puede ser string, JSON, etc.)
    value = Column(Text, nullable=True)

    # Metadata
    description = Column(String(500), nullable=True)  # Descripción de la configuración
    category = Column(String(50), default="general", nullable=False)  # Categoría (general, email, security, etc.)
    value_type = Column(String(20), default="string", nullable=False)  # Tipo: string, number, boolean, json

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<SystemConfig {self.key}={self.value[:50] if self.value else 'None'}>"
