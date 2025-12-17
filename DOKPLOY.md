# Configuracion Dokploy - Clinik

## BACKEND (FastAPI)

### Dockerfile Path
```
backend/Dockerfile
```

### Build Context
```
backend
```

### Variables de Entorno (.env)
```env
DATABASE_URL=postgresql://USUARIO:PASSWORD@HOST:5432/NOMBRE_DB
SECRET_KEY=genera-una-clave-segura-de-64-caracteres-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=24
ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
FRONTEND_URL=https://tu-dominio.com
PROJECT_NAME=Clinik
VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password
MAIL_FROM=tu-email@gmail.com
MAIL_FROM_NAME=Clinik
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=true
MAIL_SSL_TLS=false
USE_CREDENTIALS=true
VALIDATE_CERTS=true
```

### Variables de Build (.env build)
```
(no se necesitan)
```

### Volumes
```
/app/uploads -> clinik_uploads
```
Este volumen almacena:
- Fotos de perfil de usuarios
- Documentos de pacientes
- Archivos adjuntos

### Puerto
```
8000
```

### Comando Post-Deploy (opcional)
Para aplicar migraciones automaticamente despues del deploy:
```bash
alembic upgrade head
```

---

## FRONTEND (Next.js)

### Dockerfile Path
```
frontend/Dockerfile
```

### Build Context
```
frontend
```

### Variables de Entorno (.env)
```env
NODE_ENV=production
```

### Variables de Build (.env build)
```env
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
```

### Volumes
```
(no se necesitan volumes para frontend)
```

### Puerto
```
3000
```

---

## BASE DE DATOS (PostgreSQL)

Si usas PostgreSQL en Dokploy:

### Imagen
```
postgres:16-alpine
```

### Variables de Entorno
```env
POSTGRES_DB=clinik_db
POSTGRES_USER=clinik_user
POSTGRES_PASSWORD=tu-password-seguro
```

### Volumes
```
/var/lib/postgresql/data
```

### Puerto
```
5432
```

---

## RESUMEN RAPIDO

| Servicio | Puerto | Dockerfile | Build Args |
|----------|--------|------------|------------|
| Backend | 8000 | backend/Dockerfile | - |
| Frontend | 3000 | frontend/Dockerfile | NEXT_PUBLIC_API_URL |
| Database | 5432 | postgres:16-alpine | - |

---

## ORDEN DE DEPLOY

1. **PostgreSQL** - Primero la base de datos
2. **Backend** - Segundo el API (ejecutar migraciones)
3. **Frontend** - Ultimo el frontend

---

## MIGRACIONES

Despues de deployar el backend por primera vez:

```bash
# Conectarse al contenedor del backend y ejecutar:
alembic upgrade head

# Crear usuarios de prueba (opcional):
python create_test_users.py
```

---

## DOMINIOS SUGERIDOS

- Frontend: `clinik.tu-dominio.com` o `app.tu-dominio.com`
- Backend: `api.clinik.tu-dominio.com` o `api.tu-dominio.com`

Asegurate de actualizar:
- `FRONTEND_URL` en backend con el dominio del frontend
- `ALLOWED_ORIGINS` en backend con el dominio del frontend
- `NEXT_PUBLIC_API_URL` en build del frontend con el dominio del backend
