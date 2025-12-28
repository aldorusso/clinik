"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Stethoscope, Clock, DollarSign, Edit } from "lucide-react"
import { Service } from "@/lib/api"
import { formatCurrency } from "./service-helpers"

interface ServiceDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onEdit: (service: Service) => void
}

export function ServiceDetailsDialog({
  open,
  onOpenChange,
  service,
  onEdit
}: ServiceDetailsDialogProps) {
  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Detalles del Servicio
          </DialogTitle>
          <DialogDescription>
            Información completa del servicio médico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nombre del Servicio</Label>
              <p className="text-lg font-medium">{service.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Categoría</Label>
              <p className="text-lg font-medium">{service.category_name}</p>
            </div>
          </div>

          {service.description && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
              <p className="text-sm mt-1">{service.description}</p>
            </div>
          )}

          {/* Pricing and Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Duración</Label>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{service.duration_minutes} minutos</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Precio Mínimo</Label>
              <div className="flex items-center gap-1 mt-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatCurrency(service.price_min || 0)}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Precio Máximo</Label>
              <div className="flex items-center gap-1 mt-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatCurrency(service.price_max || 0)}</span>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2">
            <Badge variant={service.is_active ? "default" : "secondary"}>
              {service.is_active ? "Activo" : "Inactivo"}
            </Badge>
            <Badge variant={service.requires_consultation ? "outline" : "secondary"}>
              {service.requires_consultation ? "Requiere Consulta" : "Sin Consulta Previa"}
            </Badge>
          </div>

          {/* Instructions */}
          {service.preparation_instructions && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Instrucciones de Preparación</Label>
              <div className="mt-1 p-3 bg-blue-50 rounded-lg border">
                <p className="text-sm">{service.preparation_instructions}</p>
              </div>
            </div>
          )}

          {/* Contraindications */}
          {service.contraindications && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Contraindicaciones</Label>
              <div className="mt-1 p-3 bg-red-50 rounded-lg border">
                <p className="text-sm">{service.contraindications}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span>Creado: </span>
                <span>{new Date(service.created_at).toLocaleDateString('es-ES')}</span>
              </div>
              <div>
                <span>Actualizado: </span>
                <span>{new Date(service.updated_at).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              onOpenChange(false)
              onEdit(service)
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Servicio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
