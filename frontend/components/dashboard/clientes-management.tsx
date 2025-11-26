"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Building2,
  Search,
} from "lucide-react"
import { api, User } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"

export function ClientesManagement() {
  const router = useRouter()
  const [clients, setClients] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form data for creating clients
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    client_company_name: "",
    client_tax_id: "",
  })

  // Form data for editing clients
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    client_company_name: "",
    client_tax_id: "",
    is_active: true,
  })

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const clientsData = await api.getMyTenantClients(token)
      setClients(clientsData)
    } catch (error: any) {
      toast.error(error.message || "Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      client.email.toLowerCase().includes(searchLower) ||
      (client.first_name?.toLowerCase().includes(searchLower)) ||
      (client.last_name?.toLowerCase().includes(searchLower)) ||
      (client.client_company_name?.toLowerCase().includes(searchLower)) ||
      (client.client_tax_id?.toLowerCase().includes(searchLower))
    )
  })

  const handleCreate = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.createMyTenantClient(token, {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        client_company_name: formData.client_company_name,
        client_tax_id: formData.client_tax_id,
      })
      toast.success("Cliente creado exitosamente")
      setIsCreateDialogOpen(false)
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        client_company_name: "",
        client_tax_id: "",
      })
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al crear cliente")
    }
  }

  const handleEdit = async () => {
    if (!selectedClient) return
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updateMyTenantClient(token, selectedClient.id, {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        phone: editFormData.phone,
        client_company_name: editFormData.client_company_name,
        client_tax_id: editFormData.client_tax_id,
        is_active: editFormData.is_active,
      })
      toast.success("Cliente actualizado")
      setIsEditDialogOpen(false)
      setSelectedClient(null)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar cliente")
    }
  }

  const handleDelete = async () => {
    if (!selectedClient) return
    const token = auth.getToken()
    if (!token) return

    try {
      await api.deleteMyTenantClient(token, selectedClient.id)
      toast.success("Cliente eliminado")
      setIsDeleteDialogOpen(false)
      setSelectedClient(null)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar cliente")
    }
  }

  const handleToggleActive = async (client: User) => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updateMyTenantClient(token, client.id, { is_active: !client.is_active })
      toast.success(client.is_active ? "Cliente desactivado" : "Cliente activado")
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar estado")
    }
  }

  const openEditDialog = (client: User) => {
    setSelectedClient(client)
    setEditFormData({
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      phone: client.phone || "",
      client_company_name: client.client_company_name || "",
      client_tax_id: client.client_tax_id || "",
      is_active: client.is_active,
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
            <h1 className="text-3xl font-bold">Clientes</h1>
          </div>
          <p className="text-muted-foreground">
            Gestiona los clientes de tu organizacion
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Agrega un nuevo cliente a tu organizacion
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                  placeholder="cliente@empresa.com"
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_company_name">Empresa</Label>
                <Input
                  id="client_company_name"
                  value={formData.client_company_name}
                  onChange={(e) => setFormData({ ...formData, client_company_name: e.target.value })}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_tax_id">RUC/NIT</Label>
                <Input
                  id="client_tax_id"
                  value={formData.client_tax_id}
                  onChange={(e) => setFormData({ ...formData, client_tax_id: e.target.value })}
                  placeholder="Identificacion fiscal"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Crear Cliente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clients.length}</div>
          <p className="text-xs text-muted-foreground">
            {clients.filter((c) => c.is_active).length} activos
          </p>
        </CardContent>
      </Card>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>
                {filteredClients.length} de {clients.length} clientes
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No hay clientes que coincidan con la busqueda" : "No hay clientes registrados"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>RUC/NIT</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="font-medium">
                        {client.first_name && client.last_name
                          ? `${client.first_name} ${client.last_name}`
                          : client.full_name || "Sin nombre"}
                      </div>
                      {client.phone && (
                        <p className="text-xs text-muted-foreground">{client.phone}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.client_company_name ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{client.client_company_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      {client.client_tax_id || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {client.is_active ? (
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
                          onClick={() => handleToggleActive(client)}
                          title={client.is_active ? "Desactivar" : "Activar"}
                        >
                          {client.is_active ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(client)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedClient(client)
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
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica la informacion del cliente
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
              <Label htmlFor="edit_phone">Telefono</Label>
              <Input
                id="edit_phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_client_company_name">Empresa</Label>
              <Input
                id="edit_client_company_name"
                value={editFormData.client_company_name}
                onChange={(e) => setEditFormData({ ...editFormData, client_company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_client_tax_id">RUC/NIT</Label>
              <Input
                id="edit_client_tax_id"
                value={editFormData.client_tax_id}
                onChange={(e) => setEditFormData({ ...editFormData, client_tax_id: e.target.value })}
              />
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
            <AlertDialogTitle>Eliminar Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas eliminar al cliente{" "}
              <strong>{selectedClient?.email}</strong>? Esta accion no se puede deshacer.
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
