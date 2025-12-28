"""Invitation management endpoints."""
from datetime import datetime
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.security import verify_password, get_password_hash
from app.core.email import send_welcome_email
from app.core.notifications import create_notification
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.models.audit_log import AuditAction, AuditCategory
from app.models.notification import NotificationType
from app.schemas.user import User as UserSchema, AcceptInvitation
from app.api.v1.audit_logs import create_audit_log, get_client_ip

router = APIRouter()

ROLE_TRANSLATIONS = {
    UserRole.tenant_admin: "Administrador",
    UserRole.manager: "Manager",
    UserRole.medico: "Médico",
    UserRole.closer: "Closer/Comercial",
    UserRole.recepcionista: "Recepcionista"
}


class InvitationInfoResponse(BaseModel):
    """Response for invitation info check."""
    is_valid: bool
    is_existing_user: bool = False
    tenant_name: Optional[str] = None
    role: Optional[str] = None
    inviter_name: Optional[str] = None
    user_email: Optional[str] = None
    requires_password: bool = True


@router.get("/invitation-info/{token}")
async def get_invitation_info(
    token: str,
    db: Session = Depends(get_db)
):
    """Get information about an invitation token."""
    # Check new user invitation
    user = db.query(User).filter(User.invitation_token == token).first()

    if user:
        if user.invitation_token_expires and user.invitation_token_expires < datetime.utcnow():
            return InvitationInfoResponse(is_valid=False)

        if user.invitation_accepted_at:
            return InvitationInfoResponse(is_valid=False)

        tenant_name = user.tenant.name if user.tenant else None
        inviter = db.query(User).filter(User.id == user.invited_by_id).first() if user.invited_by_id else None
        inviter_name = inviter.full_name or inviter.first_name or inviter.email if inviter else None

        return InvitationInfoResponse(
            is_valid=True,
            is_existing_user=False,
            tenant_name=tenant_name,
            role=ROLE_TRANSLATIONS.get(user.role, user.role.value),
            inviter_name=inviter_name,
            user_email=user.email,
            requires_password=True
        )

    # Check existing user invitation
    membership = db.query(TenantMembership).filter(
        TenantMembership.notes.contains(f"Invitation token: {token}"),
        TenantMembership.is_active == False
    ).first()

    if membership:
        match = re.search(r'expires: (.+)$', membership.notes or '')
        if match:
            try:
                expires_str = match.group(1)
                expires_at = datetime.fromisoformat(expires_str)
                if expires_at < datetime.utcnow():
                    return InvitationInfoResponse(is_valid=False)
            except (ValueError, TypeError):
                pass

        existing_user = db.query(User).filter(User.id == membership.user_id).first()
        tenant = db.query(Tenant).filter(Tenant.id == membership.tenant_id).first()
        inviter = db.query(User).filter(User.id == membership.invited_by_id).first() if membership.invited_by_id else None

        return InvitationInfoResponse(
            is_valid=True,
            is_existing_user=True,
            tenant_name=tenant.name if tenant else None,
            role=ROLE_TRANSLATIONS.get(membership.role, membership.role.value),
            inviter_name=inviter.full_name or inviter.first_name or inviter.email if inviter else None,
            user_email=existing_user.email if existing_user else None,
            requires_password=False
        )

    return InvitationInfoResponse(is_valid=False)


@router.post("/accept-invitation", response_model=UserSchema)
async def accept_invitation(
    http_request: Request,
    request: AcceptInvitation,
    db: Session = Depends(get_db)
):
    """Accept invitation and complete user registration."""
    # Check new user invitation
    user = db.query(User).filter(
        User.invitation_token == request.token
    ).first()

    if user:
        return await _accept_new_user_invitation(http_request, request, user, db)

    # Check existing user invitation
    membership = db.query(TenantMembership).filter(
        TenantMembership.notes.contains(f"Invitation token: {request.token}"),
        TenantMembership.is_active == False
    ).first()

    if membership:
        return await _accept_existing_user_invitation(http_request, request, membership, db)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Token de invitación inválido o expirado"
    )


async def _accept_new_user_invitation(
    http_request: Request,
    request: AcceptInvitation,
    user: User,
    db: Session
) -> User:
    """Handle new user invitation acceptance."""
    if not user.invitation_token_expires or user.invitation_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La invitación ha expirado. Por favor, solicita una nueva invitación"
        )

    if user.invitation_accepted_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta invitación ya fue aceptada"
        )

    if not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña es requerida para nuevos usuarios"
        )

    user.hashed_password = get_password_hash(request.password)
    if request.first_name:
        user.first_name = request.first_name
    if request.last_name:
        user.last_name = request.last_name
    if request.phone:
        user.phone = request.phone

    user.is_active = True
    user.invitation_accepted_at = datetime.utcnow()
    user.invitation_token = None
    user.invitation_token_expires = None

    # Create TenantMembership
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

    try:
        await send_welcome_email(
            db=db,
            email_to=user.email,
            user_name=user.first_name or user.email.split('@')[0]
        )
    except Exception as e:
        print(f"Error sending welcome email: {e}")

    await _send_invitation_notifications(db, user, user.role)

    return user


async def _accept_existing_user_invitation(
    http_request: Request,
    request: AcceptInvitation,
    membership: TenantMembership,
    db: Session
) -> User:
    """Handle existing user invitation acceptance."""
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

    existing_user = db.query(User).filter(User.id == membership.user_id).first()
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no encontrado"
        )

    if request.password:
        if not verify_password(request.password, existing_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Contraseña incorrecta. Por favor, usa tu contraseña actual."
            )

    membership.is_active = True
    membership.joined_at = datetime.utcnow()
    membership.notes = None

    db.commit()
    db.refresh(existing_user)

    tenant = db.query(Tenant).filter(Tenant.id == membership.tenant_id).first()

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

    tenant_name = tenant.name if tenant else "la organización"
    role_display = ROLE_TRANSLATIONS.get(membership.role, membership.role.value)

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

    await _notify_admins_about_new_member(db, existing_user, membership, role_display)

    return existing_user


async def _send_invitation_notifications(db: Session, user: User, role: UserRole):
    """Send notifications for new user invitation acceptance."""
    tenant_name = user.tenant.name if user.tenant else "la plataforma"
    role_display = ROLE_TRANSLATIONS.get(role, role.value)

    try:
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


async def _notify_admins_about_new_member(
    db: Session,
    user: User,
    membership: TenantMembership,
    role_display: str
):
    """Notify admins about new team member."""
    tenant = db.query(Tenant).filter(Tenant.id == membership.tenant_id).first()
    if not tenant:
        return

    try:
        admin_users = db.query(User).filter(
            User.tenant_id == membership.tenant_id,
            User.role == UserRole.tenant_admin,
            User.id != user.id,
            User.is_active == True
        ).all()

        admin_memberships = db.query(TenantMembership).filter(
            TenantMembership.tenant_id == membership.tenant_id,
            TenantMembership.role == UserRole.tenant_admin,
            TenantMembership.user_id != user.id,
            TenantMembership.is_active == True
        ).all()

        notified_admin_ids = set()
        user_name = user.first_name or user.email.split('@')[0]

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
