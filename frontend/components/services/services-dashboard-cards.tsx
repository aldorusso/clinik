"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, Package, CheckCircle, Clock } from "lucide-react"
import { Service, ServiceCategory } from "@/lib/api"

interface ServicesDashboardCardsProps {
  services: Service[]
  categories: ServiceCategory[]
}

export function ServicesDashboardCards({ services, categories }: ServicesDashboardCardsProps) {
  const avgDuration = services.length
    ? Math.round(services.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / services.length)
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{services.length}</div>
          <p className="text-xs text-muted-foreground">
            {services.filter(s => s.is_active).length} activos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categorías</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{categories.length}</div>
          <p className="text-xs text-muted-foreground">
            {categories.filter(c => c.is_active).length} activas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Con Consulta</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {services.filter(s => s.requires_consultation).length}
          </div>
          <p className="text-xs text-muted-foreground">
            Requieren consulta previa
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgDuration} min</div>
          <p className="text-xs text-muted-foreground">
            Por procedimiento
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
