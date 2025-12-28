# Plan: Configuración SMTP por Organización

## Objetivo
Permitir que cada organización (tenant) configure sus propias credenciales SMTP para enviar correos con su propia identidad, en lugar de usar las credenciales globales del sistema.

## Acceso
- **Solo `tenant_admin`** puede acceder a esta configuración
- Nueva sección en el sidebar: "Configuración" (al final)
- Página completa (no modal) con múltiples secciones

---

## Backend

### 1. Modelo Tenant - Nuevos campos
```python
# Configuración SMTP personalizada
smtp_host = Column(String(255), nullable=True)      # smtp.gmail.com
smtp_port = Column(Integer, nullable=True)          # 587
smtp_username = Column(String(255), nullable=True)  # usuario SMTP
smtp_password = Column(String(500), nullable=True)  # contraseña (encriptada)
smtp_from_email = Column(String(255), nullable=True) # email remitente
smtp_from_name = Column(String(255), nullable=True)  # nombre remitente
smtp_use_tls = Column(Boolean, default=True)
smtp_use_ssl = Column(Boolean, default=False)
smtp_enabled = Column(Boolean, default=False)       # activar/desactivar

# Información adicional de organización
website = Column(String(255), nullable=True)
```

### 2. Migración Alembic
- Agregar los nuevos campos a la tabla `tenants`

### 3. Schemas Pydantic
```python
# TenantSettings - para actualizar configuración
class TenantSettingsUpdate(BaseModel):
    # Info organización
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    address: Optional[str]
    city: Optional[str]
    country: Optional[str]
    tax_id: Optional[str]
    legal_name: Optional[str]
    logo: Optional[str]
    primary_color: Optional[str]

    # SMTP
    smtp_host: Optional[str]
    smtp_port: Optional[int]
    smtp_username: Optional[str]
    smtp_password: Optional[str]  # solo se actualiza si se envía
    smtp_from_email: Optional[str]
    smtp_from_name: Optional[str]
    smtp_use_tls: Optional[bool]
    smtp_use_ssl: Optional[bool]
    smtp_enabled: Optional[bool]

class TenantSettingsResponse(BaseModel):
    # Mismo que update pero sin smtp_password
    # smtp_password se devuelve como "••••••••" si existe
```

### 4. Endpoints
```
GET  /api/v1/tenants/my-tenant/settings  - Obtener configuración actual
PUT  /api/v1/tenants/my-tenant/settings  - Actualizar configuración
POST /api/v1/tenants/my-tenant/smtp/test - Probar configuración SMTP
```

### 5. Servicio de Email Actualizado
- Modificar `send_email()` para aceptar `tenant_id` opcional
- Si tenant tiene SMTP configurado y habilitado, usar esas credenciales
- Si no, usar las credenciales globales del .env

---

## Frontend

### 1. Nueva página: `/dashboard/admin/configuracion`
Secciones:
1. **Información de la Organización**
   - Nombre, Logo (con upload), Teléfono, Email, Website
   - Dirección, Ciudad, País
   - Razón Social, RUC/NIT

2. **Personalización**
   - Color primario (selector)

3. **Configuración de Correo (SMTP)**
   - Toggle para habilitar SMTP personalizado
   - Servidor, Puerto, Usuario, Contraseña
   - Email remitente, Nombre remitente
   - Opciones TLS/SSL
   - Botón "Probar conexión"

### 2. Sidebar Admin
- Agregar enlace "Configuración" al final
- Solo visible para `tenant_admin`
- Icono: Settings o Cog

### 3. Componentes
- `OrganizationInfoForm` - Formulario info básica
- `SmtpConfigForm` - Formulario SMTP con test
- Reutilizar componentes UI existentes

---

## Flujo de Trabajo

1. ✅ Crear migración para nuevos campos
2. ✅ Crear/actualizar schemas
3. ✅ Crear endpoints backend
4. ✅ Actualizar servicio de email
5. ✅ Crear página frontend
6. ✅ Agregar enlace en sidebar
7. ✅ Probar flujo completo

---

## Consideraciones de Seguridad

- La contraseña SMTP debe almacenarse encriptada (o usar un servicio de secretos)
- El endpoint de configuración solo accesible por `tenant_admin`
- No devolver la contraseña en las respuestas GET
- Validar que el email remitente pertenece al dominio configurado (opcional)

---

## Preguntas para el Usuario

1. ¿Deseas que la contraseña SMTP se encripte en la base de datos? (recomendado pero agrega complejidad)
2. ¿Quieres un botón para "Probar conexión SMTP" que envíe un email de prueba?
3. ¿El logo se sube como archivo o solo URL?
