"""
Endpoints para configuración del tenant.
Solo accesible por tenant_admin de su propio tenant.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import base64
import hashlib

from app.core.config import settings
from app.core.security import get_current_tenant_admin
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import (
    TenantSettingsUpdate,
    TenantSettingsResponse,
    SmtpTestRequest
)

router = APIRouter()


def get_encryption_key() -> bytes:
    """Genera una clave de encriptación basada en SECRET_KEY."""
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key)


def encrypt_password(password: str) -> str:
    """Encripta una contraseña usando Fernet."""
    fernet = Fernet(get_encryption_key())
    return fernet.encrypt(password.encode()).decode()


def decrypt_password(encrypted_password: str) -> str:
    """Desencripta una contraseña usando Fernet."""
    fernet = Fernet(get_encryption_key())
    return fernet.decrypt(encrypted_password.encode()).decode()


@router.get("/my-tenant/settings", response_model=TenantSettingsResponse)
async def get_tenant_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Obtener configuración del tenant actual.
    Solo tenant_admin puede acceder.
    """
    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no pertenece a ningún tenant"
        )

    tenant = db.query(Tenant).filter(
        Tenant.id == current_user.current_tenant_id
    ).first()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    # Construir respuesta con smtp_password_set
    return TenantSettingsResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        email=tenant.email,
        phone=tenant.phone,
        website=tenant.website,
        address=tenant.address,
        city=tenant.city,
        country=tenant.country,
        tax_id=tenant.tax_id,
        legal_name=tenant.legal_name,
        logo=tenant.logo,
        primary_color=tenant.primary_color,
        smtp_host=tenant.smtp_host,
        smtp_port=tenant.smtp_port,
        smtp_username=tenant.smtp_username,
        smtp_password_set=bool(tenant.smtp_password_encrypted),
        smtp_from_email=tenant.smtp_from_email,
        smtp_from_name=tenant.smtp_from_name,
        smtp_use_tls=tenant.smtp_use_tls,
        smtp_use_ssl=tenant.smtp_use_ssl,
        smtp_enabled=tenant.smtp_enabled,
        plan=tenant.plan,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
        updated_at=tenant.updated_at
    )


@router.put("/my-tenant/settings", response_model=TenantSettingsResponse)
async def update_tenant_settings(
    settings_in: TenantSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Actualizar configuración del tenant actual.
    Solo tenant_admin puede acceder.
    """
    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no pertenece a ningún tenant"
        )

    tenant = db.query(Tenant).filter(
        Tenant.id == current_user.current_tenant_id
    ).first()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    # Actualizar campos proporcionados
    update_data = settings_in.model_dump(exclude_unset=True)

    # Manejar encriptación de contraseña SMTP
    if "smtp_password" in update_data:
        password = update_data.pop("smtp_password")
        if password:
            tenant.smtp_password_encrypted = encrypt_password(password)
        # Si password es None o vacío, no cambiar la contraseña existente

    # Actualizar otros campos
    for field, value in update_data.items():
        if hasattr(tenant, field):
            setattr(tenant, field, value)

    db.commit()
    db.refresh(tenant)

    return TenantSettingsResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        email=tenant.email,
        phone=tenant.phone,
        website=tenant.website,
        address=tenant.address,
        city=tenant.city,
        country=tenant.country,
        tax_id=tenant.tax_id,
        legal_name=tenant.legal_name,
        logo=tenant.logo,
        primary_color=tenant.primary_color,
        smtp_host=tenant.smtp_host,
        smtp_port=tenant.smtp_port,
        smtp_username=tenant.smtp_username,
        smtp_password_set=bool(tenant.smtp_password_encrypted),
        smtp_from_email=tenant.smtp_from_email,
        smtp_from_name=tenant.smtp_from_name,
        smtp_use_tls=tenant.smtp_use_tls,
        smtp_use_ssl=tenant.smtp_use_ssl,
        smtp_enabled=tenant.smtp_enabled,
        plan=tenant.plan,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
        updated_at=tenant.updated_at
    )


@router.post("/my-tenant/smtp/test")
async def test_smtp_connection(
    test_request: SmtpTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Probar configuración SMTP del tenant enviando un email de prueba.
    Solo tenant_admin puede acceder.
    """
    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no pertenece a ningún tenant"
        )

    tenant = db.query(Tenant).filter(
        Tenant.id == current_user.current_tenant_id
    ).first()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    # Verificar que hay configuración SMTP
    if not tenant.smtp_host or not tenant.smtp_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuración SMTP incompleta. Configure host y username primero."
        )

    if not tenant.smtp_password_encrypted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay contraseña SMTP configurada"
        )

    try:
        # Desencriptar contraseña
        smtp_password = decrypt_password(tenant.smtp_password_encrypted)

        # Crear configuración temporal para FastMail
        conf = ConnectionConfig(
            MAIL_USERNAME=tenant.smtp_username,
            MAIL_PASSWORD=smtp_password,
            MAIL_FROM=tenant.smtp_from_email or tenant.smtp_username,
            MAIL_PORT=tenant.smtp_port or 587,
            MAIL_SERVER=tenant.smtp_host,
            MAIL_STARTTLS=tenant.smtp_use_tls,
            MAIL_SSL_TLS=tenant.smtp_use_ssl,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
            MAIL_FROM_NAME=tenant.smtp_from_name or tenant.name,
        )

        fm = FastMail(conf)

        # Enviar email de prueba
        message = MessageSchema(
            subject=f"Prueba de configuración SMTP - {tenant.name}",
            recipients=[test_request.test_email],
            body=f"""
            <html>
            <body>
                <h2>Prueba de configuración SMTP exitosa</h2>
                <p>Este es un correo de prueba enviado desde <strong>{tenant.name}</strong>.</p>
                <p>Si estás viendo este mensaje, la configuración SMTP está funcionando correctamente.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Servidor: {tenant.smtp_host}:{tenant.smtp_port}<br>
                    TLS: {'Sí' if tenant.smtp_use_tls else 'No'}<br>
                    SSL: {'Sí' if tenant.smtp_use_ssl else 'No'}
                </p>
            </body>
            </html>
            """,
            subtype=MessageType.html
        )

        await fm.send_message(message)

        return {
            "success": True,
            "message": f"Email de prueba enviado correctamente a {test_request.test_email}"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al enviar email de prueba: {str(e)}"
        )


@router.delete("/my-tenant/smtp/password")
async def clear_smtp_password(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Eliminar contraseña SMTP del tenant.
    Útil para resetear la configuración.
    """
    if current_user.current_tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no pertenece a ningún tenant"
        )

    tenant = db.query(Tenant).filter(
        Tenant.id == current_user.current_tenant_id
    ).first()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant no encontrado"
        )

    tenant.smtp_password_encrypted = None
    tenant.smtp_enabled = False
    db.commit()

    return {"success": True, "message": "Contraseña SMTP eliminada"}
