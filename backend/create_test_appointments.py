#!/usr/bin/env python3

import asyncio
import sys
import os
from datetime import datetime, timedelta
from uuid import UUID

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.service import Service

def create_test_appointments():
    """Crear citas de prueba para el calendario."""
    
    db: Session = SessionLocal()
    
    try:
        # Buscar el tenant de mgclinic
        admin_user = db.query(User).filter(User.email == "mgclinic@gmail.com").first()
        if not admin_user:
            print("❌ Usuario mgclinic@gmail.com no encontrado")
            return
        
        tenant_id = admin_user.tenant_id
        print(f"✅ Usando tenant: {tenant_id}")
        
        # Buscar médicos en el tenant
        doctors = db.query(User).filter(
            User.tenant_id == tenant_id,
            User.role.in_(["tenant_admin", "manager", "user"])
        ).all()
        
        if not doctors:
            print("❌ No se encontraron médicos en el tenant")
            return
        
        print(f"✅ Encontrados {len(doctors)} médicos")
        
        # Buscar servicios en el tenant
        services = db.query(Service).filter(
            Service.tenant_id == tenant_id,
            Service.is_active == True
        ).all()
        
        print(f"✅ Encontrados {len(services)} servicios")
        
        # Crear citas de prueba para los próximos días
        base_date = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        
        appointments_data = [
            {
                "date_offset": 1,  # Mañana
                "hour": 9,
                "patient_name": "María García López",
                "patient_phone": "+52 55 1234 5678",
                "patient_email": "maria.garcia@email.com",
                "type": AppointmentType.consultation,
                "status": AppointmentStatus.scheduled,
                "duration": 60,
                "notes": "Primera consulta - valoración facial"
            },
            {
                "date_offset": 1,  # Mañana
                "hour": 11,
                "patient_name": "Carlos Mendoza",
                "patient_phone": "+52 55 8765 4321",
                "patient_email": "carlos.mendoza@email.com",
                "type": AppointmentType.treatment,
                "status": AppointmentStatus.confirmed,
                "duration": 90,
                "notes": "Sesión de botox - seguimiento"
            },
            {
                "date_offset": 2,  # Pasado mañana
                "hour": 10,
                "patient_name": "Ana Patricia Ruiz",
                "patient_phone": "+52 55 9999 1111",
                "patient_email": "ana.ruiz@email.com",
                "type": AppointmentType.consultation,
                "status": AppointmentStatus.scheduled,
                "duration": 60,
                "notes": "Consulta de seguimiento post-tratamiento"
            },
            {
                "date_offset": 3,  # En 3 días
                "hour": 14,
                "patient_name": "Roberto Silva",
                "patient_phone": "+52 55 7777 8888",
                "patient_email": "roberto.silva@email.com",
                "type": AppointmentType.treatment,
                "status": AppointmentStatus.scheduled,
                "duration": 120,
                "notes": "Sesión de rejuvenecimiento facial"
            },
            {
                "date_offset": 5,  # En 5 días
                "hour": 16,
                "patient_name": "Laura Moreno",
                "patient_phone": "+52 55 3333 4444",
                "patient_email": "laura.moreno@email.com",
                "type": AppointmentType.follow_up,
                "status": AppointmentStatus.confirmed,
                "duration": 45,
                "notes": "Control post-operatorio"
            }
        ]
        
        appointments_created = 0
        doctor_index = 0
        
        for apt_data in appointments_data:
            # Calcular fecha y hora
            scheduled_at = base_date + timedelta(days=apt_data["date_offset"])
            scheduled_at = scheduled_at.replace(hour=apt_data["hour"])
            
            # Rotar entre médicos disponibles
            doctor = doctors[doctor_index % len(doctors)]
            doctor_index += 1
            
            # Tomar servicio aleatorio si existe
            service_id = services[0].id if services else None
            
            # Verificar si ya existe una cita en ese horario
            existing = db.query(Appointment).filter(
                Appointment.tenant_id == tenant_id,
                Appointment.provider_id == doctor.id,
                Appointment.scheduled_at == scheduled_at
            ).first()
            
            if existing:
                print(f"⚠️  Ya existe cita para {doctor.full_name} el {scheduled_at}")
                continue
            
            # Crear la cita
            appointment = Appointment(
                tenant_id=tenant_id,
                provider_id=doctor.id,
                service_id=service_id,
                type=apt_data["type"],
                status=apt_data["status"],
                scheduled_at=scheduled_at,
                duration_minutes=apt_data["duration"],
                patient_name=apt_data["patient_name"],
                patient_phone=apt_data["patient_phone"],
                patient_email=apt_data["patient_email"],
                notes=apt_data["notes"]
            )
            
            db.add(appointment)
            appointments_created += 1
            
            print(f"✅ Cita creada: {apt_data['patient_name']} - {doctor.full_name} - {scheduled_at}")
        
        db.commit()
        print(f"\n🎉 Se crearon {appointments_created} citas de prueba exitosamente!")
        
    except Exception as e:
        print(f"❌ Error creando citas de prueba: {e}")
        db.rollback()
    
    finally:
        db.close()

if __name__ == "__main__":
    create_test_appointments()