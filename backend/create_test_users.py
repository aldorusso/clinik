#!/usr/bin/env python3
"""
Script to create test users for development.
Creates users with different roles: superadmin, tenant_admin, manager, user, client.

Usage:
    python create_test_users.py

Or with Docker:
    docker compose exec backend python create_test_users.py
"""

import sys
import os

# Add backend directory to path if running from project root
sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import get_password_hash


DEFAULT_PASSWORD = "admin123"

# Test users to create
TEST_USERS = [
    {
        "email": "superadmin@example.com",
        "full_name": "Super Admin",
        "role": UserRole.superadmin,
        "tenant_slug": None,  # Superadmin has no tenant
    },
    {
        "email": "admin@example.com",
        "full_name": "Tenant Admin",
        "role": UserRole.tenant_admin,
        "tenant_slug": "demo-company",
    },
    {
        "email": "manager@example.com",
        "full_name": "Manager User",
        "role": UserRole.manager,
        "tenant_slug": "demo-company",
    },
    {
        "email": "user@example.com",
        "full_name": "Regular User",
        "role": UserRole.user,
        "tenant_slug": "demo-company",
    },
    {
        "email": "client@example.com",
        "full_name": "Client User",
        "role": UserRole.client,
        "tenant_slug": "demo-company",
        "client_company_name": "Client Company S.A.",
        "client_tax_id": "12345678901",
    },
]

# Demo tenant to create
DEMO_TENANT = {
    "name": "Demo Company",
    "slug": "demo-company",
    "email": "contact@demo-company.com",
    "phone": "+1234567890",
    "country": "Peru",
    "city": "Lima",
    "plan": "professional",
}


def get_or_create_tenant(db, tenant_data: dict) -> Tenant:
    """Get existing tenant or create a new one."""
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_data["slug"]).first()

    if tenant:
        print(f"   Tenant '{tenant.name}' already exists")
        return tenant

    tenant = Tenant(**tenant_data)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    print(f"   Tenant '{tenant.name}' created")
    return tenant


def create_user(db, user_data: dict, tenant: Tenant = None) -> bool:
    """Create a single user if it doesn't exist."""
    email = user_data["email"]

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"   [{user_data['role'].value:12}] {email} - already exists")
        return False

    # Create user
    hashed_password = get_password_hash(DEFAULT_PASSWORD)

    new_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=user_data["full_name"],
        role=user_data["role"],
        is_active=True,
        tenant_id=tenant.id if tenant else None,
        client_company_name=user_data.get("client_company_name"),
        client_tax_id=user_data.get("client_tax_id"),
    )

    db.add(new_user)
    db.commit()

    print(f"   [{user_data['role'].value:12}] {email} - created")
    return True


def create_all_test_users():
    """Create all test users and the demo tenant."""
    db = SessionLocal()
    created_count = 0

    try:
        print("\n" + "=" * 60)
        print("Creating Test Users for Development")
        print("=" * 60)
        print(f"\nDefault password for all users: {DEFAULT_PASSWORD}\n")

        # Step 1: Create demo tenant
        print("Step 1: Creating Demo Tenant")
        print("-" * 40)
        demo_tenant = get_or_create_tenant(db, DEMO_TENANT)

        # Step 2: Create users
        print("\nStep 2: Creating Users")
        print("-" * 40)

        for user_data in TEST_USERS:
            tenant = None
            if user_data["tenant_slug"]:
                tenant = db.query(Tenant).filter(
                    Tenant.slug == user_data["tenant_slug"]
                ).first()

            if create_user(db, user_data, tenant):
                created_count += 1

        # Summary
        print("\n" + "=" * 60)
        print("Summary")
        print("=" * 60)
        print(f"\nUsers created: {created_count}/{len(TEST_USERS)}")
        print(f"Password: {DEFAULT_PASSWORD}")
        print("\nTest accounts:")
        print("-" * 40)
        for user in TEST_USERS:
            print(f"  {user['role'].value:12} -> {user['email']}")

        print("\n" + "=" * 60)
        return True

    except Exception as e:
        print(f"\nError: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = create_all_test_users()
    sys.exit(0 if success else 1)
