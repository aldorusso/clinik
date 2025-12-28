"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, UserCheck } from "lucide-react"
import { LeadStats } from "@/lib/api"

interface LeadsStatsCardsProps {
  stats: LeadStats | null
}

export function LeadsStatsCards({ stats }: LeadsStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.total_leads || 0}</div>
          <p className="text-xs text-muted-foreground">
            +{stats?.new_leads_today || 0} desde ayer
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nuevos Hoy</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.new_leads_today || 0}</div>
          <p className="text-xs text-muted-foreground">
            Hoy
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.conversion_rate?.toFixed(1) || 0}%</div>
          <p className="text-xs text-muted-foreground">
            Tasa de conversión
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sin Asignar</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.unassigned_leads || 0}</div>
          <p className="text-xs text-muted-foreground">
            Requieren asignación
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
