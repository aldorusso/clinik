from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.security import (
    get_password_hash,
    get_current_superadmin,
    get_current_active_user,
    verify_tenant_access,
)
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.audit_log import AuditAction, AuditCategory
from app.schemas.tenant import (
    TenantUpdate,
    Tenant as TenantSchema,
    TenantList,
    TenantWithStats,
    TenantCreateWithAdmin,
)
from app.schemas.user import User as UserSchema
from app.core.email import send_welcome_email
from app.api.v1.audit_logs import create_audit_log, get_client_ip

router = APIRouter()


# ============================================
# SUPERADMIN ENDPOINTS - Gestión global de tenants
# ============================================

@router.get("/", response_model=List[TenantList])
async def list_tenants(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    List all tenants. Only accessible by superadmins.
    """
    query = db.query(Tenant)

    if is_active is not None:
        query = query.filter(Tenant.is_active == is_active)

    tenants = query.order_by(Tenant.created_at.desc()).offset(skip).limit(limit).all()
    return tenants


@router.get("/stats", response_model=List[TenantWithStats])
async def list_tenants_with_stats(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    List all tenants with user statistics. Only accessible by superadmins.
    """
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for tenant in tenants:
        # Count users by role for this tenant
        user_count = db.query(func.count(User.id)).filter(
            User.tenant_id == tenant.id,
            User.role == UserRole.user
        ).scalar()

        tenant_admin_count = db.query(func.count(User.id)).filter(
            User.tenant_id == tenant.id,
            User.role == UserRole.tenant_admin
        ).scalar()

        manager_count = db.query(func.count(User.id)).filter(
            User.tenant_id == tenant.id,
            User.role == UserRole.manager
        ).scalar()

        client_count = db.query(func.count(User.id)).filter(
            User.tenant_id == tenant.id,
            User.role == UserRole.closer
        ).scalar()

        tenant_data = TenantWithStats(
            **TenantSchema.model_validate(tenant).model_dump(),
            user_count=user_count,
            tenant_admin_count=tenant_admin_count,
            manager_count=manager_count,
            client_count=client_count
        )
        result.append(tenant_data)

    return result


@router.post("/", response_model=TenantSchema, status_code=status.HTTP_201_CREATED)
async def create_tenant_with_admin(
    request: Request,
    data: TenantCreateWithAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    Create a new tenant with its first tenant_admin user. Only accessible by superadmins.
    """
    # Check if slug already exists
    existing = db.query(Tenant).filter(Tenant.slug == data.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El slug ya está en uso"
        )

    # Check if admin email already exists
    existing_user = db.query(User).filter(User.email == data.admin_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email del administrador ya está registrado"
        )

    # Create tenant
    tenant_data = data.model_dump(exclude={'admin_email', 'admin_password', 'admin_first_name', 'admin_last_name'})
    db_tenant = Tenant(**tenant_data)
    db.add(db_tenant)
    db.flush()  # Get the tenant ID without committing

    # Create admin user for this tenant
    hashed_password = get_password_hash(data.admin_password)
    db_admin = User(
        email=data.admin_email,
        hashed_password=hashed_password,
        first_name=data.admin_first_name,
        last_name=data.admin_last_name,
        role=UserRole.tenant_admin,
        tenant_id=db_tenant.id,
        is_active=True
    )
    db.add(db_admin)

    db.commit()
    db.refresh(db_tenant)
    db.refresh(db_admin)

    # Log tenant creation
    create_audit_log(
        db=db,
        action=AuditAction.TENANT_CREATED,
        category=AuditCategory.TENANT,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_type="tenant",
        entity_id=str(db_tenant.id),
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("User-Agent", "")[:500],
        details={"tenant_name": db_tenant.name, "tenant_slug": db_tenant.slug, "admin_email": db_admin.email}
    )

    # Enviar email de bienvenida al admin del tenant
    try:
        await send_welcome_email(
            db=db,
            email_to=db_admin.email,
            user_name=db_admin.first_name or db_admin.email.split('@')[0]
        )
    except Exception as e:
        print(f"Error enviando email de bienvenida: {e}")

    return db_tenant


@router.get("/{tenant_id}", response_model=TenantWithStats)
async def get_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a tenant by ID. Superadmins can access any tenant,
    other users can only access their own tenant.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    # Check access
    if not verify_tenant_access(current_user, tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este tenant"
        )

    # Get user counts
    user_count = db.query(func.count(User.id)).filter(
        User.tenant_id == tenant.id,
        User.role == UserRole.user
    ).scalar()

    tenant_admin_count = db.query(func.count(User.id)).filter(
        User.tenant_id == tenant.id,
        User.role == UserRole.tenant_admin
    ).scalar()

    manager_count = db.query(func.count(User.id)).filter(
        User.tenant_id == tenant.id,
        User.role == UserRole.manager
    ).scalar()

    client_count = db.query(func.count(User.id)).filter(
        User.tenant_id == tenant.id,
        User.role == UserRole.closer
    ).scalar()

    return TenantWithStats(
        **TenantSchema.model_validate(tenant).model_dump(),
        user_count=user_count,
        tenant_admin_count=tenant_admin_count,
        manager_count=manager_count,
        client_count=client_count
    )


@router.put("/{tenant_id}", response_model=TenantSchema)
async def update_tenant(
    request: Request,
    tenant_id: UUID,
    tenant_in: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    Update a tenant. Only accessible by superadmins.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    # Check slug uniqueness if being updated
    update_data = tenant_in.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != tenant.slug:
        existing = db.query(Tenant).filter(Tenant.slug == update_data["slug"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El slug ya está en uso"
            )

    # Update tenant
    for field, value in update_data.items():
        setattr(tenant, field, value)

    db.commit()
    db.refresh(tenant)

    # Log tenant update
    create_audit_log(
        db=db,
        action=AuditAction.TENANT_UPDATED,
        category=AuditCategory.TENANT,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_type="tenant",
        entity_id=str(tenant_id),
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("User-Agent", "")[:500],
        details={"updated_fields": list(update_data.keys())}
    )

    return tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    request: Request,
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    Delete a tenant and all its users. Only accessible by superadmins.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    # Store tenant info for audit log before deletion
    tenant_name = tenant.name
    tenant_slug = tenant.slug

    # Delete all users belonging to this tenant
    db.query(User).filter(User.tenant_id == tenant_id).delete()

    # Delete tenant
    db.delete(tenant)
    db.commit()

    # Log tenant deletion
    create_audit_log(
        db=db,
        action=AuditAction.TENANT_DELETED,
        category=AuditCategory.TENANT,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_type="tenant",
        entity_id=str(tenant_id),
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("User-Agent", "")[:500],
        details={"tenant_name": tenant_name, "tenant_slug": tenant_slug}
    )

    return None


@router.post("/{tenant_id}/toggle-active", response_model=TenantSchema)
async def toggle_tenant_active(
    request: Request,
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    Toggle tenant active status. Only accessible by superadmins.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    tenant.is_active = not tenant.is_active
    db.commit()
    db.refresh(tenant)

    # Log tenant activation/suspension
    action = AuditAction.TENANT_ACTIVATED if tenant.is_active else AuditAction.TENANT_SUSPENDED
    create_audit_log(
        db=db,
        action=action,
        category=AuditCategory.TENANT,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_type="tenant",
        entity_id=str(tenant_id),
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("User-Agent", "")[:500],
        details={"tenant_name": tenant.name, "is_active": tenant.is_active}
    )

    return tenant


# ============================================
# TENANT USER MANAGEMENT (by superadmin)
# ============================================

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
    # Check access
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
    """
    Create a user for a specific tenant. Only accessible by superadmins.
    """
    # Verify tenant exists
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    # Check if email already exists
    existing = db.query(User).filter(User.email == user_in.get("email")).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    # Create user
    password = user_in.pop("password", None)
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password es requerido"
        )

    # Ensure role is valid for tenant (not superadmin)
    role = user_in.get("role", UserRole.user)
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
