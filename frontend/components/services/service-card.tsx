"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Clock, DollarSign, Edit, Eye, Trash2 } from "lucide-react"
import { Service } from "@/lib/api"
import { formatPrice } from "./service-helpers"

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onView: (service: Service) => void
  onDelete: (service: Service) => void
}

export function ServiceCard({ service, onEdit, onView, onDelete }: ServiceCardProps) {
  return (
    <Card className={`hover:bg-muted/50 transition-colors ${!service.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">{service.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{service.category_name}</Badge>
              {!service.is_active && (
                <Badge variant="secondary">Inactivo</Badge>
              )}
              {service.requires_consultation && (
                <Badge variant="outline">Consulta requerida</Badge>
              )}
            </div>
            <CardDescription className="mt-1">{service.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{service.duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{formatPrice(service.price_min, service.price_max)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(service)}>
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => onView(service)}>
            <Eye className="h-3 w-3 mr-1" />
            Ver
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(service)}>
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
