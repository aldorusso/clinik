"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"
import { api, TenantWithStats, TenantCreateWithAdmin, TenantUpdate, User as UserType } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  TenantTable,
  CreateTenantDialog,
  EditTenantDialog,
  DeleteTenantDialog,
  generateSlug,
} from "@/components/tenants"

type AdminMode = "new" | "existing"

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(null)

  // Admin selection state
  const [adminMode, setAdminMode] = useState<AdminMode>("new")
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [formData, setFormData] = useState<TenantCreateWithAdmin>({
    name: "",
    slug: "",
    email: "",
    phone: "",
    plan: "free",
    admin_email: "",
    admin_password: "",
    admin_first_name: "",
    admin_last_name: "",
  })
  const [editFormData, setEditFormData] = useState<TenantUpdate>({
    name: "",
    slug: "",
    email: "",
    phone: "",
    plan: "",
    country: "",
    city: "",
  })

  const loadTenants = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const data = await api.getTenantsWithStats(token)
      setTenants(data)
    } catch (error) {
      toast.error("Error al cargar organizaciones")
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = useCallback(async (search: string) => {
    const token = auth.getToken()
    if (!token) return

    setLoadingUsers(true)
    try {
      const users = await api.getUsersAvailableForAdmin(token, search || undefined)
      setAvailableUsers(users)
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    if (isCreateDialogOpen && adminMode === "existing") {
      searchUsers(userSearchTerm)
    }
  }, [isCreateDialogOpen, adminMode, searchUsers])

  useEffect(() => {
    if (adminMode !== "existing") return
    const timer = setTimeout(() => {
      searchUsers(userSearchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearchTerm, adminMode, searchUsers])

  useEffect(() => {
    loadTenants()
  }, [])

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) })
  }

  const resetCreateForm = () => {
    setFormData({
      name: "",
      slug: "",
      email: "",
      phone: "",
      plan: "free",
      admin_email: "",
      admin_password: "",
      admin_first_name: "",
      admin_last_name: "",
    })
    setAdminMode("new")
    setSelectedUserId(null)
    setUserSearchTerm("")
    setAvailableUsers([])
  }

  const handleCreate = async () => {
    const token = auth.getToken()
    if (!token) return

    const requestData: TenantCreateWithAdmin = {
      name: formData.name,
      slug: formData.slug,
      email: formData.email,
      phone: formData.phone,
      plan: formData.plan,
    }

    if (adminMode === "existing") {
      if (!selectedUserId) {
        toast.error("Debes seleccionar un usuario existente")
        return
      }
      requestData.existing_admin_id = selectedUserId
    } else {
      if (!formData.admin_email || !formData.admin_password) {
        toast.error("Debes proporcionar email y contraseña del nuevo admin")
        return
      }
      requestData.admin_email = formData.admin_email
      requestData.admin_password = formData.admin_password
      requestData.admin_first_name = formData.admin_first_name
      requestData.admin_last_name = formData.admin_last_name
    }

    try {
      await api.createTenantWithAdmin(token, requestData)
      toast.success("Organizacion creada exitosamente")
      setIsCreateDialogOpen(false)
      resetCreateForm()
      loadTenants()
    } catch (error: any) {
      toast.error(error.message || "Error al crear organizacion")
    }
  }

  const handleToggleActive = async (tenant: TenantWithStats) => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.toggleTenantActive(token, tenant.id)
      toast.success(tenant.is_active ? "Organizacion desactivada" : "Organizacion activada")
      loadTenants()
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar estado")
    }
  }

  const handleDelete = async () => {
    if (!selectedTenant) return
    const token = auth.getToken()
    if (!token) return

    try {
      await api.deleteTenant(token, selectedTenant.id)
      toast.success("Organizacion eliminada")
      setIsDeleteDialogOpen(false)
      setSelectedTenant(null)
      loadTenants()
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar organizacion")
    }
  }

  const openEditDialog = (tenant: TenantWithStats) => {
    setSelectedTenant(tenant)
    setEditFormData({
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email || "",
      phone: tenant.phone || "",
      plan: tenant.plan,
      country: tenant.country || "",
      city: tenant.city || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedTenant) return
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updateTenant(token, selectedTenant.id, editFormData)
      toast.success("Organizacion actualizada")
      setIsEditDialogOpen(false)
      setSelectedTenant(null)
      loadTenants()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar organizacion")
    }
  }

  const handleViewTenant = (tenant: TenantWithStats) => {
    router.push(`/dashboard/superadmin/tenants/${tenant.id}`)
  }

  const handleDeleteClick = (tenant: TenantWithStats) => {
    setSelectedTenant(tenant)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las organizaciones (tenants) de la plataforma
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Organizacion
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Organizaciones</CardTitle>
          <CardDescription>{tenants.length} organizaciones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay organizaciones registradas</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                Crear Primera Organizacion
              </Button>
            </div>
          ) : (
            <TenantTable
              tenants={tenants}
              onView={handleViewTenant}
              onEdit={openEditDialog}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteClick}
            />
          )}
        </CardContent>
      </Card>

      <CreateTenantDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        setFormData={setFormData}
        adminMode={adminMode}
        setAdminMode={setAdminMode}
        availableUsers={availableUsers}
        userSearchTerm={userSearchTerm}
        setUserSearchTerm={setUserSearchTerm}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        loadingUsers={loadingUsers}
        onNameChange={handleNameChange}
        onSubmit={handleCreate}
        onReset={resetCreateForm}
      />

      <EditTenantDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleEdit}
      />

      <DeleteTenantDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        tenant={selectedTenant}
        onConfirm={handleDelete}
      />
    </div>
  )
}
