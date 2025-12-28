"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react"
import { CommercialDashboard } from "@/lib/api"

interface CommercialStatsCardsProps {
  dashboard: CommercialDashboard | null
}

export function CommercialStatsCards({ dashboard }: CommercialStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Objetivos Activos</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboard?.active_objectives.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Objetivos en progreso
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completados</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboard?.completed_objectives_this_period || 0}</div>
          <p className="text-xs text-muted-foreground">
            Este periodo
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Exito</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboard?.objectives_completion_rate.toFixed(0) || 0}%</div>
          <p className="text-xs text-muted-foreground">
            Promedio de cumplimiento
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{dashboard?.overdue_objectives || 0}</div>
          <p className="text-xs text-muted-foreground">
            Requieren atencion
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
