"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, LogIn, AlertTriangle, Shield } from "lucide-react"
import { AuditStats } from "@/lib/api"
import { CATEGORY_LABELS } from "./audit-constants"

interface AuditStatsCardsProps {
  stats: AuditStats | null
}

export function AuditStatsCards({ stats }: AuditStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.total_logs.toLocaleString() || 0}</div>
          <p className="text-xs text-muted-foreground">Registros totales</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Logins Hoy</CardTitle>
          <LogIn className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats?.logins_today || 0}</div>
          <p className="text-xs text-muted-foreground">Accesos exitosos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Logins Fallidos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats?.failed_logins_today || 0}</div>
          <p className="text-xs text-muted-foreground">Intentos fallidos hoy</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Categoria</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {stats?.actions_by_category && Object.entries(stats.actions_by_category).slice(0, 3).map(([cat, count]) => (
              <div key={cat} className="flex justify-between text-xs">
                <span className="text-muted-foreground capitalize">{CATEGORY_LABELS[cat]?.label || cat}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
