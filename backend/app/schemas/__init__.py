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
    TenantAdminCreate,
    ChangePassword,
    ClientCreate,
)

from app.schemas.tenant import (
    Tenant,
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
    "TenantAdminCreate",
    "ChangePassword",
    "ClientCreate",
    # Tenant schemas
    "Tenant",
    "TenantUpdate",
    "TenantInDB",
    "TenantList",
    "TenantWithStats",
    "TenantCreateWithAdmin",
]
