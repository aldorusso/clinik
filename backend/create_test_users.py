#!/usr/bin/env python3
"""
Script to create test users for all roles.
Run this after running migrations.

Usage:
    python create_test_users.py

This creates the following users (all with password: admin123):
    - superadmin@example.com    (superadmin)
    - admin@example.com         (tenant_admin)
    - manager@example.com       (manager)
    - medico@example.com        (medico)
    - closer@example.com        (closer)
    - recepcionista@example.com (recepcionista)
    - patient@example.com       (patient)
"""

import sys
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import get_password_hash


# Default password for all test users
DEFAULT_PASSWORD = "admin123"


# Test users configuration
TEST_USERS = [
    {
        "email": "superadmin@example.com",
        "first_name": "Super",
        "last_name": "Admin",
        "role": UserRole.superadmin,
        "tenant_id": None,  # Superadmin has no tenant
        "job_title": "Administrador de Plataforma"
    },
    {
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "Clinica",
        "role": UserRole.tenant_admin,
        "tenant_id": "TENANT",  # Will be replaced with actual tenant ID
        "job_title": "Administrador de Clínica"
    },
    {
        "email": "manager@example.com",
        "first_name": "Maria",
        "last_name": "Gestora",
        "role": UserRole.manager,
        "tenant_id": "TENANT",
        "job_title": "Gestora de Leads"
    },
    {
        "email": "medico@example.com",
        "first_name": "Dr. Juan",
        "last_name": "Pérez",
        "role": UserRole.medico,
        "tenant_id": "TENANT",
        "job_title": "Médico Especialista"
    },
    {
        "email": "closer@example.com",
        "first_name": "Carlos",
        "last_name": "Vendedor",
        "role": UserRole.closer,
        "tenant_id": "TENANT",
        "job_title": "Closer de Ventas"
    },
    {
        "email": "recepcionista@example.com",
        "first_name": "Ana",
        "last_name": "Recepción",
        "role": UserRole.recepcionista,
        "tenant_id": "TENANT",
        "job_title": "Recepcionista"
    },
    {
        "email": "patient@example.com",
        "first_name": "Pedro",
        "last_name": "Paciente",
        "role": UserRole.patient,
        "tenant_id": "TENANT",
        "job_title": None
    },
]


def get_or_create_tenant(db: Session) -> Tenant:
    """Get existing tenant or create a new one for testing."""
    # Try to find existing tenant
    tenant = db.query(Tenant).first()

    if tenant:
        print(f"📋 Using existing tenant: {tenant.name}")
        return tenant

    # Create new tenant
    tenant = Tenant(
        name="Clínica Demo",
        slug="clinica-demo",
        email="info@clinicademo.com",
        phone="+52 55 1234 5678",
        address="Av. Reforma 123, CDMX",
        city="Ciudad de México",
        country="México",
        is_active=True
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    print(f"✅ Created new tenant: {tenant.name}")
    return tenant


def create_test_users():
    """Create all test users."""
    db: Session = SessionLocal()
    created_count = 0
    skipped_count = 0

    try:
        # Get or create tenant
        tenant = get_or_create_tenant(db)

        print("\n" + "=" * 60)
        print("Creating test users...")
        print("=" * 60 + "\n")

        for user_config in TEST_USERS:
            email = user_config["email"]

            # Check if user already exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                print(f"⏭️  Skipped: {email} (already exists as {existing_user.role.value})")
                skipped_count += 1
                continue

            # Determine tenant_id
            tenant_id = None
            if user_config["tenant_id"] == "TENANT":
                tenant_id = tenant.id

            # Create user
            hashed_password = get_password_hash(DEFAULT_PASSWORD)
            user = User(
                email=email,
                hashed_password=hashed_password,
                first_name=user_config["first_name"],
                last_name=user_config["last_name"],
                full_name=f"{user_config['first_name']} {user_config['last_name']}",
                role=user_config["role"],
                tenant_id=tenant_id,
                job_title=user_config.get("job_title"),
                is_active=True
            )

            db.add(user)
            db.commit()
            db.refresh(user)

            tenant_info = f" (Tenant: {tenant.name})" if tenant_id else " (Sin tenant)"
            print(f"✅ Created: {email} - {user_config['role'].value}{tenant_info}")
            created_count += 1

        print("\n" + "=" * 60)
        print(f"Summary: {created_count} created, {skipped_count} skipped")
        print("=" * 60)

        print("\n📝 All users have password: admin123")
        print("\n🔐 Login URLs:")
        print("   - Dashboard: http://localhost:3002")
        print("   - Portal (patients): http://localhost:3002/portal")

        return True

    except Exception as e:
        print(f"\n❌ Error creating users: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def delete_all_test_users():
    """Delete all test users (for cleanup)."""
    db: Session = SessionLocal()

    try:
        for user_config in TEST_USERS:
            user = db.query(User).filter(User.email == user_config["email"]).first()
            if user:
                db.delete(user)
                print(f"🗑️  Deleted: {user_config['email']}")

        db.commit()
        print("\n✅ All test users deleted")
        return True

    except Exception as e:
        print(f"\n❌ Error deleting users: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Create or delete test users")
    parser.add_argument("--delete", action="store_true", help="Delete all test users")
    args = parser.parse_args()

    if args.delete:
        print("Deleting all test users...")
        success = delete_all_test_users()
    else:
        print("Creating test users for all roles...")
        success = create_test_users()

    sys.exit(0 if success else 1)
