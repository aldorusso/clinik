# Sistema Multi-Tenant - Documentación de Implementación

## Resumen Ejecutivo

Este documento describe la implementación completa del sistema multi-tenant para Clinik, permitiendo que usuarios pertenezcan a múltiples organizaciones con diferentes roles en cada una.

---

## 1. Modelo de Datos

### 1.1 TenantMembership

```python
# backend/app/models/tenant_membership.py

class TenantMembership(Base):
    __tablename__ = "tenant_memberships"

    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey("users.id"))
    tenant_id = Column(UUID, ForeignKey("tenants.id"))
    role = Column(Enum(UserRole))           # Rol en ESTA organización
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)  # Org por defecto al login
    invited_by_id = Column(UUID, ForeignKey("users.id"))
    joined_at = Column(DateTime)
    last_access_at = Column(DateTime)
    notes = Column(Text)  # Usado para tokens de invitación
```

### 1.2 Campos agregados al modelo User

```python
# backend/app/models/user.py

# Campos para invitaciones
invitation_token = Column(String)
invitation_token_expires = Column(DateTime)
invitation_accepted_at = Column(DateTime)
invited_by_id = Column(UUID, ForeignKey("users.id"))

# Propiedades dinámicas (del JWT, no de la BD)
_current_tenant_id = None      # Se inyecta desde el JWT
_current_role = None           # Se inyecta desde el JWT
_current_membership_id = None  # Se inyecta desde el JWT
```

---

## 2. Autenticación y JWT

### 2.1 Estructura del JWT

```python
token_data = {
    "sub": user.email,
    "user_id": str(user.id),
    "role": membership.role.value,        # Rol en el tenant actual
    "tenant_id": str(membership.tenant_id),  # Tenant actual
    "membership_id": str(membership.id),
    "is_superadmin": False
}
```

### 2.2 Inyección de Contexto

```python
# backend/app/core/security.py

def set_session_context(user: User, tenant_id, role, membership_id):
    """Inyecta el contexto del tenant actual en el objeto user"""
    user._current_tenant_id = tenant_id
    user._current_role = role
    user._current_membership_id = membership_id

@property
def current_tenant_id(self):
    """Retorna el tenant del contexto JWT (no el tenant_id de la tabla users)"""
    return self._current_tenant_id

@property
def current_role(self):
    """Retorna el rol del contexto JWT"""
    return self._current_role
```

### 2.3 Uso Correcto en Endpoints

```python
# ✅ CORRECTO - Usa el tenant del JWT
query = db.query(Lead).filter(Lead.tenant_id == current_user.current_tenant_id)

# ❌ INCORRECTO - Usa el tenant original del usuario
query = db.query(Lead).filter(Lead.tenant_id == current_user.tenant_id)
```

---

## 3. Flujo de Login

### 3.1 Casos de Login

```
Usuario hace login
        │
        ▼
   ¿Es superadmin?
    /         \
   SÍ          NO
   │            │
   ▼            ▼
Token sin    Buscar membresías
tenant       activas
   │            │
   │            ▼
   │       ¿Cuántas membresías?
   │        /      |      \
   │       0       1      2+
   │       │       │       │
   │       ▼       ▼       ▼
   │    Error   Token    Token sin
   │    "Sin    con      tenant +
   │    acceso" tenant   requires_tenant_selection=true
   │            único
   │            │
   └────────────┴───────────────────┐
                                    ▼
                              Retorna JWT
```

### 3.2 Response de Login

```typescript
// frontend/lib/api.ts

interface LoginResponseMultiTenant {
  access_token: string
  requires_tenant_selection: boolean  // Si true, debe llamar a /select-tenant
  is_superadmin?: boolean
  user_id: string
  email: string
  selected_tenant_id?: string
  selected_role?: string
  available_tenants?: AvailableTenant[]  // Lista de orgs disponibles
}

interface AvailableTenant {
  membership_id: string
  tenant_id: string
  tenant_name: string
  tenant_slug: string
  tenant_logo?: string
  role: string
  is_default: boolean
  last_access_at?: string
}
```

### 3.3 Frontend - Manejo de Login

```typescript
// frontend/lib/auth.ts

async login(email: string, password: string) {
  const response = await api.login(email, password)

  if (response.requires_tenant_selection) {
    // Guardar token temporal y redirigir a selector
    this.setToken(response.access_token)
    return {
      requiresTenantSelection: true,
      availableTenants: response.available_tenants
    }
  }

  // Login directo
  this.setToken(response.access_token)
  return { requiresTenantSelection: false }
}
```

---

## 4. Selector de Organización

### 4.1 Página de Selección

```typescript
// frontend/app/select-tenant/page.tsx

export default function SelectTenantPage() {
  const [tenants, setTenants] = useState<AvailableTenant[]>([])

  const handleSelectTenant = async (tenantId: string) => {
    const response = await api.selectTenant(tenantId)
    auth.setToken(response.access_token)  // Nuevo token con contexto
    router.push('/dashboard')
  }

  return (
    <div className="grid gap-4">
      <h1>Selecciona una organización</h1>
      {tenants.map(tenant => (
        <Card key={tenant.tenant_id} onClick={() => handleSelectTenant(tenant.tenant_id)}>
          <div className="flex items-center gap-4">
            {tenant.tenant_logo && <img src={tenant.tenant_logo} />}
            <div>
              <h3>{tenant.tenant_name}</h3>
              <Badge>{tenant.role}</Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

### 4.2 Componente de Cambio de Organización (Header/Sidebar)

```typescript
// frontend/components/tenant-switcher.tsx

export function TenantSwitcher() {
  const [tenants, setTenants] = useState([])
  const [currentTenant, setCurrentTenant] = useState(null)

  useEffect(() => {
    loadMyTenants()
  }, [])

  const loadMyTenants = async () => {
    const data = await api.getMyTenants()
    setTenants(data.tenants)
    setCurrentTenant(data.tenants.find(t => t.is_current))
  }

  const switchTenant = async (tenantId: string) => {
    const response = await api.switchTenant(tenantId)
    auth.setToken(response.access_token)
    window.location.reload()  // Recargar para limpiar estado
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{currentTenant?.tenant_name}</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {tenants.map(tenant => (
          <DropdownMenuItem
            key={tenant.tenant_id}
            onClick={() => switchTenant(tenant.tenant_id)}
          >
            <div className="flex items-center justify-between w-full">
              <span>{tenant.tenant_name}</span>
              {tenant.is_current && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 5. Sistema de Invitaciones

### 5.1 Flujo de Invitación

```
Tenant Admin invita usuario@email.com
              │
              ▼
    ¿Email ya existe en sistema?
         /          \
        NO           SÍ
        │             │
        ▼             ▼
   Crear User     ¿Ya es miembro
   con token      de este tenant?
   pendiente        /      \
        │          SÍ       NO
        │          │         │
        │          ▼         ▼
        │     Retornar    Crear
        │     mismo msg   TenantMembership
        │     (privacidad) pendiente
        │          │         │
        ▼          │         ▼
   Enviar email    │    Enviar email
   "Crea tu       │    "Ya tienes cuenta,
   cuenta"        │    únete a nueva org"
        │          │         │
        └──────────┴─────────┘
                   │
                   ▼
         Retornar: "Invitación enviada"
         (mismo mensaje siempre = privacidad)
```

### 5.2 Backend - Endpoint de Invitación

```python
# backend/app/api/v1/users.py

@router.post("/my-tenant/invite")
async def invite_user(
    invitation: UserInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    # Generar token
    invitation_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=72)

    existing_user = db.query(User).filter(User.email == invitation.email).first()

    if existing_user:
        # Usuario existe - crear membresía pendiente
        existing_membership = db.query(TenantMembership).filter(
            TenantMembership.user_id == existing_user.id,
            TenantMembership.tenant_id == current_user.current_tenant_id
        ).first()

        if existing_membership:
            # Ya es miembro - no hacer nada pero devolver mismo mensaje
            return {"message": f"Invitación enviada a {invitation.email}"}

        # Crear membresía pendiente
        membership = TenantMembership(
            user_id=existing_user.id,
            tenant_id=current_user.current_tenant_id,
            role=invitation.role,
            is_active=False,  # Pendiente
            notes=f"Invitation token: {invitation_token}, expires: {expires_at}"
        )
        db.add(membership)

        # Enviar email para usuario existente
        await send_existing_user_invitation_email(...)
    else:
        # Usuario nuevo - crear usuario pendiente
        db_user = User(
            email=invitation.email,
            hashed_password="",
            role=invitation.role,
            tenant_id=current_user.current_tenant_id,
            is_active=False,
            invitation_token=invitation_token,
            invitation_token_expires=expires_at
        )
        db.add(db_user)

        # Enviar email para usuario nuevo
        await send_invitation_email(...)

    # Mismo mensaje siempre (privacidad)
    return {"message": f"Invitación enviada a {invitation.email}"}
```

### 5.3 Frontend - Modal de Invitación

```typescript
// frontend/app/dashboard/admin/usuarios/page.tsx

const [inviteFormData, setInviteFormData] = useState({
  email: "",
  first_name: "",
  last_name: "",
  role: "medico" as UserRole,
})

const handleInvite = async () => {
  if (!inviteFormData.email) {
    toast.error("El email es requerido")
    return
  }

  try {
    await api.inviteUser(inviteFormData)
    toast.success("Invitación enviada correctamente")
    setIsInviteDialogOpen(false)
    setInviteFormData({ email: "", first_name: "", last_name: "", role: "medico" })
  } catch (error) {
    toast.error(error.message)
  }
}

// En el JSX:
<Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
  <DialogTrigger asChild>
    <Button>
      <UserPlus className="mr-2 h-4 w-4" />
      Invitar Usuario
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Invitar Usuario</DialogTitle>
      <DialogDescription>
        Envía una invitación por email. El usuario recibirá un enlace para unirse.
      </DialogDescription>
    </DialogHeader>

    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Email *</Label>
        <Input
          type="email"
          value={inviteFormData.email}
          onChange={(e) => setInviteFormData({...inviteFormData, email: e.target.value})}
          placeholder="usuario@ejemplo.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre (opcional)</Label>
          <Input
            value={inviteFormData.first_name}
            onChange={(e) => setInviteFormData({...inviteFormData, first_name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Apellido (opcional)</Label>
          <Input
            value={inviteFormData.last_name}
            onChange={(e) => setInviteFormData({...inviteFormData, last_name: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rol *</Label>
        <Select
          value={inviteFormData.role}
          onValueChange={(value) => setInviteFormData({...inviteFormData, role: value})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="medico">Médico</SelectItem>
            <SelectItem value="closer">Closer/Comercial</SelectItem>
            <SelectItem value="recepcionista">Recepcionista</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleInvite}>Enviar Invitación</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 6. Aceptación de Invitaciones

### 6.1 Endpoint de Información de Invitación

```python
# backend/app/api/v1/auth.py

@router.get("/invitation-info/{token}")
async def get_invitation_info(token: str, db: Session = Depends(get_db)):
    """
    Retorna info sobre la invitación para que el frontend sepa qué mostrar
    """
    # Buscar en usuarios nuevos
    user = db.query(User).filter(User.invitation_token == token).first()
    if user:
        return InvitationInfoResponse(
            is_valid=True,
            is_existing_user=False,
            tenant_name=user.tenant.name,
            role=user.role.value,
            requires_password=True  # Necesita crear contraseña
        )

    # Buscar en membresías (usuarios existentes)
    membership = db.query(TenantMembership).filter(
        TenantMembership.notes.contains(f"Invitation token: {token}"),
        TenantMembership.is_active == False
    ).first()
    if membership:
        return InvitationInfoResponse(
            is_valid=True,
            is_existing_user=True,
            tenant_name=membership.tenant.name,
            role=membership.role.value,
            requires_password=False  # Ya tiene cuenta
        )

    return InvitationInfoResponse(is_valid=False)
```

### 6.2 Frontend - Página de Aceptación

```typescript
// frontend/app/accept-invitation/page.tsx

interface InvitationInfo {
  is_valid: boolean
  is_existing_user: boolean
  tenant_name?: string
  role?: string
  inviter_name?: string
  user_email?: string
  requires_password: boolean
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  useEffect(() => {
    if (token) {
      loadInvitationInfo()
    }
  }, [token])

  const loadInvitationInfo = async () => {
    const info = await api.getInvitationInfo(token)
    setInvitationInfo(info)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar solo si es usuario nuevo
    if (invitationInfo?.requires_password) {
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }
    }

    await api.acceptInvitation({
      token,
      password: invitationInfo?.requires_password ? password : undefined,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
    })

    setSuccess(true)
  }

  // Estado de carga
  if (loadingInfo) {
    return <Loader2 className="animate-spin" />
  }

  // Token inválido
  if (!invitationInfo?.is_valid) {
    return (
      <Card>
        <CardHeader>
          <XCircle className="text-red-500" />
          <CardTitle>Enlace Inválido</CardTitle>
          <CardDescription>
            El enlace de invitación no es válido o ha expirado.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Usuario existente - solo botón de aceptar
  if (invitationInfo.is_existing_user) {
    return (
      <Card>
        <CardHeader>
          <Building2 className="text-primary" />
          <CardTitle>Nueva Invitación</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Detalles de la invitación */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p><strong>Organización:</strong> {invitationInfo.tenant_name}</p>
            <p><strong>Rol:</strong> {invitationInfo.role}</p>
          </div>

          {/* Info de que ya tiene cuenta */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <CheckCircle className="text-green-600" />
            <p>Ya tienes una cuenta. No necesitas crear una nueva.</p>
          </div>

          <Button onClick={handleSubmit} className="w-full mt-4">
            Aceptar Invitación
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Usuario nuevo - formulario completo
  return (
    <Card>
      <CardHeader>
        <Mail className="text-primary" />
        <CardTitle>Aceptar Invitación</CardTitle>
        <CardDescription>
          Completa tu registro para acceder a la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre (opcional)</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>Apellido (opcional)</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="mt-4">
            <Label>Contraseña *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mt-4">
            <Label>Confirmar Contraseña *</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-6">
            Aceptar Invitación
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

---

## 7. Plantillas de Email

### 7.1 Email para Usuario Nuevo

```html
<!-- Enviado cuando el email NO existe en el sistema -->
<div class="container">
  <h1>¡Te han invitado a unirte!</h1>

  <p><strong>{{ inviter_name }}</strong> te ha invitado a unirte a
     <strong>{{ tenant_name }}</strong> como <strong>{{ role }}</strong>.</p>

  <p>Para comenzar, haz clic en el siguiente botón y crea tu cuenta:</p>

  <a href="{{ invitation_link }}" class="button">Crear mi cuenta</a>

  <p>⏱️ Esta invitación expirará en 72 horas.</p>
</div>
```

### 7.2 Email para Usuario Existente

```html
<!-- Enviado cuando el email YA existe en el sistema -->
<div class="container">
  <h1>Nueva invitación a organización</h1>

  <p>Hola {{ user_name }},</p>

  <p><strong>{{ inviter_name }}</strong> te ha invitado a unirte a
     <strong>{{ tenant_name }}</strong> como <strong>{{ role }}</strong>.</p>

  <div class="info-box">
    <strong>✓ Ya tienes una cuenta</strong>
    <p>Puedes usar tus credenciales existentes. No necesitas crear una cuenta nueva.</p>
  </div>

  <a href="{{ invitation_link }}" class="button">Aceptar invitación</a>

  <p>⏱️ Esta invitación expirará en 72 horas.</p>
</div>
```

---

## 8. Superadmin vs Tenant Admin

### 8.1 Diferencias de Visibilidad

| Acción | Superadmin | Tenant Admin |
|--------|------------|--------------|
| Ver si email existe | ✅ SÍ | ❌ NO (privacidad) |
| Crear tenant | ✅ SÍ | ❌ NO |
| Asignar admin existente a tenant | ✅ SÍ | ❌ NO |
| Invitar usuarios | ❌ NO (usa otro endpoint) | ✅ SÍ |
| Ver usuarios de cualquier tenant | ✅ SÍ | ❌ NO (solo su tenant) |

### 8.2 Superadmin - Crear Tenant con Admin

```python
# El superadmin puede ver si un usuario existe
@router.post("/tenants", dependencies=[Depends(get_current_superadmin)])
async def create_tenant(tenant_in: TenantCreate, db: Session):
    # Verificar si el admin ya existe
    existing_admin = db.query(User).filter(User.email == tenant_in.admin_email).first()

    if existing_admin:
        # Asignar usuario existente como admin del nuevo tenant
        # El superadmin VE que ya existe
        membership = TenantMembership(
            user_id=existing_admin.id,
            tenant_id=new_tenant.id,
            role=UserRole.tenant_admin,
            is_active=True
        )
    else:
        # Crear nuevo usuario admin
        new_admin = User(
            email=tenant_in.admin_email,
            role=UserRole.tenant_admin,
            tenant_id=new_tenant.id
        )
```

---

## 9. API Endpoints

### 9.1 Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Login, retorna JWT y lista de tenants si múltiples |
| POST | `/auth/select-tenant` | Seleccionar tenant después de login |
| POST | `/auth/switch-tenant` | Cambiar de tenant sin logout |
| GET | `/auth/my-tenants` | Listar tenants del usuario |
| GET | `/auth/invitation-info/{token}` | Info de invitación |
| POST | `/auth/accept-invitation` | Aceptar invitación |

### 9.2 Usuarios (Tenant Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users/my-tenant/` | Listar usuarios del tenant |
| POST | `/users/my-tenant/invite` | Invitar usuario por email |
| POST | `/users/my-tenant/create` | Crear usuario directamente |

### 9.3 Frontend API Client

```typescript
// frontend/lib/api.ts

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetchApi<LoginResponseMultiTenant>('/auth/login', { method: 'POST', body: { username: email, password } }),

  selectTenant: (tenantId: string) =>
    fetchApi<SelectTenantResponse>('/auth/select-tenant', { method: 'POST', body: { tenant_id: tenantId } }),

  switchTenant: (tenantId: string) =>
    fetchApi<SelectTenantResponse>('/auth/switch-tenant', { method: 'POST', body: { tenant_id: tenantId } }),

  getMyTenants: () =>
    fetchApi<MyTenantsResponse>('/auth/my-tenants'),

  getInvitationInfo: (token: string) =>
    fetchApi<InvitationInfo>(`/auth/invitation-info/${token}`),

  acceptInvitation: (data: AcceptInvitationRequest) =>
    fetchApi('/auth/accept-invitation', { method: 'POST', body: data }),

  // Users
  inviteUser: (data: UserInviteRequest) =>
    fetchApi('/users/my-tenant/invite', { method: 'POST', body: data }),
}
```

---

## 10. Consideraciones de Seguridad

### 10.1 Privacidad

- Tenant admins **nunca** saben si un email ya existe
- Mensaje de respuesta siempre es el mismo: "Invitación enviada"
- Esto previene enumeración de usuarios

### 10.2 Tokens

- Expiran en 72 horas
- Son únicos y seguros (secrets.token_urlsafe)
- Se invalidan después de uso

### 10.3 Validaciones

- No se pueden crear membresías duplicadas
- No se puede aceptar invitación ya aceptada
- Tenant admins solo pueden invitar ciertos roles
- Superadmins no pueden invitar a tenants

---

## 11. Archivos Modificados

### Backend
- `backend/app/models/tenant_membership.py` - Nuevo modelo
- `backend/app/models/user.py` - Campos de invitación y propiedades dinámicas
- `backend/app/api/v1/auth.py` - Endpoints de invitación y multi-tenant
- `backend/app/api/v1/users.py` - Endpoint de invitación
- `backend/app/core/security.py` - Inyección de contexto JWT
- `backend/app/core/email.py` - Nuevas funciones de email
- `backend/app/models/email_template.py` - Nuevos tipos de template
- `backend/app/schemas/user.py` - Schema AcceptInvitation

### Frontend
- `frontend/app/accept-invitation/page.tsx` - Página de aceptación
- `frontend/app/select-tenant/page.tsx` - Selector de organización
- `frontend/app/dashboard/admin/usuarios/page.tsx` - Modal de invitación
- `frontend/lib/api.ts` - Nuevos métodos de API
- `frontend/lib/auth.ts` - Manejo de multi-tenant en login

### Base de Datos
- Nueva tabla `tenant_memberships`
- Nuevos valores en enum `emailtemplatetype`
- Nuevos campos en tabla `users`

---

## 12. Comandos SQL Ejecutados

```sql
-- Agregar valores al enum de email templates
ALTER TYPE emailtemplatetype ADD VALUE IF NOT EXISTS 'user_invitation';
ALTER TYPE emailtemplatetype ADD VALUE IF NOT EXISTS 'existing_user_invitation';

-- La tabla tenant_memberships se crea via migración de Alembic
```

---

*Documento generado: Diciembre 2024*
*Última actualización: Sistema Multi-Tenant v1.0*
