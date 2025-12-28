"""Client management endpoints."""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_password_hash,
    get_current_tenant_admin,
    get_current_tenant_member,
)
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserUpdate, User as UserSchema, ClientCreate
from app.core.email import send_welcome_email

router = APIRouter()


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
            user_name=db_user.first_name or db_user.email.split('@')[0]
        )
    except Exception as e:
        print(f"Error enviando email de bienvenida: {e}")

    return db_user


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
        User.tenant_id == current_user.current_tenant_id,
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
    if client.tenant_id != current_user.current_tenant_id:
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
    if client.tenant_id != current_user.current_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este cliente"
        )

    db.delete(client)
    db.commit()

    return None
