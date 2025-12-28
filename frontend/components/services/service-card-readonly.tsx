"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, DollarSign, Eye, Star } from "lucide-react"
import { Service } from "@/lib/api"
import { formatDuration } from "./service-helpers"

interface ServiceCardReadOnlyProps {
  service: Service
  onView?: (service: Service) => void
}

export function ServiceCardReadOnly({ service, onView }: ServiceCardReadOnlyProps) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              {service.is_featured && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <Badge variant="secondary">{service.category_name}</Badge>
          </div>

          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(service)}>
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {service.short_description && (
          <p className="text-sm text-muted-foreground">
            {service.short_description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{service.price_range_text}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{formatDuration(service.duration_minutes)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-1">
            <Badge variant={service.is_active ? "default" : "secondary"}>
              {service.is_active ? "Activo" : "Inactivo"}
            </Badge>
            {service.requires_consultation && (
              <Badge variant="outline">
                Requiere consulta
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
