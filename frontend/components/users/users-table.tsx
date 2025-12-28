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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Users, Pencil, Trash2, CheckCircle, XCircle, Building2, UserPlus } from "lucide-react"
import { User, TenantWithStats } from "@/lib/api"
import { getRoleBadge } from "./user-helpers"

interface UsersTableProps {
  users: User[]
  tenants: TenantWithStats[]
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleActive: (user: User) => void
  onAssignTenant?: (user: User) => void
}

export function UsersTable({
  users,
  tenants,
  onEdit,
  onDelete,
  onToggleActive,
  onAssignTenant,
}: UsersTableProps) {
  const getTenantName = (tenantId: string | undefined) => {
    if (!tenantId) return <span className="text-muted-foreground">-</span>
    const tenant = tenants.find((t) => t.id === tenantId)
    return tenant ? tenant.name : tenantId
  }

  const renderMemberships = (user: User) => {
    // If user has memberships array from API, use it
    if (user.memberships && user.memberships.length > 0) {
      if (user.memberships.length === 1) {
        const m = user.memberships[0]
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{m.tenant_name}</span>
            {m.is_default && (
              <Badge variant="outline" className="text-xs">Default</Badge>
            )}
          </div>
        )
      }

      // Multiple memberships - show first one + count
      const defaultMembership = user.memberships.find(m => m.is_default) || user.memberships[0]
      const otherCount = user.memberships.length - 1

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{defaultMembership.tenant_name}</span>
                <Badge variant="secondary" className="text-xs">
                  +{otherCount} más
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium text-xs mb-2">Organizaciones:</p>
                {user.memberships.map((m) => (
                  <div key={m.tenant_id} className="flex items-center justify-between gap-3 text-xs">
                    <span>{m.tenant_name}</span>
                    <div className="flex items-center gap-1">
                      {getRoleBadge(m.role)}
                      {m.is_default && (
                        <Badge variant="outline" className="text-[10px] px-1">Default</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // Fallback to legacy tenant_id field
    return (
      <div className="flex items-center gap-2">
        {user.tenant_id && <Building2 className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm">{getTenantName(user.tenant_id)}</span>
      </div>
    )
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
          <TableHead>Organizaciones</TableHead>
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
              {renderMemberships(user)}
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
                {onAssignTenant && user.role !== "superadmin" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAssignTenant(user)}
                    title="Asignar a organización"
                  >
                    <UserPlus className="h-4 w-4 text-primary" />
                  </Button>
                )}
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
