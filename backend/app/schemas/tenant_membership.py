"""
Schemas de Pydantic para el sistema de membresías multi-tenant.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID

from app.models.user import UserRole


# ============================================
# Schemas Base
# ============================================

class TenantMembershipBase(BaseModel):
    """Schema base para membresías"""
    role: UserRole = Field(..., description="Rol del usuario en este tenant")
    is_active: bool = Field(True, description="Si la membresía está activa")
    is_default: bool = Field(False, description="Si es el tenant por defecto al login")
    notes: Optional[str] = Field(None, max_length=500, description="Notas sobre la membresía")


class TenantMembershipCreate(TenantMembershipBase):
    """Schema para crear una membresía"""
    user_id: UUID = Field(..., description="ID del usuario")
    tenant_id: UUID = Field(..., description="ID del tenant")


class TenantMembershipUpdate(BaseModel):
    """Schema para actualizar una membresía"""
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=500)


# ============================================
# Schemas de Respuesta
# ============================================

class TenantMembershipResponse(TenantMembershipBase):
    """Schema de respuesta para una membresía"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    tenant_id: UUID
    joined_at: datetime
    last_access_at: Optional[datetime] = None
    invited_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class TenantMembershipWithTenant(TenantMembershipResponse):
    """Membresía con información del tenant"""
    tenant_name: str
    tenant_slug: str
    tenant_logo: Optional[str] = None


class TenantMembershipWithUser(TenantMembershipResponse):
    """Membresía con información del usuario"""
    user_email: str
    user_first_name: Optional[str] = None
    user_last_name: Optional[str] = None
    user_full_name: Optional[str] = None


# ============================================
# Schemas para Login Multi-Tenant
# ============================================

class AvailableTenant(BaseModel):
    """Tenant disponible para selección en login"""
    model_config = ConfigDict(from_attributes=True)

    membership_id: UUID
    tenant_id: UUID
    tenant_name: str
    tenant_slug: str
    tenant_logo: Optional[str] = None
    role: UserRole
    is_default: bool
    last_access_at: Optional[datetime] = None


class LoginResponseMultiTenant(BaseModel):
    """Respuesta de login con soporte multi-tenant"""
    access_token: str
    token_type: str = "bearer"
    requires_tenant_selection: bool = False
    available_tenants: List[AvailableTenant] = []

    # Información del usuario
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    is_superadmin: bool = False

    # Si no requiere selección, incluye el tenant seleccionado
    selected_tenant_id: Optional[UUID] = None
    selected_role: Optional[UserRole] = None


class SelectTenantRequest(BaseModel):
    """Request para seleccionar tenant después del login"""
    tenant_id: UUID = Field(..., description="ID del tenant a seleccionar")


class SelectTenantResponse(BaseModel):
    """Respuesta después de seleccionar tenant"""
    access_token: str
    token_type: str = "bearer"
    tenant_id: UUID
    tenant_name: str
    role: UserRole


# ============================================
# Schemas para Gestión de Miembros
# ============================================

class AddMemberRequest(BaseModel):
    """Request para agregar un miembro a un tenant"""
    email: str = Field(..., description="Email del usuario a agregar")
    role: UserRole = Field(..., description="Rol a asignar")
    send_invitation: bool = Field(True, description="Enviar email de invitación")
    notes: Optional[str] = Field(None, max_length=500)


class UpdateMemberRoleRequest(BaseModel):
    """Request para cambiar el rol de un miembro"""
    role: UserRole = Field(..., description="Nuevo rol")
    notes: Optional[str] = Field(None, max_length=500)


class MemberListResponse(BaseModel):
    """Lista de miembros de un tenant"""
    members: List[TenantMembershipWithUser]
    total: int
    page: int
    page_size: int


class UserTenantsResponse(BaseModel):
    """Lista de tenants de un usuario"""
    tenants: List[TenantMembershipWithTenant]
    total: int
    default_tenant_id: Optional[UUID] = None
