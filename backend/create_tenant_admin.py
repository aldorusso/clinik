#!/usr/bin/env python3
"""
Script to create a tenant and tenant_admin for testing.
"""

import sys
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import get_password_hash


def create_tenant_and_admin():
    """Create a test tenant and tenant_admin."""
    db: Session = SessionLocal()

    try:
        # Create tenant first
        tenant_slug = "clinica-test"
        tenant_name = "Clínica de Prueba"
        
        existing_tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        if existing_tenant:
            print(f"❌ Tenant with slug {tenant_slug} already exists!")
            tenant = existing_tenant
        else:
            tenant = Tenant(
                name=tenant_name,
                slug=tenant_slug,
                email="info@clinica-test.com",
                phone="+52 55 1234 5678",
                country="México",
                city="Ciudad de México",
                address="Av. Reforma 123, Col. Centro",
                legal_name="Clínica de Prueba S.A. de C.V.",
                is_active=True
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"✅ Tenant created: {tenant_name}")

        # Create tenant admin
        admin_email = "admin@clinica-test.com"
        admin_password = "admin123"
        
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            print(f"❌ Admin user with email {admin_email} already exists!")
            print(f"   Email: {admin_email}")
            print(f"   Password: {admin_password}")
            print(f"   Role: {existing_admin.role.value}")
            print(f"   Tenant: {tenant_name}")
            return True

        hashed_password = get_password_hash(admin_password)
        admin_user = User(
            email=admin_email,
            hashed_password=hashed_password,
            full_name="Administrador Clínica",
            first_name="Administrador",
            last_name="Clínica",
            phone="+52 55 1234 5678",
            country="México",
            city="Ciudad de México",
            job_title="Administrador General",
            role=UserRole.tenant_admin,
            tenant_id=tenant.id,
            is_active=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print(f"✅ Tenant admin user created successfully!")
        print(f"   Email: {admin_email}")
        print(f"   Password: {admin_password}")
        print(f"   Role: {admin_user.role.value}")
        print(f"   Tenant: {tenant_name}")
        return True

    except Exception as e:
        print(f"❌ Error creating tenant and admin: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("Creating tenant and admin user...")
    print("=" * 50)
    
    success = create_tenant_and_admin()
    
    print("=" * 50)
    sys.exit(0 if success else 1)