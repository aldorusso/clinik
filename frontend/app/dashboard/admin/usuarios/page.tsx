"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"
import { api, User, UserRole } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"
import {
  UserStatsCards,
  UsersTable,
  InviteUserDialog,
  EditUserDialog,
  DeleteUserDialog,
  InviteFormData,
  EditFormData,
} from "@/components/admin-users"

const defaultInviteForm: InviteFormData = {
  email: "",
  first_name: "",
  last_name: "",
  role: "medico",
}

const defaultEditForm: EditFormData = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  role: "medico",
  is_active: true,
}

export default function TenantAdminUsuariosPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  // Filters
  const [filterRole, setFilterRole] = useState<string>("all")

  // Form data
  const [inviteFormData, setInviteFormData] = useState<InviteFormData>(defaultInviteForm)
  const [editFormData, setEditFormData] = useState<EditFormData>(defaultEditForm)

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const usersData = await api.getMyTenantUsers(token)
      const filteredUsers = usersData.filter(
        (u) => u.role !== "superadmin" && u.role !== "tenant_admin"
      )
      setUsers(filteredUsers)
    } catch (error: any) {
      toast.error(error.message || "Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = users.filter((user) => {
    if (filterRole !== "all" && user.role !== filterRole) return false
    return true
  })

  const handleInvite = async () => {
    const token = auth.getToken()
    if (!token) return

    if (!inviteFormData.email) {
      toast.error("El email es requerido")
      return
    }

    try {
      await api.inviteUser(token, {
        email: inviteFormData.email,
        role: inviteFormData.role,
        first_name: inviteFormData.first_name || undefined,
        last_name: inviteFormData.last_name || undefined,
      })
      toast.success(`Invitación enviada a ${inviteFormData.email}`)
      setIsInviteDialogOpen(false)
      setInviteFormData(defaultInviteForm)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al enviar invitación")
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
    if (!deletingUser) return
    const token = auth.getToken()
    if (!token) return

    try {
      await api.deleteUser(token, deletingUser.id)
      toast.success("Usuario eliminado")
      setDeletingUser(null)
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
            <h1 className="text-3xl font-bold">Usuarios del Equipo</h1>
          </div>
          <p className="text-muted-foreground">
            Gestiona los managers y usuarios de tu organizacion
          </p>
        </div>
        <InviteUserDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          formData={inviteFormData}
          setFormData={setInviteFormData}
          onSubmit={handleInvite}
        />
      </div>

      {/* Stats Cards */}
      <UserStatsCards users={users} />

      {/* Users Table */}
      <UsersTable
        users={filteredUsers}
        totalUsers={users.length}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        onToggleActive={handleToggleActive}
        onEdit={openEditDialog}
        onDelete={setDeletingUser}
      />

      {/* Edit Dialog */}
      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleEdit}
      />

      {/* Delete Dialog */}
      <DeleteUserDialog
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
