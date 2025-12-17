# Deuda Tecnica - Clinik

Documento generado: 2025-12-17

Este documento registra los archivos que exceden los limites de tamano establecidos en CLAUDE.md y requieren refactorizacion.

---

## Resumen Ejecutivo

| Area | Archivos con Problemas | Prioridad |
|------|------------------------|-----------|
| Frontend - Paginas | 20+ archivos | ALTA |
| Frontend - Componentes | 9 archivos | ALTA |
| Frontend - API Client | 1 archivo (3289 lineas) | CRITICA |
| Backend - Endpoints | 6+ archivos | ALTA |
| Backend - Models | 4 archivos | MEDIA |
| Backend - Services | No existe layer | CRITICA |

---

## FRONTEND

### Paginas que Exceden 300 Lineas

| Archivo | Lineas | Excede por | Prioridad |
|---------|--------|------------|-----------|
| `dashboard/calendario/page.tsx` | 1120 | +820 | CRITICA |
| `dashboard/admin/calendario/page.tsx` | 1088 | +788 | CRITICA |
| `dashboard/admin/objetivos/page.tsx` | 940 | +640 | CRITICA |
| `dashboard/admin/servicios/page.tsx` | 894 | +594 | CRITICA |
| `dashboard/citas/page.tsx` | 859 | +559 | CRITICA |
| `dashboard/profile/page.tsx` | 837 | +537 | CRITICA |
| `dashboard/admin/usuarios/page.tsx` | 825 | +525 | CRITICA |
| `dashboard/superadmin/usuarios/page.tsx` | 809 | +509 | CRITICA |
| `dashboard/servicios/page.tsx` | 744 | +444 | ALTA |
| `portal/profile/page.tsx` | 667 | +367 | ALTA |
| `dashboard/admin/inventario/categorias/page.tsx` | 665 | +365 | ALTA |
| `dashboard/admin/profile/page.tsx` | 661 | +361 | ALTA |
| `dashboard/superadmin/configuracion/page.tsx` | 646 | +346 | ALTA |
| `dashboard/superadmin/tenants/page.tsx` | 626 | +326 | ALTA |
| `dashboard/superadmin/auditoria/page.tsx` | 624 | +324 | ALTA |
| `dashboard/leads/page.tsx` | 594 | +294 | ALTA |
| `portal/documentos/page.tsx` | 548 | +248 | MEDIA |
| `dashboard/objetivos/page.tsx` | 533 | +233 | MEDIA |
| `dashboard/superadmin/profile/page.tsx` | 529 | +229 | MEDIA |
| `dashboard/notifications/page.tsx` | 500 | +200 | MEDIA |

**Accion requerida:** Extraer secciones a componentes reutilizables.

### Componentes que Exceden 200 Lineas

| Archivo | Lineas | Excede por | Prioridad |
|---------|--------|------------|-----------|
| `leads/lead-form-modal.tsx` | 569 | +369 | CRITICA |
| `dashboard/clientes-management.tsx` | 548 | +348 | CRITICA |
| `calendar/calendar-view.tsx` | 450 | +250 | CRITICA |
| `medical/medical-history.tsx` | 445 | +245 | CRITICA |
| `patients/schedule-appointment-modal.tsx` | 404 | +204 | ALTA |
| `appointments/inventory-usage-dialog.tsx` | 369 | +169 | ALTA |
| `dashboard/sidebar.tsx` | 354 | +154 | ALTA |
| `notifications/notification-bell.tsx` | 262 | +62 | MEDIA |
| `dashboard/admin-sidebar.tsx` | 256 | +56 | MEDIA |

**Accion requerida:** Dividir en subcomponentes y extraer logica a hooks.

### API Client (CRITICO)

| Archivo | Lineas | Limite | Accion |
|---------|--------|--------|--------|
| `lib/api.ts` | 3289 | 150 (types) | Dividir por dominio |

**Accion requerida:** Dividir en modulos:
- `lib/api/index.ts` - Exports y cliente base
- `lib/api/auth.ts` - Autenticacion
- `lib/api/leads.ts` - Leads y conversiones
- `lib/api/appointments.ts` - Citas
- `lib/api/users.ts` - Usuarios
- `lib/api/services.ts` - Servicios medicos
- `lib/api/inventory.ts` - Inventario
- `lib/api/tenants.ts` - Multi-tenant
- `lib/api/types.ts` - Tipos compartidos

---

## BACKEND

### Endpoints que Exceden 50 Lineas (sin Services Layer)

| Archivo | Lineas | Prioridad |
|---------|--------|-----------|
| `api/v1/leads.py` | 1030 | CRITICA |
| `api/v1/inventory.py` | 840 | CRITICA |
| `api/v1/endpoints/commercial_objectives.py` | 823 | CRITICA |
| `api/v1/users.py` | 798 | CRITICA |
| `api/v1/appointments.py` | 706 | CRITICA |
| `api/v1/inventory_usage.py` | 577 | ALTA |
| `api/v1/auth.py` | 577 | ALTA |
| `api/v1/tenants.py` | 463 | ALTA |
| `api/v1/audit_logs.py` | 449 | MEDIA |
| `api/v1/services.py` | 346 | MEDIA |
| `api/v1/notifications.py` | 343 | MEDIA |

**Accion requerida:** Crear services layer:
```
backend/app/services/
├── __init__.py
├── lead_service.py
├── appointment_service.py
├── user_service.py
├── inventory_service.py
├── auth_service.py
└── tenant_service.py
```

### Modelos que Exceden 100 Lineas

| Archivo | Lineas | Excede por | Nota |
|---------|--------|------------|------|
| `models/appointment.py` | 316 | +216 | Aceptable si tiene muchas relaciones |
| `models/lead.py` | 298 | +198 | Aceptable si tiene muchas relaciones |
| `models/treatment.py` | 296 | +196 | Aceptable si tiene muchas relaciones |
| `models/service.py` | 253 | +153 | Revisar si se puede simplificar |
| `models/commercial_objectives.py` | 252 | +152 | Revisar |
| `models/inventory.py` | 231 | +131 | Revisar |

**Nota:** Los modelos pueden exceder el limite si tienen muchas relaciones y campos necesarios. Revisar caso por caso.

---

## ARCHIVOS OK

| Archivo | Lineas | Limite | Estado |
|---------|--------|--------|--------|
| `docker-compose.yml` | 73 | 200 | OK |
| `globals.css` | 438 | 500 | OK |

---

## Plan de Refactorizacion Sugerido

### Fase 1 - Critico (Sprint 1-2)
1. [ ] Dividir `lib/api.ts` en modulos por dominio
2. [ ] Crear services layer basico en backend
3. [ ] Refactorizar `leads.py` usando services

### Fase 2 - Alto (Sprint 3-4)
4. [ ] Refactorizar paginas de calendario (extraer CalendarView, EventModal, etc)
5. [ ] Refactorizar `lead-form-modal.tsx` (extraer FormSteps, FormFields)
6. [ ] Migrar logica de `users.py` y `appointments.py` a services

### Fase 3 - Medio (Sprint 5-6)
7. [ ] Refactorizar paginas de perfil
8. [ ] Extraer componentes de tablas reutilizables
9. [ ] Completar migracion de endpoints a services

### Fase 4 - Mantenimiento Continuo
10. [ ] Aplicar limites a nuevo codigo
11. [ ] Code review enfocado en tamano de archivos
12. [ ] Documentar patrones de extraccion

---

## Metricas de Progreso

| Metrica | Actual | Objetivo |
|---------|--------|----------|
| Paginas > 300 lineas | 20 | 0 |
| Componentes > 200 lineas | 9 | 0 |
| Endpoints sin services | 11 | 0 |
| api.ts lineas | 3289 | <150 por archivo |

---

*Ultima actualizacion: 2025-12-17*
