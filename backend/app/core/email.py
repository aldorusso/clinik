from typing import Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from jinja2 import Template
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.email_template import EmailTemplate, EmailTemplateType


# Configure FastMail
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
)

fm = FastMail(conf)


async def send_email(
    email_to: EmailStr,
    subject: str,
    html_content: str,
    text_content: str = None
):
    """
    Send an email using FastMail.

    Args:
        email_to: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        text_content: Plain text content (optional)
    """
    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        body=html_content,
        subtype=MessageType.html
    )

    await fm.send_message(message)


async def get_email_template_from_db(db: Session, template_type: EmailTemplateType) -> Optional[EmailTemplate]:
    """
    Get email template from database.

    Args:
        db: Database session
        template_type: Type of template to retrieve

    Returns:
        EmailTemplate object or None if not found
    """
    return db.query(EmailTemplate).filter(
        EmailTemplate.template_type == template_type,
        EmailTemplate.is_active == True
    ).first()


async def render_email_template(template: EmailTemplate, context: dict) -> tuple[str, str]:
    """
    Render email template with given context.

    Args:
        template: EmailTemplate object
        context: Dictionary with template variables

    Returns:
        Tuple of (subject, rendered_html_content)
    """
    jinja_template = Template(template.html_content)
    html_content = jinja_template.render(**context)

    # Also render subject in case it has variables
    subject_template = Template(template.subject)
    subject = subject_template.render(**context)

    return subject, html_content


async def send_reset_password_email(
    db: Session,
    email_to: EmailStr,
    token: str,
    user_name: str = None
):
    """
    Send password reset email with token.

    Args:
        db: Database session
        email_to: User's email address
        token: Password reset token
        user_name: User's name (optional)
    """
    from datetime import datetime

    # Try to get template from database
    template = await get_email_template_from_db(db, EmailTemplateType.PASSWORD_RESET)

    # Prepare context
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    context = {
        "project_name": settings.PROJECT_NAME,
        "user_name": user_name,
        "reset_url": reset_url,
        "expire_hours": settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS,
        "current_year": datetime.now().year
    }

    if template:
        # Use database template
        subject, html_content = await render_email_template(template, context)
    else:
        # Fallback to hardcoded template
        subject = f"Recuperación de Contraseña - {settings.PROJECT_NAME}"
        html_content = get_default_password_reset_template(context)

    await send_email(
        email_to=email_to,
        subject=subject,
        html_content=html_content
    )


async def send_welcome_email(db: Session, email_to: EmailStr, user_name: str):
    """
    Send welcome email to new users.

    Args:
        db: Database session
        email_to: User's email address
        user_name: User's name
    """
    from datetime import datetime

    # Try to get template from database
    template = await get_email_template_from_db(db, EmailTemplateType.WELCOME)

    # Prepare context
    context = {
        "project_name": settings.PROJECT_NAME,
        "user_name": user_name,
        "current_year": datetime.now().year
    }

    if template:
        # Use database template
        subject, html_content = await render_email_template(template, context)
    else:
        # Fallback to hardcoded template
        subject = f"Bienvenido a {settings.PROJECT_NAME}"
        html_content = get_default_welcome_template(context)

    await send_email(
        email_to=email_to,
        subject=subject,
        html_content=html_content
    )


async def send_notification_email(
    db: Session,
    email_to: EmailStr,
    subject: str = None,
    message: str = "",
    user_name: str = None
):
    """
    Send a generic notification email.

    Args:
        db: Database session
        email_to: Recipient email address
        subject: Email subject (optional, will use template default)
        message: Notification message
        user_name: User's name (optional)
    """
    from datetime import datetime

    # Try to get template from database
    template = await get_email_template_from_db(db, EmailTemplateType.NOTIFICATION)

    # Prepare context
    context = {
        "project_name": settings.PROJECT_NAME,
        "user_name": user_name,
        "message": message,
        "current_year": datetime.now().year
    }

    if template:
        # Use database template
        rendered_subject, html_content = await render_email_template(template, context)
        # Use provided subject or template subject
        final_subject = subject or rendered_subject
    else:
        # Fallback to hardcoded template
        final_subject = subject or f"Notificación - {settings.PROJECT_NAME}"
        html_content = get_default_notification_template(context)

    await send_email(
        email_to=email_to,
        subject=final_subject,
        html_content=html_content
    )


async def send_invitation_email(
    db: Session,
    email_to: EmailStr,
    invitation_token: str,
    inviter_name: str,
    tenant_name: str,
    role: str
):
    """
    Send invitation email to join a tenant (for NEW users who need to create an account).

    Args:
        db: Database session
        email_to: Invitee email address
        invitation_token: Unique invitation token
        inviter_name: Name of the person sending the invitation
        tenant_name: Name of the tenant/organization
        role: Role being offered (tenant_admin, manager, user, client)
    """
    from datetime import datetime

    # Try to get template from database
    template = await get_email_template_from_db(db, EmailTemplateType.USER_INVITATION)

    # Build invitation link
    invitation_link = f"{settings.FRONTEND_URL}/accept-invitation?token={invitation_token}"

    # Role translation
    role_translations = {
        "tenant_admin": "Administrador",
        "manager": "Manager",
        "medico": "Médico",
        "closer": "Closer/Comercial"
    }
    role_display = role_translations.get(role, role)

    # Prepare context
    context = {
        "project_name": settings.PROJECT_NAME,
        "inviter_name": inviter_name,
        "tenant_name": tenant_name,
        "role": role_display,
        "invitation_link": invitation_link,
        "current_year": datetime.now().year
    }

    if template:
        # Use database template
        subject, html_content = await render_email_template(template, context)
    else:
        # Fallback to hardcoded template
        subject = f"Invitación a unirse a {tenant_name}"
        html_content = f"""
        <p>Hola,</p>
        <p><strong>{inviter_name}</strong> te ha invitado a unirte a <strong>{tenant_name}</strong> como <strong>{role_display}</strong>.</p>
        <p>Para aceptar esta invitación, haz clic en el siguiente enlace:</p>
        <p><a href="{invitation_link}">{invitation_link}</a></p>
        <p><strong>Esta invitación expirará en 72 horas.</strong></p>
        """

    await send_email(
        email_to=email_to,
        subject=subject,
        html_content=html_content
    )


async def send_existing_user_invitation_email(
    db: Session,
    email_to: EmailStr,
    invitation_token: str,
    inviter_name: str,
    tenant_name: str,
    role: str,
    user_name: str = None
):
    """
    Send invitation email to join a tenant for EXISTING users who already have an account.
    The email acknowledges they have an account and can use their existing credentials.

    Args:
        db: Database session
        email_to: Invitee email address
        invitation_token: Unique invitation token
        inviter_name: Name of the person sending the invitation
        tenant_name: Name of the tenant/organization
        role: Role being offered
        user_name: User's name (optional)
    """
    from datetime import datetime

    # Try to get template from database
    template = await get_email_template_from_db(db, EmailTemplateType.EXISTING_USER_INVITATION)

    # Build invitation link - same page but user already has account
    invitation_link = f"{settings.FRONTEND_URL}/accept-invitation?token={invitation_token}"

    # Role translation
    role_translations = {
        "tenant_admin": "Administrador",
        "manager": "Manager",
        "medico": "Médico",
        "closer": "Closer/Comercial",
        "recepcionista": "Recepcionista"
    }
    role_display = role_translations.get(role, role)

    # Prepare context
    context = {
        "project_name": settings.PROJECT_NAME,
        "inviter_name": inviter_name,
        "tenant_name": tenant_name,
        "role": role_display,
        "invitation_link": invitation_link,
        "user_name": user_name,
        "current_year": datetime.now().year
    }

    if template:
        # Use database template
        subject, html_content = await render_email_template(template, context)
    else:
        # Fallback to hardcoded template
        subject = f"Te han invitado a unirte a {tenant_name}"
        html_content = get_default_existing_user_invitation_template(context)

    await send_email(
        email_to=email_to,
        subject=subject,
        html_content=html_content
    )


# Default/Fallback Templates

def get_default_password_reset_template(context: dict) -> str:
    """Get default password reset template."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                color: #4a5568;
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #4299e1;
                color: white !important;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #718096;
            }
            .token-box {
                background-color: #edf2f7;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                word-break: break-all;
                font-family: monospace;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{{ project_name }}</h1>
                <h2>Recuperación de Contraseña</h2>
            </div>

            {% if user_name %}
            <p>Hola {{ user_name }},</p>
            {% else %}
            <p>Hola,</p>
            {% endif %}

            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>

            <div style="text-align: center;">
                <a href="{{ reset_url }}" class="button" style="color: white !important;">Restablecer Contraseña</a>
            </div>

            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <div class="token-box">{{ reset_url }}</div>

            <p><strong>Este enlace expirará en {{ expire_hours }} horas.</strong></p>

            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>

            <div class="footer">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                <p>&copy; {{ project_name }} - {{ current_year }}</p>
            </div>
        </div>
    </body>
    </html>
    """
    template = Template(html)
    return template.render(**context)


def get_default_welcome_template(context: dict) -> str:
    """Get default welcome email template."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                color: #4a5568;
                margin-bottom: 30px;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #718096;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Bienvenido a {{ project_name }}!</h1>
            </div>

            <p>Hola {{ user_name }},</p>

            <p>¡Gracias por registrarte en {{ project_name }}!</p>

            <p>Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a todas las funcionalidades de nuestra plataforma.</p>

            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>

            <div class="footer">
                <p>&copy; {{ project_name }} - {{ current_year }}</p>
            </div>
        </div>
    </body>
    </html>
    """
    template = Template(html)
    return template.render(**context)


def get_default_notification_template(context: dict) -> str:
    """Get default notification email template."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                color: #4a5568;
                margin-bottom: 30px;
            }
            .message-box {
                background-color: white;
                padding: 20px;
                border-left: 4px solid #4299e1;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #718096;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>{{ project_name }}</h2>
            </div>

            {% if user_name %}
            <p>Hola {{ user_name }},</p>
            {% else %}
            <p>Hola,</p>
            {% endif %}

            <div class="message-box">
                {{ message }}
            </div>

            <div class="footer">
                <p>&copy; {{ project_name }} - {{ current_year }}</p>
            </div>
        </div>
    </body>
    </html>
    """
    template = Template(html)
    return template.render(**context)


def get_default_existing_user_invitation_template(context: dict) -> str:
    """Get default template for existing user invitations."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                color: #4a5568;
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                padding: 14px 35px;
                background-color: #4299e1;
                color: white !important;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
            .info-box {
                background-color: #e6fffa;
                border: 1px solid #38b2ac;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }
            .info-box-title {
                color: #234e52;
                font-weight: bold;
                margin-bottom: 5px;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #718096;
            }
            .highlight {
                background-color: #fef3c7;
                padding: 2px 6px;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{{ project_name }}</h1>
                <h2>Nueva invitación a organización</h2>
            </div>

            {% if user_name %}
            <p>Hola {{ user_name }},</p>
            {% else %}
            <p>Hola,</p>
            {% endif %}

            <p><strong>{{ inviter_name }}</strong> te ha invitado a unirte a <strong>{{ tenant_name }}</strong> como <strong>{{ role }}</strong>.</p>

            <div class="info-box">
                <div class="info-box-title">✓ Ya tienes una cuenta en {{ project_name }}</div>
                <p style="margin: 5px 0 0 0;">Puedes usar tus credenciales existentes para aceptar esta invitación. No necesitas crear una cuenta nueva.</p>
            </div>

            <p>Al aceptar, tendrás acceso a <strong>{{ tenant_name }}</strong> además de las organizaciones en las que ya participas.</p>

            <div style="text-align: center;">
                <a href="{{ invitation_link }}" class="button" style="color: white !important;">Aceptar invitación</a>
            </div>

            <p style="font-size: 14px; color: #718096;">O copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; font-size: 12px; background: #edf2f7; padding: 10px; border-radius: 5px;">{{ invitation_link }}</p>

            <p><strong>⏱️ Esta invitación expirará en 72 horas.</strong></p>

            <p style="font-size: 13px; color: #718096;">Si no reconoces a quien te invitó o no deseas unirte, simplemente ignora este correo.</p>

            <div class="footer">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                <p>&copy; {{ project_name }} - {{ current_year }}</p>
            </div>
        </div>
    </body>
    </html>
    """
    template = Template(html)
    return template.render(**context)
