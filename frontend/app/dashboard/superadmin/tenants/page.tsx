"use client"

import { useEffect, useState, useCallback } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Building2, Plus, Pencil, Trash2, Power, Users, Eye, Search, User, UserPlus } from "lucide-react"
import { api, TenantWithStats, TenantCreateWithAdmin, TenantUpdate, User as UserType } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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

  // Email validation state - detects if email already exists
  const [existingUserForEmail, setExistingUserForEmail] = useState<UserType | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)

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

  // Load users when dialog opens and mode is "existing"
  useEffect(() => {
    if (isCreateDialogOpen && adminMode === "existing") {
      searchUsers(userSearchTerm)
    }
  }, [isCreateDialogOpen, adminMode, searchUsers])

  // Debounced search
  useEffect(() => {
    if (adminMode !== "existing") return
    const timer = setTimeout(() => {
      searchUsers(userSearchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearchTerm, adminMode, searchUsers])

  // Check if admin email already exists (when creating new user)
  useEffect(() => {
    if (adminMode !== "new" || !formData.admin_email) {
      setExistingUserForEmail(null)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.admin_email)) {
      setExistingUserForEmail(null)
      return
    }

    const checkEmail = async () => {
      const token = auth.getToken()
      if (!token) return

      setCheckingEmail(true)
      try {
        // Search for exact email match
        const users = await api.getUsersAvailableForAdmin(token, formData.admin_email)
        const exactMatch = users.find(
          (u) => u.email.toLowerCase() === formData.admin_email?.toLowerCase()
        )
        setExistingUserForEmail(exactMatch || null)
      } catch (error) {
        console.error("Error checking email:", error)
        setExistingUserForEmail(null)
      } finally {
        setCheckingEmail(false)
      }
    }

    const timer = setTimeout(checkEmail, 500)
    return () => clearTimeout(timer)
  }, [formData.admin_email, adminMode])

  useEffect(() => {
    loadTenants()
  }, [])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    })
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
    setExistingUserForEmail(null)
  }

  // Helper to use existing user from email check
  const useExistingUserFromEmail = () => {
    if (existingUserForEmail) {
      setAdminMode("existing")
      setSelectedUserId(existingUserForEmail.id)
      setUserSearchTerm(existingUserForEmail.email)
      setAvailableUsers([existingUserForEmail])
      setExistingUserForEmail(null)
      // Clear the new user fields
      setFormData({
        ...formData,
        admin_email: "",
        admin_password: "",
        admin_first_name: "",
        admin_last_name: "",
      })
    }
  }

  const handleCreate = async () => {
    const token = auth.getToken()
    if (!token) return

    // Build request data based on admin mode
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
      toast.success(
        tenant.is_active
          ? "Organizacion desactivada"
          : "Organizacion activada"
      )
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

  const getTotalUsers = (tenant: TenantWithStats) => {
    return tenant.tenant_admin_count + tenant.manager_count + tenant.user_count
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Organizacion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Organizacion</DialogTitle>
                <DialogDescription>
                  Crea una nueva organizacion con su administrador inicial
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la Organizacion</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Mi Empresa S.A."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="mi-empresa"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Contacto</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-2">
                  <h4 className="font-medium mb-3">Administrador Inicial</h4>

                  <RadioGroup
                    value={adminMode}
                    onValueChange={(value) => {
                      setAdminMode(value as AdminMode)
                      setSelectedUserId(null)
                    }}
                    className="flex gap-4 mb-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="new" id="admin-new" />
                      <Label htmlFor="admin-new" className="flex items-center gap-1 cursor-pointer">
                        <UserPlus className="h-4 w-4" />
                        Crear nuevo usuario
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="admin-existing" />
                      <Label htmlFor="admin-existing" className="flex items-center gap-1 cursor-pointer">
                        <User className="h-4 w-4" />
                        Usuario existente
                      </Label>
                    </div>
                  </RadioGroup>

                  {adminMode === "new" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin_first_name">Nombre</Label>
                          <Input
                            id="admin_first_name"
                            value={formData.admin_first_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                admin_first_name: e.target.value,
                              })
                            }
                            placeholder="Juan"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin_last_name">Apellido</Label>
                          <Input
                            id="admin_last_name"
                            value={formData.admin_last_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                admin_last_name: e.target.value,
                              })
                            }
                            placeholder="Perez"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin_email">Email del Admin</Label>
                          <Input
                            id="admin_email"
                            type="email"
                            value={formData.admin_email || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                admin_email: e.target.value,
                              })
                            }
                            placeholder="admin@empresa.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin_password">Contrasena</Label>
                          <Input
                            id="admin_password"
                            type="password"
                            value={formData.admin_password || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                admin_password: e.target.value,
                              })
                            }
                            placeholder="******"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por email o nombre..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <div className="border rounded-md max-h-48 overflow-y-auto">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Buscando usuarios...
                          </div>
                        ) : availableUsers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            {userSearchTerm
                              ? "No se encontraron usuarios"
                              : "Escribe para buscar usuarios"}
                          </div>
                        ) : (
                          availableUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => setSelectedUserId(user.id)}
                              className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                                selectedUserId === user.id
                                  ? "bg-primary/10 border-primary"
                                  : ""
                              }`}
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                              {user.role && (
                                <Badge variant="outline" className="text-xs">
                                  {user.role}
                                </Badge>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {selectedUserId && (
                        <p className="text-sm text-green-600">
                          Usuario seleccionado para admin
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetCreateForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Crear Organizacion</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas las Organizaciones</CardTitle>
            <CardDescription>
              {tenants.length} organizaciones registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay organizaciones registradas
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Crear Primera Organizacion
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organizacion</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {tenant.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{tenant.email || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.phone || "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tenant.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {getTotalUsers(tenant)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({tenant.client_count} clientes)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tenant.is_active ? "default" : "destructive"}
                        >
                          {tenant.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(
                                `/dashboard/superadmin/tenants/${tenant.id}`
                              )
                            }
                            title="Ver detalles y usuarios"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(tenant)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(tenant)}
                            title={
                              tenant.is_active ? "Desactivar" : "Activar"
                            }
                          >
                            <Power
                              className={`h-4 w-4 ${
                                tenant.is_active
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTenant(tenant)
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Organizacion</DialogTitle>
              <DialogDescription>
                Modifica los datos de la organizacion
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_name">Nombre</Label>
                  <Input
                    id="edit_name"
                    value={editFormData.name || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_slug">Slug (URL)</Label>
                  <Input
                    id="edit_slug"
                    value={editFormData.slug || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, slug: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Telefono</Label>
                  <Input
                    id="edit_phone"
                    value={editFormData.phone || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_country">Pais</Label>
                  <Input
                    id="edit_country"
                    value={editFormData.country || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, country: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_city">Ciudad</Label>
                  <Input
                    id="edit_city"
                    value={editFormData.city || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, city: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_plan">Plan</Label>
                <Select
                  value={editFormData.plan || "free"}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, plan: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
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
              <AlertDialogTitle>Eliminar Organizacion</AlertDialogTitle>
              <AlertDialogDescription>
                Estas seguro de que deseas eliminar la organizacion{" "}
                <strong>{selectedTenant?.name}</strong>? Esta accion eliminara
                todos los usuarios y datos asociados. Esta accion no se puede
                deshacer.
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
      </div>
    )
  }
