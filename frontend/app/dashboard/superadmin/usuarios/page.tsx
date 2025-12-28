"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, UserPlus, Filter } from "lucide-react"
import { api, User, UserRole, TenantWithStats } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"
import {
  UsersTable,
  UsersStatsCards,
  CreateUserDialog,
  EditUserDialog,
  DeleteUserDialog,
  AssignTenantModal,
} from "@/components/users"

export default function SuperadminUsuariosPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<TenantWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAssignTenantOpen, setIsAssignTenantOpen] = useState(false)
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
    role: "medico" as UserRole,
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
        const createData: any = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: formData.role,
        }

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

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const openAssignTenantModal = (user: User) => {
    setSelectedUser(user)
    setIsAssignTenantOpen(true)
  }

  const handleAssignTenant = async (
    userId: string,
    tenantId: string,
    role: UserRole,
    isDefault: boolean
  ) => {
    const token = auth.getToken()
    if (!token) return

    await api.assignUserToTenant(token, userId, {
      tenant_id: tenantId,
      role,
      is_default: isDefault,
    })
    toast.success("Usuario asignado a la organización")
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
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
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats Cards */}
      <UsersStatsCards users={users} />

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
                    <SelectItem value="medico">Usuario</SelectItem>
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
          <UsersTable
            users={filteredUsers}
            tenants={tenants}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onToggleActive={handleToggleActive}
            onAssignTenant={openAssignTenantModal}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        setFormData={setFormData}
        sendInvitation={sendInvitation}
        setSendInvitation={setSendInvitation}
        isCreating={isCreating}
        tenants={tenants}
        onSubmit={handleCreate}
      />

      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleEdit}
      />

      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={selectedUser}
        onConfirm={handleDelete}
      />

      <AssignTenantModal
        user={selectedUser}
        tenants={tenants}
        open={isAssignTenantOpen}
        onOpenChange={setIsAssignTenantOpen}
        onAssign={handleAssignTenant}
      />
    </div>
  )
}
