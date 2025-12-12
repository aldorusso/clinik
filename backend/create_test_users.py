#!/usr/bin/env python3
"""
Script para crear usuarios de prueba para el sistema de gestión de leads
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to the path
sys.path.append(str(Path(__file__).parent / "app"))

from sqlalchemy.orm import Session
from app.db.session import engine
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import get_password_hash

def create_test_users():
    """Create test users for the lead management system"""
    
    with Session(engine) as db:
        # First, let's check if we have a tenant, if not create one
        tenant = db.query(Tenant).first()
        
        if not tenant:
            print("🏥 Creando tenant de prueba...")
            tenant = Tenant(
                name="Clínica de Prueba",
                slug="clinica-prueba",
                is_active=True
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"✅ Tenant creado: {tenant.name}")
        else:
            print(f"🏥 Usando tenant existente: {tenant.name}")
        
        tenant_id = tenant.id
        
        # Define test users
        test_users = [
            {
                "email": "admin.clinica@example.com",
                "password": "admin123",
                "first_name": "Ana",
                "last_name": "García",
                "role": UserRole.tenant_admin,
                "description": "Administradora de la clínica"
            },
            {
                "email": "gestor.leads@example.com", 
                "password": "gestor123",
                "first_name": "Carlos",
                "last_name": "López",
                "role": UserRole.manager,
                "description": "Gestor de leads (manager)"
            },
            {
                "email": "dr.martinez@example.com",
                "password": "doctor123", 
                "first_name": "Dr. Roberto",
                "last_name": "Martínez",
                "role": UserRole.user,
                "description": "Médico especialista"
            },
            {
                "email": "comercial@example.com",
                "password": "comercial123",
                "first_name": "María",
                "last_name": "Rodríguez", 
                "role": UserRole.client,
                "description": "Ejecutiva comercial"
            },
            {
                "email": "recepcion@example.com",
                "password": "recepcion123",
                "first_name": "Sofia",
                "last_name": "Torres",
                "role": UserRole.recepcionista,
                "description": "Recepcionista"
            }
        ]
        
        print(f"\n👥 Creando usuarios de prueba para tenant: {tenant.name}")
        print("=" * 60)
        
        created_users = []
        
        for user_data in test_users:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            
            if existing_user:
                print(f"⚠️  Usuario ya existe: {user_data['email']} ({existing_user.role})")
                created_users.append(existing_user)
                continue
            
            # Create new user
            hashed_password = get_password_hash(user_data["password"])
            
            new_user = User(
                email=user_data["email"],
                hashed_password=hashed_password,
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                full_name=f"{user_data['first_name']} {user_data['last_name']}",
                role=user_data["role"],
                tenant_id=tenant_id,
                is_active=True
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            created_users.append(new_user)
            
            print(f"✅ Creado: {user_data['email']} | {user_data['role'].value} | {user_data['description']}")
        
        print("\n" + "=" * 60)
        print("🎉 USUARIOS DE PRUEBA CREADOS")
        print("=" * 60)
        print(f"🏥 Tenant: {tenant.name} (ID: {tenant.id})")
        print(f"🌐 Slug: {tenant.slug}")
        print()
        print("👤 CREDENCIALES DE ACCESO:")
        print("-" * 40)
        
        role_descriptions = {
            UserRole.tenant_admin: "👑 Admin Clínica - Acceso completo",
            UserRole.manager: "📊 Gestor de Leads - Gestión de leads", 
            UserRole.user: "👨‍⚕️ Médico - Leads asignados",
            UserRole.client: "💼 Comercial - Leads asignados", 
            UserRole.recepcionista: "📞 Recepcionista - Acceso completo"
        }
        
        for user_data in test_users:
            role_desc = role_descriptions.get(user_data["role"], user_data["role"].value)
            print(f"Email: {user_data['email']}")
            print(f"Password: {user_data['password']}")
            print(f"Rol: {role_desc}")
            print(f"Nombre: {user_data['first_name']} {user_data['last_name']}")
            print("-" * 40)
        
        print("\n🚀 EMPEZAR A PROBAR:")
        print("1. Ve a: http://localhost:3002 (Frontend)")
        print("2. O usa la API: http://localhost:8002/docs")
        print("3. Inicia sesión con cualquiera de las credenciales arriba")
        print("4. El admin de clínica y gestor de leads pueden ver todos los leads")
        print("5. Los médicos y comerciales solo ven leads asignados a ellos")
        print("6. La recepcionista puede ver todos los leads")
        
        print(f"\n📝 Total usuarios creados: {len(created_users)}")
        
        return created_users

if __name__ == "__main__":
    print("🔧 Iniciando creación de usuarios de prueba...")
    print("=" * 60)
    
    try:
        users = create_test_users()
        print(f"\n✅ ¡Proceso completado exitosamente!")
        
    except Exception as e:
        print(f"\n❌ Error durante la creación: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)