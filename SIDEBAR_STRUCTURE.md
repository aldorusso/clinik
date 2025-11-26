# Estructura del Sidebar por Rol

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
📊 Dashboard
   - Métricas globales, tenants activos, usuarios totales

🏢 Tenants
   - Lista de tenants
   - Crear/editar/desactivar tenants
   - Ver usuarios por tenant

👥 Usuarios
   - Gestión global de usuarios
   - Crear superadmins
   - Ver todos los usuarios del sistema

📧 Email
   - Plantillas de email
   - Configuración SMTP
   - Historial de envíos

⚙️ Configuración
   - Configuración global del sistema
   - Planes/suscripciones disponibles
   - Parámetros generales

📋 Logs / Auditoría
   - Actividad del sistema
   - Logins, cambios críticos

🔐 Mi Cuenta
   - Perfil del superadmin
   - Cambiar contraseña
```

## Tenant Admin

```
📊 Dashboard
   - Métricas de su tenant

👥 Usuarios
   - Gestión de usuarios de su tenant
   - Crear managers, users y clients

👤 Clientes
   - Gestión de clientes externos
   - Portal de clientes

⚙️ Configuración
   - Configuración de su tenant
   - Logo, colores, datos fiscales

📋 Logs
   - Actividad de su tenant

🔐 Mi Cuenta
   - Perfil
   - Cambiar contraseña
```

## Manager

```
📊 Dashboard
   - Métricas de su área

👥 Usuarios
   - Ver usuarios (solo lectura)

👤 Clientes
   - Gestión de clientes (si aplica)

🔐 Mi Cuenta
   - Perfil
   - Cambiar contraseña
```

## User (Empleado)

```
📊 Dashboard
   - Dashboard personal

🔐 Mi Cuenta
   - Perfil
   - Cambiar contraseña
```

## Client (Cliente externo)

```
📊 Portal de Cliente
   - Dashboard personalizado
   - Documentos/facturas
   - Estado de pedidos/proyectos

🔐 Mi Cuenta
   - Perfil
   - Cambiar contraseña
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
| Logs | Todos | Su tenant | ❌ | ❌ | ❌ |
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
- **Tenant admin crea clients**: `POST /users/my-tenant/clients` (endpoint específico)
