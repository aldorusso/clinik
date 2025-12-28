"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminObjectiveDashboard, ObjectiveType } from "@/lib/api"
import { getTypeLabel } from "./objective-helpers"

interface ObjectivesStatsChartsProps {
  dashboard: AdminObjectiveDashboard | null
}

export function ObjectivesStatsCharts({ dashboard }: ObjectivesStatsChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Objetivos por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboard?.objectives_by_status && Object.entries(dashboard.objectives_by_status).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="capitalize">{status.replace('_', ' ')}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objetivos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboard?.objectives_by_type && Object.entries(dashboard.objectives_by_type).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span>{getTypeLabel(type as ObjectiveType)}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
