# 🏥 Clinik.Download - Sistema de Gestión de Leads Médicos

Plataforma multi-tenant completa para la gestión integral de leads, pacientes y operaciones en clínicas estéticas y centros médicos.

## 🌟 Características Principales

- **🏢 Multi-tenant**: Cada clínica tiene su propio espacio aislado
- **👥 Gestión de Leads**: Pipeline completo de conversión
- **📅 Calendario Médico**: Agenda integrada para citas
- **👤 Portal del Paciente**: Acceso independiente para pacientes
- **📊 Dashboard Analytics**: Estadísticas en tiempo real
- **🎯 Objetivos Comerciales**: Seguimiento de metas
- **📋 Inventario Médico**: Control de productos y equipos
- **🔐 Roles y Permisos**: 6 niveles de acceso diferentes

## 🚀 Stack Tecnológico

### Backend
- **FastAPI 0.115.6** - Framework web moderno y asíncrono
- **PostgreSQL 16** - Base de datos relacional robusta
- **SQLAlchemy 2.0** - ORM avanzado con soporte async
- **Alembic** - Sistema de migraciones
- **JWT** - Autenticación con refresh tokens

### Frontend
- **Next.js 16** - Framework React con App Router
- **TypeScript** - Tipado estático completo
- **shadcn/ui** - Componentes UI modernos
- **Tailwind CSS** - Estilos utilitarios
- **Sonner** - Notificaciones toast

### Infraestructura
- **Docker & Docker Compose** - Contenedorización completa
- **Hot Reload** - Desarrollo con recarga automática
- **Multi-stage builds** - Optimización para producción

## 🏗️ Arquitectura Multi-Tenant

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

## 👤 Sistema de Roles

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `superadmin` | Admin global de la plataforma | Gestión total de clínicas |
| `tenant_admin` | Admin de clínica | Todos los leads y pacientes |
| `manager` | Gestor de leads | Leads, Pacientes, Citas, Estadísticas |
| `user` | Médico | Mis Leads Asignados, Mis Pacientes |
| `client` | Comercial | Mis Leads, Performance, Objetivos |
| `recepcionista` | Recepcionista | Leads, Pacientes, Citas |

## 🚀 Inicio Rápido

### Prerequisitos
- Docker
- Docker Compose
- Git

### Instalación

1. **Clonar repositorio**
```bash
git clone [repo-url]
cd clinik-download
```

2. **Levantar servicios**
```bash
docker-compose up -d
```

3. **Aplicar migraciones**
```bash
docker-compose exec backend alembic upgrade head
```

4. **Crear superadmin**
```bash
docker-compose exec backend python create_admin.py
```

5. **Acceder a la aplicación**
- Frontend: http://localhost:3002
- Backend API: http://localhost:8002
- Documentación API: http://localhost:8002/docs

## 📋 Comandos Útiles

### Docker
```bash
# Levantar servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Reconstruir contenedores
docker-compose build

# Limpiar todo
docker-compose down -v
```

### Base de Datos
```bash
# Aplicar migraciones
docker-compose exec backend alembic upgrade head

# Crear nueva migración
docker-compose exec backend alembic revision --autogenerate -m "descripción"

# Acceso directo a PostgreSQL
docker-compose exec db psql -U clinik_download_user -d clinik_download_db
```

### Datos Iniciales
```bash
# Crear superadmin
docker-compose exec backend python create_admin.py

# Crear usuarios de prueba
docker-compose exec backend python create_test_users.py

# Seedear plantillas de email
docker-compose exec backend python seed_email_templates.py
```

## 🔧 Configuración

### Variables de Entorno Backend (.env)
```env
# Database
DATABASE_URL=postgresql://clinik_download_user:clinik_download_password@db:5432/clinik_download_db

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Email SMTP
MAIL_USERNAME=clinic@gmail.com
MAIL_PASSWORD=app-specific-password
MAIL_FROM=noreply@clinik.download
MAIL_SERVER=smtp.gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3002
```

### Variables Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8002
```

## 📊 APIs Principales

### Autenticación
```
POST /api/v1/auth/login        # Login con credenciales
POST /api/v1/auth/register     # Registro de usuario
POST /api/v1/auth/refresh      # Refresh token
```

### Leads Management
```
GET    /api/v1/leads                 # Lista con filtros
POST   /api/v1/leads                 # Crear lead
PUT    /api/v1/leads/{id}/assign     # Asignar lead
GET    /api/v1/leads/{id}/timeline   # Timeline del lead
```

### Portal de Pacientes
```
GET /api/v1/patient-portal/my-appointments     # Mis citas
GET /api/v1/patient-portal/my-treatments       # Mis tratamientos
GET /api/v1/patient-portal/my-medical-history  # Historial médico
```

## 🎯 Pipeline de Leads

```
NUEVO → CONTACTADO → CALIFICADO → CITA AGENDADA → VINO A CITA → EN TRATAMIENTO → COMPLETADO
  ↓         ↓            ↓              ↓               ↓              ↓
PERDIDO  NO CONTESTA  NO CALIFICA   NO SHOW      RECHAZÓ PRESUP.  ABANDONO
```

## 📈 KPIs y Métricas

- **Tasa de Conversión Global**: Leads → Pacientes
- **ROI por Canal**: Performance de fuentes de marketing
- **Tiempo de Respuesta**: Primera interacción con leads
- **Ocupación de Agenda**: Eficiencia médica
- **Valor Promedio**: Revenue por tratamiento

## 🛠️ Desarrollo

### Estructura del Proyecto
```
/
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── api/v1/        # API endpoints
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── core/          # Config, security, email
│   └── alembic/           # Database migrations
│
├── frontend/              # Next.js 16 application
│   ├── app/               # App Router
│   ├── components/        # React components
│   └── lib/               # Utilities and API client
│
└── database/              # SQL scripts
```

### Testing
```bash
# Backend tests (por implementar)
docker-compose exec backend pytest

# Frontend type checking
docker-compose exec frontend npm run type-check

# Linting
docker-compose exec backend black app/ --check
docker-compose exec frontend npm run lint
```

## 🚀 Producción

### Build para Producción
```bash
# Build optimizado
docker-compose -f docker-compose.prod.yml up -d

# Variables de producción necesarias
DATABASE_URL=postgresql://user:pass@prod-db:5432/db
SECRET_KEY=production-secret-key-32-chars-min
MAIL_SERVER=smtp.your-provider.com
```

### Consideraciones de Seguridad
- ✅ JWT en httpOnly cookies
- ✅ CORS restrictivo
- ✅ Rate limiting en endpoints críticos
- ✅ Validación de entrada en cliente y servidor
- ✅ Encriptación de datos sensibles

## 📝 Licencia

Proyecto privado - Todos los derechos reservados.

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 🆘 Soporte

Para soporte técnico o consultas sobre el sistema:
- Email: support@clinik.download
- Documentación: [Enlace a docs]

---

**Clinik.Download** - Transformando la gestión de leads médicos con tecnología moderna 🚀