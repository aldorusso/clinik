# Estructura del Sidebar por Rol

## Estado de Implementación

✅ = Completado | 🚧 = En Progreso | ⏳ = Pendiente

## Roles del Sistema (5 roles)

| Rol | Descripción | Pertenece a Tenant |
|-----|-------------|-------------------|
| `superadmin` | Administrador global de la plataforma | No (tenant_id = NULL) |
| `tenant_admin` | Administrador de un tenant específico | Sí |
| `manager` | Gestor/supervisor dentro de un tenant | Sí |
| `user` | Usuario/empleado regular de un tenant | Sí |
| `client` | Cliente externo de un tenant (portal limitado) | Sí |

---

## Superadmin

```
✅ 📊 Dashboard
   - Métricas globales, tenants activos, usuarios totales
   - Estadísticas en tiempo real

✅ 🏢 Tenants
   - Lista de tenants con paginación
   - Crear tenant con admin (en un solo paso)
   - Editar/desactivar tenants
   - Ver estadísticas por tenant

✅ 👥 Usuarios
   - Gestión global de usuarios
   - Crear superadmins adicionales
   - Ver todos los usuarios del sistema
   - Filtros y búsqueda

✅ 📧 Email
   - Plantillas de email (PASSWORD_RESET, WELCOME, NOTIFICATION, USER_INVITATION)
   - Configuración SMTP (Gmail, Outlook, SendGrid, Mailgun)
   - Templates con Jinja2 en base de datos
   - Estilos responsive para emails

✅ 📋 Logs / Auditoría
   - Actividad del sistema completa
   - Logins exitosos/fallidos
   - Acciones de usuarios
   - Filtros por categoría, acción, usuario, tenant

✅ 🔐 Mi Cuenta
   - Perfil del superadmin
   - Cambiar contraseña con validación
   - Seguridad y configuración personal

⏳ ⚙️ Configuración
   - Configuración global del sistema
   - Planes/suscripciones disponibles
   - Parámetros generales
```

## Tenant Admin

```
✅ 🏢 Organización
   - Nombre de organización visible en sidebar
   - Contexto de tenant siempre presente

✅ 📊 Dashboard
   - Métricas de su tenant
   - Estadísticas de usuarios y clientes

✅ 👥 Usuarios
   - Gestión de usuarios de su tenant (managers, users)
   - Crear usuarios manualmente con contraseña
   - Invitar usuarios por email (con token de 72h)
   - Editar/desactivar usuarios
   - Ver roles y estados

✅ 👤 Clientes
   - Gestión de clientes externos
   - Crear clientes con datos fiscales
   - Portal de clientes separado
   - Datos específicos: client_company_name, client_tax_id

✅ 📋 Registro de Actividad
   - Log de actividad de su tenant
   - Filtros por acción, categoría, usuario y fecha
   - Búsqueda por email, IP o detalles
   - Estadísticas de actividad (logins, eventos)
   - Vista detallada de cada evento

✅ 🔐 Mi Cuenta
   - Perfil completo (first_name, last_name, phone, etc.)
   - Cambiar contraseña con validación
   - Ver información de tenant

⏳ ⚙️ Configuración
   - Configuración de su tenant
   - Logo, colores, datos fiscales
```

## Manager

```
✅ 🏢 Organización
   - Nombre de organización visible en sidebar

✅ 📊 Dashboard
   - Dashboard personal

✅ 👤 Clientes
   - Gestión de clientes del tenant

✅ 🔐 Mi Cuenta
   - Perfil completo
   - Cambiar contraseña

⏳ 👥 Usuarios
   - Ver usuarios (solo lectura)
```

## User (Empleado)

```
✅ 🏢 Organización
   - Nombre de organización visible en sidebar

✅ 📊 Dashboard
   - Dashboard personal

✅ 👤 Clientes
   - Ver clientes del tenant

✅ 🔐 Mi Cuenta
   - Perfil completo
   - Cambiar contraseña
```

## Client (Cliente externo)

```
✅ 🏢 Organización
   - Nombre de organización visible en sidebar

✅ 📊 Portal de Cliente
   - Dashboard personalizado
   - Interfaz simplificada

✅ 🔐 Mi Cuenta
   - Perfil con datos de empresa
   - Cambiar contraseña

⏳ 📄 Documentos
   - Ver documentos/facturas

⏳ 💬 Mensajes
   - Comunicación con el tenant
```

---

## Matriz de Permisos por Sección

| Sección | Superadmin | Tenant Admin | Manager | User | Client |
|---------|------------|--------------|---------|------|--------|
| Dashboard | Global | Su tenant | Su área | Personal | Portal |
| Tenants | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Usuarios | Todos | Solo su tenant | Solo lectura | ❌ | ❌ |
| Clientes | Todos | Solo su tenant | Limitado | ❌ | ❌ |
| Email Templates | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Configuración | Global | Su tenant | ❌ | ❌ | ❌ |
| Logs/Actividad | Todos | Su tenant | Su tenant | Su tenant | ❌ |
| Mi Cuenta | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Jerarquía de Permisos

```
superadmin (global, sin tenant)
    │
    └── tenant_admin (admin del tenant)
            │
            ├── manager (supervisor interno)
            │
            ├── user (empleado interno)
            │
            └── client (cliente externo - acceso limitado al portal)
```

### Diferencia User vs Client

| Aspecto | User (Empleado) | Client (Cliente) |
|---------|-----------------|------------------|
| Tipo | Interno (empleado) | Externo (cliente) |
| Acceso | Sistema interno | Portal de clientes |
| Datos | job_title, company_name | client_company_name, client_tax_id |
| Permisos | Operaciones internas | Solo ver su información |

---

## Endpoints de Creación

- **Superadmin crea tenant_admin**: `POST /tenants/` (con admin incluido)
- **Tenant admin crea usuarios**: `POST /users/my-tenant/users` (manager, user, client)
- **Tenant admin invita usuarios**: `POST /users/my-tenant/invite` (envía email con token)
- **Tenant admin crea clients**: `POST /users/my-tenant/clients` (endpoint específico)
- **Usuario acepta invitación**: `POST /auth/accept-invitation` (completa registro)

---

## Funcionalidades Completadas

### ✅ Autenticación y Seguridad
- Sistema de login con JWT
- Tokens de acceso con expiración (7 días por defecto)
- Refresh token automático antes de expirar
- Modal de advertencia de sesión (5 minutos antes)
- Cambio de contraseña con validación
- Recuperación de contraseña por email
- Sistema de invitaciones por email con tokens (72h)
- Aceptación de invitaciones con registro completo
- Logs de auditoría para todas las acciones de autenticación

### ✅ Multi-Tenancy
- Aislamiento completo de datos por tenant
- Tenant ID en JWT para validación
- Middleware de validación de tenant
- Superadmin sin tenant (acceso global)
- Visualización de nombre de organización en sidebar
- Endpoint `/me` retorna información de tenant

### ✅ Gestión de Usuarios
- CRUD completo de usuarios
- 5 roles implementados (superadmin, tenant_admin, manager, user, client)
- Creación manual con contraseña
- Invitación por email con token
- Campos completos de perfil (first_name, last_name, phone, country, city, etc.)
- Activación/desactivación de usuarios
- Diferenciación entre usuarios internos y clientes externos

### ✅ Gestión de Tenants (Superadmin)
- CRUD completo de tenants
- Creación de tenant con admin en un solo paso
- Activación/desactivación de tenants
- Estadísticas por tenant
- Validación de tenant activo en login

### ✅ Sistema de Email
- Configuración SMTP flexible (Gmail, Outlook, SendGrid, Mailgun)
- Templates en base de datos con Jinja2
- 4 tipos de email: PASSWORD_RESET, WELCOME, NOTIFICATION, USER_INVITATION
- Templates responsive con HTML/CSS
- Fallback a templates hardcoded si no hay en BD
- Variables de contexto (project_name, user_name, current_year, etc.)
- FRONTEND_URL configurable para links en emails
- Botones con estilos inline para compatibilidad con clientes de email
- Texto blanco en botones con !important para máxima compatibilidad

### ✅ Auditoría y Logs
- Sistema completo de audit logs
- Categorías: AUTH, USER, TENANT, SYSTEM
- Acciones rastreadas: LOGIN_SUCCESS, LOGIN_FAILED, PASSWORD_CHANGED, etc.
- Almacenamiento de IP y User-Agent
- Filtros por categoría, acción, usuario, tenant
- Endpoint de auditoría para superadmin (todos los tenants)
- Endpoint de actividad para tenant_admin/manager/user (filtrado por su tenant)
- Página de "Registro de Actividad" con estadísticas y filtros avanzados
- Búsqueda por email, IP o detalles
- Vista detallada de cada evento con JSON completo

### ✅ Sistema de Notificaciones In-App
- Notificaciones en tiempo real para usuarios
- Campanita con badge de contador de no leídas
- 4 tipos de notificaciones (INFO, SUCCESS, WARNING, ERROR)
- Polling automático cada 30 segundos
- Dropdown con últimas 5 notificaciones en header
- Página completa de gestión de notificaciones
- Filtros: Todas, No leídas, Leídas
- Marcar como leída individualmente o todas
- Eliminar notificaciones
- Navegación a URL de acción al hacer click
- Notificaciones automáticas para:
  - Cambio de contraseña
  - Recuperación de contraseña exitosa
  - Aceptación de invitaciones
  - Activación/desactivación de cuenta
  - Nuevos miembros en el equipo (para admins)

### ✅ UI/UX
- Tema oscuro/claro con toggle
- Sidebar responsive con navegación
- Dashboards específicos por rol
- Tablas con paginación y búsqueda
- Modals y dialogs con shadcn/ui
- Toasts para notificaciones
- Loading states
- Visualización de organización en sidebar
- Avatar con iniciales
- Componentes reutilizables (Alert, Button, Dialog, etc.)

### ✅ Infraestructura
- Docker Compose para desarrollo
- PostgreSQL con migraciones Alembic
- FastAPI con async/await
- Next.js 14 con App Router
- TypeScript en frontend
- Pydantic para validación
- SQLAlchemy ORM
- CORS configurado
- Variables de entorno

---

## Funcionalidades Pendientes (⏳)

### Configuración Global (Superadmin)
- Planes y suscripciones
- Parámetros del sistema
- Límites por tenant

### Configuración de Tenant
- Logo y colores personalizados
- Datos fiscales completos
- Configuración de timezone

### Portal de Cliente Avanzado
- Documentos/facturas
- Sistema de mensajería
- Notificaciones

### Reportes y Analíticas
- Dashboards con gráficos
- Reportes exportables
- Métricas en tiempo real

### Integraciones
- APIs de terceros
- Webhooks
- SSO (Single Sign-On)
