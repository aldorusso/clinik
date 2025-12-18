from datetime import timedelta, datetime
import secrets
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user,
    get_current_superadmin,
    decode_access_token,
)
from app.core.email import send_reset_password_email, send_welcome_email
from app.core.notifications import create_notification
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.models.audit_log import AuditAction, AuditCategory
from app.models.notification import NotificationType
from app.schemas.user import UserCreate, UserUpdate, Token, User as UserSchema, UserWithTenant, ChangePassword, AcceptInvitation
from app.schemas.tenant_membership import (
    LoginResponseMultiTenant,
    AvailableTenant,
    SelectTenantRequest,
    SelectTenantResponse,
)
from app.api.v1.audit_logs import create_audit_log, get_client_ip

router = APIRouter()


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
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


@router.post("/login", response_model=LoginResponseMultiTenant)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token.

    For multi-tenant support:
    - Superadmins get direct access (no tenant selection needed)
    - Users with single membership get direct access to that tenant
    - Users with multiple memberships must select a tenant after login

    Returns LoginResponseMultiTenant with:
    - requires_tenant_selection: true if user must call /select-tenant
    - available_tenants: list of tenants to choose from
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

    # Authenticate user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        create_audit_log(
            db=db,
            action=AuditAction.LOGIN_FAILED,
            category=AuditCategory.AUTH,
            user_email=form_data.username,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"reason": "invalid_credentials"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        create_audit_log(
            db=db,
            action=AuditAction.LOGIN_FAILED,
            category=AuditCategory.AUTH,
            user_id=user.id,
            user_email=user.email,
            tenant_id=user.tenant_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"reason": "inactive_user"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Case 1: Superadmin - no tenant selection needed
    if user.is_superadmin:
        create_audit_log(
            db=db,
            action=AuditAction.LOGIN_SUCCESS,
            category=AuditCategory.AUTH,
            user_id=user.id,
            user_email=user.email,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"role": "superadmin"}
        )

        token_data = {
            "sub": user.email,
            "user_id": user.id,
            "role": UserRole.superadmin.value,
            "tenant_id": None,
            "membership_id": None,
            "is_superadmin": True,
        }
        access_token = create_access_token(data=token_data, expires_delta=access_token_expires)

        return LoginResponseMultiTenant(
            access_token=access_token,
            requires_tenant_selection=False,
            is_superadmin=True,
            user_id=user.id,
            email=user.email,
            selected_role=UserRole.superadmin,
        )

    # Case 2 & 3: Regular user - check memberships
    active_memberships = db.query(TenantMembership).join(Tenant).filter(
        TenantMembership.user_id == user.id,
        TenantMembership.is_active == True,
        Tenant.is_active == True,
    ).all()

    if not active_memberships:
        # Fallback: Check legacy tenant_id field for backwards compatibility
        if user.tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id, Tenant.is_active == True).first()
            if tenant:
                # Create token with legacy data
                token_data = {
                    "sub": user.email,
                    "user_id": user.id,
                    "role": user.role.value,
                    "tenant_id": user.tenant_id,
                    "membership_id": None,
                    "is_superadmin": False,
                }
                access_token = create_access_token(data=token_data, expires_delta=access_token_expires)

                create_audit_log(
                    db=db,
                    action=AuditAction.LOGIN_SUCCESS,
                    category=AuditCategory.AUTH,
                    user_id=user.id,
                    user_email=user.email,
                    tenant_id=user.tenant_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    details={"role": user.role.value, "method": "legacy"}
                )

                return LoginResponseMultiTenant(
                    access_token=access_token,
                    requires_tenant_selection=False,
                    user_id=user.id,
                    email=user.email,
                    selected_tenant_id=user.tenant_id,
                    selected_role=user.role,
                )

        # No memberships and no legacy tenant
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tienes acceso a ninguna organización activa"
        )

    # Build available tenants list
    available_tenants: List[AvailableTenant] = []
    for membership in active_memberships:
        available_tenants.append(AvailableTenant(
            membership_id=membership.id,
            tenant_id=membership.tenant_id,
            tenant_name=membership.tenant.name,
            tenant_slug=membership.tenant.slug,
            tenant_logo=membership.tenant.logo,
            role=membership.role,
            is_default=membership.is_default,
            last_access_at=membership.last_access_at,
        ))

    # Case 2: Single membership - direct login
    if len(active_memberships) == 1:
        membership = active_memberships[0]

        # Update last access
        membership.last_access_at = datetime.utcnow()
        db.commit()

        create_audit_log(
            db=db,
            action=AuditAction.LOGIN_SUCCESS,
            category=AuditCategory.AUTH,
            user_id=user.id,
            user_email=user.email,
            tenant_id=membership.tenant_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"role": membership.role.value, "membership_id": str(membership.id)}
        )

        token_data = {
            "sub": user.email,
            "user_id": user.id,
            "role": membership.role.value,
            "tenant_id": membership.tenant_id,
            "membership_id": membership.id,
            "is_superadmin": False,
        }
        access_token = create_access_token(data=token_data, expires_delta=access_token_expires)

        return LoginResponseMultiTenant(
            access_token=access_token,
            requires_tenant_selection=False,
            user_id=user.id,
            email=user.email,
            selected_tenant_id=membership.tenant_id,
            selected_role=membership.role,
            available_tenants=available_tenants,
        )

    # Case 3: Multiple memberships - require tenant selection
    # Create a temporary token without tenant context (limited permissions)
    create_audit_log(
        db=db,
        action=AuditAction.LOGIN_SUCCESS,
        category=AuditCategory.AUTH,
        user_id=user.id,
        user_email=user.email,
        ip_address=ip_address,
        user_agent=user_agent,
        details={"requires_tenant_selection": True, "tenant_count": len(active_memberships)}
    )

    # Token without tenant - only valid for /select-tenant endpoint
    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "role": None,  # No role until tenant is selected
        "tenant_id": None,
        "membership_id": None,
        "is_superadmin": False,
    }
    access_token = create_access_token(data=token_data, expires_delta=access_token_expires)

    return LoginResponseMultiTenant(
        access_token=access_token,
        requires_tenant_selection=True,
        available_tenants=available_tenants,
        user_id=user.id,
        email=user.email,
    )


@router.post("/select-tenant", response_model=SelectTenantResponse)
async def select_tenant(
    request: Request,
    tenant_request: SelectTenantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Select a tenant after login (for users with multiple memberships).

    This endpoint is used when login returns requires_tenant_selection=True.
    User must have a valid membership for the requested tenant.
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

    # Find the membership for the requested tenant
    membership = db.query(TenantMembership).join(Tenant).filter(
        TenantMembership.user_id == current_user.id,
        TenantMembership.tenant_id == tenant_request.tenant_id,
        TenantMembership.is_active == True,
        Tenant.is_active == True,
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a esta organización"
        )

    # Update last access
    membership.last_access_at = datetime.utcnow()
    db.commit()

    # Log tenant selection
    create_audit_log(
        db=db,
        action=AuditAction.LOGIN_SUCCESS,
        category=AuditCategory.AUTH,
        user_id=current_user.id,
        user_email=current_user.email,
        tenant_id=membership.tenant_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details={"action": "tenant_selected", "role": membership.role.value}
    )

    # Create new token with tenant context
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": current_user.email,
        "user_id": current_user.id,
        "role": membership.role.value,
        "tenant_id": membership.tenant_id,
        "membership_id": membership.id,
        "is_superadmin": False,
    }
    access_token = create_access_token(data=token_data, expires_delta=access_token_expires)

    return SelectTenantResponse(
        access_token=access_token,
        tenant_id=membership.tenant_id,
        tenant_name=membership.tenant.name,
        role=membership.role,
    )


@router.post("/switch-tenant", response_model=SelectTenantResponse)
async def switch_tenant(
    request: Request,
    tenant_request: SelectTenantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Switch to a different tenant (for users already logged in).

    Allows users with multiple memberships to switch between organizations
    without logging out and back in.
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

    # Superadmins can't switch tenants (they don't have memberships)
    if current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los superadmins no pertenecen a organizaciones"
        )

    # Find the membership for the requested tenant
    membership = db.query(TenantMembership).join(Tenant).filter(
        TenantMembership.user_id == current_user.id,
        TenantMembership.tenant_id == tenant_request.tenant_id,
        TenantMembership.is_active == True,
        Tenant.is_active == True,
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a esta organización"
        )

    # Update last access
    membership.last_access_at = datetime.utcnow()
    db.commit()

    # Log tenant switch
    create_audit_log(
        db=db,
        action=AuditAction.LOGIN_SUCCESS,
        category=AuditCategory.AUTH,
        user_id=current_user.id,
        user_email=current_user.email,
        tenant_id=membership.tenant_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details={"action": "tenant_switched", "role": membership.role.value}
    )

    # Create new token with the selected tenant context
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": current_user.email,
        "user_id": current_user.id,
        "role": membership.role.value,
        "tenant_id": membership.tenant_id,
        "membership_id": membership.id,
        "is_superadmin": False,
    }
    access_token = create_access_token(data=token_data, expires_delta=access_token_expires)

    return SelectTenantResponse(
        access_token=access_token,
        tenant_id=membership.tenant_id,
        tenant_name=membership.tenant.name,
        role=membership.role,
    )


@router.get("/my-tenants")
async def get_my_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get list of all tenants the current user has access to.

    Useful for displaying a tenant switcher in the UI.
    """
    if current_user.is_superadmin:
        return {
            "is_superadmin": True,
            "tenants": [],
            "current_tenant_id": None,
        }

    memberships = db.query(TenantMembership).join(Tenant).filter(
        TenantMembership.user_id == current_user.id,
        TenantMembership.is_active == True,
        Tenant.is_active == True,
    ).all()

    tenants = []
    for m in memberships:
        tenants.append({
            "membership_id": m.id,
            "tenant_id": m.tenant_id,
            "tenant_name": m.tenant.name,
            "tenant_slug": m.tenant.slug,
            "tenant_logo": m.tenant.logo,
            "role": m.role.value,
            "is_default": m.is_default,
            "is_current": m.tenant_id == current_user.current_tenant_id,
        })

    return {
        "is_superadmin": False,
        "tenants": tenants,
        "current_tenant_id": current_user.current_tenant_id,
    }


@router.get("/me", response_model=UserWithTenant)
async def read_users_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get current user information with tenant details.

    Uses current_role and current_tenant_id from session context (JWT).
    """
    # Get current tenant if applicable
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
        "role": current_user.current_role,  # Use session context role
        "tenant_id": current_user.current_tenant_id,  # Use session context tenant
        "is_active": current_user.is_active,
        "client_company_name": current_user.client_company_name,
        "client_tax_id": current_user.client_tax_id,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        "tenant_name": current_tenant.name if current_tenant else None,
        "tenant_slug": current_tenant.slug if current_tenant else None,
    }
    return user_dict


@router.post("/create-superadmin", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_superadmin_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_superadmin: User = Depends(get_current_superadmin)
):
    """Create a new superadmin user. Only accessible by superadmins."""
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new superadmin user (no tenant_id)
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=UserRole.superadmin,
        tenant_id=None  # Superadmins don't belong to any tenant
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
    # Update fields if provided
    update_data = user_update.model_dump(exclude_unset=True)

    # Handle password update separately
    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            update_data["hashed_password"] = get_password_hash(password)

    # Update user
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/change-password")
async def change_password(
    request: Request,
    password_data: ChangePassword,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change current user's password."""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    # Log password change
    create_audit_log(
        db=db,
        action=AuditAction.PASSWORD_CHANGED,
        category=AuditCategory.AUTH,
        user_id=current_user.id,
        user_email=current_user.email,
        tenant_id=current_user.current_tenant_id,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("User-Agent", "")[:500],
    )

    # Create notification for password change
    try:
        await create_notification(
            db=db,
            user_id=current_user.id,
            type=NotificationType.WARNING,
            title="Contraseña actualizada",
            message="Tu contraseña fue cambiada exitosamente. Si no fuiste tú, contacta al administrador inmediatamente.",
            action_url="/dashboard/profile?tab=security",
            tenant_id=current_user.current_tenant_id
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error creating notification: {e}")

    return {"message": "Contraseña actualizada correctamente"}


# Password reset schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(
    http_request: Request,
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Request password reset. Sends an email with reset token."""
    user = db.query(User).filter(User.email == request.email).first()

    # Always return success even if user doesn't exist (security best practice)
    if not user:
        return {
            "message": "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña"
        }

    # Generate secure random token
    reset_token = secrets.token_urlsafe(32)

    # Set token expiration
    expires_at = datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)

    # Save token to database
    user.reset_password_token = reset_token
    user.reset_password_token_expires = expires_at
    db.commit()

    # Log password reset request
    create_audit_log(
        db=db,
        action=AuditAction.PASSWORD_RESET_REQUESTED,
        category=AuditCategory.AUTH,
        user_id=user.id,
        user_email=user.email,
        tenant_id=user.tenant_id,
        ip_address=get_client_ip(http_request),
        user_agent=http_request.headers.get("User-Agent", "")[:500],
    )

    # Send email with reset link
    try:
        await send_reset_password_email(
            db=db,
            email_to=user.email,
            token=reset_token,
            user_name=user.full_name or user.email.split('@')[0]
        )
    except Exception as e:
        # Log error but don't expose it to user
        print(f"Error sending email: {e}")
        # In production, you might want to use proper logging

    return {
        "message": "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña"
    }


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using the token sent via email."""
    # Find user with this token
    user = db.query(User).filter(
        User.reset_password_token == request.token
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )

    # Check if token has expired
    if not user.reset_password_token_expires or user.reset_password_token_expires < datetime.utcnow():
        # Clear expired token
        user.reset_password_token = None
        user.reset_password_token_expires = None
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token ha expirado. Por favor, solicita un nuevo enlace de recuperación"
        )

    # Update password
    user.hashed_password = get_password_hash(request.new_password)

    # Clear reset token
    user.reset_password_token = None
    user.reset_password_token_expires = None

    db.commit()

    # Create notification for password reset
    try:
        await create_notification(
            db=db,
            user_id=user.id,
            type=NotificationType.SUCCESS,
            title="Contraseña restablecida",
            message="Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.",
            action_url="/login",
            tenant_id=user.tenant_id
        )
    except Exception as e:
        print(f"Error creating notification: {e}")

    return {"message": "Contraseña restablecida exitosamente"}


@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Refresh the access token for the current user.

    Preserves the current tenant context from the existing token.
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

    # Check if tenant is still active (for non-superadmin users)
    if not current_user.is_superadmin and current_user.current_tenant_id:
        tenant = db.query(Tenant).filter(Tenant.id == current_user.current_tenant_id).first()
        if tenant and not tenant.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tu organización está desactivada. Contacta al administrador."
            )

    # Log token refresh
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

    # Create new access token preserving current context
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


class InvitationInfoResponse(BaseModel):
    """Response for invitation info check."""
    is_valid: bool
    is_existing_user: bool = False
    tenant_name: Optional[str] = None
    role: Optional[str] = None
    inviter_name: Optional[str] = None
    user_email: Optional[str] = None
    requires_password: bool = True  # New users need to set password


@router.get("/invitation-info/{token}")
async def get_invitation_info(
    token: str,
    db: Session = Depends(get_db)
):
    """Get information about an invitation token.

    This helps the frontend know whether to show:
    - Password creation form (new user)
    - Simple accept button (existing user)
    """
    # First, check if it's a new user invitation (token in User table)
    user = db.query(User).filter(User.invitation_token == token).first()

    if user:
        # New user invitation
        if user.invitation_token_expires and user.invitation_token_expires < datetime.utcnow():
            return InvitationInfoResponse(is_valid=False)

        if user.invitation_accepted_at:
            return InvitationInfoResponse(is_valid=False)

        tenant_name = user.tenant.name if user.tenant else None
        inviter = db.query(User).filter(User.id == user.invited_by_id).first() if user.invited_by_id else None
        inviter_name = inviter.full_name or inviter.first_name or inviter.email if inviter else None

        role_translations = {
            UserRole.tenant_admin: "Administrador",
            UserRole.manager: "Manager",
            UserRole.medico: "Médico",
            UserRole.closer: "Closer/Comercial",
            UserRole.recepcionista: "Recepcionista"
        }

        return InvitationInfoResponse(
            is_valid=True,
            is_existing_user=False,
            tenant_name=tenant_name,
            role=role_translations.get(user.role, user.role.value),
            inviter_name=inviter_name,
            user_email=user.email,
            requires_password=True
        )

    # Check if it's an existing user invitation (token in TenantMembership.notes)
    # We stored: "Invitation token: {token}, expires: {date}"
    membership = db.query(TenantMembership).filter(
        TenantMembership.notes.contains(f"Invitation token: {token}"),
        TenantMembership.is_active == False  # Pending invitation
    ).first()

    if membership:
        # Parse expiration from notes
        import re
        match = re.search(r'expires: (.+)$', membership.notes or '')
        if match:
            try:
                expires_str = match.group(1)
                expires_at = datetime.fromisoformat(expires_str)
                if expires_at < datetime.utcnow():
                    return InvitationInfoResponse(is_valid=False)
            except (ValueError, TypeError):
                pass  # If parsing fails, consider it valid (let accept handle it)

        existing_user = db.query(User).filter(User.id == membership.user_id).first()
        tenant = db.query(Tenant).filter(Tenant.id == membership.tenant_id).first()
        inviter = db.query(User).filter(User.id == membership.invited_by_id).first() if membership.invited_by_id else None

        role_translations = {
            UserRole.tenant_admin: "Administrador",
            UserRole.manager: "Manager",
            UserRole.medico: "Médico",
            UserRole.closer: "Closer/Comercial",
            UserRole.recepcionista: "Recepcionista"
        }

        return InvitationInfoResponse(
            is_valid=True,
            is_existing_user=True,
            tenant_name=tenant.name if tenant else None,
            role=role_translations.get(membership.role, membership.role.value),
            inviter_name=inviter.full_name or inviter.first_name or inviter.email if inviter else None,
            user_email=existing_user.email if existing_user else None,
            requires_password=False  # Existing user already has password
        )

    return InvitationInfoResponse(is_valid=False)


@router.post("/accept-invitation", response_model=UserSchema)
async def accept_invitation(
    http_request: Request,
    request: AcceptInvitation,
    db: Session = Depends(get_db)
):
    """Accept invitation and complete user registration.

    Handles two cases:
    1. New user: Creates user account with password
    2. Existing user: Activates TenantMembership (password optional, can be used for verification)
    """
    # First, check if it's a new user invitation (token in User table)
    user = db.query(User).filter(
        User.invitation_token == request.token
    ).first()

    if user:
        # CASE 1: New user invitation
        # Check if token has expired
        if not user.invitation_token_expires or user.invitation_token_expires < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La invitación ha expirado. Por favor, solicita una nueva invitación"
            )

        # Check if invitation was already accepted
        if user.invitation_accepted_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta invitación ya fue aceptada"
            )

        # For new users, password is required
        if not request.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña es requerida para nuevos usuarios"
            )

        # Update user with password and optional info
        user.hashed_password = get_password_hash(request.password)
        if request.first_name:
            user.first_name = request.first_name
        if request.last_name:
            user.last_name = request.last_name
        if request.phone:
            user.phone = request.phone

        # Activate user and mark invitation as accepted
        user.is_active = True
        user.invitation_accepted_at = datetime.utcnow()
        user.invitation_token = None
        user.invitation_token_expires = None

        # Also create TenantMembership for consistency
        existing_membership = db.query(TenantMembership).filter(
            TenantMembership.user_id == user.id,
            TenantMembership.tenant_id == user.tenant_id
        ).first()

        if not existing_membership and user.tenant_id:
            membership = TenantMembership(
                user_id=user.id,
                tenant_id=user.tenant_id,
                role=user.role,
                is_active=True,
                is_default=True,
                invited_by_id=user.invited_by_id
            )
            db.add(membership)

        db.commit()
        db.refresh(user)

        # Log invitation acceptance
        create_audit_log(
            db=db,
            action=AuditAction.USER_CREATED,
            category=AuditCategory.USER,
            user_id=user.id,
            user_email=user.email,
            tenant_id=user.tenant_id,
            ip_address=get_client_ip(http_request),
            user_agent=http_request.headers.get("User-Agent", "")[:500],
            details={"method": "invitation_accepted", "role": user.role.value}
        )

        # Send welcome email
        try:
            await send_welcome_email(
                db=db,
                email_to=user.email,
                user_name=user.first_name or user.email.split('@')[0]
            )
        except Exception as e:
            print(f"Error sending welcome email: {e}")

        # Create welcome notification for the new user
        try:
            tenant_name = user.tenant.name if user.tenant else "la plataforma"
            role_display = {
                UserRole.tenant_admin: "Administrador",
                UserRole.manager: "Manager",
                UserRole.medico: "Médico",
                UserRole.closer: "Closer/Comercial",
                UserRole.recepcionista: "Recepcionista"
            }.get(user.role, user.role.value)

            await create_notification(
                db=db,
                user_id=user.id,
                type=NotificationType.SUCCESS,
                title="¡Bienvenido al equipo!",
                message=f"Te has unido a {tenant_name} como {role_display}. Explora el dashboard y comienza a trabajar.",
                action_url="/dashboard",
                tenant_id=user.tenant_id
            )
        except Exception as e:
            print(f"Error creating welcome notification: {e}")

        # Notify tenant admins about the new member
        if user.tenant_id:
            try:
                tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
                if tenant:
                    admin_users = db.query(User).filter(
                        User.tenant_id == user.tenant_id,
                        User.role == UserRole.tenant_admin,
                        User.id != user.id,
                        User.is_active == True
                    ).all()

                    user_name = user.first_name or user.email.split('@')[0]
                    for admin in admin_users:
                        await create_notification(
                            db=db,
                            user_id=admin.id,
                            type=NotificationType.INFO,
                            title="Nuevo miembro en el equipo",
                            message=f"{user_name} ha aceptado tu invitación y se ha unido como {role_display}.",
                            action_url="/dashboard/users",
                            tenant_id=user.tenant_id
                        )
            except Exception as e:
                print(f"Error notifying admins: {e}")

        return user

    # CASE 2: Check if it's an existing user invitation (token in TenantMembership.notes)
    import re
    membership = db.query(TenantMembership).filter(
        TenantMembership.notes.contains(f"Invitation token: {request.token}"),
        TenantMembership.is_active == False
    ).first()

    if membership:
        # Parse and check expiration
        match = re.search(r'expires: (.+)$', membership.notes or '')
        if match:
            try:
                expires_str = match.group(1)
                expires_at = datetime.fromisoformat(expires_str)
                if expires_at < datetime.utcnow():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="La invitación ha expirado. Por favor, solicita una nueva invitación"
                    )
            except (ValueError, TypeError):
                pass

        # Get the existing user
        existing_user = db.query(User).filter(User.id == membership.user_id).first()
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario no encontrado"
            )

        # If password provided, verify it (optional security step)
        if request.password:
            if not verify_password(request.password, existing_user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Contraseña incorrecta. Por favor, usa tu contraseña actual."
                )

        # Activate the membership
        membership.is_active = True
        membership.joined_at = datetime.utcnow()
        membership.notes = None  # Clear the invitation token from notes

        db.commit()
        db.refresh(existing_user)

        # Get tenant for notifications
        tenant = db.query(Tenant).filter(Tenant.id == membership.tenant_id).first()
        tenant_name = tenant.name if tenant else "la organización"

        role_display = {
            UserRole.tenant_admin: "Administrador",
            UserRole.manager: "Manager",
            UserRole.medico: "Médico",
            UserRole.closer: "Closer/Comercial",
            UserRole.recepcionista: "Recepcionista"
        }.get(membership.role, membership.role.value)

        # Log membership activation
        create_audit_log(
            db=db,
            action=AuditAction.USER_UPDATED,
            category=AuditCategory.USER,
            user_id=existing_user.id,
            user_email=existing_user.email,
            tenant_id=membership.tenant_id,
            ip_address=get_client_ip(http_request),
            user_agent=http_request.headers.get("User-Agent", "")[:500],
            details={"method": "existing_user_invitation_accepted", "role": membership.role.value}
        )

        # Create notification for the user
        try:
            await create_notification(
                db=db,
                user_id=existing_user.id,
                type=NotificationType.SUCCESS,
                title=f"Te uniste a {tenant_name}",
                message=f"Ahora eres parte de {tenant_name} como {role_display}. Puedes cambiar entre organizaciones desde tu perfil.",
                action_url="/dashboard",
                tenant_id=membership.tenant_id
            )
        except Exception as e:
            print(f"Error creating notification: {e}")

        # Notify tenant admins
        if tenant:
            try:
                admin_users = db.query(User).filter(
                    User.tenant_id == membership.tenant_id,
                    User.role == UserRole.tenant_admin,
                    User.id != existing_user.id,
                    User.is_active == True
                ).all()

                # Also check admins via memberships
                admin_memberships = db.query(TenantMembership).filter(
                    TenantMembership.tenant_id == membership.tenant_id,
                    TenantMembership.role == UserRole.tenant_admin,
                    TenantMembership.user_id != existing_user.id,
                    TenantMembership.is_active == True
                ).all()

                notified_admin_ids = set()
                user_name = existing_user.first_name or existing_user.email.split('@')[0]

                for admin in admin_users:
                    if admin.id not in notified_admin_ids:
                        await create_notification(
                            db=db,
                            user_id=admin.id,
                            type=NotificationType.INFO,
                            title="Nuevo miembro en el equipo",
                            message=f"{user_name} ha aceptado tu invitación y se ha unido como {role_display}.",
                            action_url="/dashboard/users",
                            tenant_id=membership.tenant_id
                        )
                        notified_admin_ids.add(admin.id)

                for admin_membership in admin_memberships:
                    if admin_membership.user_id not in notified_admin_ids:
                        await create_notification(
                            db=db,
                            user_id=admin_membership.user_id,
                            type=NotificationType.INFO,
                            title="Nuevo miembro en el equipo",
                            message=f"{user_name} ha aceptado tu invitación y se ha unido como {role_display}.",
                            action_url="/dashboard/users",
                            tenant_id=membership.tenant_id
                        )
                        notified_admin_ids.add(admin_membership.user_id)

            except Exception as e:
                print(f"Error notifying admins: {e}")

        return existing_user

    # No valid invitation found
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Token de invitación inválido o expirado"
    )
