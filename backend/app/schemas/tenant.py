from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
import re


def validate_slug(slug: str) -> str:
    """Valida que el slug sea URL-friendly"""
    if not re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', slug):
        raise ValueError('Slug debe ser lowercase, alfanumérico y puede contener guiones')
    return slug


# Base schema
class TenantBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    legal_name: Optional[str] = None
    logo: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    settings: Optional[str] = None  # JSON string
    plan: Optional[str] = "free"


# Schema for creating a tenant
class TenantCreate(TenantBase):
    pass


# Schema for creating a tenant with its first admin
class TenantCreateWithAdmin(TenantBase):
    # Opción 1: Usuario existente (solo se necesita el ID)
    existing_admin_id: Optional[UUID] = Field(None, description="ID de usuario existente para asignar como admin")

    # Opción 2: Crear usuario nuevo (se requieren estos campos)
    admin_email: Optional[EmailStr] = Field(None, description="Email para crear nuevo admin")
    admin_password: Optional[str] = Field(None, min_length=6, description="Password para nuevo admin")
    admin_first_name: Optional[str] = None
    admin_last_name: Optional[str] = None


# Schema for updating a tenant
class TenantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    legal_name: Optional[str] = None
    logo: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    settings: Optional[str] = None
    plan: Optional[str] = None
    is_active: Optional[bool] = None


# Schema for tenant in database
class TenantInDB(TenantBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Schema for tenant response
class Tenant(TenantInDB):
    pass


# Schema for tenant with user count
class TenantWithStats(Tenant):
    user_count: int = 0
    tenant_admin_count: int = 0
    manager_count: int = 0
    client_count: int = 0


# Schema for tenant list (lightweight)
class TenantList(BaseModel):
    id: UUID
    name: str
    slug: str
    email: Optional[str] = None
    plan: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Schemas para configuración de tenant (solo tenant_admin)
# =============================================================================

class TenantSettingsUpdate(BaseModel):
    """Schema para actualizar configuración del tenant"""
    # Información de la organización
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[str] = None  # Validado manualmente para permitir strings vacíos
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    legal_name: Optional[str] = None
    logo: Optional[str] = None
    primary_color: Optional[str] = None  # Validado manualmente

    # Configuración SMTP
    smtp_host: Optional[str] = Field(None, max_length=255)
    smtp_port: Optional[int] = Field(None, ge=1, le=65535)
    smtp_username: Optional[str] = Field(None, max_length=255)
    smtp_password: Optional[str] = Field(None, max_length=255)  # Solo se actualiza si se envía
    smtp_from_email: Optional[str] = None  # Validado manualmente
    smtp_from_name: Optional[str] = Field(None, max_length=255)
    smtp_use_tls: Optional[bool] = None
    smtp_use_ssl: Optional[bool] = None
    smtp_enabled: Optional[bool] = None

    @field_validator('email', 'smtp_from_email', mode='before')
    @classmethod
    def empty_str_to_none_email(cls, v):
        """Convierte strings vacíos a None para campos de email"""
        if v == '' or v is None:
            return None
        return v

    @field_validator('primary_color', mode='before')
    @classmethod
    def validate_color(cls, v):
        """Valida el color hexadecimal o convierte vacío a None"""
        if v == '' or v is None:
            return None
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('Color debe ser formato hex (#RRGGBB)')
        return v

    @field_validator('phone', 'website', 'address', 'city', 'country', 'tax_id', 'legal_name', 'logo', 'smtp_host', 'smtp_username', 'smtp_from_name', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        """Convierte strings vacíos a None"""
        if v == '':
            return None
        return v


class TenantSettingsResponse(BaseModel):
    """Schema para respuesta de configuración del tenant"""
    id: UUID
    name: str
    slug: str

    # Información de contacto
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None

    # Dirección
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

    # Información fiscal/legal
    tax_id: Optional[str] = None
    legal_name: Optional[str] = None

    # Branding
    logo: Optional[str] = None
    primary_color: Optional[str] = None

    # Configuración SMTP (sin contraseña)
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password_set: bool = False  # Indica si hay contraseña configurada
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    smtp_enabled: bool = False

    # Metadata
    plan: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SmtpTestRequest(BaseModel):
    """Schema para probar configuración SMTP"""
    test_email: EmailStr = Field(..., description="Email donde enviar el correo de prueba")
