#!/usr/bin/env python3

import sys
import os

# Add the app directory to Python path
sys.path.append('/app')

import asyncio
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.service import ServiceCategory
from app.models.user import User

async def seed_service_categories():
    """
    Crear categorías de servicios por defecto para clínicas estéticas
    """
    
    # Get database session
    db = next(get_db())
    
    try:
        # Definir categorías por defecto
        default_categories = [
            {
                "name": "Tratamientos Faciales",
                "description": "Procedimientos para el cuidado y rejuvenecimiento del rostro",
                "icon": "face",
                "color": "#FF6B9D",
                "display_order": 1
            },
            {
                "name": "Tratamientos Corporales",
                "description": "Procedimientos para el cuidado y modelado del cuerpo",
                "icon": "body",
                "color": "#4ECDC4", 
                "display_order": 2
            },
            {
                "name": "Dermatología",
                "description": "Tratamientos médicos especializados para la piel",
                "icon": "medical",
                "color": "#45B7D1",
                "display_order": 3
            },
            {
                "name": "Medicina Estética",
                "description": "Procedimientos médico-estéticos avanzados",
                "icon": "syringe",
                "color": "#96CEB4",
                "display_order": 4
            },
            {
                "name": "Láser y Tecnología",
                "description": "Tratamientos con equipos láser y tecnología avanzada",
                "icon": "laser",
                "color": "#FFEAA7",
                "display_order": 5
            },
            {
                "name": "Nutrición y Bienestar",
                "description": "Consultas nutricionales y programas de bienestar",
                "icon": "nutrition",
                "color": "#DDA0DD",
                "display_order": 6
            }
        ]
        
        # Obtener todos los tenants (clínicas) existentes usando SQL directo
        from sqlalchemy import text
        tenant_query = text("""
            SELECT DISTINCT tenant_id, tenant_name, email 
            FROM users 
            WHERE role = 'tenant_admin' AND is_active = true
        """)
        tenants = db.execute(tenant_query).fetchall()
        
        if not tenants:
            print("No se encontraron clínicas (tenant_admin) activas.")
            return
            
        categories_created = 0
        
        for tenant in tenants:
            print(f"\n🏥 Procesando clínica: {tenant.tenant_name or tenant.email}")
            
            for category_data in default_categories:
                # Verificar si ya existe la categoría en este tenant
                existing = db.query(ServiceCategory).filter(
                    ServiceCategory.tenant_id == tenant.tenant_id,
                    ServiceCategory.name == category_data["name"]
                ).first()
                
                if existing:
                    print(f"  ⚠️  Categoría '{category_data['name']}' ya existe")
                    continue
                
                # Crear nueva categoría
                category = ServiceCategory(
                    tenant_id=tenant.tenant_id,
                    name=category_data["name"],
                    description=category_data["description"],
                    icon=category_data["icon"],
                    color=category_data["color"],
                    display_order=category_data["display_order"],
                    is_active=True
                )
                
                db.add(category)
                categories_created += 1
                print(f"  ✅ Creada categoría: {category_data['name']}")
        
        # Guardar cambios
        db.commit()
        
        print(f"\n🎉 Proceso completado!")
        print(f"📊 Total de categorías creadas: {categories_created}")
        print(f"🏥 Clínicas procesadas: {len(tenants)}")
        
    except Exception as e:
        print(f"❌ Error al crear categorías: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Iniciando creación de categorías de servicios...")
    asyncio.run(seed_service_categories())
    print("✅ Proceso terminado.")