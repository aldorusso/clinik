# Pydantic schemas will be defined here
from app.schemas.user import (
    User,
    UserCreate,
    UserUpdate,
    UserLogin,
    Token,
    TokenData,
    UserInDB,
    UserWithTenant,
    ClientCreate,
    TenantAdminCreate,
    ChangePassword,
)

from app.schemas.tenant import (
    Tenant,
    TenantCreate,
    TenantUpdate,
    TenantInDB,
    TenantList,
    TenantWithStats,
    TenantCreateWithAdmin,
)

__all__ = [
    # User schemas
    "User",
    "UserCreate",
    "UserUpdate",
    "UserLogin",
    "Token",
    "TokenData",
    "UserInDB",
    "UserWithTenant",
    "ClientCreate",
    "TenantAdminCreate",
    "ChangePassword",
    # Tenant schemas
    "Tenant",
    "TenantCreate",
    "TenantUpdate",
    "TenantInDB",
    "TenantList",
    "TenantWithStats",
    "TenantCreateWithAdmin",
]
