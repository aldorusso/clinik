#!/usr/bin/env python3

import asyncio
import sys
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Add the app directory to the path
sys.path.append('/app')

from app.db.session import engine
from app.models.user import User, UserRole

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    # Create database session
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = SessionLocal()
    
    try:
        # Check if superadmin already exists
        existing_admin = db.query(User).filter(
            User.role == UserRole.superadmin
        ).first()
        
        if existing_admin:
            print(f"✅ Superadmin already exists: {existing_admin.email}")
            return
        
        # Create new superadmin
        email = "admin@example.com"
        password = "admin123"
        
        hashed_password = pwd_context.hash(password)
        
        admin_user = User(
            email=email,
            hashed_password=hashed_password,
            role=UserRole.superadmin,
            full_name="Super Administrator",
            first_name="Super",
            last_name="Administrator",
            is_active=True,
            tenant_id=None  # Superadmin doesn't belong to any tenant
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("🎉 Superadmin user created successfully!")
        print("=" * 50)
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Role: {admin_user.role.value}")
        print(f"ID: {admin_user.id}")
        print("=" * 50)
        print("You can now login at: http://localhost:3002")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(create_admin())