"use client"

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
import { Users, Pencil, Trash2, CheckCircle, XCircle, Building2 } from "lucide-react"
import { User, TenantWithStats } from "@/lib/api"
import { getRoleBadge } from "./user-helpers"

interface UsersTableProps {
  users: User[]
  tenants: TenantWithStats[]
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleActive: (user: User) => void
}

export function UsersTable({
  users,
  tenants,
  onEdit,
  onDelete,
  onToggleActive,
}: UsersTableProps) {
  const getTenantName = (tenantId: string | undefined) => {
    if (!tenantId) return <span className="text-muted-foreground">-</span>
    const tenant = tenants.find((t) => t.id === tenantId)
    return tenant ? tenant.name : tenantId
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay usuarios que coincidan con los filtros</p>
      </div>
    )
  }

  return (
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
        {users.map((user) => (
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
                  onClick={() => onToggleActive(user)}
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
                  onClick={() => onEdit(user)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(user)}
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
  )
}
