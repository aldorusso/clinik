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
  Users,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Building2,
} from "lucide-react"
import { User } from "@/lib/api"

interface ClientsTableProps {
  clients: User[]
  onEdit: (client: User) => void
  onDelete: (client: User) => void
  onToggleActive: (client: User) => void
  emptyMessage?: string
}

export function ClientsTable({
  clients,
  onEdit,
  onDelete,
  onToggleActive,
  emptyMessage = "No hay clientes registrados"
}: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
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
        {clients.map((client) => (
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
                  onClick={() => onToggleActive(client)}
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
                  onClick={() => onEdit(client)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(client)}
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
