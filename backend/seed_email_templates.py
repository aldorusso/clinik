#!/usr/bin/env python3
"""
Script to seed default email templates.
Run this script from the root of the project.

Usage:
    python seed_email_templates.py

Or with Docker:
    docker compose exec backend python /app/seed_email_templates.py
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.session import SessionLocal
from app.models.email_template import EmailTemplate, EmailTemplateType


def seed_email_templates():
    """Create default email templates."""
    db = SessionLocal()

    try:
        # Password Reset Template
        password_reset_template = {
            "name": "Password Reset Email",
            "template_type": EmailTemplateType.PASSWORD_RESET,
            "subject": "Recuperación de Contraseña - {{ project_name }}",
            "html_content": """
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
            color: white;
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
            <a href="{{ reset_url }}" class="button">Restablecer Contraseña</a>
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
            """,
            "variables": '{"project_name": "Nombre del proyecto", "user_name": "Nombre del usuario", "reset_url": "URL de restablecimiento", "expire_hours": "Horas de expiración", "current_year": "Año actual"}',
            "is_active": True
        }

        # Welcome Email Template
        welcome_template = {
            "name": "Welcome Email",
            "template_type": EmailTemplateType.WELCOME,
            "subject": "¡Bienvenido a {{ project_name }}!",
            "html_content": """
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
            """,
            "variables": '{"project_name": "Nombre del proyecto", "user_name": "Nombre del usuario", "current_year": "Año actual"}',
            "is_active": True
        }

        # Notification Email Template
        notification_template = {
            "name": "Notification Email",
            "template_type": EmailTemplateType.NOTIFICATION,
            "subject": "Notificación - {{ project_name }}",
            "html_content": """
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
            """,
            "variables": '{"project_name": "Nombre del proyecto", "user_name": "Nombre del usuario", "message": "Mensaje de la notificación", "current_year": "Año actual"}',
            "is_active": True
        }

        # User Invitation Template (for NEW users)
        user_invitation_template = {
            "name": "User Invitation Email",
            "template_type": EmailTemplateType.USER_INVITATION,
            "subject": "Invitación a unirse a {{ tenant_name }}",
            "html_content": """
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
            background-color: #ebf8ff;
            border: 1px solid #4299e1;
            border-radius: 8px;
            padding: 15px;
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
            <h1>{{ project_name }}</h1>
            <h2>Invitación a {{ tenant_name }}</h2>
        </div>

        <p>Hola,</p>

        <p><strong>{{ inviter_name }}</strong> te ha invitado a unirte a <strong>{{ tenant_name }}</strong> como <strong>{{ role }}</strong>.</p>

        <div class="info-box">
            <p style="margin: 0;"><strong>¿Qué necesitas hacer?</strong></p>
            <p style="margin: 5px 0 0 0;">Haz clic en el botón de abajo para crear tu cuenta y aceptar la invitación.</p>
        </div>

        <div style="text-align: center;">
            <a href="{{ invitation_link }}" class="button" style="color: white !important;">Aceptar Invitación</a>
        </div>

        <p style="font-size: 14px; color: #718096;">O copia y pega el siguiente enlace en tu navegador:</p>
        <p style="word-break: break-all; font-size: 12px; background: #edf2f7; padding: 10px; border-radius: 5px;">{{ invitation_link }}</p>

        <p><strong>⏱️ Esta invitación expirará en 72 horas.</strong></p>

        <p style="font-size: 13px; color: #718096;">Si no reconoces a quien te invitó, simplemente ignora este correo.</p>

        <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; {{ project_name }} - {{ current_year }}</p>
        </div>
    </div>
</body>
</html>
            """,
            "variables": '{"project_name": "Nombre del proyecto", "inviter_name": "Nombre de quien invita", "tenant_name": "Nombre de la organización", "role": "Rol asignado", "invitation_link": "Enlace de invitación", "current_year": "Año actual"}',
            "is_active": True
        }

        # Existing User Invitation Template
        existing_user_invitation_template = {
            "name": "Existing User Invitation Email",
            "template_type": EmailTemplateType.EXISTING_USER_INVITATION,
            "subject": "Te han invitado a unirte a {{ tenant_name }}",
            "html_content": """
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
            <a href="{{ invitation_link }}" class="button" style="color: white !important;">Aceptar Invitación</a>
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
            """,
            "variables": '{"project_name": "Nombre del proyecto", "user_name": "Nombre del usuario", "inviter_name": "Nombre de quien invita", "tenant_name": "Nombre de la organización", "role": "Rol asignado", "invitation_link": "Enlace de invitación", "current_year": "Año actual"}',
            "is_active": True
        }

        # Tenant Assignment Template (for direct assignment without invitation)
        tenant_assignment_template = {
            "name": "Tenant Assignment Email",
            "template_type": EmailTemplateType.TENANT_ASSIGNMENT,
            "subject": "Has sido asignado a {{ tenant_name }}",
            "html_content": """
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
            background-color: #48bb78;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .info-box {
            background-color: #f0fff4;
            border: 1px solid #48bb78;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .info-box-title {
            color: #276749;
            font-weight: bold;
            margin-bottom: 5px;
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
            <h1>{{ project_name }}</h1>
            <h2>Nueva Organización Asignada</h2>
        </div>

        {% if user_name %}
        <p>Hola {{ user_name }},</p>
        {% else %}
        <p>Hola,</p>
        {% endif %}

        <p>Te informamos que <strong>{{ assigner_name }}</strong> te ha asignado como <strong>{{ role }}</strong> en la organización <strong>{{ tenant_name }}</strong>.</p>

        <div class="info-box">
            <div class="info-box-title">✓ Ya tienes acceso</div>
            <p style="margin: 5px 0 0 0;">No necesitas realizar ninguna acción. Ya puedes acceder a {{ tenant_name }} con tus credenciales actuales.</p>
        </div>

        <p>La próxima vez que inicies sesión, podrás seleccionar esta organización desde tu panel de control.</p>

        <div style="text-align: center;">
            <a href="{{ login_url }}" class="button" style="color: white !important;">Ir al Panel de Control</a>
        </div>

        <p style="font-size: 13px; color: #718096;">Si tienes alguna pregunta sobre este acceso, contacta a {{ assigner_name }} o al administrador de la organización.</p>

        <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; {{ project_name }} - {{ current_year }}</p>
        </div>
    </div>
</body>
</html>
            """,
            "variables": '{"project_name": "Nombre del proyecto", "user_name": "Nombre del usuario", "assigner_name": "Nombre de quien asigna", "tenant_name": "Nombre de la organización", "role": "Rol asignado", "login_url": "URL de login", "current_year": "Año actual"}',
            "is_active": True
        }

        templates = [
            password_reset_template,
            welcome_template,
            notification_template,
            user_invitation_template,
            existing_user_invitation_template,
            tenant_assignment_template
        ]

        for template_data in templates:
            # Check if template already exists
            existing = db.query(EmailTemplate).filter(
                EmailTemplate.template_type == template_data["template_type"]
            ).first()

            if existing:
                print(f"⚠️  Template '{template_data['name']}' already exists. Skipping...")
                continue

            # Create template
            template = EmailTemplate(**template_data)
            db.add(template)
            db.commit()
            db.refresh(template)

            print(f"✅ Created template: {template.name} ({template.template_type.value})")

        print("=" * 50)
        print("✨ Email templates seeded successfully!")
        print("=" * 50)

    except Exception as e:
        print(f"❌ Error seeding templates: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 50)
    print("Seeding Email Templates")
    print("=" * 50)

    seed_email_templates()

    sys.exit(0)
