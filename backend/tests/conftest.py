"""
Configuración global para pytest.
Este archivo se ejecuta antes de todas las pruebas y proporciona fixtures compartidas.
"""
import os
import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Set testing environment
os.environ["TESTING"] = "true"

from app.main import app
from app.db.session import get_db
from app.models.user import Base
from app.core.security import create_access_token, verify_password
from app.models.tenant import Tenant
from app.models.user import User, UserRole

# Test database URL - usando SQLite en memoria para tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

# Crear engine para testing
test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=test_engine
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


def override_get_db():
    """Override para usar la base de datos de testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db_session():
    """Crear una nueva sesión de base de datos para cada test."""
    # Limpiar y crear todas las tablas
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    # Crear sesión
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Limpiar todas las tablas después de cada test
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Cliente de testing para FastAPI."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
async def async_client():
    """Cliente async para pruebas asíncronas."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


# ============== FIXTURES DE DATOS DE TESTING ==============

@pytest.fixture
def test_tenant(db_session):
    """Crear un tenant de prueba."""
    tenant = Tenant(
        name="Test Clinic",
        slug="testclinic",
        is_active=True
    )
    db_session.add(tenant)
    db_session.commit()
    db_session.refresh(tenant)
    return tenant


@pytest.fixture
def superadmin_user(db_session):
    """Crear un usuario superadmin de prueba."""
    from app.core.security import get_password_hash
    
    user = User(
        email="superadmin@test.com",
        hashed_password=get_password_hash("testpass123"),
        first_name="Super",
        last_name="Admin",
        role=UserRole.superadmin,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def tenant_admin_user(db_session, test_tenant):
    """Crear un usuario admin de tenant de prueba."""
    from app.core.security import get_password_hash
    
    user = User(
        email="admin@testclinic.com",
        hashed_password=get_password_hash("testpass123"),
        first_name="Tenant",
        last_name="Admin",
        role=UserRole.tenant_admin,
        tenant_id=test_tenant.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def manager_user(db_session, test_tenant):
    """Crear un usuario manager de prueba."""
    from app.core.security import get_password_hash
    
    user = User(
        email="manager@testclinic.com",
        hashed_password=get_password_hash("testpass123"),
        first_name="Test",
        last_name="Manager",
        role=UserRole.manager,
        tenant_id=test_tenant.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def doctor_user(db_session, test_tenant):
    """Crear un usuario médico de prueba."""
    from app.core.security import get_password_hash
    
    user = User(
        email="doctor@testclinic.com",
        hashed_password=get_password_hash("testpass123"),
        first_name="Dr. Test",
        last_name="Doctor",
        role=UserRole.user,
        tenant_id=test_tenant.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def commercial_user(db_session, test_tenant):
    """Crear un usuario comercial de prueba."""
    from app.core.security import get_password_hash
    
    user = User(
        email="commercial@testclinic.com",
        hashed_password=get_password_hash("testpass123"),
        first_name="Test",
        last_name="Commercial",
        role=UserRole.closer,
        tenant_id=test_tenant.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def receptionist_user(db_session, test_tenant):
    """Crear un usuario recepcionista de prueba."""
    from app.core.security import get_password_hash
    
    user = User(
        email="receptionist@testclinic.com",
        hashed_password=get_password_hash("testpass123"),
        first_name="Test",
        last_name="Receptionist",
        role=UserRole.recepcionista,
        tenant_id=test_tenant.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def patient_user(db_session, test_tenant):
    """Crear un usuario paciente de prueba."""
    from app.core.security import get_password_hash
    
    user = User(
        email="patient@testclinic.com",
        hashed_password=get_password_hash("testpass123"),
        first_name="Test",
        last_name="Patient",
        role=UserRole.patient,
        tenant_id=test_tenant.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


# ============== FIXTURES DE AUTENTICACIÓN ==============

@pytest.fixture
def superadmin_token(superadmin_user):
    """Token de autenticación para superadmin."""
    return create_access_token(data={"sub": superadmin_user.email})


@pytest.fixture
def tenant_admin_token(tenant_admin_user):
    """Token de autenticación para tenant admin."""
    return create_access_token(data={"sub": tenant_admin_user.email})


@pytest.fixture
def manager_token(manager_user):
    """Token de autenticación para manager."""
    return create_access_token(data={"sub": manager_user.email})


@pytest.fixture
def doctor_token(doctor_user):
    """Token de autenticación para doctor."""
    return create_access_token(data={"sub": doctor_user.email})


@pytest.fixture
def commercial_token(commercial_user):
    """Token de autenticación para commercial."""
    return create_access_token(data={"sub": commercial_user.email})


@pytest.fixture
def receptionist_token(receptionist_user):
    """Token de autenticación para receptionist."""
    return create_access_token(data={"sub": receptionist_user.email})


@pytest.fixture
def patient_token(patient_user):
    """Token de autenticación para patient."""
    return create_access_token(data={"sub": patient_user.email})


# ============== HELPERS DE AUTENTICACIÓN ==============

def create_auth_headers(token: str) -> dict:
    """Crear headers de autenticación para las requests."""
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_superadmin(superadmin_token):
    """Headers de autenticación para superadmin."""
    return create_auth_headers(superadmin_token)


@pytest.fixture
def auth_headers_tenant_admin(tenant_admin_token):
    """Headers de autenticación para tenant admin."""
    return create_auth_headers(tenant_admin_token)


@pytest.fixture
def auth_headers_manager(manager_token):
    """Headers de autenticación para manager."""
    return create_auth_headers(manager_token)


@pytest.fixture
def auth_headers_doctor(doctor_token):
    """Headers de autenticación para doctor."""
    return create_auth_headers(doctor_token)


@pytest.fixture
def auth_headers_commercial(commercial_token):
    """Headers de autenticación para commercial."""
    return create_auth_headers(commercial_token)


@pytest.fixture
def auth_headers_receptionist(receptionist_token):
    """Headers de autenticación para receptionist."""
    return create_auth_headers(receptionist_token)


@pytest.fixture
def auth_headers_patient(patient_token):
    """Headers de autenticación para patient."""
    return create_auth_headers(patient_token)


# ============== FIXTURES DE DATOS DE NEGOCIO ==============

@pytest.fixture
def sample_leads(db_session, test_tenant, doctor_user, commercial_user):
    """Crear leads de muestra para testing."""
    from app.models.lead import Lead
    
    leads = []
    
    # Lead asignado a médico
    lead1 = Lead(
        tenant_id=test_tenant.id,
        first_name="Juan",
        last_name="Pérez",
        email="juan@test.com",
        phone="+34600123456",
        source="website",
        status="nuevo",
        priority="media",
        assigned_to_id=doctor_user.id,
        is_active=True
    )
    
    # Lead asignado a comercial
    lead2 = Lead(
        tenant_id=test_tenant.id,
        first_name="María",
        last_name="García",
        email="maria@test.com",
        phone="+34600123457",
        source="facebook",
        status="contactado",
        priority="alta",
        assigned_to_id=commercial_user.id,
        is_active=True
    )
    
    # Lead sin asignar
    lead3 = Lead(
        tenant_id=test_tenant.id,
        first_name="Carlos",
        last_name="López",
        email="carlos@test.com",
        phone="+34600123458",
        source="facebook",
        status="nuevo",
        priority="baja",
        is_active=True
    )
    
    leads.extend([lead1, lead2, lead3])
    
    for lead in leads:
        db_session.add(lead)
    
    db_session.commit()
    
    for lead in leads:
        db_session.refresh(lead)
    
    return leads