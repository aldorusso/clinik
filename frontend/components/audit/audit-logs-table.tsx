"use client"

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
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { AuditLog, AuditLogListResponse } from "@/lib/api"
import { ACTION_LABELS, CATEGORY_LABELS, formatDate } from "./audit-constants"

interface AuditLogsTableProps {
  logsData: AuditLogListResponse | null
  page: number
  setPage: (page: number) => void
  onViewDetails: (log: AuditLog) => void
}

export function AuditLogsTable({ logsData, page, setPage, onViewDetails }: AuditLogsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Registros de Actividad</CardTitle>
        <CardDescription>
          {logsData?.total || 0} registros encontrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Accion</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="text-right">Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logsData?.items.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">
                  {formatDate(log.timestamp)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {log.user_email || "Sistema"}
                    </span>
                    {log.tenant_id && (
                      <span className="text-xs text-muted-foreground">
                        Tenant: {log.tenant_id.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={ACTION_LABELS[log.action]?.variant || "secondary"}>
                    {ACTION_LABELS[log.action]?.label || log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {CATEGORY_LABELS[log.category] && (
                      <>
                        {(() => {
                          const Icon = CATEGORY_LABELS[log.category].icon
                          return <Icon className="h-3 w-3" />
                        })()}
                      </>
                    )}
                    <span className="text-sm">
                      {CATEGORY_LABELS[log.category]?.label || log.category}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.ip_address || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!logsData?.items || logsData.items.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {logsData && logsData.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Pagina {logsData.page} de {logsData.total_pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= logsData.total_pages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
