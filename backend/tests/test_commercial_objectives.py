"""
Pruebas para la funcionalidad de objetivos comerciales.
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta


class TestCommercialObjectives:
    """Pruebas para gestión de objetivos comerciales."""
    
    @pytest.fixture
    def sample_objective_data(self):
        """Datos de muestra para crear objetivo."""
        return {
            "title": "Objetivo de Ventas Q1",
            "description": "Conseguir 20 nuevos pacientes en Q1",
            "target_value": 20.0,
            "current_value": 0.0,
            "unit": "pacientes",
            "start_date": (datetime.now()).isoformat(),
            "end_date": (datetime.now() + timedelta(days=90)).isoformat(),
            "is_active": True
        }
    
    def test_manager_can_create_objective_for_commercial(
        self, 
        client, 
        auth_headers_manager, 
        commercial_user,
        sample_objective_data
    ):
        """Test que manager puede crear objetivos para comerciales."""
        objective_data = sample_objective_data.copy()
        objective_data["commercial_id"] = str(commercial_user.id)
        
        response = client.post(
            "/api/v1/commercial-objectives/",
            json=objective_data,
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == objective_data["title"]
        assert data["commercial_id"] == str(commercial_user.id)
    
    def test_tenant_admin_can_create_objective(
        self, 
        client, 
        auth_headers_tenant_admin, 
        commercial_user,
        sample_objective_data
    ):
        """Test que tenant admin puede crear objetivos."""
        objective_data = sample_objective_data.copy()
        objective_data["commercial_id"] = str(commercial_user.id)
        
        response = client.post(
            "/api/v1/commercial-objectives/",
            json=objective_data,
            headers=auth_headers_tenant_admin
        )
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_commercial_cannot_create_objectives(
        self, 
        client, 
        auth_headers_commercial, 
        commercial_user,
        sample_objective_data
    ):
        """Test que comercial NO puede crear objetivos."""
        objective_data = sample_objective_data.copy()
        objective_data["commercial_id"] = str(commercial_user.id)
        
        response = client.post(
            "/api/v1/commercial-objectives/",
            json=objective_data,
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_doctor_cannot_access_objectives(
        self, 
        client, 
        auth_headers_doctor
    ):
        """Test que doctor NO puede acceder a objetivos comerciales."""
        response = client.get(
            "/api/v1/commercial-objectives/",
            headers=auth_headers_doctor
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @pytest.fixture
    def sample_objective(self, db_session, test_tenant, commercial_user, manager_user):
        """Crear un objetivo de muestra."""
        from app.models.commercial_objectives import CommercialObjective
        
        objective = CommercialObjective(
            tenant_id=test_tenant.id,
            commercial_id=commercial_user.id,
            created_by_id=manager_user.id,
            title="Test Objective",
            description="Test description",
            target_value=10.0,
            current_value=3.0,
            unit="leads",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30),
            is_active=True
        )
        db_session.add(objective)
        db_session.commit()
        db_session.refresh(objective)
        return objective
    
    def test_manager_can_view_all_objectives(
        self, 
        client, 
        auth_headers_manager,
        sample_objective
    ):
        """Test que manager puede ver todos los objetivos."""
        response = client.get(
            "/api/v1/commercial-objectives/",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data.get("items", [])) >= 1
    
    def test_commercial_can_view_own_objectives(
        self, 
        client, 
        auth_headers_commercial,
        commercial_user,
        sample_objective
    ):
        """Test que comercial puede ver sus propios objetivos."""
        response = client.get(
            "/api/v1/commercial-objectives/my-dashboard",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        objectives = data.get("objectives", [])
        
        # Verificar que solo ve sus objetivos
        for objective in objectives:
            assert objective["commercial_id"] == str(commercial_user.id)
    
    def test_commercial_cannot_view_others_objectives(
        self, 
        client, 
        auth_headers_commercial,
        sample_objective
    ):
        """Test que comercial NO puede ver objetivos de otros."""
        response = client.get(
            "/api/v1/commercial-objectives/",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_manager_can_update_objective(
        self, 
        client, 
        auth_headers_manager,
        sample_objective
    ):
        """Test que manager puede actualizar objetivos."""
        update_data = {
            "current_value": 5.0,
            "notes": "Progreso actualizado"
        }
        
        response = client.put(
            f"/api/v1/commercial-objectives/{sample_objective.id}",
            json=update_data,
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["current_value"] == 5.0
    
    def test_commercial_cannot_update_objective(
        self, 
        client, 
        auth_headers_commercial,
        sample_objective
    ):
        """Test que comercial NO puede actualizar objetivos."""
        update_data = {
            "current_value": 8.0
        }
        
        response = client.put(
            f"/api/v1/commercial-objectives/{sample_objective.id}",
            json=update_data,
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_manager_can_delete_objective(
        self, 
        client, 
        auth_headers_manager,
        sample_objective
    ):
        """Test que manager puede eliminar objetivos."""
        response = client.delete(
            f"/api/v1/commercial-objectives/{sample_objective.id}",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_objective_progress_calculation(
        self, 
        client, 
        auth_headers_manager,
        sample_objective
    ):
        """Test que el progreso del objetivo se calcula correctamente."""
        response = client.get(
            f"/api/v1/commercial-objectives/{sample_objective.id}",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Con current_value=3 y target_value=10, debería ser 30%
        expected_progress = (3.0 / 10.0) * 100
        assert data["progress_percentage"] == expected_progress
    
    def test_objective_completion_status(
        self, 
        client, 
        auth_headers_manager,
        sample_objective
    ):
        """Test que el estado de completitud se calcula correctamente."""
        # Actualizar a 100% de progreso
        update_data = {
            "current_value": 10.0
        }
        
        response = client.put(
            f"/api/v1/commercial-objectives/{sample_objective.id}",
            json=update_data,
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_completed"] == True
        assert data["progress_percentage"] == 100.0


class TestCommercialStats:
    """Pruebas para estadísticas comerciales."""
    
    def test_manager_can_view_commercial_stats(
        self, 
        client, 
        auth_headers_manager
    ):
        """Test que manager puede ver estadísticas comerciales."""
        response = client.get(
            "/api/v1/commercial-stats/",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar que contiene las secciones esperadas
        assert "overview" in data
        assert "weekly_trends" in data
        assert "conversion_funnel" in data
        assert "source_performance" in data
        assert "doctor_performance" in data
    
    def test_commercial_cannot_view_global_stats(
        self, 
        client, 
        auth_headers_commercial
    ):
        """Test que comercial NO puede ver estadísticas globales."""
        response = client.get(
            "/api/v1/commercial-stats/",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_stats_with_date_filter(
        self, 
        client, 
        auth_headers_manager
    ):
        """Test que las estadísticas se pueden filtrar por fecha."""
        start_date = (datetime.now() - timedelta(days=30)).date().isoformat()
        end_date = datetime.now().date().isoformat()
        
        response = client.get(
            f"/api/v1/commercial-stats/?start_date={start_date}&end_date={end_date}",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar que la respuesta contiene datos filtrados
        assert "overview" in data