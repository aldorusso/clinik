"""User profile and token management endpoints."""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    create_access_token,
    get_current_active_user,
    get_current_superadmin,
)
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.audit_log import AuditAction, AuditCategory
from app.schemas.user import UserCreate, UserUpdate, Token, User as UserSchema, UserWithTenant
from app.api.v1.audit_logs import create_audit_log, get_client_ip

router = APIRouter()


@router.get("/me", response_model=UserWithTenant)
async def read_users_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get current user information with tenant details."""
    current_tenant = None
    if current_user.current_tenant_id:
        current_tenant = db.query(Tenant).filter(
            Tenant.id == current_user.current_tenant_id
        ).first()

    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "country": current_user.country,
        "city": current_user.city,
        "office_address": current_user.office_address,
        "company_name": current_user.company_name,
        "job_title": current_user.job_title,
        "profile_photo": current_user.profile_photo,
        "role": current_user.current_role,
        "tenant_id": current_user.current_tenant_id,
        "is_active": current_user.is_active,
        "client_company_name": current_user.client_company_name,
        "client_tax_id": current_user.client_tax_id,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        "tenant_name": current_tenant.name if current_tenant else None,
        "tenant_slug": current_tenant.slug if current_tenant else None,
    }
    return user_dict


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/create-superadmin", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_superadmin_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_superadmin: User = Depends(get_current_superadmin)
):
    """Create a new superadmin user. Only accessible by superadmins."""
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=UserRole.superadmin,
        tenant_id=None
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.put("/profile", response_model=UserSchema)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile."""
    update_data = user_update.model_dump(exclude_unset=True)

    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            update_data["hashed_password"] = get_password_hash(password)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Refresh the access token for the current user."""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

    if not current_user.is_superadmin and current_user.current_tenant_id:
        tenant = db.query(Tenant).filter(Tenant.id == current_user.current_tenant_id).first()
        if tenant and not tenant.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tu organización está desactivada. Contacta al administrador."
            )

    create_audit_log(
        db=db,
        action=AuditAction.TOKEN_REFRESHED,
        category=AuditCategory.AUTH,
        user_id=current_user.id,
        user_email=current_user.email,
        tenant_id=current_user.current_tenant_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": current_user.email,
        "user_id": current_user.id,
        "role": current_user.current_role.value if current_user.current_role else None,
        "tenant_id": current_user.current_tenant_id,
        "membership_id": current_user._current_membership_id,
        "is_superadmin": current_user.is_superadmin,
    }
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}
