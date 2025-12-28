"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle } from "lucide-react"
import { AuditLog } from "@/lib/api"
import { ACTION_LABELS, formatDate } from "./audit-constants"

interface CriticalActionsTableProps {
  actions: AuditLog[]
}

export function CriticalActionsTable({ actions }: CriticalActionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Acciones Criticas Recientes
        </CardTitle>
        <CardDescription>
          Ultimas acciones que requieren atencion especial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Accion</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">
                  {formatDate(log.timestamp)}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-sm">
                    {log.user_email || "Sistema"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={ACTION_LABELS[log.action]?.variant || "destructive"}>
                    {ACTION_LABELS[log.action]?.label || log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.entity_type && (
                    <span className="text-sm">
                      {log.entity_type}: {log.entity_id?.slice(0, 8)}...
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.ip_address || "-"}
                </TableCell>
              </TableRow>
            ))}
            {actions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay acciones criticas recientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
