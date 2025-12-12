from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID


# ============================================
# SERVICE CATEGORY SCHEMAS
# ============================================

class ServiceCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Nombre de la categoría")
    description: Optional[str] = Field(None, description="Descripción de la categoría")
    icon: Optional[str] = Field(None, max_length=100, description="Icono para UI")
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", description="Color hex para UI")
    display_order: int = Field(0, ge=0, description="Orden para mostrar en UI")
    is_active: bool = Field(True, description="Si la categoría está activa")


class ServiceCategoryCreate(ServiceCategoryBase):
    pass


class ServiceCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ServiceCategoryInDB(ServiceCategoryBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ServiceCategory(ServiceCategoryInDB):
    service_count: Optional[int] = Field(None, description="Número de servicios en esta categoría")


# ============================================
# SERVICE SCHEMAS
# ============================================

class ServiceBase(BaseModel):
    category_id: UUID = Field(..., description="ID de la categoría del servicio")
    name: str = Field(..., min_length=1, max_length=255, description="Nombre del servicio")
    short_description: Optional[str] = Field(None, max_length=500, description="Descripción corta")
    description: Optional[str] = Field(None, description="Descripción completa")
    
    # Precios
    price_min: Optional[float] = Field(None, ge=0, description="Precio mínimo")
    price_max: Optional[float] = Field(None, ge=0, description="Precio máximo")
    price_consultation: Optional[float] = Field(None, ge=0, description="Precio de consulta")
    
    # Duración y sesiones
    duration_minutes: Optional[int] = Field(None, gt=0, description="Duración de cada sesión en minutos")
    session_count_min: Optional[int] = Field(None, gt=0, description="Mínimo de sesiones")
    session_count_max: Optional[int] = Field(None, gt=0, description="Máximo de sesiones")
    
    # Configuración del servicio
    requires_consultation: bool = Field(True, description="Requiere consulta previa")
    requires_preparation: bool = Field(False, description="Requiere preparación especial")
    has_contraindications: bool = Field(False, description="Tiene contraindicaciones")
    
    # Información médica
    preparation_instructions: Optional[str] = Field(None, description="Instrucciones pre-tratamiento")
    aftercare_instructions: Optional[str] = Field(None, description="Instrucciones post-tratamiento")
    contraindications: Optional[str] = Field(None, description="Contraindicaciones")
    side_effects: Optional[str] = Field(None, description="Efectos secundarios posibles")
    
    # Configuración de agenda
    booking_buffer_before: int = Field(0, ge=0, description="Minutos de buffer antes")
    booking_buffer_after: int = Field(0, ge=0, description="Minutos de buffer después")
    max_daily_bookings: Optional[int] = Field(None, gt=0, description="Máximo de citas por día")
    
    # Targeting de marketing
    target_age_min: Optional[int] = Field(None, ge=0, le=120, description="Edad mínima objetivo")
    target_age_max: Optional[int] = Field(None, ge=0, le=120, description="Edad máxima objetivo")
    target_gender: Optional[str] = Field(None, pattern="^(masculino|femenino|ambos)$", description="Género objetivo")
    
    # SEO y marketing
    tags: Optional[List[str]] = Field(None, description="Tags para búsqueda")
    meta_title: Optional[str] = Field(None, max_length=255, description="Título meta")
    meta_description: Optional[str] = Field(None, max_length=500, description="Descripción meta")
    
    # Imágenes y multimedia
    featured_image: Optional[str] = Field(None, description="Imagen principal")
    gallery_images: Optional[List[str]] = Field(None, description="Galería de imágenes")
    video_url: Optional[str] = Field(None, description="URL de video explicativo")
    
    # Estado y configuración
    is_active: bool = Field(True, description="Si el servicio está activo")
    is_featured: bool = Field(False, description="Si es servicio destacado")
    is_online_bookable: bool = Field(True, description="Se puede agendar online")
    display_order: int = Field(0, ge=0, description="Orden para mostrar en UI")

    @validator('price_max')
    def validate_price_range(cls, v, values):
        if v is not None and 'price_min' in values and values['price_min'] is not None:
            if v < values['price_min']:
                raise ValueError('price_max must be greater than or equal to price_min')
        return v

    @validator('session_count_max')
    def validate_session_range(cls, v, values):
        if v is not None and 'session_count_min' in values and values['session_count_min'] is not None:
            if v < values['session_count_min']:
                raise ValueError('session_count_max must be greater than or equal to session_count_min')
        return v

    @validator('target_age_max')
    def validate_age_range(cls, v, values):
        if v is not None and 'target_age_min' in values and values['target_age_min'] is not None:
            if v < values['target_age_min']:
                raise ValueError('target_age_max must be greater than or equal to target_age_min')
        return v


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    category_id: Optional[UUID] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    short_description: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    price_min: Optional[float] = Field(None, ge=0)
    price_max: Optional[float] = Field(None, ge=0)
    price_consultation: Optional[float] = Field(None, ge=0)
    duration_minutes: Optional[int] = Field(None, gt=0)
    session_count_min: Optional[int] = Field(None, gt=0)
    session_count_max: Optional[int] = Field(None, gt=0)
    requires_consultation: Optional[bool] = None
    requires_preparation: Optional[bool] = None
    has_contraindications: Optional[bool] = None
    preparation_instructions: Optional[str] = None
    aftercare_instructions: Optional[str] = None
    contraindications: Optional[str] = None
    side_effects: Optional[str] = None
    booking_buffer_before: Optional[int] = Field(None, ge=0)
    booking_buffer_after: Optional[int] = Field(None, ge=0)
    max_daily_bookings: Optional[int] = Field(None, gt=0)
    target_age_min: Optional[int] = Field(None, ge=0, le=120)
    target_age_max: Optional[int] = Field(None, ge=0, le=120)
    target_gender: Optional[str] = Field(None, pattern="^(masculino|femenino|ambos)$")
    tags: Optional[List[str]] = None
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)
    featured_image: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    video_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_online_bookable: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)


class ServiceInDB(ServiceBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Service(ServiceInDB):
    # Información de la categoría
    category_name: str
    
    # Campos computados
    price_range_text: str
    session_count_text: str
    
    # Estadísticas
    lead_count: Optional[int] = Field(None, description="Número de leads interesados")
    appointment_count: Optional[int] = Field(None, description="Número de citas agendadas")
    treatment_count: Optional[int] = Field(None, description="Número de tratamientos activos")


# Schema for service with full details including providers
class ServiceDetailed(Service):
    providers: List[dict] = Field(default_factory=list, description="Médicos que ofrecen este servicio")
    packages: List[dict] = Field(default_factory=list, description="Paquetes disponibles")
    availability: dict = Field(default_factory=dict, description="Disponibilidad de citas")


# Schema for service list response
class ServiceListResponse(BaseModel):
    items: List[Service]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================
# SERVICE PACKAGE SCHEMAS
# ============================================

class ServicePackageBase(BaseModel):
    service_id: UUID = Field(..., description="ID del servicio")
    name: str = Field(..., min_length=1, max_length=255, description="Nombre del paquete")
    description: Optional[str] = Field(None, description="Descripción del paquete")
    session_count: int = Field(..., gt=0, description="Número de sesiones incluidas")
    validity_months: int = Field(12, gt=0, le=60, description="Validez en meses")
    original_price: float = Field(..., gt=0, description="Precio original")
    package_price: float = Field(..., gt=0, description="Precio del paquete")
    discount_percentage: Optional[float] = Field(None, ge=0, le=100, description="Porcentaje de descuento")
    transferable: bool = Field(False, description="Se puede transferir a otra persona")
    refundable: bool = Field(False, description="Se puede reembolsar")
    is_active: bool = Field(True, description="Si el paquete está activo")

    @validator('package_price')
    def validate_package_price(cls, v, values):
        if 'original_price' in values and values['original_price'] is not None:
            if v >= values['original_price']:
                raise ValueError('package_price must be less than original_price')
        return v


class ServicePackageCreate(ServicePackageBase):
    pass


class ServicePackageUpdate(BaseModel):
    service_id: Optional[UUID] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    session_count: Optional[int] = Field(None, gt=0)
    validity_months: Optional[int] = Field(None, gt=0, le=60)
    original_price: Optional[float] = Field(None, gt=0)
    package_price: Optional[float] = Field(None, gt=0)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    transferable: Optional[bool] = None
    refundable: Optional[bool] = None
    is_active: Optional[bool] = None


class ServicePackageInDB(ServicePackageBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ServicePackage(ServicePackageInDB):
    service_name: str
    savings_amount: float
    savings_percentage: float


# ============================================
# SERVICE PROVIDER SCHEMAS
# ============================================

class ServiceProviderBase(BaseModel):
    service_id: UUID = Field(..., description="ID del servicio")
    provider_id: UUID = Field(..., description="ID del médico/proveedor")
    experience_years: Optional[int] = Field(None, ge=0, description="Años de experiencia")
    certification: Optional[str] = Field(None, max_length=255, description="Certificación específica")
    hourly_rate: Optional[float] = Field(None, ge=0, description="Tarifa por hora")
    commission_percentage: Optional[float] = Field(None, ge=0, le=100, description="Porcentaje de comisión")
    is_active: bool = Field(True, description="Si está activo")
    is_primary: bool = Field(False, description="Es el especialista principal")


class ServiceProviderCreate(ServiceProviderBase):
    pass


class ServiceProviderUpdate(BaseModel):
    service_id: Optional[UUID] = None
    provider_id: Optional[UUID] = None
    experience_years: Optional[int] = Field(None, ge=0)
    certification: Optional[str] = Field(None, max_length=255)
    hourly_rate: Optional[float] = Field(None, ge=0)
    commission_percentage: Optional[float] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None


class ServiceProviderInDB(ServiceProviderBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ServiceProvider(ServiceProviderInDB):
    service_name: str
    provider_name: str
    provider_email: str


# ============================================
# SERVICE FILTERS AND SEARCH
# ============================================

class ServiceFilters(BaseModel):
    # Filtros básicos
    category_id: Optional[UUID] = Field(None, description="Filtrar por categoría")
    is_active: Optional[bool] = Field(None, description="Filtrar por activos")
    is_featured: Optional[bool] = Field(None, description="Filtrar por destacados")
    is_online_bookable: Optional[bool] = Field(None, description="Filtrar por agendables online")
    
    # Filtros de precio
    price_min: Optional[float] = Field(None, ge=0, description="Precio mínimo")
    price_max: Optional[float] = Field(None, ge=0, description="Precio máximo")
    
    # Filtros de duración
    duration_min: Optional[int] = Field(None, gt=0, description="Duración mínima en minutos")
    duration_max: Optional[int] = Field(None, gt=0, description="Duración máxima en minutos")
    
    # Filtros de sesiones
    session_count_min: Optional[int] = Field(None, gt=0, description="Mínimo de sesiones")
    session_count_max: Optional[int] = Field(None, gt=0, description="Máximo de sesiones")
    
    # Filtros de configuración
    requires_consultation: Optional[bool] = Field(None, description="Requiere consulta")
    has_contraindications: Optional[bool] = Field(None, description="Tiene contraindicaciones")
    
    # Filtros de targeting
    target_gender: Optional[str] = Field(None, pattern="^(masculino|femenino|ambos)$")
    target_age_min: Optional[int] = Field(None, ge=0, le=120)
    target_age_max: Optional[int] = Field(None, ge=0, le=120)
    
    # Búsqueda de texto
    search: Optional[str] = Field(None, min_length=1, description="Búsqueda en nombre y descripción")
    tags: Optional[List[str]] = Field(None, description="Filtrar por tags")
    
    # Filtros de proveedor
    provider_id: Optional[UUID] = Field(None, description="Filtrar por médico/proveedor")
    
    # Ordenamiento
    order_by: Optional[str] = Field("display_order", pattern="^(name|price_min|duration_minutes|created_at|display_order)$")
    order_direction: Optional[str] = Field("asc", pattern="^(asc|desc)$")
    
    # Paginación
    page: int = Field(1, ge=1, description="Número de página")
    page_size: int = Field(20, ge=1, le=100, description="Elementos por página")


# ============================================
# SERVICE STATISTICS
# ============================================

class ServiceStats(BaseModel):
    """Estadísticas de servicios"""
    total_services: int
    active_services: int
    featured_services: int
    services_by_category: dict[str, int]
    most_popular_services: List[dict]  # Top 5 servicios más solicitados
    revenue_by_service: List[dict]  # Ingresos por servicio
    appointment_count_by_service: dict[str, int]


class ServicePerformance(BaseModel):
    """Performance de un servicio específico"""
    service_id: UUID
    service_name: str
    total_leads: int
    conversion_rate: float
    total_appointments: int
    completed_treatments: int
    total_revenue: float
    average_price: float
    satisfaction_rating: Optional[float] = None
    repeat_customer_rate: float