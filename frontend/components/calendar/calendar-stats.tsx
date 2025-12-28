"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle, CheckCircle2, Stethoscope } from "lucide-react"
import { CalendarViewType } from "@/components/calendar/calendar-view"

interface CalendarStatsProps {
  viewType: CalendarViewType
  stats: {
    total: number
    confirmed: number
    inProgress: number
    completed: number
  }
}

export function CalendarStats({ viewType, stats }: CalendarStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total {viewType === 'month' ? 'del Mes' : 'de la Semana'}
          </CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <p className="text-xs text-muted-foreground">citas programadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          <p className="text-xs text-muted-foreground">listas para atender</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Consulta</CardTitle>
          <Stethoscope className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
          <p className="text-xs text-muted-foreground">actualmente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">finalizadas</p>
        </CardContent>
      </Card>
    </div>
  )
}
