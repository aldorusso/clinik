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
import { Building2, Users, Pencil, Trash2, Power, Eye } from "lucide-react"
import { TenantWithStats } from "@/lib/api"
import { getTotalUsers } from "./tenant-helpers"

interface TenantTableProps {
  tenants: TenantWithStats[]
  onView: (tenant: TenantWithStats) => void
  onEdit: (tenant: TenantWithStats) => void
  onToggleActive: (tenant: TenantWithStats) => void
  onDelete: (tenant: TenantWithStats) => void
}

export function TenantTable({
  tenants,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
}: TenantTableProps) {
  return (
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
                  <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p className="text-sm">{tenant.email || "-"}</p>
              <p className="text-xs text-muted-foreground">{tenant.phone || "-"}</p>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{tenant.plan}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{getTotalUsers(tenant)}</span>
                <span className="text-xs text-muted-foreground">
                  ({tenant.client_count} clientes)
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={tenant.is_active ? "default" : "destructive"}>
                {tenant.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(tenant)}
                  title="Ver detalles y usuarios"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(tenant)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleActive(tenant)}
                  title={tenant.is_active ? "Desactivar" : "Activar"}
                >
                  <Power
                    className={`h-4 w-4 ${
                      tenant.is_active ? "text-green-600" : "text-red-600"
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(tenant)}
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
