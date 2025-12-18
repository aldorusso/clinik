from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import TokenData


# Nuevo schema extendido para JWT multi-tenant
class TokenDataMultiTenant(TokenData):
    """Token data extendido para soporte multi-tenant"""
    user_id: Optional[UUID] = None
    membership_id: Optional[UUID] = None
    is_superadmin: bool = False

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token.

    For multi-tenant support, the token includes:
    - sub: user email
    - user_id: UUID of the user
    - role: user role in current tenant context
    - tenant_id: UUID of the tenant (null for superadmin)
    - membership_id: UUID of the TenantMembership (null for superadmin)
    - is_superadmin: boolean flag
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    # Convert UUIDs to string for JSON serialization
    for uuid_field in ["tenant_id", "user_id", "membership_id"]:
        if uuid_field in to_encode and to_encode[uuid_field] is not None:
            to_encode[uuid_field] = str(to_encode[uuid_field])

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[TokenDataMultiTenant]:
    """Decode and verify a JWT token.

    Returns extended TokenDataMultiTenant with membership information.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        tenant_id_str: str = payload.get("tenant_id")
        user_id_str: str = payload.get("user_id")
        membership_id_str: str = payload.get("membership_id")
        is_superadmin: bool = payload.get("is_superadmin", False)

        if email is None:
            return None

        # Convert string UUIDs back to UUID objects if present
        tenant_id = UUID(tenant_id_str) if tenant_id_str else None
        user_id = UUID(user_id_str) if user_id_str else None
        membership_id = UUID(membership_id_str) if membership_id_str else None

        token_data = TokenDataMultiTenant(
            email=email,
            role=role,
            tenant_id=tenant_id,
            user_id=user_id,
            membership_id=membership_id,
            is_superadmin=is_superadmin
        )
        return token_data
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user with session context injected.

    The user object will have session context set based on JWT claims:
    - current_tenant_id: The tenant context from the token
    - current_role: The role in the current tenant context
    - _current_membership_id: The membership being used
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data = decode_access_token(token)
    if token_data is None or token_data.email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception

    # Inject session context from JWT into user object
    # This allows current_user.tenant_id and current_user.role to work
    # based on the selected tenant context (for multi-tenant users)
    user.set_session_context(
        tenant_id=token_data.tenant_id,
        role=UserRole(token_data.role) if token_data.role else None,
        membership_id=token_data.membership_id
    )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# ============================================
# SUPERADMIN: Platform-level access
# ============================================

async def get_current_superadmin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get the current superadmin user (platform owner)."""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin privileges required"
        )
    return current_user


# ============================================
# TENANT ADMIN: Tenant-level administration
# ============================================

async def get_current_tenant_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get the current tenant admin."""
    if current_user.is_superadmin:
        return current_user  # Superadmin can access everything
    if current_user.current_role != UserRole.tenant_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin must belong to a tenant"
        )
    return current_user


# ============================================
# MANAGER: Manager-level access within tenant
# ============================================

async def get_current_manager_or_above(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get the current manager or higher (superadmin, tenant_admin, manager)."""
    if current_user.is_superadmin:
        return current_user  # Superadmin can access everything
    if current_user.current_role not in [UserRole.tenant_admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager privileges required"
        )
    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to a tenant"
        )
    return current_user


# ============================================
# TENANT MEMBER: Any tenant member access (internal)
# ============================================

async def get_current_tenant_member(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get any internal tenant member (tenant_admin, manager, user, closer/comercial, or recepcionista)."""
    if current_user.is_superadmin:
        return current_user  # Superadmin can access everything
    # In our medical leads system, 'closer' role represents internal comercials/closers
    if current_user.current_role not in [UserRole.tenant_admin, UserRole.manager, UserRole.medico, UserRole.closer, UserRole.recepcionista]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Internal access only"
        )
    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to a tenant"
        )
    return current_user


# ============================================
# CLOSER: Internal sales/closer access
# ============================================

async def get_current_closer(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get the current closer user (internal comercial/closer of a tenant)."""
    if current_user.is_superadmin:
        return current_user  # Superadmin can access everything
    if current_user.current_role != UserRole.closer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Closer access only"
        )
    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Closer must belong to a tenant"
        )
    return current_user


# ============================================
# MEDICAL ACCESS: For patient medical information
# ============================================

async def get_current_medical_staff(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current user with medical staff access (tenant_admin, manager, or user/médico only)."""
    if current_user.is_superadmin:
        return current_user  # Superadmin can access everything
    if current_user.current_role not in [UserRole.tenant_admin, UserRole.manager, UserRole.medico]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Medical staff access required"
        )
    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to a tenant"
        )
    return current_user

async def get_current_doctor_only(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current user with doctor-only access (medico role)."""
    if current_user.is_superadmin:
        return current_user  # Superadmin can access everything
    if current_user.current_role == UserRole.tenant_admin:
        return current_user  # Tenant admin can access patient details
    if current_user.current_role != UserRole.medico:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor access required for detailed patient information"
        )
    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to a tenant"
        )
    return current_user


# ============================================
# BACKWARDS COMPATIBILITY
# ============================================

async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    DEPRECATED: Use get_current_superadmin or get_current_tenant_admin instead.

    For backwards compatibility, this now returns superadmin users.
    """
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough privileges"
        )
    return current_user


# ============================================
# TENANT ISOLATION HELPERS
# ============================================

def verify_tenant_access(user: User, tenant_id: UUID) -> bool:
    """
    Verify if a user has access to a specific tenant.

    - Superadmins can access any tenant
    - Other users can only access their current tenant (from session context)
    """
    if user.is_superadmin:
        return True
    return user.current_tenant_id == tenant_id


def get_user_tenant_id(user: User) -> Optional[UUID]:
    """
    Get the tenant_id for filtering queries.

    - Superadmins return None (no filter, access to all)
    - Other users return their current tenant_id (from session context)
    """
    if user.is_superadmin:
        return None
    return user.current_tenant_id


def filter_by_tenant(query, model, user: User):
    """
    Apply tenant filter to a query if user is not superadmin.

    Usage:
        query = db.query(SomeModel)
        query = filter_by_tenant(query, SomeModel, current_user)
    """
    if not user.is_superadmin and hasattr(model, 'tenant_id'):
        query = query.filter(model.tenant_id == user.current_tenant_id)
    return query
