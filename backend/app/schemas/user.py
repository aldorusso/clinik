from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.user import UserRole


# Base schema
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    office_address: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    profile_photo: Optional[str] = None


# Schema for creating a user (by tenant admin)
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: Optional[UserRole] = UserRole.medico
    tenant_id: Optional[UUID] = None  # Set by system for tenant users


# Schema for updating a user
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    office_address: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    profile_photo: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    # Client specific fields
    client_company_name: Optional[str] = None
    client_tax_id: Optional[str] = None


# Schema for user in database
class UserInDB(UserBase):
    id: UUID
    tenant_id: Optional[UUID] = None
    role: UserRole
    is_active: bool
    job_title: Optional[str] = None
    client_company_name: Optional[str] = None
    client_tax_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Schema for user response (without sensitive data)
class User(UserInDB):
    pass


# Schema for user with tenant info
class UserWithTenant(User):
    tenant_name: Optional[str] = None
    tenant_slug: Optional[str] = None


# Schema for login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Schema for token response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Schema for token data (includes tenant_id for multi-tenant)
class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None
    tenant_id: Optional[UUID] = None


# Schema for changing password
class ChangePassword(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


# Schema for superadmin creating tenant admins
class TenantAdminCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


# Schema for creating a client (external customer of a tenant)
class ClientCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    client_company_name: Optional[str] = None  # Empresa del cliente
    client_tax_id: Optional[str] = None  # RUC/NIT del cliente


# Schema for inviting a user
class UserInvite(BaseModel):
    email: EmailStr
    role: UserRole = Field(..., description="Role for the invited user")
    first_name: Optional[str] = None
    last_name: Optional[str] = None


# Schema for accepting an invitation
class AcceptInvitation(BaseModel):
    token: str = Field(..., description="Invitation token from email")
    password: str = Field(..., min_length=6)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
