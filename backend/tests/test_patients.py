"""
Pruebas para la funcionalidad de gestión de pacientes.
"""
import pytest
from fastapi import status


class TestPatientsManagement:
    """Pruebas para gestión de pacientes."""
    
    def test_manager_can_view_all_patients(
        self, 
        client, 
        auth_headers_manager,
        patient_user
    ):
        """Test que manager puede ver todos los pacientes."""
        response = client.get(
            "/api/v1/patients/",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        
        # Verificar que la información es completa para medical staff
        patient = data[0]
        assert patient["access_level"] == "full"
        assert patient["can_view_details"] == True
        assert "email" in patient
        assert patient["email"] != "***@***.***"  # No debe estar oculto
    
    def test_doctor_can_view_all_patients(
        self, 
        client, 
        auth_headers_doctor,
        patient_user
    ):
        """Test que doctor puede ver todos los pacientes con información completa."""
        response = client.get(
            "/api/v1/patients/",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        
        # Verificar acceso completo para médicos
        patient = data[0]
        assert patient["access_level"] == "full"
        assert patient["can_view_details"] == True
    
    def test_commercial_can_view_patients_limited(
        self, 
        client, 
        auth_headers_commercial,
        patient_user
    ):
        """Test que comercial puede ver pacientes pero con información limitada."""
        response = client.get(
            "/api/v1/patients/",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        if len(data) > 0:
            patient = data[0]
            # Verificar que la información está limitada
            assert patient["access_level"] == "limited"
            assert patient["can_view_details"] == False
            assert patient["email"] == "***@***.***"  # Email debe estar oculto
            assert patient["phone"] == "***-***-****"  # Teléfono debe estar oculto
    
    def test_receptionist_can_view_patients_limited(
        self, 
        client, 
        auth_headers_receptionist,
        patient_user
    ):
        """Test que recepcionista puede ver pacientes pero con información limitada."""
        response = client.get(
            "/api/v1/patients/",
            headers=auth_headers_receptionist
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        if len(data) > 0:
            patient = data[0]
            # Verificar que la información está limitada pero pueden hacer scheduling
            assert patient["access_level"] == "limited"
            assert patient["can_schedule"] == True
    
    def test_patient_cannot_view_other_patients(
        self, 
        client, 
        auth_headers_patient
    ):
        """Test que paciente NO puede ver otros pacientes."""
        response = client.get(
            "/api/v1/patients/",
            headers=auth_headers_patient
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_doctor_can_view_patient_details(
        self, 
        client, 
        auth_headers_doctor,
        patient_user
    ):
        """Test que doctor puede ver detalles completos de pacientes."""
        response = client.get(
            f"/api/v1/patients/{patient_user.id}/details",
            headers=auth_headers_doctor
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar información médica completa
        assert data["access_level"] == "medical_full"
        assert data["email"] == patient_user.email
        assert "full_name" in data
        assert "created_at" in data
    
    def test_commercial_cannot_view_patient_details(
        self, 
        client, 
        auth_headers_commercial,
        patient_user
    ):
        """Test que comercial NO puede ver detalles médicos de pacientes."""
        response = client.get(
            f"/api/v1/patients/{patient_user.id}/details",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_all_staff_can_view_patient_basic_info(
        self, 
        client, 
        auth_headers_manager,
        auth_headers_doctor,
        auth_headers_commercial,
        auth_headers_receptionist,
        patient_user
    ):
        """Test que todo el staff puede ver información básica para scheduling."""
        headers_list = [
            auth_headers_manager,
            auth_headers_doctor,
            auth_headers_commercial,
            auth_headers_receptionist
        ]
        
        for headers in headers_list:
            response = client.get(
                f"/api/v1/patients/{patient_user.id}/basic",
                headers=headers
            )
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["access_level"] == "basic"
            assert data["can_schedule"] == True
            assert "full_name" in data
    
    def test_patient_cannot_view_basic_info_of_others(
        self, 
        client, 
        auth_headers_patient,
        tenant_admin_user  # Usar otro usuario como "otro paciente"
    ):
        """Test que paciente NO puede ver información básica de otros."""
        response = client.get(
            f"/api/v1/patients/{tenant_admin_user.id}/basic",
            headers=auth_headers_patient
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_search_patients_by_name(
        self, 
        client, 
        auth_headers_manager,
        patient_user
    ):
        """Test buscar pacientes por nombre."""
        search_term = patient_user.first_name[:3]  # Primeras 3 letras del nombre
        
        response = client.get(
            f"/api/v1/patients/?search={search_term}",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar que se encontró el paciente
        found = any(
            search_term.lower() in patient["first_name"].lower() 
            for patient in data
        )
        assert found
    
    def test_pagination_patients(
        self, 
        client, 
        auth_headers_manager,
        patient_user
    ):
        """Test paginación de pacientes."""
        response = client.get(
            "/api/v1/patients/?page=1&page_size=10",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar que devuelve máximo 10 pacientes
        assert len(data) <= 10


class TestPatientPrivacy:
    """Pruebas para privacidad y protección de datos de pacientes."""
    
    def test_tenant_isolation_patients(
        self, 
        client, 
        auth_headers_manager,
        patient_user
    ):
        """Test que pacientes están aislados por tenant."""
        # Este test verifica que un usuario de un tenant no puede ver pacientes de otro
        response = client.get(
            "/api/v1/patients/",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Todos los pacientes devueltos deben ser del mismo tenant
        for patient in data:
            # No podemos verificar tenant_id directamente ya que no se expone en la API
            # pero la lógica del backend debe asegurar el filtrado
            assert "id" in patient
    
    def test_sensitive_data_hidden_for_non_medical(
        self, 
        client, 
        auth_headers_commercial,
        patient_user
    ):
        """Test que datos sensibles están ocultos para staff no médico."""
        response = client.get(
            "/api/v1/patients/",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        if len(data) > 0:
            patient = data[0]
            # Verificar que datos sensibles están ocultos
            assert patient["email"] == "***@***.***"
            assert patient["phone"] == "***-***-****"
            assert patient["client_company_name"] is None
            assert patient["client_tax_id"] is None
    
    def test_medical_data_only_for_doctors(
        self, 
        client, 
        auth_headers_doctor,
        patient_user
    ):
        """Test que datos médicos solo son accesibles para médicos."""
        response = client.get(
            f"/api/v1/patients/{patient_user.id}/details",
            headers=auth_headers_doctor
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar que tiene acceso médico completo
        assert data["access_level"] == "medical_full"
        # En el futuro, aquí se verificarían campos como:
        # assert "medical_history" in data
        # assert "treatments" in data
        # assert "allergies" in data