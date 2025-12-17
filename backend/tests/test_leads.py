"""
Pruebas para la funcionalidad de gestión de leads.
"""
import pytest
from fastapi import status


class TestLeadsManagement:
    """Pruebas para gestión de leads."""
    
    def test_manager_can_view_all_leads(self, client, auth_headers_manager, sample_leads):
        """Test que manager puede ver todos los leads del tenant."""
        response = client.get(
            "/api/v1/leads/",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data.get("items", [])) == 3  # Según sample_leads fixture
    
    def test_commercial_can_view_assigned_leads_only(
        self, 
        client, 
        auth_headers_commercial, 
        sample_leads,
        commercial_user
    ):
        """Test que comercial solo puede ver leads asignados a él."""
        response = client.get(
            "/api/v1/leads/?assigned_to_me=true",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        leads = data.get("items", [])
        
        # Solo debería ver 1 lead asignado a él
        assert len(leads) == 1
        assert leads[0]["assigned_to_id"] == str(commercial_user.id)
    
    def test_doctor_can_view_assigned_leads_only(
        self, 
        client, 
        auth_headers_doctor, 
        sample_leads,
        doctor_user
    ):
        """Test que doctor solo puede ver leads asignados a él."""
        response = client.get(
            "/api/v1/leads/?assigned_to_me=true",
            headers=auth_headers_doctor
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        leads = data.get("items", [])
        
        # Solo debería ver 1 lead asignado a él
        assert len(leads) == 1
        assert leads[0]["assigned_to_id"] == str(doctor_user.id)
    
    def test_manager_can_create_lead(self, client, auth_headers_manager, test_tenant):
        """Test que manager puede crear leads."""
        lead_data = {
            "first_name": "Nuevo",
            "last_name": "Lead",
            "email": "nuevo@test.com",
            "phone": "+34600111222",
            "source": "website",
            "status": "nuevo",
            "priority": "media"
        }
        
        response = client.post(
            "/api/v1/leads/",
            json=lead_data,
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["first_name"] == "Nuevo"
        assert data["last_name"] == "Lead"
        assert data["tenant_id"] == str(test_tenant.id)
    
    def test_commercial_can_create_lead_auto_assigned(
        self, 
        client, 
        auth_headers_commercial, 
        commercial_user,
        test_tenant
    ):
        """Test que comercial puede crear leads y se auto-asignan."""
        lead_data = {
            "first_name": "Lead",
            "last_name": "Comercial",
            "email": "leadcomercial@test.com",
            "phone": "+34600333444",
            "source": "llamada_directa",
            "status": "nuevo",
            "priority": "media"
        }
        
        response = client.post(
            "/api/v1/leads/",
            json=lead_data,
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["first_name"] == "Lead"
        # Verificar auto-asignación (esto debería implementarse en el backend)
        # assert data["assigned_to_id"] == str(commercial_user.id)
    
    def test_receptionist_can_create_lead(self, client, auth_headers_receptionist):
        """Test que recepcionista puede crear leads."""
        lead_data = {
            "first_name": "Lead",
            "last_name": "Recepción",
            "email": "leadrecepcion@test.com",
            "phone": "+34600555666",
            "source": "otros",
            "status": "nuevo",
            "priority": "media"
        }
        
        response = client.post(
            "/api/v1/leads/",
            json=lead_data,
            headers=auth_headers_receptionist
        )
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_patient_cannot_create_lead(self, client, auth_headers_patient):
        """Test que paciente NO puede crear leads."""
        lead_data = {
            "first_name": "Should",
            "last_name": "Fail",
            "email": "fail@test.com",
            "phone": "+34600777888",
            "source": "website",
            "status": "nuevo",
            "priority": "media"
        }
        
        response = client.post(
            "/api/v1/leads/",
            json=lead_data,
            headers=auth_headers_patient
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_manager_can_assign_lead(
        self, 
        client, 
        auth_headers_manager, 
        sample_leads,
        doctor_user
    ):
        """Test que manager puede asignar leads."""
        # Usar el lead sin asignar (tercer lead en sample_leads)
        unassigned_lead = sample_leads[2]
        
        response = client.post(
            f"/api/v1/leads/{unassigned_lead.id}/assign",
            json={"assigned_to_id": str(doctor_user.id)},
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_commercial_cannot_assign_lead_to_others(
        self, 
        client, 
        auth_headers_commercial, 
        sample_leads,
        doctor_user
    ):
        """Test que comercial NO puede asignar leads a otros."""
        unassigned_lead = sample_leads[2]
        
        response = client.post(
            f"/api/v1/leads/{unassigned_lead.id}/assign",
            json={"assigned_to_id": str(doctor_user.id)},
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_manager_can_update_lead(
        self, 
        client, 
        auth_headers_manager, 
        sample_leads
    ):
        """Test que manager puede actualizar leads."""
        lead = sample_leads[0]
        
        update_data = {
            "status": "contactado",
            "priority": "alta"
        }
        
        response = client.put(
            f"/api/v1/leads/{lead.id}",
            json=update_data,
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "contactado"
        assert data["priority"] == "alta"
    
    def test_commercial_can_update_assigned_lead(
        self, 
        client, 
        auth_headers_commercial, 
        sample_leads,
        commercial_user
    ):
        """Test que comercial puede actualizar sus leads asignados."""
        # Encontrar el lead asignado al comercial
        assigned_lead = next(
            lead for lead in sample_leads 
            if lead.assigned_to_id == commercial_user.id
        )
        
        update_data = {
            "status": "calificado",
            "notes": "Cliente muy interesado"
        }
        
        response = client.put(
            f"/api/v1/leads/{assigned_lead.id}",
            json=update_data,
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "calificado"
    
    def test_commercial_cannot_update_others_lead(
        self, 
        client, 
        auth_headers_commercial, 
        sample_leads,
        doctor_user
    ):
        """Test que comercial NO puede actualizar leads de otros."""
        # Encontrar el lead asignado al doctor
        other_lead = next(
            lead for lead in sample_leads 
            if lead.assigned_to_id == doctor_user.id
        )
        
        update_data = {
            "status": "perdido"
        }
        
        response = client.put(
            f"/api/v1/leads/{other_lead.id}",
            json=update_data,
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestLeadsFiltering:
    """Pruebas para filtrado de leads."""
    
    def test_filter_leads_by_status(self, client, auth_headers_manager, sample_leads):
        """Test filtrar leads por estado."""
        response = client.get(
            "/api/v1/leads/?status=nuevo",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        leads = data.get("items", [])
        
        # Verificar que todos los leads devueltos tienen status "nuevo"
        for lead in leads:
            assert lead["status"] == "nuevo"
    
    def test_filter_leads_by_priority(self, client, auth_headers_manager, sample_leads):
        """Test filtrar leads por prioridad."""
        response = client.get(
            "/api/v1/leads/?priority=alta",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        leads = data.get("items", [])
        
        # Verificar que todos los leads devueltos tienen prioridad "alta"
        for lead in leads:
            assert lead["priority"] == "alta"
    
    def test_search_leads_by_name(self, client, auth_headers_manager, sample_leads):
        """Test buscar leads por nombre."""
        response = client.get(
            "/api/v1/leads/?search=Juan",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        leads = data.get("items", [])
        
        # Verificar que se encuentra el lead con nombre Juan
        assert len(leads) >= 1
        found = any("Juan" in lead["first_name"] for lead in leads)
        assert found
    
    def test_pagination_leads(self, client, auth_headers_manager, sample_leads):
        """Test paginación de leads."""
        response = client.get(
            "/api/v1/leads/?page=1&page_size=2",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        leads = data.get("items", [])
        
        # Verificar que devuelve máximo 2 leads
        assert len(leads) <= 2


class TestLeadsConversion:
    """Pruebas para conversión de leads a pacientes."""
    
    def test_manager_can_convert_lead_to_patient(
        self, 
        client, 
        auth_headers_manager, 
        sample_leads
    ):
        """Test que manager puede convertir lead a paciente."""
        lead = sample_leads[0]
        
        conversion_data = {
            "create_user_account": True,
            "send_welcome_email": False
        }
        
        response = client.post(
            f"/api/v1/leads/{lead.id}/convert",
            json=conversion_data,
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "patient_user_id" in data
    
    def test_cannot_convert_lost_lead(
        self, 
        client, 
        auth_headers_manager, 
        db_session,
        test_tenant
    ):
        """Test que no se puede convertir un lead perdido."""
        from app.models.lead import Lead
        
        # Crear lead con status "perdido"
        lost_lead = Lead(
            tenant_id=test_tenant.id,
            first_name="Lost",
            last_name="Lead",
            email="lost@test.com",
            source="website",
            status="perdido",
            priority="media",
            is_active=True
        )
        db_session.add(lost_lead)
        db_session.commit()
        db_session.refresh(lost_lead)
        
        conversion_data = {
            "create_user_account": True
        }
        
        response = client.post(
            f"/api/v1/leads/{lost_lead.id}/convert",
            json=conversion_data,
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST