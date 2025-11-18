# Configuración del Sistema de Envío de Correos

Este proyecto incluye un sistema completo de envío de correos electrónicos mediante SMTP para funcionalidades como:
- Recuperación de contraseña
- Emails de bienvenida
- Notificaciones generales

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` basado en `.env.example`:

```bash
cp .env.example .env
```

### 2. Configurar SMTP

Edita el archivo `.env` y configura las siguientes variables:

```env
# Email/SMTP Configuration
MAIL_USERNAME=tu-correo@gmail.com
MAIL_PASSWORD=tu-contraseña-de-aplicación
MAIL_FROM=noreply@tudominio.com
MAIL_FROM_NAME=Nombre de tu App
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
USE_CREDENTIALS=True
VALIDATE_CERTS=True
```

### 3. Configuración para Gmail

Si usas Gmail, necesitas crear una "Contraseña de Aplicación":

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en 2 pasos (debe estar activada)
3. Seguridad → Contraseñas de aplicaciones
4. Genera una nueva contraseña para "Correo"
5. Copia la contraseña de 16 caracteres generada
6. Usa esta contraseña en `MAIL_PASSWORD`

**IMPORTANTE**: No uses tu contraseña de Gmail normal, usa una contraseña de aplicación.

### 4. Otros Proveedores SMTP

#### Outlook/Hotmail
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
```

#### Yahoo
```env
MAIL_SERVER=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
```

#### SendGrid
```env
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=tu-api-key-de-sendgrid
MAIL_STARTTLS=True
```

#### Mailgun
```env
MAIL_SERVER=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=tu-usuario-mailgun
MAIL_PASSWORD=tu-contraseña-mailgun
MAIL_STARTTLS=True
```

## Endpoints Disponibles

### 1. Recuperación de Contraseña

**Solicitar recuperación:**
```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@example.com"
}
```

El usuario recibirá un correo con un enlace para restablecer su contraseña.

**Restablecer contraseña:**
```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "token-recibido-por-email",
  "new_password": "nueva-contraseña-segura"
}
```

## Funciones de Utilidad

El módulo `app/core/email.py` proporciona las siguientes funciones:

### `send_reset_password_email(email_to, token, user_name)`
Envía un email de recuperación de contraseña con un enlace y token.

### `send_welcome_email(email_to, user_name)`
Envía un email de bienvenida a nuevos usuarios.

### `send_notification_email(email_to, subject, message, user_name)`
Envía un email de notificación genérico.

### `send_email(email_to, subject, html_content, text_content)`
Función base para enviar cualquier tipo de email con HTML personalizado.

## Ejemplo de Uso en Código

```python
from app.core.email import send_notification_email

# Enviar notificación personalizada
await send_notification_email(
    email_to="usuario@example.com",
    subject="Actualización importante",
    message="Tu cuenta ha sido actualizada exitosamente.",
    user_name="Juan Pérez"
)
```

## Plantillas HTML

Las plantillas de correo están incluidas en `app/core/email.py` usando Jinja2. Incluyen:
- Diseño responsive
- Estilos modernos
- Botones de acción
- Footer con información del proyecto

## Solución de Problemas

### Error: "Authentication failed"
- Verifica que estés usando una contraseña de aplicación (no tu contraseña normal)
- Asegúrate de que la verificación en 2 pasos esté activada en Gmail

### Error: "Connection refused"
- Verifica que `MAIL_SERVER` y `MAIL_PORT` sean correctos
- Comprueba que tu firewall permita conexiones salientes al puerto SMTP

### Los correos no llegan
- Revisa la carpeta de spam
- Verifica que `MAIL_FROM` tenga un formato válido
- Comprueba los logs del backend para ver errores de envío

### En desarrollo sin SMTP configurado
Los endpoints funcionarán pero los correos no se enviarán. Los errores se imprimen en la consola pero no afectan la respuesta de la API (por seguridad).

## Seguridad

- **Nunca** commits tu archivo `.env` con credenciales reales
- Usa variables de entorno en producción
- Las contraseñas de aplicación son más seguras que las contraseñas normales
- Los tokens de reset expiran después de 24 horas por defecto
- Los tokens son URLs seguras y criptográficamente aleatorios

## Personalización

Para personalizar las plantillas de correo, edita las funciones en `app/core/email.py`:
- Modifica el HTML para cambiar el diseño
- Ajusta los estilos CSS inline
- Cambia los textos y mensajes
- Añade tu logo o imágenes corporativas
