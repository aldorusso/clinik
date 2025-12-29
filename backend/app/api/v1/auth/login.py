"""Login and tenant selection endpoints."""
from datetime import timedelta, datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_current_active_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.models.audit_log import AuditAction, AuditCategory
from app.schemas.tenant_membership import (
    LoginResponseMultiTenant,
    AvailableTenant,
    SelectTenantRequest,
    SelectTenantResponse,
)
from app.api.v1.audit_logs import create_audit_log, get_client_ip

router = APIRouter()


@router.post("/login", response_model=LoginResponseMultiTenant)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token."""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

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
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        # Check if user has a pending invitation
        if user.invitation_token and not user.invitation_accepted_at:
            detail_message = "Tu cuenta está pendiente de activación. Revisa tu email para aceptar la invitación."
        else:
            detail_message = "Tu cuenta está desactivada. Contacta al administrador."

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
            detail=detail_message
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Case 1: Superadmin
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
        # Fallback: Check legacy tenant_id
        if user.tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id, Tenant.is_active == True).first()
            if tenant:
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

    # Case 2: Single membership
    if len(active_memberships) == 1:
        membership = active_memberships[0]
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

    # Case 3: Multiple memberships
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

    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "role": None,
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
    """Select a tenant after login."""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

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

    membership.last_access_at = datetime.utcnow()
    db.commit()

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
    """Switch to a different tenant."""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")[:500]

    if current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los superadmins no pertenecen a organizaciones"
        )

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

    membership.last_access_at = datetime.utcnow()
    db.commit()

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
    """Get list of all tenants the current user has access to."""
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
