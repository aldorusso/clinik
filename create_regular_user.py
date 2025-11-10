#!/usr/bin/env python3
"""
Script to create a regular user.
Run this script from the root of the project.

Usage:
    python create_regular_user.py

Or with Docker:
    docker compose exec backend python /app/../create_regular_user.py
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_regular_user(
    email: str = "user@example.com",
    password: str = "user123",
    full_name: str = "Regular User"
):
    """Create a regular user if it doesn't exist."""
    db = SessionLocal()

    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            print(f"   Current role: {existing_user.role.value}")
            return False

        # Create regular user
        hashed_password = get_password_hash(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=UserRole.USER,
            is_active=True
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print("✅ Regular user created successfully!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Role: {user.role.value}")
        return True

    except Exception as e:
        print(f"❌ Error creating user: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 50)
    print("Creating Regular User")
    print("=" * 50)

    # Get custom values from command line arguments or use defaults
    email = sys.argv[1] if len(sys.argv) > 1 else "user@example.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "user123"
    full_name = sys.argv[3] if len(sys.argv) > 3 else "Regular User"

    success = create_regular_user(email, password, full_name)

    print("=" * 50)
    sys.exit(0 if success else 1)
