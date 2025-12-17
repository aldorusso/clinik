"""
Pruebas para la funcionalidad de citas médicas.
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta


class TestAppointments:
    """Pruebas para gestión de citas."""
    
    @pytest.fixture
    def sample_service(self, db_session, test_tenant):
        """Crear un servicio de muestra."""
        from app.models.service import Service, ServiceCategory
        
        # Crear categoría
        category = ServiceCategory(
            name="Consultas",
            description="Consultas médicas",
            tenant_id=test_tenant.id,
            is_active=True
        )
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)
        
        # Crear servicio
        service = Service(
            name="Consulta General",
            description="Consulta médica general",
            duration_minutes=30,
            price_min=50.0,
            price_max=100.0,
            category_id=category.id,
            tenant_id=test_tenant.id,
            requires_consultation=False,
            is_active=True
        )
        db_session.add(service)
        db_session.commit()
        db_session.refresh(service)
        return service
    
    @pytest.fixture
    def sample_appointment_data(self, patient_user, doctor_user, sample_service):
        """Datos de muestra para crear cita."""
        future_date = datetime.now() + timedelta(days=7, hours=10)
        return {
            "patient_id": str(patient_user.id),
            "medic_id": str(doctor_user.id),
            "service_id": str(sample_service.id),
            "scheduled_at": future_date.isoformat(),
            "duration_minutes": 30,
            "notes": "Consulta de rutina"
        }
    
    def test_manager_can_create_appointment(
        self, 
        client, 
        auth_headers_manager,
        sample_appointment_data
    ):
        """Test que manager puede crear citas."""
        response = client.post(
            "/api/v1/appointments/",
            json=sample_appointment_data,
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["patient_id"] == sample_appointment_data["patient_id"]
        assert data["medic_id"] == sample_appointment_data["medic_id"]
    
    def test_receptionist_can_create_appointment(
        self, 
        client, 
        auth_headers_receptionist,
        sample_appointment_data
    ):
        """Test que recepcionista puede crear citas."""
        response = client.post(
            "/api/v1/appointments/",
            json=sample_appointment_data,
            headers=auth_headers_receptionist
        )
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_doctor_can_create_appointment(
        self, 
        client, 
        auth_headers_doctor,
        sample_appointment_data
    ):
        """Test que doctor puede crear citas."""
        response = client.post(
            "/api/v1/appointments/",
            json=sample_appointment_data,
            headers=auth_headers_doctor
        )
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_commercial_can_create_appointment(
        self, 
        client, 
        auth_headers_commercial,
        sample_appointment_data
    ):
        """Test que comercial puede crear citas."""
        response = client.post(
            "/api/v1/appointments/",
            json=sample_appointment_data,
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_patient_cannot_create_appointment(
        self, 
        client, 
        auth_headers_patient,
        sample_appointment_data
    ):
        """Test que paciente NO puede crear citas directamente."""
        response = client.post(
            "/api/v1/appointments/",
            json=sample_appointment_data,
            headers=auth_headers_patient
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @pytest.fixture
    def sample_appointment(self, db_session, test_tenant, patient_user, doctor_user, sample_service):
        """Crear una cita de muestra."""
        from app.models.appointment import Appointment
        
        future_date = datetime.now() + timedelta(days=7, hours=10)
        appointment = Appointment(
            tenant_id=test_tenant.id,
            patient_id=patient_user.id,
            medic_id=doctor_user.id,
            service_id=sample_service.id,
            scheduled_at=future_date,
            duration_minutes=30,
            status="scheduled",
            notes="Cita de prueba"
        )
        db_session.add(appointment)
        db_session.commit()
        db_session.refresh(appointment)
        return appointment
    
    def test_manager_can_view_all_appointments(
        self, 
        client, 
        auth_headers_manager,
        sample_appointment
    ):
        """Test que manager puede ver todas las citas."""
        response = client.get(
            "/api/v1/appointments/",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data.get("items", [])) >= 1
    
    def test_doctor_can_view_own_appointments(
        self, 
        client, 
        auth_headers_doctor,
        doctor_user,
        sample_appointment
    ):
        """Test que doctor puede ver sus citas."""
        response = client.get(
            "/api/v1/appointments/?medic_id=" + str(doctor_user.id),
            headers=auth_headers_doctor
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        appointments = data.get("items", [])
        
        # Verificar que solo ve sus citas
        for appointment in appointments:
            assert appointment["medic_id"] == str(doctor_user.id)
    
    def test_patient_can_view_own_appointments(
        self, 
        client, 
        auth_headers_patient,
        patient_user,
        sample_appointment
    ):
        """Test que paciente puede ver sus citas."""
        response = client.get(
            "/api/v1/appointments/?patient_id=" + str(patient_user.id),
            headers=auth_headers_patient
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        appointments = data.get("items", [])
        
        # Verificar que solo ve sus citas
        for appointment in appointments:
            assert appointment["patient_id"] == str(patient_user.id)
    
    def test_commercial_can_view_appointments(
        self, 
        client, 
        auth_headers_commercial,
        sample_appointment
    ):
        """Test que comercial puede ver citas."""
        response = client.get(
            "/api/v1/appointments/",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_manager_can_update_appointment(
        self, 
        client, 
        auth_headers_manager,
        sample_appointment
    ):
        """Test que manager puede actualizar citas."""
        update_data = {
            "status": "confirmed",
            "notes": "Cita confirmada por el paciente"
        }
        
        response = client.put(
            f"/api/v1/appointments/{sample_appointment.id}",
            json=update_data,
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "confirmed"
    
    def test_doctor_can_update_own_appointments(
        self, 
        client, 
        auth_headers_doctor,
        sample_appointment
    ):
        """Test que doctor puede actualizar sus citas."""
        update_data = {
            "status": "completed",
            "notes": "Consulta realizada exitosamente"
        }
        
        response = client.put(
            f"/api/v1/appointments/{sample_appointment.id}",
            json=update_data,
            headers=auth_headers_doctor
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_patient_cannot_update_appointment_status(
        self, 
        client, 
        auth_headers_patient,
        sample_appointment
    ):
        """Test que paciente NO puede cambiar el estado de la cita."""
        update_data = {
            "status": "completed"
        }
        
        response = client.put(
            f"/api/v1/appointments/{sample_appointment.id}",
            json=update_data,
            headers=auth_headers_patient
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_appointment_availability_check(
        self, 
        client, 
        auth_headers_manager,
        doctor_user,
        sample_appointment
    ):
        """Test que no se pueden crear citas en horarios ocupados."""
        # Intentar crear otra cita en el mismo horario
        conflicting_appointment_data = {
            "patient_id": str(patient_user.id),
            "medic_id": str(doctor_user.id),
            "scheduled_at": sample_appointment.scheduled_at.isoformat(),
            "duration_minutes": 30
        }
        
        response = client.post(
            "/api/v1/appointments/",
            json=conflicting_appointment_data,
            headers=auth_headers_manager
        )
        # Debería fallar por conflicto de horario
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_appointment_pagination(
        self, 
        client, 
        auth_headers_manager,
        sample_appointment
    ):
        """Test paginación de citas."""
        response = client.get(
            "/api/v1/appointments/?page=1&page_size=10",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar estructura de paginación
        assert "items" in data
        assert "page" in data
        assert "page_size" in data
        assert "total" in data
    
    def test_appointment_date_filter(
        self, 
        client, 
        auth_headers_manager,
        sample_appointment
    ):
        """Test filtrar citas por fecha."""
        date_str = sample_appointment.scheduled_at.date().isoformat()
        
        response = client.get(
            f"/api/v1/appointments/?date={date_str}",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        appointments = data.get("items", [])
        
        # Verificar que todas las citas son de la fecha especificada
        for appointment in appointments:
            appointment_date = datetime.fromisoformat(
                appointment["scheduled_at"].replace("Z", "+00:00")
            ).date()
            assert appointment_date.isoformat() == date_str


class TestAppointmentConfirmation:
    """Pruebas para confirmación de citas."""
    
    def test_manager_can_confirm_appointment(
        self, 
        client, 
        auth_headers_manager,
        sample_appointment
    ):
        """Test que manager puede confirmar citas."""
        response = client.post(
            f"/api/v1/appointments/{sample_appointment.id}/confirm",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "confirmed"
    
    def test_receptionist_can_confirm_appointment(
        self, 
        client, 
        auth_headers_receptionist,
        sample_appointment
    ):
        """Test que recepcionista puede confirmar citas."""
        response = client.post(
            f"/api/v1/appointments/{sample_appointment.id}/confirm",
            headers=auth_headers_receptionist
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_patient_cannot_confirm_appointment(
        self, 
        client, 
        auth_headers_patient,
        sample_appointment
    ):
        """Test que paciente NO puede confirmar citas."""
        response = client.post(
            f"/api/v1/appointments/{sample_appointment.id}/confirm",
            headers=auth_headers_patient
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN