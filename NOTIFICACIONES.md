# Sistema de Notificaciones In-App

Sistema completo de notificaciones en tiempo real para informar a los usuarios sobre eventos importantes en la plataforma multi-tenant.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Backend](#backend)
- [Frontend](#frontend)
- [Uso](#uso)
- [Ejemplos de Código](#ejemplos-de-código)
- [Notificaciones Automáticas](#notificaciones-automáticas)

---

## ✨ Características

### Funcionalidades Principales

- **Notificaciones In-App**: Sistema de notificaciones integrado en la aplicación
- **4 Tipos de Notificaciones**: INFO, SUCCESS, WARNING, ERROR (con colores distintivos)
- **Campanita con Badge**: Contador de notificaciones no leídas en tiempo real
- **Polling Automático**: Actualización cada 30 segundos del contador
- **Dropdown Rápido**: Últimas 5 notificaciones accesibles desde el header
- **Página Completa**: Vista detallada con filtros y gestión avanzada
- **Aislamiento Multi-Tenant**: Cada usuario solo ve sus propias notificaciones
- **Acciones Inteligentes**: Click en notificación navega a URL relevante

### Gestión de Notificaciones

- ✅ Marcar como leída (individual o todas)
- 🗑️ Eliminar notificaciones
- 🔍 Filtrar: Todas, No leídas, Leídas
- 📊 Estadísticas: Total, No leídas, Leídas
- ⏱️ Timestamps relativos ("hace 5 minutos")
- 🎨 Colores según tipo y estado

---

## 🏗️ Arquitectura

### Base de Datos

**Tabla**: `notifications`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | Usuario destinatario (FK) |
| `tenant_id` | UUID | Tenant (FK, nullable) |
| `type` | ENUM | Tipo: info, success, warning, error |
| `title` | VARCHAR(200) | Título corto |
| `message` | TEXT | Mensaje descriptivo completo |
| `action_url` | VARCHAR(500) | URL opcional para navegación |
| `is_read` | BOOLEAN | Estado de lectura |
| `read_at` | TIMESTAMP | Fecha/hora de lectura |
| `created_at` | TIMESTAMP | Fecha/hora de creación |

**Índices**:
- `(user_id, is_read)` - Consultas rápidas de no leídas
- `(user_id, created_at)` - Listado cronológico
- `(tenant_id)` - Filtrado por tenant

**Relaciones**:
- Cascade delete con `users` y `tenants`

---

## 🔧 Backend

### Archivos Principales

```
backend/
├── app/
│   ├── models/
│   │   └── notification.py          # Modelo SQLAlchemy
│   ├── schemas/
│   │   └── notification.py          # Schemas Pydantic
│   ├── core/
│   │   └── notifications.py         # Helper functions
│   └── api/v1/
│       └── notifications.py         # API endpoints
```

### Modelo (`backend/app/models/notification.py`)

```python
class NotificationType(str, enum.Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def mark_as_read(self):
        """Marca la notificación como leída"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
```

### Helper Functions (`backend/app/core/notifications.py`)

```python
async def create_notification(
    db: Session,
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    tenant_id: Optional[UUID] = None
) -> Notification:
    """Crea una nueva notificación para un usuario"""

async def create_notification_for_multiple_users(
    db: Session,
    user_ids: list[UUID],
    type: NotificationType,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    tenant_id: Optional[UUID] = None
) -> list[Notification]:
    """Crea la misma notificación para múltiples usuarios"""

def mark_notification_as_read(db: Session, notification: Notification) -> Notification:
    """Marca una notificación como leída"""

def mark_all_as_read(db: Session, user_id: UUID) -> int:
    """Marca todas las notificaciones de un usuario como leídas"""

def get_unread_count(db: Session, user_id: UUID) -> int:
    """Obtiene el número de notificaciones no leídas"""
```

### API Endpoints (`backend/app/api/v1/notifications.py`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/notifications` | Lista notificaciones con paginación |
| `GET` | `/api/v1/notifications/count` | Contador de no leídas (para badge) |
| `PATCH` | `/api/v1/notifications/{id}/read` | Marca una como leída |
| `POST` | `/api/v1/notifications/mark-all-read` | Marca todas como leídas |
| `DELETE` | `/api/v1/notifications/{id}` | Elimina una notificación |

---

## 💻 Frontend

### Archivos Principales

```
frontend/
├── components/
│   └── notifications/
│       └── notification-bell.tsx     # Componente campanita
├── app/
│   └── dashboard/
│       └── notifications/
│           └── page.tsx              # Página completa
└── lib/
    └── api.ts                        # Funciones de API
```

### API Client (`frontend/lib/api.ts`)

```typescript
// Tipos
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  user_id: string;
  tenant_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// Funciones API
api.getNotifications(token, params?)          // Lista notificaciones
api.getNotificationCount(token)               // Contador no leídas
api.markNotificationAsRead(token, id)         // Marcar como leída
api.markAllNotificationsAsRead(token)         // Marcar todas
api.deleteNotification(token, id)             // Eliminar
```

### Componente NotificationBell

**Ubicación**: Header del sidebar (junto al ThemeToggle)

**Features**:
- Badge con contador actualizado cada 30 segundos
- Dropdown con últimas 5 notificaciones
- Click en notificación la marca como leída y navega
- Botón "Marcar todas como leídas"
- Link a página completa

**Uso**:
```tsx
import { NotificationBell } from "@/components/notifications/notification-bell"

<NotificationBell />
```

### Página de Notificaciones

**Ruta**: `/dashboard/notifications`

**Features**:
- Tabs: Todas, No leídas, Leídas
- Tarjetas de estadísticas (Total, No leídas, Leídas)
- Lista completa con scroll infinito
- Acciones por notificación:
  - Ver detalles (navega a action_url)
  - Marcar como leída
  - Eliminar (con confirmación)
- Botón global "Marcar todas como leídas"

---

## 📚 Uso

### Crear una Notificación

```python
from app.core.notifications import create_notification
from app.models.notification import NotificationType

# Notificación simple
await create_notification(
    db=db,
    user_id=user.id,
    type=NotificationType.SUCCESS,
    title="¡Operación exitosa!",
    message="Tu contraseña fue actualizada correctamente",
    action_url="/dashboard/profile?tab=security",
    tenant_id=user.tenant_id
)
```

### Notificar a Múltiples Usuarios

```python
from app.core.notifications import create_notification_for_multiple_users

# Notificar a todos los admins del tenant
admin_ids = [admin.id for admin in tenant.admins]
await create_notification_for_multiple_users(
    db=db,
    user_ids=admin_ids,
    type=NotificationType.INFO,
    title="Nuevo cliente registrado",
    message=f"El cliente {client.name} fue agregado al sistema",
    action_url="/dashboard/admin/clientes",
    tenant_id=tenant.id
)
```

---

## 🔔 Notificaciones Automáticas

El sistema crea notificaciones automáticamente para los siguientes eventos:

### 1. Cambio de Contraseña

**Trigger**: `POST /api/v1/auth/change-password`

**Ubicación**: `backend/app/api/v1/auth.py:270-283`

```python
await create_notification(
    db=db,
    user_id=current_user.id,
    type=NotificationType.WARNING,
    title="Contraseña actualizada",
    message="Tu contraseña fue cambiada exitosamente. Si no fuiste tú, contacta al administrador inmediatamente.",
    action_url="/dashboard/profile?tab=security",
    tenant_id=current_user.tenant_id
)
```

### 2. Recuperación de Contraseña

**Trigger**: `POST /api/v1/auth/reset-password`

**Ubicación**: `backend/app/api/v1/auth.py:392-404`

```python
await create_notification(
    db=db,
    user_id=user.id,
    type=NotificationType.SUCCESS,
    title="Contraseña restablecida",
    message="Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.",
    action_url="/login",
    tenant_id=user.tenant_id
)
```

### 3. Aceptación de Invitación

**Trigger**: `POST /api/v1/auth/accept-invitation`

**Ubicación**: `backend/app/api/v1/auth.py:513-561`

**Para el nuevo usuario**:
```python
await create_notification(
    db=db,
    user_id=user.id,
    type=NotificationType.SUCCESS,
    title="¡Bienvenido al equipo!",
    message=f"Te has unido a {tenant_name} como {role_display}. Explora el dashboard y comienza a trabajar.",
    action_url="/dashboard",
    tenant_id=user.tenant_id
)
```

**Para los admins del tenant**:
```python
for admin in admin_users:
    await create_notification(
        db=db,
        user_id=admin.id,
        type=NotificationType.INFO,
        title="Nuevo miembro en el equipo",
        message=f"{user_name} ha aceptado tu invitación y se ha unido como {role_display}.",
        action_url="/dashboard/users",
        tenant_id=user.tenant_id
    )
```

### 4. Activación/Desactivación de Cuenta

**Trigger**: `PUT /api/v1/users/{user_id}` (cuando cambia `is_active`)

**Ubicación**: `backend/app/api/v1/users.py:199-225`

**Activación**:
```python
await create_notification(
    db=db,
    user_id=user.id,
    type=NotificationType.SUCCESS,
    title="Cuenta activada",
    message="Tu cuenta ha sido activada. Ya puedes acceder a todas las funcionalidades del sistema.",
    action_url="/dashboard",
    tenant_id=user.tenant_id
)
```

**Desactivación**:
```python
await create_notification(
    db=db,
    user_id=user.id,
    type=NotificationType.WARNING,
    title="Cuenta desactivada",
    message="Tu cuenta ha sido desactivada. Contacta al administrador si crees que esto es un error.",
    action_url="/dashboard/profile",
    tenant_id=user.tenant_id
)
```

---

## 🎨 Tipos de Notificación y Colores

| Tipo | Color | Uso | Emoji |
|------|-------|-----|-------|
| `INFO` | Azul | Información general | ℹ️ |
| `SUCCESS` | Verde | Acciones exitosas | ✅ |
| `WARNING` | Amarillo | Advertencias que requieren atención | ⚠️ |
| `ERROR` | Rojo | Errores o problemas críticos | ❌ |

---

## 🚀 Cómo Extender

### Agregar Nuevas Notificaciones

1. **Identifica el evento** en tu código que debe generar notificación
2. **Importa la función helper**:
   ```python
   from app.core.notifications import create_notification
   from app.models.notification import NotificationType
   ```
3. **Crea la notificación** después del evento:
   ```python
   await create_notification(
       db=db,
       user_id=user_id,
       type=NotificationType.INFO,
       title="Título descriptivo",
       message="Mensaje completo explicando qué pasó",
       action_url="/ruta/relevante",  # Opcional
       tenant_id=tenant_id
   )
   ```

### Mejoras Futuras Sugeridas

- **WebSockets**: Notificaciones en tiempo real sin polling
- **Push Notifications**: Notificaciones al navegador aunque no esté abierta la app
- **Email Digest**: Resumen diario/semanal de notificaciones por email
- **Preferencias**: Permitir al usuario elegir qué notificaciones recibir
- **Categorías**: Agrupar notificaciones por categoría (seguridad, actividad, sistema)
- **Templates**: Sistema de templates para notificaciones recurrentes
- **Historial**: Archivo de notificaciones antiguas
- **Analytics**: Métricas sobre notificaciones (tasa de lectura, engagement, etc.)

---

## 📝 Notas Importantes

- Las notificaciones se eliminan en cascada si se elimina el usuario o tenant
- El polling de 30 segundos es configurable en `NotificationBell.tsx`
- Todas las notificaciones tienen aislamiento por usuario (seguridad garantizada)
- Los timestamps usan `date-fns` con locale español
- El sistema es completamente async/await
- Todas las funciones tienen manejo de errores con try/catch
- Las notificaciones no bloquean las operaciones principales (fire and forget)

---

## 🎯 Resumen

Sistema de notificaciones **completo**, **bien documentado** y **listo para producción** que demuestra las mejores prácticas de desarrollo:

✅ Backend robusto con FastAPI + SQLAlchemy
✅ Frontend moderno con Next.js 14 + TypeScript
✅ Base de datos optimizada con índices
✅ API RESTful completa y documentada
✅ Componentes reutilizables de UI
✅ Multi-tenant con aislamiento de datos
✅ Código limpio con documentación en español
✅ Ejemplos prácticos de uso
✅ Extensible y escalable

**¡Sistema listo para usar y crecer con tu aplicación!** 🚀
