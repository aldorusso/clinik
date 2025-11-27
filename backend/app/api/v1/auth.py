from datetime import timedelta, datetime
import secrets
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
)
from app.core.email import send_reset_password_email, send_welcome_email
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.audit_log import AuditAction, AuditCategory
from app.schemas.user import UserCreate, UserUpdate, Token, User as UserSchema, UserWithTenant, ChangePassword, AcceptInvitation
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


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token."""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

    # Authenticate user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Log failed login attempt
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

    # Check if tenant is active (for non-superadmin users)
    if user.role != UserRole.superadmin and user.tenant:
        if not user.tenant.is_active:
            create_audit_log(
                db=db,
                action=AuditAction.LOGIN_FAILED,
                category=AuditCategory.AUTH,
                user_id=user.id,
                user_email=user.email,
                tenant_id=user.tenant_id,
                ip_address=ip_address,
                user_agent=user_agent,
                details={"reason": "inactive_tenant"}
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tu organización está desactivada. Contacta al administrador."
            )

    # Log successful login
    create_audit_log(
        db=db,
        action=AuditAction.LOGIN_SUCCESS,
        category=AuditCategory.AUTH,
        user_id=user.id,
        user_email=user.email,
        tenant_id=user.tenant_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details={"role": user.role.value}
    )

    # Create access token with tenant_id for multi-tenant support
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": user.email,
        "role": user.role.value,
        "tenant_id": user.tenant_id  # Will be None for superadmin
    }
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserWithTenant)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information with tenant details."""
    # Add tenant information if user belongs to a tenant
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
        "role": current_user.role,
        "tenant_id": current_user.tenant_id,
        "is_active": current_user.is_active,
        "client_company_name": current_user.client_company_name,
        "client_tax_id": current_user.client_tax_id,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        "tenant_name": current_user.tenant.name if current_user.tenant else None,
        "tenant_slug": current_user.tenant.slug if current_user.tenant else None,
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
        tenant_id=current_user.tenant_id,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("User-Agent", "")[:500],
    )

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

    return {"message": "Contraseña restablecida exitosamente"}


@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Refresh the access token for the current user."""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

    # Check if tenant is still active (for non-superadmin users)
    if current_user.role != UserRole.superadmin and current_user.tenant:
        if not current_user.tenant.is_active:
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
        tenant_id=current_user.tenant_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": current_user.email,
        "role": current_user.role.value,
        "tenant_id": current_user.tenant_id
    }
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/accept-invitation", response_model=UserSchema)
async def accept_invitation(
    http_request: Request,
    request: AcceptInvitation,
    db: Session = Depends(get_db)
):
    """Accept invitation and complete user registration."""
    # Find user with this invitation token
    user = db.query(User).filter(
        User.invitation_token == request.token
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de invitación inválido o expirado"
        )

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

    return user
