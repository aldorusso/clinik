from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_password_hash,
    get_current_admin_user
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, User as UserSchema

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    List all users. Only accessible by admins.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Create a new user. Only accessible by admins.
    """
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya esta registrado"
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
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get user by ID. Only accessible by admins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Update user by ID. Only accessible by admins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Update fields if provided
    update_data = user_update.model_dump(exclude_unset=True)

    # Handle password update separately
    if "password" in update_data and update_data["password"]:
        password = update_data.pop("password")
        update_data["hashed_password"] = get_password_hash(password)

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
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Delete user by ID. Only accessible by admins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Prevent admin from deleting themselves
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta"
        )

    db.delete(user)
    db.commit()

    return None
