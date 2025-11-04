# Scraper App - SerpAPI & Google Maps

Aplicación full-stack para scraping de SerpAPI y Google Maps.

## Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno y rápido
- **PostgreSQL** - Base de datos relacional
- **SQLAlchemy** - ORM para Python
- **Alembic** - Migraciones de base de datos

### Frontend
- **Next.js 14** - Framework de React
- **shadcn/ui** - Componentes UI con Tailwind CSS
- **TypeScript** - Tipado estático

### Infraestructura
- **Docker & Docker Compose** - Contenedorización

## Estructura del Proyecto

```
scraper-fastapi/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # Endpoints de la API
│   │   ├── core/          # Configuración
│   │   ├── db/            # Configuración de base de datos
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── schemas/       # Schemas Pydantic
│   │   └── services/      # Lógica de negocio
│   ├── alembic/           # Migraciones
│   ├── Dockerfile.dev
│   └── requirements.txt
├── frontend/
│   ├── app/               # App Router de Next.js
│   ├── components/        # Componentes React
│   ├── lib/               # Utilidades
│   ├── Dockerfile.dev
│   └── package.json
├── database/
│   └── init.sql           # Script de inicialización
└── docker-compose.yml
```

## Comenzar

### Prerrequisitos
- Docker
- Docker Compose

### Instalación y Ejecución

1. Clonar el repositorio

2. Levantar los servicios con Docker Compose:
```bash
docker-compose up --build
```

Esto levantará tres servicios:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

### Desarrollo

Los contenedores están configurados con hot-reload:
- Cambios en el backend se reflejan automáticamente
- Cambios en el frontend se reflejan automáticamente
- Los volúmenes de Docker mantienen los cambios sincronizados

### Detener los servicios

```bash
docker-compose down
```

Para eliminar también los volúmenes (base de datos):
```bash
docker-compose down -v
```

## Configuración de shadcn/ui

El frontend ya está configurado con shadcn/ui. Para agregar componentes:

```bash
# Entrar al contenedor del frontend
docker-compose exec frontend sh

# Agregar componentes
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
# etc...
```

## Base de Datos

### Crear una migración
```bash
docker-compose exec backend alembic revision --autogenerate -m "descripción del cambio"
```

### Aplicar migraciones
```bash
docker-compose exec backend alembic upgrade head
```

### Revertir migración
```bash
docker-compose exec backend alembic downgrade -1
```

## Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://scraper_user:scraper_password@db:5432/scraper_db
ENVIRONMENT=development
DEBUG=true
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

## Próximos Pasos

- [ ] Implementar modelos de datos para scraping
- [ ] Crear endpoints de API para SerpAPI
- [ ] Crear endpoints de API para Google Maps
- [ ] Diseñar interfaz de usuario
- [ ] Implementar sistema de jobs/tareas
- [ ] Agregar autenticación si es necesario

## Licencia

Proyecto privado
