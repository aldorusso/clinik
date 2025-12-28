"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AuditLog } from "@/lib/api"
import { ACTION_LABELS, CATEGORY_LABELS, formatDate, parseDetails } from "./audit-constants"

interface LogDetailsDialogProps {
  log: AuditLog | null
  onClose: () => void
}

export function LogDetailsDialog({ log, onClose }: LogDetailsDialogProps) {
  return (
    <Dialog open={!!log} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles del Registro</DialogTitle>
          <DialogDescription>
            Informacion completa del evento de auditoria
          </DialogDescription>
        </DialogHeader>
        {log && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Fecha/Hora</Label>
                <p className="font-mono">{formatDate(log.timestamp)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Accion</Label>
                <p>
                  <Badge variant={ACTION_LABELS[log.action]?.variant || "secondary"}>
                    {ACTION_LABELS[log.action]?.label || log.action}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Usuario</Label>
                <p>{log.user_email || "Sistema"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Categoria</Label>
                <p>{CATEGORY_LABELS[log.category]?.label || log.category}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">IP</Label>
                <p className="font-mono">{log.ip_address || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tenant ID</Label>
                <p className="font-mono text-sm">{log.tenant_id || "Global"}</p>
              </div>
              {log.entity_type && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Tipo de Entidad</Label>
                    <p>{log.entity_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ID de Entidad</Label>
                    <p className="font-mono text-sm">{log.entity_id}</p>
                  </div>
                </>
              )}
            </div>

            {log.user_agent && (
              <div>
                <Label className="text-muted-foreground">User Agent</Label>
                <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {log.user_agent}
                </p>
              </div>
            )}

            {log.details && (
              <div>
                <Label className="text-muted-foreground">Detalles Adicionales</Label>
                <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(parseDetails(log.details), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
