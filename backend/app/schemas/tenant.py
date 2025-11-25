from pydantic import BaseModel, EmailStr, Field
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
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=6)
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
