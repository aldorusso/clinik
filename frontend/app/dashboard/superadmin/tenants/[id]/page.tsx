"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SuperadminDashboardLayout } from "@/components/dashboard/superadmin-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  ArrowLeft,
  Building2,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserCog,
  Briefcase,
  User as UserIcon,
  UserCheck,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { api, TenantWithStats, User } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"

const roleConfig = {
  tenant_admin: { label: "Admin", icon: Shield, variant: "default" as const },
  manager: { label: "Manager", icon: UserCog, variant: "secondary" as const },
  user: { label: "Usuario", icon: UserIcon, variant: "outline" as const },
  client: { label: "Cliente", icon: UserCheck, variant: "outline" as const },
}

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<TenantWithStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const loadTenantData = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const [tenantData, usersData] = await Promise.all([
        api.getTenant(token, tenantId),
        api.getTenantUsers(token, tenantId),
      ])
      setTenant(tenantData)
      setUsers(usersData)
    } catch (error: any) {
      toast.error(error.message || "Error al cargar datos del tenant")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantId) {
      loadTenantData()
    }
  }, [tenantId])

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    const token = auth.getToken()
    if (!token) return

    try {
      await api.deleteUser(token, selectedUser.id)
      toast.success("Usuario eliminado")
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      loadTenantData()
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar usuario")
    }
  }

  const handleToggleUserActive = async (user: User) => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updateUser(token, user.id, { is_active: !user.is_active })
      toast.success(user.is_active ? "Usuario desactivado" : "Usuario activado")
      loadTenantData()
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar estado")
    }
  }

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig]
    if (!config) return <Badge variant="outline">{role}</Badge>

    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
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

  if (!tenant) {
    return (
      <SuperadminDashboardLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Organizacion no encontrada</p>
          <Button onClick={() => router.push("/dashboard/superadmin/tenants")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </SuperadminDashboardLayout>
    )
  }

  return (
    <SuperadminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/superadmin/tenants")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
              <p className="text-muted-foreground">{tenant.slug}</p>
            </div>
          </div>
          <Badge variant={tenant.is_active ? "default" : "destructive"} className="text-sm px-3 py-1">
            {tenant.is_active ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Tenant Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{tenant.plan}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Internos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenant.tenant_admin_count + tenant.manager_count + tenant.user_count}
              </div>
              <p className="text-xs text-muted-foreground">
                {tenant.tenant_admin_count} admins, {tenant.manager_count} managers, {tenant.user_count} usuarios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenant.client_count}</div>
              <p className="text-xs text-muted-foreground">Clientes externos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creado</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(tenant.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion de Contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{tenant.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium">{tenant.phone || "-"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ubicacion</p>
                  <p className="font-medium">
                    {tenant.city && tenant.country
                      ? `${tenant.city}, ${tenant.country}`
                      : tenant.city || tenant.country || "-"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios del Tenant</CardTitle>
            <CardDescription>
              {users.length} usuarios en esta organizacion
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay usuarios en este tenant</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.full_name || "Sin nombre"}
                        </div>
                        {user.role === "client" && user.client_company_name && (
                          <p className="text-xs text-muted-foreground">
                            {user.client_company_name}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
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
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserActive(user)}
                          >
                            {user.is_active ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsDeleteDialogOpen(true)
                            }}
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

      {/* Delete User Dialog */}
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
              onClick={handleDeleteUser}
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
