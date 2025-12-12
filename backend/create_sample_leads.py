#!/usr/bin/env python3
"""
Script para crear leads de prueba en el sistema.
Ejecutar desde el backend: python create_sample_leads.py
"""

import sys
import os
from datetime import datetime, timedelta

# Agregar el directorio padre al path para importar app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.lead import Lead, LeadSource, LeadStatus, LeadPriority
from app.models.tenant import Tenant
from app.models.user import User
from app.database import SessionLocal

def create_sample_leads():
    """Crear leads de prueba en el sistema"""
    
    print("🔧 Creando leads de prueba...")
    print("=" * 60)
    
    # Crear conexión a la base de datos
    db = SessionLocal()
    
    try:
        # Obtener el primer tenant
        tenant = db.query(Tenant).first()
        if not tenant:
            print("❌ No se encontró ningún tenant. Ejecute primero create_test_users.py")
            return False
            
        print(f"🏥 Usando tenant: {tenant.name}")
        
        # Obtener usuarios para asignación
        users = db.query(User).filter(User.tenant_id == tenant.id).all()
        doctors = [u for u in users if u.role == "user"]  # Los médicos tienen role "user"
        
        # Datos de leads de prueba
        sample_leads = [
            {
                "first_name": "Juan",
                "last_name": "Pérez",
                "email": "juan.perez@email.com",
                "phone": "+52 555 1234567",
                "source": LeadSource.website,
                "status": LeadStatus.nuevo,
                "priority": LeadPriority.alta,
                "initial_notes": "Interesado en consulta de evaluación. Llamar en horario matutino.",
                "age": 35,
                "gender": "masculino",
                "city": "Ciudad de México",
                "utm_source": "google",
                "utm_campaign": "consulta_estetica"
            },
            {
                "first_name": "María",
                "last_name": "González",
                "email": "maria.gonzalez@email.com",
                "phone": "+52 555 9876543",
                "source": LeadSource.facebook,
                "status": LeadStatus.contactado,
                "priority": LeadPriority.media,
                "assigned_to_id": doctors[0].id if doctors else None,
                "initial_notes": "Consulta por tratamiento facial. Ya contactada por WhatsApp.",
                "age": 28,
                "gender": "femenino",
                "city": "Guadalajara",
                "utm_source": "facebook",
                "utm_campaign": "facial_promo"
            },
            {
                "first_name": "Carlos",
                "last_name": "López",
                "email": "carlos.lopez@email.com",
                "phone": "+52 555 4567890",
                "source": LeadSource.instagram,
                "status": LeadStatus.cita_agendada,
                "priority": LeadPriority.alta,
                "assigned_to_id": doctors[0].id if doctors else None,
                "initial_notes": "Cita agendada para el viernes. Interés en procedimiento estético.",
                "age": 42,
                "gender": "masculino",
                "city": "Monterrey",
                "utm_source": "instagram",
                "utm_campaign": "before_after"
            },
            {
                "first_name": "Ana",
                "last_name": "Martínez",
                "email": "ana.martinez@email.com",
                "phone": "+52 555 3216547",
                "source": LeadSource.referidos,
                "status": LeadStatus.calificado,
                "priority": LeadPriority.media,
                "initial_notes": "Referida por paciente actual. Muy interesada en iniciar tratamiento.",
                "age": 31,
                "gender": "femenino",
                "city": "Puebla"
            },
            {
                "first_name": "Roberto",
                "last_name": "Silva",
                "email": "roberto.silva@email.com",
                "phone": "+52 555 7890123",
                "source": LeadSource.google,
                "status": LeadStatus.seguimiento,
                "priority": LeadPriority.baja,
                "initial_notes": "Solicitó información por formulario web. Enviar cotización.",
                "age": 38,
                "gender": "masculino",
                "city": "Tijuana",
                "utm_source": "google",
                "utm_medium": "cpc",
                "utm_campaign": "info_tratamientos"
            },
            {
                "first_name": "Laura",
                "last_name": "Hernández",
                "email": "laura.hernandez@email.com",
                "phone": "+52 555 6547890",
                "source": LeadSource.llamada_directa,
                "status": LeadStatus.nuevo,
                "priority": LeadPriority.urgente,
                "initial_notes": "Llamada directa. Urgencia por evento especial próximo.",
                "age": 26,
                "gender": "femenino",
                "city": "Cancún"
            }
        ]
        
        # Crear los leads
        created_count = 0
        
        for lead_data in sample_leads:
            # Verificar si ya existe un lead con este email
            existing = db.query(Lead).filter(
                Lead.email == lead_data["email"],
                Lead.tenant_id == tenant.id
            ).first()
            
            if existing:
                print(f"⚠️  Lead ya existe: {lead_data['email']}")
                continue
                
            # Crear nuevo lead
            lead = Lead(
                tenant_id=tenant.id,
                **lead_data
            )
            
            db.add(lead)
            created_count += 1
            print(f"✅ Lead creado: {lead_data['first_name']} {lead_data['last_name']} ({lead_data['email']})")
        
        # Guardar cambios
        db.commit()
        
        print("\n" + "=" * 60)
        print("🎉 LEADS DE PRUEBA CREADOS")
        print("=" * 60)
        print(f"🏥 Tenant: {tenant.name}")
        print(f"📝 Total leads creados: {created_count}")
        print(f"👥 Usuarios disponibles para asignación: {len(users)}")
        print(f"👨‍⚕️ Médicos disponibles: {len(doctors)}")
        
        if doctors:
            print(f"\n👨‍⚕️ MÉDICOS DISPONIBLES:")
            for doctor in doctors:
                print(f"  - {doctor.first_name} {doctor.last_name} ({doctor.email})")
        
        print(f"\n🚀 EMPEZAR A PROBAR:")
        print(f"1. Ve a: http://localhost:3002")
        print(f"2. Inicia sesión con: gestor.leads@example.com / gestor123")
        print(f"3. Ve a 'Leads' en el sidebar")
        print(f"4. ¡Verás {created_count} leads listos para gestionar!")
        
        print(f"\n✅ ¡Proceso completado exitosamente!")
        return True
        
    except Exception as e:
        print(f"❌ Error creando leads: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = create_sample_leads()
    sys.exit(0 if success else 1)