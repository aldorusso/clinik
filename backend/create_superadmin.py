#!/usr/bin/env python3
"""
Script to create a superadmin user with default values.
"""

import sys
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_superadmin():
    """Create a superadmin user with default values."""
    db: Session = SessionLocal()

    email = "superadmin@example.com"
    password = "superadmin123"
    full_name = "Super Administrator"

    try:
        # Check if superadmin already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            print(f"   Email: {email}")
            print(f"   Role: {existing_user.role.value}")
            return True

        # Create superadmin user
        hashed_password = get_password_hash(password)
        superadmin_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=UserRole.superadmin,
            is_active=True
        )

        db.add(superadmin_user)
        db.commit()
        db.refresh(superadmin_user)

        print(f"✅ Superadmin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Role: {superadmin_user.role.value}")
        return True

    except Exception as e:
        print(f"❌ Error creating superadmin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("Creating superadmin user...")
    print("=" * 50)
    
    success = create_superadmin()
    
    print("=" * 50)
    sys.exit(0 if success else 1)