"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, PhoneCall, CheckCircle, Stethoscope, CheckCircle2 } from "lucide-react"

interface AppointmentsStatsCardsProps {
  stats: {
    hoy: number
    pendientes: number
    confirmadas: number
    consulta: number
    completadas_hoy: number
  }
}

export function AppointmentsStatsCards({ stats }: AppointmentsStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hoy</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.hoy}</div>
          <p className="text-xs text-muted-foreground">Citas programadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Confirmar</CardTitle>
          <PhoneCall className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
          <p className="text-xs text-muted-foreground">Necesitan confirmación</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.confirmadas}</div>
          <p className="text-xs text-muted-foreground">Listas para atender</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Consulta</CardTitle>
          <Stethoscope className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.consulta}</div>
          <p className="text-xs text-muted-foreground">Actualmente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{stats.completadas_hoy}</div>
          <p className="text-xs text-muted-foreground">Hoy</p>
        </CardContent>
      </Card>
    </div>
  )
}
