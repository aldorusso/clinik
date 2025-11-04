#!/usr/bin/env python3
"""
Script to create an initial admin user.
Run this after running migrations.

Usage:
    python create_admin.py
"""

import sys
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.models import Base


def create_admin_user(
    email: str = "admin@example.com",
    password: str = "admin123",
    full_name: str = "Admin User"
):
    """Create an admin user if it doesn't exist."""
    db: Session = SessionLocal()

    try:
        # Check if admin already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            return False

        # Create admin user
        hashed_password = get_password_hash(password)
        admin_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=UserRole.ADMIN,
            is_active=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print(f"✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Role: {admin_user.role.value}")
        return True

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("Creating admin user...")
    print("=" * 50)

    # You can customize these values
    email = input("Enter admin email (default: admin@example.com): ").strip()
    if not email:
        email = "admin@example.com"

    password = input("Enter admin password (default: admin123): ").strip()
    if not password:
        password = "admin123"

    full_name = input("Enter admin full name (default: Admin User): ").strip()
    if not full_name:
        full_name = "Admin User"

    print("=" * 50)

    success = create_admin_user(email, password, full_name)

    sys.exit(0 if success else 1)
