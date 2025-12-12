# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏥 Sistema de Gestión de Leads Médicos

Este es un sistema multi-tenant para la gestión integral de leads en clínicas estéticas y centros médicos. Cada tenant representa una clínica/centro independiente con sus propios usuarios, leads, servicios y configuraciones.

## 📋 Comandos de Desarrollo Comunes

### Docker y Desarrollo
```bash
# Levantar el entorno completo
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Reconstruir contenedores
docker-compose build

# Entrar al contenedor del backend
docker-compose exec backend sh

# Entrar al contenedor del frontend  
docker-compose exec frontend sh

# Detener todo
docker-compose down

# Limpiar todo (incluye volúmenes)
docker-compose down -v
```

### Base de Datos y Migraciones
```bash
# Aplicar todas las migraciones
docker-compose exec backend alembic upgrade head

# Crear nueva migración
docker-compose exec backend alembic revision --autogenerate -m "descripcion"

# Revertir última migración
docker-compose exec backend alembic downgrade -1

# Ver historial de migraciones
docker-compose exec backend alembic history

# Acceder a PostgreSQL
docker-compose exec db psql -U base_fastapi_nextjs16_user -d base_fastapi_nextjs16_db
```

### Creación de Usuarios y Datos Iniciales
```bash
# Crear superadmin inicial
docker-compose exec backend python create_admin.py

# Crear usuarios de prueba
docker-compose exec backend python create_test_users.py

# Seedear plantillas de email
docker-compose exec backend python seed_email_templates.py

# Seedear datos de leads (por crear)
docker-compose exec backend python seed_leads_data.py
```

### Frontend
```bash
# Desarrollo con hot-reload (ya configurado en docker-compose)
npm run dev

# Build para producción
npm run build

# Linting
npm run lint

# Añadir componentes de shadcn/ui
npx shadcn-ui@latest add [component-name]
```

### Testing y Calidad
```bash
# Backend - Ejecutar tests (por implementar)
docker-compose exec backend pytest

# Frontend - Type checking
npm run type-check

# Verificar formato de código
docker-compose exec backend black app/ --check
docker-compose exec backend flake8 app/
```

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Backend**: FastAPI 0.115.6, PostgreSQL 16, SQLAlchemy 2.0, Alembic
- **Frontend**: Next.js 16, TypeScript, shadcn/ui, Tailwind CSS
- **Autenticación**: JWT con refresh token automático
- **Infraestructura**: Docker Compose, desarrollo con hot-reload

### Arquitectura Multi-Tenant
```
PLATAFORMA (Superadmin)
    │
    ├── CLÍNICA A (Tenant)
    │   ├── Admin Clínica
    │   ├── Gestor de Leads
    │   ├── Médicos
    │   ├── Comerciales
    │   └── Recepcionistas
    │
    └── CLÍNICA B (Tenant)
        └── ... (misma estructura)
```

## 🎯 DIFERENCIA LEADS vs PACIENTES

**📝 LEADS** = Personas interesadas que aún NO son clientes
- Estado: Prospecto en el pipeline de conversión  
- Se encuentran en: Nuevo, Contactado, Calificado, Cita Agendada, etc.
- Objetivo: Convertirlos en pacientes

**👥 PACIENTES** = Personas que YA son clientes de la clínica
- Estado: En Tratamiento, Completado, o con historial médico
- Se encuentran en: Tratamiento activo, historial de servicios  
- Objetivo: Brindar atención médica y seguimiento

### Roles del Sistema (6 roles)

| Rol | Descripción | Pertenece a Tenant | Ve en Dashboard |
|-----|-------------|--------------------|-----------------|
| `superadmin` | Admin global de la plataforma | No | Gestión total de clínicas |
| `tenant_admin` | Admin de clínica (admin_clinica) | Sí | Todos los leads y pacientes |
| `manager` | Gestor de leads (gestor_leads) | Sí | Leads, Pacientes, Citas, Estadísticas, Servicios |
| `user` | Médico (medico) | Sí | Mis Leads Asignados, Mis Pacientes, Mis Citas |
| `client` | Comercial (comercial) | Sí | Mis Leads, Mis Pacientes, Mis Citas, Mi Performance, Mis Objetivos |
| `recepcionista` | Recepcionista | Sí | Leads, Pacientes, Citas, Servicios |

### Estructura de Directorios
```
/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints de la API
│   │   ├── core/            # Config, seguridad, email
│   │   ├── db/              # Configuración de BD
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── schemas/         # Schemas Pydantic
│   │   └── services/        # Lógica de negocio
│   └── alembic/             # Migraciones
│
├── frontend/
│   ├── app/                 # App Router Next.js
│   │   ├── dashboard/       # Dashboards por rol
│   │   └── portal/          # Portal de clientes
│   ├── components/          # Componentes React
│   │   ├── leads/          # Componentes de leads
│   │   ├── medical/        # Componentes médicos
│   │   └── ui/             # shadcn/ui
│   └── lib/                # Utils y API client
│
└── database/               # Scripts SQL iniciales
```

## 🔄 Flujo de Trabajo de Leads

### 1. Captura del Lead
```
Fuentes de Captura:
├── Automáticas
│   ├── Facebook/Instagram Ads → Webhook → API
│   ├── Google Ads → Webhook → API
│   ├── Formulario Web → API directa
│   └── WhatsApp Business → Webhook → API
│
└── Manuales
    ├── Recepcionista → Formulario manual
    └── Importación masiva → CSV/Excel
```

### 2. Pipeline de Conversión
```
NUEVO → CONTACTADO → CALIFICADO → CITA AGENDADA → VINO A CITA → EN TRATAMIENTO → COMPLETADO
  ↓         ↓            ↓              ↓               ↓              ↓
PERDIDO  NO CONTESTA  NO CALIFICA   NO SHOW      RECHAZÓ PRESUP.  ABANDONO
```

### 3. Asignación de Leads
- **Round-robin**: Distribución equitativa
- **Por servicio**: Según especialidad del médico
- **Por ubicación**: Sucursal más cercana
- **Manual**: Gestor asigna específicamente

## 📊 Modelos de Datos Principales

### Lead
```python
- id (UUID)
- tenant_id (FK)
- first_name, last_name
- phone, email
- source_id (FK → LeadSource)
- status_id (FK → LeadStatus)
- assigned_to_id (FK → User)
- service_interest_id (FK → Service)
- budget_range
- preferred_contact_time
- notes
- created_at, updated_at
```

### Service (Servicio Médico)
```python
- id (UUID)
- tenant_id (FK)
- category_id (FK)
- name
- description
- duration_minutes
- price_min, price_max
- requires_consultation
- is_active
```

### Appointment (Cita)
```python
- id (UUID)
- tenant_id (FK)
- lead_id (FK)
- patient_id (FK → User con rol patient)
- medic_id (FK → User con rol medico)
- service_id (FK)
- scheduled_at
- duration_minutes
- status (scheduled, confirmed, completed, no_show, cancelled)
- notes
```

### Treatment (Tratamiento)
```python
- id (UUID)
- tenant_id (FK)
- patient_id (FK)
- medic_id (FK)
- service_id (FK)
- total_sessions
- completed_sessions
- start_date, end_date
- total_amount
- notes
- before_photos, after_photos (JSON)
```

## 🚀 APIs Principales

### Leads API
```
GET    /api/v1/leads                 # Lista con filtros
POST   /api/v1/leads                 # Crear lead
GET    /api/v1/leads/{id}           # Detalle del lead
PUT    /api/v1/leads/{id}           # Actualizar lead
POST   /api/v1/leads/{id}/assign    # Asignar lead
POST   /api/v1/leads/{id}/interact  # Registrar interacción
GET    /api/v1/leads/{id}/timeline  # Timeline del lead
```

### Services API
```
GET    /api/v1/services              # Lista de servicios
POST   /api/v1/services              # Crear servicio
GET    /api/v1/services/categories   # Categorías
PUT    /api/v1/services/{id}        # Actualizar servicio
```

### Appointments API
```
GET    /api/v1/appointments          # Agenda con filtros
POST   /api/v1/appointments          # Crear cita
PUT    /api/v1/appointments/{id}     # Actualizar cita
POST   /api/v1/appointments/{id}/confirm  # Confirmar cita
GET    /api/v1/appointments/availability # Disponibilidad
```

### Reports API
```
GET    /api/v1/reports/leads/funnel   # Funnel de conversión
GET    /api/v1/reports/leads/sources  # Performance por fuente
GET    /api/v1/reports/revenue        # Ingresos
GET    /api/v1/reports/medics         # Performance médicos
```

## 💡 Patrones y Mejores Prácticas

### Backend
1. **Validación Multi-tenant**: Siempre filtrar por tenant_id
2. **Soft Deletes**: Usar is_active en lugar de DELETE
3. **Audit Logs**: Registrar todas las acciones importantes
4. **Async/Await**: Usar funciones asíncronas para mejor performance
5. **Pydantic**: Validación estricta de datos entrada/salida

### Frontend
1. **Server Components**: Usar por defecto en Next.js 16
2. **Client Components**: Solo cuando se necesite interactividad
3. **API Types**: Mantener types sincronizados con backend
4. **Error Boundaries**: Manejo robusto de errores
5. **Optimistic UI**: Actualizar UI antes de confirmar en servidor

### Seguridad
1. **JWT en httpOnly cookies**: Más seguro que localStorage
2. **CORS restrictivo**: Solo origines permitidos
3. **Rate Limiting**: En endpoints críticos
4. **Input Validation**: Cliente y servidor
5. **SQL Injection**: Usar ORM, nunca queries raw

## 🔧 Configuración Importante

### Variables de Entorno Backend
```env
# Base de datos
DATABASE_URL=postgresql://user:pass@db:5432/db_name

# JWT
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 días

# Email SMTP
MAIL_USERNAME=clinic@gmail.com
MAIL_PASSWORD=app-specific-password
MAIL_FROM=noreply@clinic.com
MAIL_SERVER=smtp.gmail.com

# Frontend URL (para links en emails)
FRONTEND_URL=http://localhost:3002

# WhatsApp Business API (futuro)
WHATSAPP_API_TOKEN=your-token
WHATSAPP_PHONE_NUMBER=+123456789
```

### Variables de Entorno Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8002
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your-key  # Para mapas de sucursales
```

## 📈 KPIs y Métricas Clave

### Por Clínica (Admin)
- Leads totales del mes
- Tasa de conversión global
- Valor promedio de tratamiento
- ROI por canal de marketing
- Tiempo promedio de conversión

### Por Gestor
- Leads sin asignar
- Tiempo primera respuesta
- Leads en cada etapa
- Tasa de pérdida

### Por Médico
- Pacientes atendidos
- Tasa de conversión consulta→venta
- Ingresos generados
- Satisfacción del paciente
- Ocupación de agenda

### Por Comercial
- Llamadas realizadas
- Citas agendadas
- Tasa de show-up
- Conversión a venta

## 🚀 Próximas Funcionalidades

1. **WhatsApp Business API**: Mensajes automáticos y conversaciones
2. **IA para Lead Scoring**: Predecir probabilidad de conversión
3. **App Móvil**: Para médicos y comerciales
4. **Telemedicina**: Consultas virtuales
5. **Facturación Electrónica**: Integración con SAT/AFIP
6. **Business Intelligence**: Dashboards avanzados con IA

## ⚠️ Consideraciones Importantes

1. **NUNCA** exponer tenant_id en URLs públicas
2. **Siempre** validar permisos por rol antes de acciones
3. **Logs de auditoría** para acciones médicas (HIPAA compliance)
4. **Backups** diarios de base de datos
5. **Encriptar** datos sensibles de pacientes
6. **Validar** número de teléfono con código de país
7. **Timezone** correcto para cada clínica

## 🧪 Testing

### Usuarios de Prueba
```
# Superadmin
email: admin@example.com
password: admin123

# Admin Clínica (crear después)
email: clinica@example.com
password: clinica123

# Médico (crear después)
email: medico@example.com
password: medico123
```

### Flujo de Prueba Completo
1. Login como superadmin
2. Crear una clínica de prueba
3. Crear usuarios para la clínica
4. Cambiar a admin de clínica
5. Configurar servicios
6. Crear leads manualmente
7. Asignar y procesar leads
8. Verificar reportes

---

Este archivo debe actualizarse conforme se agreguen nuevas funcionalidades al sistema de gestión de leads médicos.