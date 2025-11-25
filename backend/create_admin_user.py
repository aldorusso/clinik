#!/usr/bin/env python3
"""
Script to create an admin user.
Run this script from the root of the project.

Usage:
    python create_admin_user.py

Or with Docker:
    docker compose exec backend python /app/../create_admin_user.py
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_admin_user(
    email: str = "admin@example.com",
    password: str = "admin123",
    full_name: str = "Admin User"
):
    """Create an admin user if it doesn't exist."""
    db = SessionLocal()

    try:
        # Check if admin already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            print(f"   Current role: {existing_user.role.value}")
            return False

        # Create admin user
        hashed_password = get_password_hash(password)
        admin_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=UserRole.superadmin,
            is_active=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("✅ Admin user created successfully!")
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
    print("=" * 50)
    print("Creating Admin User")
    print("=" * 50)

    # Get custom values from command line arguments or use defaults
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@example.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "admin123"
    full_name = sys.argv[3] if len(sys.argv) > 3 else "Admin User"

    success = create_admin_user(email, password, full_name)

    print("=" * 50)
    sys.exit(0 if success else 1)
