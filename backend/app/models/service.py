from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.session import Base


class ServiceCategory(Base):
    """
    Categorías de servicios médicos/estéticos.
    Ej: Facial, Corporal, Capilar, Odontología, etc.
    """
    __tablename__ = "service_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Información de la categoría
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)  # Icono para UI
    color = Column(String(7), nullable=True)  # Color hex para UI (#FFFFFF)
    
    # Orden para mostrar en UI
    display_order = Column(Integer, nullable=False, default=0)
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    services = relationship("Service", back_populates="category", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ServiceCategory {self.name}>"


class Service(Base):
    """
    Servicios médicos/estéticos que ofrece la clínica.
    Cada servicio puede tener precios, duración, requisitos, etc.
    """
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Relación con Categoría
    category_id = Column(UUID(as_uuid=True), ForeignKey("service_categories.id"), nullable=False)
    
    # Información básica
    name = Column(String(255), nullable=False)
    short_description = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    # Precios
    price_min = Column(Float, nullable=True)  # Precio mínimo
    price_max = Column(Float, nullable=True)  # Precio máximo
    price_consultation = Column(Float, nullable=True)  # Precio de consulta
    
    # Duración y sesiones
    duration_minutes = Column(Integer, nullable=True)  # Duración de cada sesión
    session_count_min = Column(Integer, nullable=True)  # Mínimo de sesiones
    session_count_max = Column(Integer, nullable=True)  # Máximo de sesiones
    
    # Configuración del servicio
    requires_consultation = Column(Boolean, default=True, nullable=False)  # Requiere consulta previa
    requires_preparation = Column(Boolean, default=False, nullable=False)  # Requiere preparación especial
    has_contraindications = Column(Boolean, default=False, nullable=False)  # Tiene contraindicaciones
    
    # Información médica
    preparation_instructions = Column(Text, nullable=True)  # Instrucciones pre-tratamiento
    aftercare_instructions = Column(Text, nullable=True)  # Instrucciones post-tratamiento
    contraindications = Column(Text, nullable=True)  # Contraindicaciones
    side_effects = Column(Text, nullable=True)  # Efectos secundarios posibles
    
    # Configuración de agenda
    booking_buffer_before = Column(Integer, nullable=True, default=0)  # Minutos antes
    booking_buffer_after = Column(Integer, nullable=True, default=0)  # Minutos después
    max_daily_bookings = Column(Integer, nullable=True)  # Máximo por día
    
    # Targeting de marketing
    target_age_min = Column(Integer, nullable=True)  # Edad mínima objetivo
    target_age_max = Column(Integer, nullable=True)  # Edad máxima objetivo
    target_gender = Column(String(20), nullable=True)  # masculino, femenino, ambos
    
    # SEO y marketing
    tags = Column(JSON, nullable=True)  # Tags para búsqueda
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(String(500), nullable=True)
    
    # Imágenes y multimedia
    featured_image = Column(String, nullable=True)  # Imagen principal
    gallery_images = Column(JSON, nullable=True)  # Array de URLs de imágenes
    video_url = Column(String, nullable=True)  # URL de video explicativo
    
    # Estado y configuración
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)  # Servicio destacado
    is_online_bookable = Column(Boolean, default=True, nullable=False)  # Se puede agendar online
    
    # Orden para mostrar en UI
    display_order = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    category = relationship("ServiceCategory", back_populates="services")
    interested_leads = relationship("Lead", back_populates="service_interest")
    appointments = relationship("Appointment", back_populates="service")
    treatments = relationship("Treatment", back_populates="service")
    packages = relationship("ServicePackage", back_populates="service")
    provider_services = relationship("ServiceProvider", back_populates="service")

    def __repr__(self):
        return f"<Service {self.name}>"

    @property
    def price_range_text(self) -> str:
        """Retorna el rango de precios como texto"""
        if self.price_min and self.price_max:
            if self.price_min == self.price_max:
                return f"${self.price_min:,.0f}"
            else:
                return f"${self.price_min:,.0f} - ${self.price_max:,.0f}"
        elif self.price_min:
            return f"Desde ${self.price_min:,.0f}"
        elif self.price_max:
            return f"Hasta ${self.price_max:,.0f}"
        else:
            return "Consultar precio"

    @property
    def session_count_text(self) -> str:
        """Retorna el número de sesiones como texto"""
        if self.session_count_min and self.session_count_max:
            if self.session_count_min == self.session_count_max:
                return f"{self.session_count_min} sesión{'es' if self.session_count_min > 1 else ''}"
            else:
                return f"{self.session_count_min} - {self.session_count_max} sesiones"
        elif self.session_count_min:
            return f"Mínimo {self.session_count_min} sesión{'es' if self.session_count_min > 1 else ''}"
        elif self.session_count_max:
            return f"Máximo {self.session_count_max} sesiones"
        else:
            return "Sesión única"


class ServicePackage(Base):
    """
    Paquetes de servicios con descuentos.
    Ej: 3 sesiones de láser + 1 consulta = 20% descuento
    """
    __tablename__ = "service_packages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relación con Tenant
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Relación con Servicio principal
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    
    # Información del paquete
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuración del paquete
    session_count = Column(Integer, nullable=False)  # Número de sesiones incluidas
    validity_months = Column(Integer, nullable=False, default=12)  # Validez en meses
    
    # Precios
    original_price = Column(Float, nullable=False)  # Precio original
    package_price = Column(Float, nullable=False)  # Precio del paquete
    discount_percentage = Column(Float, nullable=True)  # Porcentaje de descuento
    
    # Configuración
    transferable = Column(Boolean, default=False, nullable=False)  # Se puede transferir a otra persona
    refundable = Column(Boolean, default=False, nullable=False)  # Se puede reembolsar
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tenant = relationship("Tenant")
    service = relationship("Service", back_populates="packages")

    def __repr__(self):
        return f"<ServicePackage {self.name}>"

    @property
    def savings_amount(self) -> float:
        """Calcula el ahorro en cantidad"""
        return self.original_price - self.package_price

    @property
    def savings_percentage(self) -> float:
        """Calcula el porcentaje de ahorro"""
        if self.original_price > 0:
            return ((self.original_price - self.package_price) / self.original_price) * 100
        return 0


class ServiceProvider(Base):
    """
    Relación entre servicios y médicos/especialistas.
    Define qué médicos pueden realizar qué servicios.
    """
    __tablename__ = "service_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relaciones
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Médico
    
    # Configuración específica del proveedor para este servicio
    experience_years = Column(Integer, nullable=True)  # Años de experiencia en este servicio
    certification = Column(String(255), nullable=True)  # Certificación específica
    hourly_rate = Column(Float, nullable=True)  # Tarifa por hora (para comisiones)
    commission_percentage = Column(Float, nullable=True)  # Porcentaje de comisión
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)  # Es el especialista principal
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    service = relationship("Service", back_populates="provider_services")
    provider = relationship("User")

    def __repr__(self):
        return f"<ServiceProvider {self.provider.full_name} - {self.service.name}>"