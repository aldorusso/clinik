from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_password_hash,
    get_current_superadmin,
    get_current_tenant_admin,
    get_current_tenant_member,
    get_current_active_user,
    filter_by_tenant,
    verify_tenant_access,
)
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.notification import NotificationType
from app.schemas.user import UserCreate, UserUpdate, User as UserSchema, ClientCreate, UserInvite
from app.core.email import send_welcome_email, send_invitation_email
from app.core.notifications import create_notification

router = APIRouter()


# ============================================
# SUPERADMIN ENDPOINTS - Global user management
# ============================================

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
        if user.tenant_id != current_user.tenant_id:
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
        if user.tenant_id != current_user.tenant_id:
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
        if user.tenant_id != current_user.tenant_id:
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


# ============================================
# TENANT-SCOPED ENDPOINTS - For tenant admins
# ============================================

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
    if current_user.role not in [UserRole.superadmin, UserRole.tenant_admin, UserRole.manager, UserRole.user, UserRole.closer, UserRole.recepcionista]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver la lista de usuarios"
        )
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins no pertenecen a un tenant. Usa /users/ en su lugar."
        )

    query = db.query(User).filter(User.tenant_id == current_user.tenant_id)

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
    allowed_roles = [UserRole.manager, UserRole.user, UserRole.closer, UserRole.recepcionista]
    role = user_in.role or UserRole.user
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes crear usuarios con rol 'manager', 'user', 'closer' o 'recepcionista'"
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
        tenant_id=current_user.tenant_id,
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
    """
    import secrets
    from datetime import timedelta, datetime

    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins no pueden invitar usuarios a tenants"
        )

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == invitation.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    # Tenant admins can only invite managers, users, and clients
    allowed_roles = [UserRole.manager, UserRole.user, UserRole.closer]
    if invitation.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes invitar usuarios con rol 'manager', 'user' o 'closer'"
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
        tenant_id=current_user.tenant_id,
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
        tenant_name = current_user.tenant.name if current_user.tenant else "la organización"

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

    return {
        "message": f"Invitación enviada a {invitation.email}",
        "expires_at": expires_at.isoformat()
    }


@router.post("/my-tenant/clients", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Create a client (external customer) in my tenant.
    Accessible by tenant admins.
    """
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins deben usar /tenants/{tenant_id}/users"
        )

    # Check if user already exists
    user = db.query(User).filter(User.email == client_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya esta registrado"
        )

    # Create new client
    hashed_password = get_password_hash(client_in.password)
    db_user = User(
        email=client_in.email,
        hashed_password=hashed_password,
        first_name=client_in.first_name,
        last_name=client_in.last_name,
        phone=client_in.phone,
        client_company_name=client_in.client_company_name,
        client_tax_id=client_in.client_tax_id,
        role=UserRole.closer,
        tenant_id=current_user.tenant_id,
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
            user_name=db_user.first_name or db_user.email.split('@')[0]
        )
    except Exception as e:
        print(f"Error enviando email de bienvenida: {e}")

    return db_user


# ============================================
# CLIENT MANAGEMENT - For tenant_admin, manager, and user
# ============================================

@router.get("/my-tenant/clients", response_model=List[UserSchema])
async def list_my_tenant_clients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    List all clients in my tenant.
    Accessible by tenant_admin, manager, and user (not clients).
    """
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins no pertenecen a un tenant. Usa /users/?role=client en su lugar."
        )

    query = db.query(User).filter(
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.closer
    )

    clients = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return clients


@router.post("/my-tenant/clients/create", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_tenant_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Create a client (external customer) in my tenant.
    Accessible by tenant_admin, manager, and user.
    """
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins deben usar /tenants/{tenant_id}/users"
        )

    # Check if user already exists
    user = db.query(User).filter(User.email == client_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya esta registrado"
        )

    # Create new client
    hashed_password = get_password_hash(client_in.password)
    db_user = User(
        email=client_in.email,
        hashed_password=hashed_password,
        first_name=client_in.first_name,
        last_name=client_in.last_name,
        phone=client_in.phone,
        client_company_name=client_in.client_company_name,
        client_tax_id=client_in.client_tax_id,
        role=UserRole.closer,
        tenant_id=current_user.tenant_id,
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
            user_name=db_user.first_name or db_user.email.split('@')[0]
        )
    except Exception as e:
        print(f"Error enviando email de bienvenida: {e}")

    return db_user


@router.put("/my-tenant/clients/{client_id}", response_model=UserSchema)
async def update_tenant_client(
    client_id: UUID,
    client_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Update a client in my tenant.
    Accessible by tenant_admin, manager, and user.
    """
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins deben usar /users/{user_id}"
        )

    client = db.query(User).filter(
        User.id == client_id,
        User.role == UserRole.closer
    ).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )

    # Check tenant access
    if client.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este cliente"
        )

    # Update fields if provided (only allowed client fields)
    update_data = client_update.model_dump(exclude_unset=True)

    # Remove fields that shouldn't be updated by non-admins
    protected_fields = ['role', 'tenant_id', 'password']
    for field in protected_fields:
        update_data.pop(field, None)

    # Update client
    for field, value in update_data.items():
        if hasattr(client, field):
            setattr(client, field, value)

    db.commit()
    db.refresh(client)

    return client


@router.delete("/my-tenant/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant_client(
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Delete a client from my tenant.
    Accessible by tenant_admin, manager, and user.
    """
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmins deben usar /users/{user_id}"
        )

    client = db.query(User).filter(
        User.id == client_id,
        User.role == UserRole.closer
    ).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )

    # Check tenant access
    if client.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este cliente"
        )

    db.delete(client)
    db.commit()

    return None
