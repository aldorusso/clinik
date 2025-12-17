"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SuperadminDashboardLayout } from "@/components/dashboard/superadmin-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  UserCog,
  Briefcase,
  User as UserIcon,
  UserCheck,
  Building2,
  Filter,
  Mail,
  Key,
} from "lucide-react"
import { api, User, UserRole, TenantWithStats } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"

const roleConfig: Record<UserRole, { label: string; icon: any; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  superadmin: { label: "Superadmin", icon: Shield, variant: "destructive" },
  tenant_admin: { label: "Admin", icon: UserCog, variant: "default" },
  manager: { label: "Manager", icon: Briefcase, variant: "secondary" },
  user: { label: "Usuario", icon: UserIcon, variant: "outline" },
  client: { label: "Cliente", icon: UserCheck, variant: "outline" },
}

export default function SuperadminUsuariosPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<TenantWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Filters
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterTenant, setFilterTenant] = useState<string>("all")

  // Form data for creating users
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "superadmin" as UserRole,
    tenant_id: "",
  })

  // Toggle for invitation mode
  const [sendInvitation, setSendInvitation] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form data for editing users
  const [editFormData, setEditFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "user" as UserRole,
    is_active: true,
  })

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const [usersData, tenantsData] = await Promise.all([
        api.getUsers(token),
        api.getTenantsWithStats(token),
      ])
      setUsers(usersData)
      setTenants(tenantsData)
    } catch (error: any) {
      toast.error(error.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = users.filter((user) => {
    if (filterRole !== "all" && user.role !== filterRole) return false
    if (filterTenant !== "all") {
      if (filterTenant === "none" && user.tenant_id !== null) return false
      if (filterTenant !== "none" && user.tenant_id !== filterTenant) return false
    }
    return true
  })

  const handleCreate = async () => {
    const token = auth.getToken()
    if (!token) return

    setIsCreating(true)

    try {
      if (sendInvitation) {
        // Send invitation via email
        const inviteData = {
          email: formData.email,
          role: formData.role,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
        }

        const tenantId = formData.role !== "superadmin" ? formData.tenant_id : undefined

        const result = await api.inviteUserAsSuperadmin(token, inviteData, tenantId)

        if (result.warning) {
          toast.warning(result.message)
        } else {
          toast.success(result.message)
        }
      } else {
        // Create user directly with password
        const createData: any = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: formData.role,
        }

        // Only include tenant_id if not superadmin
        if (formData.role !== "superadmin" && formData.tenant_id) {
          createData.tenant_id = formData.tenant_id
        }

        await api.createUser(token, createData)
        toast.success("Usuario creado exitosamente")
      }

      setIsCreateDialogOpen(false)
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "superadmin",
        tenant_id: "",
      })
      setSendInvitation(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al crear usuario")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updateUser(token, selectedUser.id, {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        phone: editFormData.phone,
        role: editFormData.role,
        is_active: editFormData.is_active,
      })
      toast.success("Usuario actualizado")
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar usuario")
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    const token = auth.getToken()
    if (!token) return

    try {
      await api.deleteUser(token, selectedUser.id)
      toast.success("Usuario eliminado")
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar usuario")
    }
  }

  const handleToggleActive = async (user: User) => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updateUser(token, user.id, { is_active: !user.is_active })
      toast.success(user.is_active ? "Usuario desactivado" : "Usuario activado")
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar estado")
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      role: user.role,
      is_active: user.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const getRoleBadge = (role: UserRole) => {
    const config = roleConfig[role]
    if (!config) return <Badge variant="outline">{role}</Badge>

    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTenantName = (tenantId: string | undefined) => {
    if (!tenantId) return <span className="text-muted-foreground">-</span>
    const tenant = tenants.find((t) => t.id === tenantId)
    return tenant ? tenant.name : tenantId
  }

  if (loading) {
    return (
      <SuperadminDashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </SuperadminDashboardLayout>
    )
  }

  return (
    <SuperadminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Usuarios del Sistema</h1>
            </div>
            <p className="text-muted-foreground">
              Gestion global de todos los usuarios de la plataforma
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crea un usuario en el sistema. Los superadmins no pertenecen a ningun tenant.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Switch para elegir metodo de creacion */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {sendInvitation ? (
                        <Mail className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Key className="h-4 w-4 text-amber-500" />
                      )}
                      <Label htmlFor="send-invitation" className="font-medium">
                        {sendInvitation ? "Enviar invitacion por email" : "Crear con contrasena"}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sendInvitation
                        ? "El usuario recibira un email para crear su contrasena"
                        : "Tu defines la contrasena del usuario"}
                    </p>
                  </div>
                  <Switch
                    id="send-invitation"
                    checked={sendInvitation}
                    onCheckedChange={setSendInvitation}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Perez"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                {!sendInvitation && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contrasena *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimo 6 caracteres"
                    />
                  </div>
                )}
                {!sendInvitation && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="role">Rol *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Superadmin
                        </div>
                      </SelectItem>
                      <SelectItem value="tenant_admin">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4" />
                          Admin de Tenant
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          Usuario
                        </div>
                      </SelectItem>
                      <SelectItem value="closer">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Cliente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role !== "superadmin" && (
                  <div className="space-y-2">
                    <Label htmlFor="tenant_id">Tenant *</Label>
                    <Select
                      value={formData.tenant_id}
                      onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {tenant.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <span className="animate-spin mr-2">&#9696;</span>
                      {sendInvitation ? "Enviando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      {sendInvitation ? (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Invitacion
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Crear Usuario
                        </>
                      )}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Superadmins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "superadmin").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "tenant_admin").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Managers</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "manager").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "user").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "closer").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Usuarios</CardTitle>
                <CardDescription>
                  {filteredUsers.length} de {users.length} usuarios
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                      <SelectItem value="tenant_admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="closer">Closer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterTenant} onValueChange={setFilterTenant}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tenants</SelectItem>
                    <SelectItem value="none">Sin tenant (global)</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay usuarios que coincidan con los filtros</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.full_name || "Sin nombre"}
                        </div>
                        {user.phone && (
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.tenant_id && <Building2 className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-sm">{getTenantName(user.tenant_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-500 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(user)}
                            title={user.is_active ? "Desactivar" : "Activar"}
                          >
                            {user.is_active ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsDeleteDialogOpen(true)
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la informacion del usuario
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">Nombre</Label>
                <Input
                  id="edit_first_name"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Apellido</Label>
                <Input
                  id="edit_last_name"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editFormData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Telefono</Label>
              <Input
                id="edit_phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role">Rol</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: UserRole) => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="tenant_admin">Admin de Tenant</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="closer">Closer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas eliminar al usuario{" "}
              <strong>{selectedUser?.email}</strong>? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperadminDashboardLayout>
  )
}
