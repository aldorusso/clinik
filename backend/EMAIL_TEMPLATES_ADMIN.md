# Administración de Plantillas de Email

Este sistema permite a los administradores gestionar las plantillas de correo electrónico desde el panel de administración.

## Características

- ✅ CRUD completo de plantillas de email (solo para administradores)
- ✅ Plantillas HTML personalizables con variables Jinja2
- ✅ Preview de plantillas con datos de ejemplo
- ✅ 3 tipos de plantillas predefinidas
- ✅ Activación/desactivación de plantillas
- ✅ Fallback a plantillas hardcodeadas si no hay plantilla activa en BD

## Tipos de Plantillas

### 1. Password Reset (`PASSWORD_RESET`)
Usado para enviar enlaces de recuperación de contraseña.

**Variables disponibles:**
- `project_name` - Nombre del proyecto
- `user_name` - Nombre del usuario
- `reset_url` - URL completa para restablecer contraseña
- `expire_hours` - Horas de expiración del token
- `current_year` - Año actual

### 2. Welcome (`WELCOME`)
Usado para dar la bienvenida a nuevos usuarios.

**Variables disponibles:**
- `project_name` - Nombre del proyecto
- `user_name` - Nombre del usuario
- `current_year` - Año actual

### 3. Notification (`NOTIFICATION`)
Usado para notificaciones genéricas.

**Variables disponibles:**
- `project_name` - Nombre del proyecto
- `user_name` - Nombre del usuario (opcional)
- `message` - Mensaje de la notificación
- `current_year` - Año actual

## Endpoints de API

### Listar Todas las Plantillas
```http
GET /api/v1/email-templates/
Authorization: Bearer {admin_token}
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "name": "Password Reset Email",
    "template_type": "password_reset",
    "subject": "Recuperación de Contraseña - {{ project_name }}",
    "html_content": "<html>...</html>",
    "variables": "{...}",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

### Obtener Plantilla por ID
```http
GET /api/v1/email-templates/{template_id}
Authorization: Bearer {admin_token}
```

### Obtener Plantilla por Tipo
```http
GET /api/v1/email-templates/type/{template_type}
Authorization: Bearer {admin_token}
```

Tipos válidos: `password_reset`, `welcome`, `notification`

### Crear Nueva Plantilla
```http
POST /api/v1/email-templates/
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Mi Plantilla",
  "template_type": "password_reset",
  "subject": "Asunto del correo - {{ project_name }}",
  "html_content": "<html><body>...</body></html>",
  "variables": "{\"var1\": \"descripción\"}",
  "is_active": true
}
```

**Nota:** Solo puede haber una plantilla activa por `template_type`.

### Actualizar Plantilla
```http
PUT /api/v1/email-templates/{template_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "subject": "Nuevo asunto",
  "html_content": "<html>...</html>",
  "is_active": true
}
```

### Eliminar Plantilla
```http
DELETE /api/v1/email-templates/{template_id}
Authorization: Bearer {admin_token}
```

### Preview de Plantilla
```http
GET /api/v1/email-templates/preview/{template_type}
Authorization: Bearer {admin_token}
```

Retorna el HTML renderizado con datos de ejemplo para visualizar cómo se verá el correo.

**Respuesta:**
```json
{
  "subject": "Recuperación de Contraseña - Scraper API",
  "html_content": "<html>...rendered html...</html>",
  "sample_data": {
    "project_name": "Scraper API",
    "user_name": "Juan Pérez",
    ...
  }
}
```

## Sintaxis de Plantillas (Jinja2)

Las plantillas usan Jinja2 para renderizar variables dinámicas.

### Variables Simples
```html
<h1>Hola {{ user_name }}</h1>
<p>Bienvenido a {{ project_name }}</p>
```

### Condicionales
```html
{% if user_name %}
  <p>Hola {{ user_name }},</p>
{% else %}
  <p>Hola,</p>
{% endif %}
```

### Bucles
```html
<ul>
{% for item in items %}
  <li>{{ item }}</li>
{% endfor %}
</ul>
```

### Filtros
```html
<p>{{ user_name|upper }}</p>
<p>{{ message|capitalize }}</p>
```

## Ejemplos de Uso

### Ejemplo 1: Editar Plantilla de Password Reset

```bash
# 1. Obtener el token de admin
curl -X POST http://localhost:8002/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=admin123"

# 2. Listar plantillas
curl http://localhost:8002/api/v1/email-templates/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Actualizar plantilla
curl -X PUT http://localhost:8002/api/v1/email-templates/{TEMPLATE_ID} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "¡Recupera tu contraseña! - {{ project_name }}",
    "html_content": "<html>... tu nuevo HTML ...</html>"
  }'
```

### Ejemplo 2: Preview de Plantilla

```bash
curl http://localhost:8002/api/v1/email-templates/preview/password_reset \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Mejores Prácticas

### 1. Diseño HTML para Emails
- Usa **tablas** para el layout (no CSS Grid/Flexbox)
- Usa **estilos inline** en lugar de clases CSS
- Mantén un ancho máximo de **600px**
- Usa colores hexadecimales completos (#FFFFFF no #FFF)
- Evita JavaScript

### 2. Testing
- Siempre usa el endpoint `/preview/` antes de activar
- Prueba con diferentes clientes de email
- Verifica que todas las variables se rendericen correctamente

### 3. Versionado
- Guarda copias de plantillas importantes antes de editarlas
- Considera crear plantillas con `is_active=false` para probar antes de activar

### 4. Performance
- Mantén el HTML lo más simple posible
- Evita imágenes muy pesadas
- Usa CDNs para recursos externos

## Troubleshooting

### Error: "Template for type 'X' already exists"
Solo puede haber una plantilla por tipo. Edita la existente o elimínala primero.

### Error: "Error rendering template"
La sintaxis Jinja2 tiene un error. Verifica:
- Todos los `{{` tienen su `}}`
- Todos los `{%` tienen su `%}`
- Los nombres de variables son correctos

### Las variables no se renderizan
- Asegúrate de usar la sintaxis correcta: `{{ variable }}`
- Verifica que la variable existe en el contexto
- Revisa los logs del backend para errores

### Email no se envía
- El sistema de plantillas solo gestiona el HTML
- Verifica la configuración SMTP en `.env`
- Revisa los logs del backend

## Estructura de Base de Datos

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  variables TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Migración Inicial

Las plantillas por defecto se crean automáticamente al ejecutar:

```bash
docker exec base_fastapi_nextjs_backend python /app/seed_email_templates.py
```

O manualmente desde el proyecto:
```bash
python backend/seed_email_templates.py
```

## Seguridad

- ✅ Solo usuarios con rol `ADMIN` pueden gestionar plantillas
- ✅ Las plantillas se sanitizan antes de renderizar
- ✅ No se permite ejecución de código arbitrario
- ✅ Las variables no definidas se ignoran silenciosamente
- ⚠️ Ten cuidado con XSS - no renderices HTML no confiable

## Frontend Integration

Para integrar con el frontend, necesitarás crear componentes de UI para:

1. **Lista de Plantillas** - Tabla con todas las plantillas
2. **Editor de Plantilla** - Formulario con:
   - Campo de texto para nombre
   - Campo de texto para asunto
   - Editor HTML (Monaco, CodeMirror, o textarea)
   - Toggle para is_active
3. **Preview de Plantilla** - Iframe o modal que muestre el preview

Ejemplo de fetch en el frontend:

```typescript
// Obtener plantillas
const response = await fetch('http://localhost:8002/api/v1/email-templates/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const templates = await response.json();

// Actualizar plantilla
await fetch(`http://localhost:8002/api/v1/email-templates/${templateId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subject: newSubject,
    html_content: newHtml
  })
});
```

## Roadmap Futuro

- [ ] Historial de versiones de plantillas
- [ ] Duplicar plantillas
- [ ] Importar/Exportar plantillas en JSON
- [ ] Biblioteca de templates prediseñados
- [ ] Editor visual WYSIWYG
- [ ] Variables personalizadas por proyecto
- [ ] Pruebas A/B de plantillas
- [ ] Estadísticas de apertura/clicks
