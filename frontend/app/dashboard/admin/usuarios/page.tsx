"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, UserPlus, Pencil, Trash2, CheckCircle, XCircle, Shield, User as UserIcon } from "lucide-react"
import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { auth } from "@/lib/auth"
import { User } from "@/lib/api"

export default function UsuariosPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    company_name: "",
    role: "user" as "admin" | "user",
    is_active: true,
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/users/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar usuarios")
      }

      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error("Error al cargar usuarios", {
        description: error instanceof Error ? error.message : "No se pudieron cargar los usuarios"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/users/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al crear usuario")
      }

      toast.success("Usuario creado", {
        description: "El usuario ha sido creado correctamente"
      })

      setIsAddDialogOpen(false)
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        company_name: "",
        role: "user",
        is_active: true,
      })
      loadUsers()
    } catch (error) {
      toast.error("Error al crear usuario", {
        description: error instanceof Error ? error.message : "No se pudo crear el usuario"
      })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          is_active: formData.is_active,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al actualizar usuario")
      }

      toast.success("Usuario actualizado", {
        description: "El usuario ha sido actualizado correctamente"
      })

      setIsEditDialogOpen(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      toast.error("Error al actualizar usuario", {
        description: error instanceof Error ? error.message : "No se pudo actualizar el usuario"
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al eliminar usuario")
      }

      toast.success("Usuario eliminado", {
        description: "El usuario ha sido eliminado correctamente"
      })

      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      toast.error("Error al eliminar usuario", {
        description: error instanceof Error ? error.message : "No se pudo eliminar el usuario"
      })
    }
  }

  const handleToggleActive = async (user: User) => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...user,
          is_active: !user.is_active,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al actualizar estado")
      }

      toast.success(user.is_active ? "Usuario desactivado" : "Usuario activado", {
        description: `El usuario ha sido ${user.is_active ? "desactivado" : "activado"} correctamente`
      })

      loadUsers()
    } catch (error) {
      toast.error("Error al actualizar estado", {
        description: error instanceof Error ? error.message : "No se pudo actualizar el estado"
      })
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      company_name: user.company_name || "",
      role: user.role,
      is_active: user.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  if (isLoading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Cargando usuarios...</p>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Usuarios</h1>
            </div>
            <p className="text-muted-foreground">
              Gestiona todos los usuarios del sistema
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Agregar Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crea un nuevo usuario en el sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email *</Label>
                  <Input
                    id="add-email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-password">Contraseña *</Label>
                  <Input
                    id="add-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-first-name">Nombre</Label>
                  <Input
                    id="add-first-name"
                    placeholder="Nombre"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-last-name">Apellido</Label>
                  <Input
                    id="add-last-name"
                    placeholder="Apellido"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-phone">Teléfono</Label>
                  <Input
                    id="add-phone"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-company">Empresa</Label>
                  <Input
                    id="add-company"
                    placeholder="Nombre de la empresa"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-role">Rol *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "user") => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddUser}>
                  Crear Usuario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              Total de usuarios: {users.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : (user.full_name || "Sin nombre")}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="text-sm">{user.phone || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.company_name || "-"}</span>
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <UserIcon className="h-3 w-3" />
                            Usuario
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit border-green-500 text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit border-red-500 text-red-700">
                            <XCircle className="h-3 w-3" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.is_active ? (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Activar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica la información del usuario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">Nombre</Label>
                <Input
                  id="edit-first-name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Apellido</Label>
                <Input
                  id="edit-last-name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Empresa</Label>
                <Input
                  id="edit-company"
                  placeholder="Nombre de la empresa"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "user") => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditUser}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario
                <span className="font-semibold"> {selectedUser?.email}</span> del sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminDashboardLayout>
  )
}
