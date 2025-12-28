"""Tenant user management endpoints."""
from typing import List, Optional
from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_password_hash,
    get_current_tenant_admin,
    get_current_tenant_member,
)
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.schemas.user import UserCreate, User as UserSchema, UserInvite
from app.core.email import send_welcome_email, send_invitation_email, send_existing_user_invitation_email

router = APIRouter()


@router.get("/my-tenant/users", response_model=List[UserSchema])
async def list_my_tenant_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    List all users in my tenant. Accessible by all tenant members.
    """
    # Check permissions - all tenant members can see the directory
    if current_user.role not in [UserRole.superadmin, UserRole.tenant_admin, UserRole.manager, UserRole.medico, UserRole.closer, UserRole.recepcionista]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver la lista de usuarios"
        )
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins no pertenecen a un tenant. Usa /users/ en su lugar."
        )

    query = db.query(User).filter(User.tenant_id == current_user.current_tenant_id)

    if role:
        query = query.filter(User.role == role)

    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users


@router.post("/my-tenant/users", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_my_tenant_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Create a user in my tenant. Accessible by tenant admins.
    Cannot create superadmins or admins (only users and clients).
    """
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins deben usar /users/ o /tenants/{tenant_id}/users"
        )

    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya esta registrado"
        )

    # Tenant admins can create all roles except superadmin and other tenant_admins
    allowed_roles = [UserRole.manager, UserRole.medico, UserRole.closer, UserRole.recepcionista]
    role = user_in.role or UserRole.medico
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes crear usuarios con rol 'manager', 'medico', 'closer' o 'recepcionista'"
        )

    # Create new user in the same tenant
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        full_name=user_in.full_name,
        phone=user_in.phone,
        country=user_in.country,
        city=user_in.city,
        office_address=user_in.office_address,
        company_name=user_in.company_name,
        job_title=user_in.job_title,
        profile_photo=user_in.profile_photo,
        role=role,
        tenant_id=current_user.current_tenant_id,
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
        print(f"Error enviando email de bienvenida: {e}")

    return db_user


@router.post("/my-tenant/invite", response_model=dict, status_code=status.HTTP_201_CREATED)
async def invite_user(
    invitation: UserInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Invite a user to join the tenant by email.
    Accessible by tenant admins.

    This endpoint handles two cases:
    1. New user: Creates a new user with pending invitation
    2. Existing user: Creates a TenantMembership and sends different email

    The tenant admin never knows if the user already exists (privacy).
    """
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins no pueden invitar usuarios a tenants"
        )

    # Tenant admins can only invite certain roles
    allowed_roles = [UserRole.manager, UserRole.medico, UserRole.closer, UserRole.recepcionista]
    if invitation.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes invitar usuarios con rol 'manager', 'medico', 'closer' o 'recepcionista'"
        )

    # Generate invitation token
    invitation_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=72)  # 3 days

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == invitation.email).first()

    if existing_user:
        # CASE 1: User already exists in the system

        # Check if already a member of this tenant
        existing_membership = db.query(TenantMembership).filter(
            TenantMembership.user_id == existing_user.id,
            TenantMembership.tenant_id == current_user.current_tenant_id
        ).first()

        if existing_membership:
            # Already a member - return same message as new invite (privacy)
            # But actually don't create anything new
            return {
                "message": f"Invitación enviada a {invitation.email}",
                "expires_at": expires_at.isoformat()
            }

        # Create pending TenantMembership for existing user
        membership = TenantMembership(
            user_id=existing_user.id,
            tenant_id=current_user.current_tenant_id,
            role=invitation.role,
            is_active=False,  # Pending until accepted
            invited_by_id=current_user.id,
            notes=f"Invitation token: {invitation_token}, expires: {expires_at.isoformat()}"
        )

        db.add(membership)
        db.commit()
        db.refresh(membership)

        # Send existing user invitation email
        try:
            inviter_name = current_user.full_name or current_user.first_name or current_user.email
            # Get tenant name from current session context
            current_tenant = db.query(Tenant).filter(Tenant.id == current_user.current_tenant_id).first()
            tenant_name = current_tenant.name if current_tenant else "la organización"
            user_name = existing_user.full_name or existing_user.first_name or None

            await send_existing_user_invitation_email(
                db=db,
                email_to=invitation.email,
                invitation_token=invitation_token,
                inviter_name=inviter_name,
                tenant_name=tenant_name,
                role=invitation.role.value,
                user_name=user_name
            )
        except Exception as e:
            print(f"Error enviando email de invitación: {e}")
            # Rollback membership creation if email fails
            db.delete(membership)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error enviando email de invitación"
            )

    else:
        # CASE 2: New user - create user with pending invitation
        db_user = User(
            email=invitation.email,
            hashed_password="",  # Will be set when accepting invitation
            first_name=invitation.first_name,
            last_name=invitation.last_name,
            role=invitation.role,
            tenant_id=current_user.current_tenant_id,
            is_active=False,  # Inactive until invitation is accepted
            invitation_token=invitation_token,
            invitation_token_expires=expires_at,
            invited_by_id=current_user.id
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Send new user invitation email
        try:
            inviter_name = current_user.full_name or current_user.first_name or current_user.email
            # Get tenant name from current session context
            current_tenant = db.query(Tenant).filter(Tenant.id == current_user.current_tenant_id).first()
            tenant_name = current_tenant.name if current_tenant else "la organización"

            await send_invitation_email(
                db=db,
                email_to=invitation.email,
                invitation_token=invitation_token,
                inviter_name=inviter_name,
                tenant_name=tenant_name,
                role=invitation.role.value
            )
        except Exception as e:
            print(f"Error enviando email de invitación: {e}")
            # Rollback user creation if email fails
            db.delete(db_user)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error enviando email de invitación"
            )

    # Return same message regardless of case (privacy)
    return {
        "message": f"Invitación enviada a {invitation.email}",
        "expires_at": expires_at.isoformat()
    }
