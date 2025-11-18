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

        templates = [password_reset_template, welcome_template, notification_template]

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
