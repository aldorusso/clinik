"""Tenant user management endpoints."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_password_hash,
    get_current_superadmin,
    get_current_active_user,
    verify_tenant_access,
)
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.schemas.user import User as UserSchema
from app.core.email import send_welcome_email

router = APIRouter()


@router.get("/{tenant_id}/users", response_model=List[UserSchema])
async def list_tenant_users(
    tenant_id: UUID,
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all users of a tenant. Superadmins can access any tenant,
    tenant admins can only access their own tenant.
    """
    if not verify_tenant_access(current_user, tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este tenant"
        )

    query = db.query(User).filter(User.tenant_id == tenant_id)

    if role:
        query = query.filter(User.role == role)

    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


@router.post("/{tenant_id}/users", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_tenant_user(
    tenant_id: UUID,
    user_in: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Create a user for a specific tenant. Only accessible by superadmins."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    existing = db.query(User).filter(User.email == user_in.get("email")).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    password = user_in.pop("password", None)
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password es requerido"
        )

    role = user_in.get("role", UserRole.medico)
    if role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede crear un superadmin dentro de un tenant"
        )

    db_user = User(
        **user_in,
        hashed_password=get_password_hash(password),
        tenant_id=tenant_id,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    try:
        await send_welcome_email(
            db=db,
            email_to=db_user.email,
            user_name=db_user.full_name or db_user.first_name or db_user.email.split('@')[0]
        )
    except Exception as e:
        print(f"Error enviando email de bienvenida: {e}")

    return db_user
