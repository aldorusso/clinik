#!/usr/bin/env python3

import sys
import os

# Add the parent directory to the path
sys.path.append('/app')

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
import uuid

# Database connection
DATABASE_URL = "postgresql://base_fastapi_nextjs16_user:base_fastapi_nextjs16_password@db:5432/base_fastapi_nextjs16_db"

print("🔧 Creando leads de prueba...")
print("=" * 60)

# Create database connection
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Get first tenant
    result = db.execute(text("SELECT id, name FROM tenants LIMIT 1"))
    tenant = result.fetchone()
    
    if not tenant:
        print("❌ No tenant found")
        sys.exit(1)
    
    tenant_id = tenant[0]
    tenant_name = tenant[1]
    print(f"🏥 Using tenant: {tenant_name}")
    
    # Sample leads data
    leads_data = [
        ("Juan", "Pérez", "juan.perez@email.com", "+52 555 1234567", "website", "nuevo", "alta", "Interesado en consulta de evaluación"),
        ("María", "González", "maria.gonzalez@email.com", "+52 555 9876543", "facebook", "contactado", "media", "Consulta por tratamiento facial"),
        ("Carlos", "López", "carlos.lopez@email.com", "+52 555 4567890", "facebook", "cita_agendada", "alta", "Cita agendada para el viernes"),
        ("Ana", "Martínez", "ana.martinez@email.com", "+52 555 3216547", "referral", "calificado", "media", "Referida por paciente actual"),
        ("Roberto", "Silva", "roberto.silva@email.com", "+52 555 7890123", "google", "contactado", "baja", "Solicitó información por formulario web"),
        ("Laura", "Hernández", "laura.hernandez@email.com", "+52 555 6547890", "phone", "nuevo", "alta", "Llamada directa. Urgencia por evento especial")
    ]
    
    created_count = 0
    
    for first_name, last_name, email, phone, source, status, priority, notes in leads_data:
        # Check if lead already exists
        result = db.execute(
            text("SELECT id FROM leads WHERE email = :email AND tenant_id = :tenant_id"),
            {"email": email, "tenant_id": tenant_id}
        )
        
        if result.fetchone():
            print(f"⚠️  Lead ya existe: {email}")
            continue
        
        # Create new lead
        lead_id = str(uuid.uuid4())
        
        db.execute(text("""
            INSERT INTO leads (
                id, tenant_id, first_name, last_name, email, phone, 
                source, status, priority, initial_notes, is_active, is_duplicate, created_at, updated_at
            ) VALUES (:id, :tenant_id, :first_name, :last_name, :email, :phone, 
                     :source, :status, :priority, :notes, true, false, NOW(), NOW())
        """), {
            "id": lead_id, "tenant_id": tenant_id, "first_name": first_name, 
            "last_name": last_name, "email": email, "phone": phone,
            "source": source, "status": status, "priority": priority, "notes": notes
        })
        
        created_count += 1
        print(f"✅ Lead creado: {first_name} {last_name} ({email})")
    
    # Commit changes
    db.commit()
    
    print("\n" + "=" * 60)
    print("🎉 LEADS DE PRUEBA CREADOS")
    print("=" * 60)
    print(f"🏥 Tenant: {tenant_name}")
    print(f"📝 Total leads creados: {created_count}")
    print(f"\n🚀 EMPEZAR A PROBAR:")
    print(f"1. Ve a: http://localhost:3002")
    print(f"2. Inicia sesión con: gestor.leads@example.com / gestor123")
    print(f"3. Ve a 'Leads' en el sidebar")
    print(f"4. ¡Verás {created_count} leads listos para gestionar!")
    print(f"\n✅ ¡Proceso completado exitosamente!")

except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
    sys.exit(1)

finally:
    db.close()