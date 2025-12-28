"""Superadmin user management endpoints."""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_password_hash,
    get_current_superadmin,
    get_current_active_user,
    get_current_tenant_admin,
)
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.notification import NotificationType
from app.schemas.user import UserCreate, UserUpdate, User as UserSchema, UserInvite
from app.core.email import send_welcome_email, send_invitation_email
from app.core.notifications import create_notification

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    tenant_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    List all users globally. Only accessible by superadmins.
    Can filter by role and tenant_id.
    """
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if tenant_id:
        query = query.filter(User.tenant_id == tenant_id)

    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


@router.get("/available-for-admin", response_model=List[UserSchema])
async def list_users_available_for_admin(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    List users that can be assigned as admin of a new tenant.
    Only accessible by superadmins.

    Returns active users who are NOT superadmins (superadmins cannot be tenant admins).
    Optionally filter by search term (matches email, first_name, last_name).
    """
    query = db.query(User).filter(
        User.is_active == True,
        # Exclude superadmins - check both flag and role
        User.is_superadmin_flag == False,
        User.role != UserRole.superadmin,
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )

    users = query.order_by(User.email).offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    Create a new user. Only accessible by superadmins.
    For creating tenant users, use /tenants/{tenant_id}/users endpoint.
    """
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya esta registrado"
        )

    # Validate: if role is not superadmin, tenant_id is required
    if user_in.role != UserRole.superadmin and not user_in.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id es requerido para usuarios no superadmin"
        )

    # Create new user
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        full_name=user_in.full_name,
        role=user_in.role,
        tenant_id=user_in.tenant_id if user_in.role != UserRole.superadmin else None,
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Enviar email de bienvenida
    try:
        await send_welcome_email(
            db=db,
            email_to=db_user.email,
            user_name=db_user.full_name or db_user.first_name or db_user.email.split('@')[0]
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error enviando email de bienvenida: {e}")

    return db_user


@router.post("/invite", response_model=dict, status_code=status.HTTP_201_CREATED)
async def invite_user_as_superadmin(
    invitation: UserInvite,
    tenant_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    Invite a new user via email. Only accessible by superadmins.
    The user will receive an email to set their password.

    - For non-superadmin roles, tenant_id is required.
    - For superadmin role, tenant_id must be None.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == invitation.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya esta registrado"
        )

    # Validate tenant_id requirement
    if invitation.role != UserRole.superadmin and not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id es requerido para usuarios no superadmin"
        )

    if invitation.role == UserRole.superadmin and tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los superadmins no pueden pertenecer a un tenant"
        )

    # Verify tenant exists if provided
    tenant = None
    if tenant_id:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant no encontrado"
            )

    # Generate invitation token
    invitation_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=72)  # 3 days

    # Create user with pending invitation
    db_user = User(
        email=invitation.email,
        hashed_password="",  # Will be set when accepting invitation
        first_name=invitation.first_name,
        last_name=invitation.last_name,
        role=invitation.role,
        tenant_id=tenant_id if invitation.role != UserRole.superadmin else None,
        is_active=False,  # Inactive until invitation is accepted
        invitation_token=invitation_token,
        invitation_token_expires=expires_at,
        invited_by_id=current_user.id
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send invitation email
    try:
        inviter_name = current_user.full_name or current_user.first_name or current_user.email
        tenant_name = tenant.name if tenant else "la plataforma"

        await send_invitation_email(
            db=db,
            email_to=invitation.email,
            invitation_token=invitation_token,
            inviter_name=inviter_name,
            tenant_name=tenant_name,
            role=invitation.role.value
        )
    except Exception as e:
        print(f"Error enviando email de invitacion: {e}")
        # Don't fail the request, but notify user
        return {
            "message": f"Usuario creado pero hubo un error enviando el email de invitacion a {invitation.email}",
            "expires_at": expires_at.isoformat(),
            "warning": "El email no pudo ser enviado. Contacte al administrador."
        }

    return {
        "message": f"Invitacion enviada a {invitation.email}",
        "expires_at": expires_at.isoformat()
    }


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user by ID.
    - Superadmins can access any user
    - Tenant admins can only access users in their tenant
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Check access for non-superadmins
    if current_user.role != UserRole.superadmin:
        if user.tenant_id != current_user.current_tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este usuario"
            )

    return user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Update user by ID.
    - Superadmins can update any user
    - Tenant admins can only update users in their tenant
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Check access for non-superadmins
    if current_user.role != UserRole.superadmin:
        if user.tenant_id != current_user.current_tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este usuario"
            )
        # Tenant admins cannot change roles to superadmin
        if user_update.role == UserRole.superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes asignar el rol superadmin"
            )

    # Update fields if provided
    update_data = user_update.model_dump(exclude_unset=True)

    # Track if is_active changed for notification
    is_active_changed = False
    old_is_active = user.is_active
    new_is_active = update_data.get("is_active")
    if new_is_active is not None and new_is_active != old_is_active:
        is_active_changed = True

    # Handle password update separately
    if "password" in update_data and update_data["password"]:
        password = update_data.pop("password")
        update_data["hashed_password"] = get_password_hash(password)

    # Prevent changing tenant_id for non-superadmins
    if "tenant_id" in update_data and current_user.role != UserRole.superadmin:
        del update_data["tenant_id"]

    # Update user
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)

    db.commit()
    db.refresh(user)

    # Create notification if account status changed
    if is_active_changed:
        try:
            if new_is_active:
                # Account activated
                await create_notification(
                    db=db,
                    user_id=user.id,
                    type=NotificationType.SUCCESS,
                    title="Cuenta activada",
                    message="Tu cuenta ha sido activada. Ya puedes acceder a todas las funcionalidades del sistema.",
                    action_url="/dashboard",
                    tenant_id=user.tenant_id
                )
            else:
                # Account deactivated
                await create_notification(
                    db=db,
                    user_id=user.id,
                    type=NotificationType.WARNING,
                    title="Cuenta desactivada",
                    message="Tu cuenta ha sido desactivada. Contacta al administrador si crees que esto es un error.",
                    action_url="/dashboard/profile",
                    tenant_id=user.tenant_id
                )
        except Exception as e:
            print(f"Error creating activation/deactivation notification: {e}")

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Delete user by ID.
    - Superadmins can delete any user (except themselves)
    - Tenant admins can only delete users in their tenant
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta"
        )

    # Check access for non-superadmins
    if current_user.role != UserRole.superadmin:
        if user.tenant_id != current_user.current_tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este usuario"
            )
        # Tenant admins cannot delete other tenant_admins
        if user.role == UserRole.tenant_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes eliminar a otros administradores"
            )

    db.delete(user)
    db.commit()

    return None
