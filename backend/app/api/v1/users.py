from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_password_hash,
    get_current_superadmin,
    get_current_tenant_admin,
    get_current_active_user,
    filter_by_tenant,
    verify_tenant_access,
)
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, User as UserSchema, ClientCreate

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
    if user_in.role != UserRole.SUPERADMIN and not user_in.tenant_id:
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
        tenant_id=user_in.tenant_id if user_in.role != UserRole.SUPERADMIN else None,
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


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
    if current_user.role != UserRole.SUPERADMIN:
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
    if current_user.role != UserRole.SUPERADMIN:
        if user.tenant_id != current_user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este usuario"
            )
        # Tenant admins cannot change roles to superadmin
        if user_update.role == UserRole.SUPERADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes asignar el rol superadmin"
            )

    # Update fields if provided
    update_data = user_update.model_dump(exclude_unset=True)

    # Handle password update separately
    if "password" in update_data and update_data["password"]:
        password = update_data.pop("password")
        update_data["hashed_password"] = get_password_hash(password)

    # Prevent changing tenant_id for non-superadmins
    if "tenant_id" in update_data and current_user.role != UserRole.SUPERADMIN:
        del update_data["tenant_id"]

    # Update user
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)

    db.commit()
    db.refresh(user)

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
    if current_user.role != UserRole.SUPERADMIN:
        if user.tenant_id != current_user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este usuario"
            )
        # Tenant admins cannot delete other admins
        if user.role == UserRole.ADMIN:
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
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    List all users in my tenant. Accessible by tenant admins.
    """
    if current_user.role == UserRole.SUPERADMIN:
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
    if current_user.role == UserRole.SUPERADMIN:
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

    # Tenant admins can only create users and clients, not admins or superadmins
    allowed_roles = [UserRole.USER, UserRole.CLIENT]
    role = user_in.role or UserRole.USER
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes crear usuarios con rol 'user' o 'client'"
        )

    # Create new user in the same tenant
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        full_name=user_in.full_name,
        role=role,
        tenant_id=current_user.tenant_id,
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/my-tenant/clients", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Create a client in my tenant. Accessible by tenant admins.
    Simplified endpoint specifically for creating clients.
    """
    if current_user.role == UserRole.SUPERADMIN:
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
        role=UserRole.CLIENT,
        tenant_id=current_user.tenant_id,
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user
