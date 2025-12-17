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
    - role: user role (superadmin, tenant_admin, manager, user, client)
    - tenant_id: UUID of the tenant (null for superadmin)
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    # Convert tenant_id to string for JSON serialization
    if "tenant_id" in to_encode and to_encode["tenant_id"] is not None:
        to_encode["tenant_id"] = str(to_encode["tenant_id"])

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[TokenData]:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        tenant_id_str: str = payload.get("tenant_id")

        if email is None:
            return None

        # Convert tenant_id back to UUID if present
        tenant_id = UUID(tenant_id_str) if tenant_id_str else None

        token_data = TokenData(email=email, role=role, tenant_id=tenant_id)
        return token_data
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
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
    if current_user.role != UserRole.superadmin:
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
    if current_user.role not in [UserRole.superadmin, UserRole.tenant_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    if current_user.role == UserRole.tenant_admin and current_user.tenant_id is None:
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
    if current_user.role == UserRole.user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager privileges required"
        )
    if current_user.role in [UserRole.tenant_admin, UserRole.manager] and current_user.tenant_id is None:
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
    if current_user.role == UserRole.superadmin:
        return current_user  # Superadmin can access everything
    # In our medical leads system, 'closer' role represents internal comercials/closers
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.user, UserRole.closer, UserRole.recepcionista]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Internal access only"
        )
    if current_user.tenant_id is None:
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
    if current_user.role != UserRole.closer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Closer access only"
        )
    if current_user.tenant_id is None:
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
    if current_user.role == UserRole.superadmin:
        return current_user  # Superadmin can access everything
    if current_user.role not in [UserRole.tenant_admin, UserRole.manager, UserRole.user]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Medical staff access required"
        )
    if current_user.tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must belong to a tenant"
        )
    return current_user

async def get_current_doctor_only(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current user with doctor-only access (user role = médico)."""
    if current_user.role == UserRole.superadmin:
        return current_user  # Superadmin can access everything
    if current_user.role == UserRole.tenant_admin:
        return current_user  # Tenant admin can access patient details
    if current_user.role != UserRole.user:  # user = médico in our system
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor access required for detailed patient information"
        )
    if current_user.tenant_id is None:
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
    if current_user.role != UserRole.superadmin:
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
    - Other users can only access their own tenant
    """
    if user.role == UserRole.superadmin:
        return True
    return user.tenant_id == tenant_id


def get_user_tenant_id(user: User) -> Optional[UUID]:
    """
    Get the tenant_id for filtering queries.

    - Superadmins return None (no filter, access to all)
    - Other users return their tenant_id
    """
    if user.role == UserRole.superadmin:
        return None
    return user.tenant_id


def filter_by_tenant(query, model, user: User):
    """
    Apply tenant filter to a query if user is not superadmin.

    Usage:
        query = db.query(SomeModel)
        query = filter_by_tenant(query, SomeModel, current_user)
    """
    if user.role != UserRole.superadmin and hasattr(model, 'tenant_id'):
        query = query.filter(model.tenant_id == user.tenant_id)
    return query
