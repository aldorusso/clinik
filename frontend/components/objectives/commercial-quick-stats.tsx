"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommercialDashboard } from "@/lib/api"
import { formatCurrency } from "./objective-helpers"

interface CommercialQuickStatsProps {
  dashboard: CommercialDashboard | null
}

export function CommercialQuickStats({ dashboard }: CommercialQuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Este Mes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Leads</span>
            <span className="font-medium">{dashboard?.total_leads_this_month || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Ingresos</span>
            <span className="font-medium">
              {formatCurrency(dashboard?.total_revenue_this_month || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Conversion</span>
            <span className="font-medium">{dashboard?.conversion_rate_this_month.toFixed(1) || 0}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Proximas Fechas</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard?.upcoming_deadlines.length ? (
            <div className="space-y-2">
              {dashboard.upcoming_deadlines.slice(0, 3).map((deadline, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{deadline.title}</span>
                  <span className="font-medium">{deadline.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay fechas proximas</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sugerencias</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard?.suggestions.length ? (
            <div className="space-y-1">
              {dashboard.suggestions.slice(0, 3).map((suggestion, index) => (
                <p key={index} className="text-sm text-muted-foreground">* {suggestion}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Vas muy bien! Sigue asi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
