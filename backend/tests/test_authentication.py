"""
Pruebas de autenticación y autorización del sistema.
Verifica que los usuarios solo puedan acceder a los recursos permitidos según su rol.
"""
import pytest
from fastapi import status


class TestAuthentication:
    """Pruebas básicas de autenticación."""
    
    def test_login_success(self, client, tenant_admin_user):
        """Test que el login funciona correctamente con credenciales válidas."""
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": tenant_admin_user.email,
                "password": "testpass123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client, tenant_admin_user):
        """Test que el login falla con credenciales incorrectas."""
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": tenant_admin_user.email,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_nonexistent_user(self, client):
        """Test que el login falla con usuario inexistente."""
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "nonexistent@test.com",
                "password": "anypassword"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_access_protected_endpoint_without_token(self, client):
        """Test que no se puede acceder a endpoints protegidos sin token."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_access_protected_endpoint_with_invalid_token(self, client):
        """Test que no se puede acceder con token inválido."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user(self, client, auth_headers_tenant_admin, tenant_admin_user):
        """Test que se puede obtener información del usuario actual."""
        response = client.get(
            "/api/v1/auth/me",
            headers=auth_headers_tenant_admin
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == tenant_admin_user.email
        assert data["role"] == tenant_admin_user.role.value


class TestRoleBasedAccess:
    """Pruebas de acceso basado en roles."""
    
    def test_superadmin_can_access_tenant_management(self, client, auth_headers_superadmin):
        """Test que superadmin puede acceder a gestión de tenants."""
        response = client.get(
            "/api/v1/tenants/",
            headers=auth_headers_superadmin
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_tenant_admin_cannot_access_tenant_management(self, client, auth_headers_tenant_admin):
        """Test que tenant admin NO puede acceder a gestión de tenants."""
        response = client.get(
            "/api/v1/tenants/",
            headers=auth_headers_tenant_admin
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_manager_can_access_leads(self, client, auth_headers_manager):
        """Test que manager puede acceder a leads."""
        response = client.get(
            "/api/v1/leads/",
            headers=auth_headers_manager
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_commercial_can_access_own_leads(self, client, auth_headers_commercial):
        """Test que comercial puede acceder a sus leads."""
        response = client.get(
            "/api/v1/leads/?assigned_to_me=true",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_patient_cannot_access_leads(self, client, auth_headers_patient):
        """Test que paciente NO puede acceder a leads."""
        response = client.get(
            "/api/v1/leads/",
            headers=auth_headers_patient
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_doctor_can_access_patients(self, client, auth_headers_doctor):
        """Test que doctor puede acceder a pacientes."""
        response = client.get(
            "/api/v1/patients/",
            headers=auth_headers_doctor
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_commercial_can_access_patients_limited(self, client, auth_headers_commercial):
        """Test que comercial puede acceder a pacientes pero con información limitada."""
        response = client.get(
            "/api/v1/patients/",
            headers=auth_headers_commercial
        )
        assert response.status_code == status.HTTP_200_OK
        # Verificar que la información está limitada (se implementará en el endpoint)
    
    def test_receptionist_can_access_appointments(self, client, auth_headers_receptionist):
        """Test que recepcionista puede acceder a citas."""
        response = client.get(
            "/api/v1/appointments/",
            headers=auth_headers_receptionist
        )
        assert response.status_code == status.HTTP_200_OK


class TestTenantIsolation:
    """Pruebas de aislamiento entre tenants."""
    
    @pytest.fixture
    def second_tenant(self, db_session):
        """Crear un segundo tenant para probar aislamiento."""
        from app.models.tenant import Tenant
        tenant = Tenant(
            name="Second Test Clinic",
            slug="secondclinic",
            is_active=True
        )
        db_session.add(tenant)
        db_session.commit()
        db_session.refresh(tenant)
        return tenant
    
    @pytest.fixture
    def second_tenant_user(self, db_session, second_tenant):
        """Crear un usuario del segundo tenant."""
        from app.core.security import get_password_hash
        from app.models.user import User, UserRole
        
        user = User(
            email="admin@secondclinic.com",
            hashed_password=get_password_hash("testpass123"),
            first_name="Second",
            last_name="Admin",
            role=UserRole.tenant_admin,
            tenant_id=second_tenant.id,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    @pytest.fixture
    def second_tenant_token(self, second_tenant_user):
        """Token para el usuario del segundo tenant."""
        from app.core.security import create_access_token
        return create_access_token(data={"sub": second_tenant_user.email})
    
    @pytest.fixture
    def auth_headers_second_tenant(self, second_tenant_token):
        """Headers de autenticación para el segundo tenant."""
        return {"Authorization": f"Bearer {second_tenant_token}"}
    
    def test_tenant_cannot_access_other_tenant_leads(
        self, 
        client, 
        auth_headers_tenant_admin, 
        auth_headers_second_tenant,
        sample_leads
    ):
        """Test que un tenant no puede ver leads de otro tenant."""
        # Usuario del primer tenant debería ver sus leads
        response = client.get(
            "/api/v1/leads/",
            headers=auth_headers_tenant_admin
        )
        assert response.status_code == status.HTTP_200_OK
        first_tenant_leads = response.json()
        
        # Usuario del segundo tenant NO debería ver leads del primer tenant
        response = client.get(
            "/api/v1/leads/",
            headers=auth_headers_second_tenant
        )
        assert response.status_code == status.HTTP_200_OK
        second_tenant_leads = response.json()
        
        # Verificar aislamiento (los leads deberían ser diferentes)
        assert len(first_tenant_leads.get("items", [])) > 0
        assert len(second_tenant_leads.get("items", [])) == 0