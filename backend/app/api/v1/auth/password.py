"""Password management endpoints."""
from datetime import timedelta, datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.security import verify_password, get_password_hash, get_current_active_user
from app.core.email import send_reset_password_email
from app.core.notifications import create_notification
from app.db.session import get_db
from app.models.user import User
from app.models.audit_log import AuditAction, AuditCategory
from app.models.notification import NotificationType
from app.schemas.user import ChangePassword
from app.api.v1.audit_logs import create_audit_log, get_client_ip

router = APIRouter()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/change-password")
async def change_password(
    request: Request,
    password_data: ChangePassword,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change current user's password."""
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )

    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

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
        print(f"Error creating notification: {e}")

    return {"message": "Contraseña actualizada correctamente"}


@router.post("/forgot-password")
async def forgot_password(
    http_request: Request,
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Request password reset."""
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        return {
            "message": "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña"
        }

    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)

    user.reset_password_token = reset_token
    user.reset_password_token_expires = expires_at
    db.commit()

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

    try:
        await send_reset_password_email(
            db=db,
            email_to=user.email,
            token=reset_token,
            user_name=user.full_name or user.email.split('@')[0]
        )
    except Exception as e:
        print(f"Error sending email: {e}")

    return {
        "message": "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña"
    }


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using the token sent via email."""
    user = db.query(User).filter(
        User.reset_password_token == request.token
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )

    if not user.reset_password_token_expires or user.reset_password_token_expires < datetime.utcnow():
        user.reset_password_token = None
        user.reset_password_token_expires = None
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token ha expirado. Por favor, solicita un nuevo enlace de recuperación"
        )

    user.hashed_password = get_password_hash(request.new_password)
    user.reset_password_token = None
    user.reset_password_token_expires = None
    db.commit()

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
