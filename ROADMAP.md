# Roadmap - Base SaaS Multi-tenant

## Prioridad Alta (Fundamentales)

- [ ] **Recuperacion de Contrasena**
  - Flujo "Olvide mi contrasena"
  - Email con token temporal
  - Pagina de reset

- [ ] **Sistema de Notificaciones**
  - Notificaciones in-app (bell icon con contador)
  - Preferencias de notificacion por usuario
  - Historial de notificaciones

- [ ] **Invitaciones por Email**
  - Invitar usuarios por email
  - Token de invitacion con expiracion
  - Registro desde invitacion

- [ ] **Activity Log por Tenant**
  - Log de actividad visible para tenant_admin
  - Filtros por usuario, accion, fecha

## Prioridad Media

- [ ] **Dashboard con metricas reales**
  - Widgets configurables
  - Estadisticas del tenant (usuarios activos, clientes, etc.)

- [ ] **Exportacion de datos**
  - Export a CSV/Excel de tablas
  - Reportes basicos

- [ ] **Busqueda global**
  - Command palette (Cmd+K)
  - Busqueda rapida de usuarios, clientes, etc.

- [ ] **Onboarding/Wizard inicial**
  - Guia para nuevos tenant_admin
  - Checklist de configuracion inicial

## Prioridad Baja (Nice to have)

- [ ] **API Keys para integraciones**
  - Generacion de API keys por tenant
  - Scopes/permisos por key

- [ ] **Webhooks**
  - Configuracion de webhooks por tenant
  - Eventos comunes (user.created, client.created, etc.)

- [ ] **Archivo/Soft Delete**
  - Soft delete en lugar de hard delete
  - Papelera con restauracion

- [ ] **Multi-idioma (i18n)**
  - Preparar estructura para traducciones

---

## Completado

- [x] Multi-tenant architecture con 5 roles (superadmin, tenant_admin, manager, user, client)
- [x] Autenticacion JWT
- [x] Gestion de tenants (superadmin)
- [x] Gestion de usuarios por tenant (tenant_admin)
- [x] Gestion de clientes (tenant_admin, manager, user)
- [x] Perfiles de usuario con foto
- [x] Cambio de contrasena
- [x] Dark mode
- [x] Sistema de emails con plantillas (superadmin)
- [x] Audit logs (superadmin)
- [x] Planes y configuracion del sistema (superadmin)
