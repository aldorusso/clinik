"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { api, CommercialStatsResponse } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Target,
  Filter,
  Download
} from "lucide-react"

export default function EstadisticasPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CommercialStatsResponse | null>(null)

  // Cargar estadísticas reales desde la API
  useEffect(() => {
    const loadStats = async () => {
      const token = auth.getToken()
      if (!token) {
        toast({
          title: "Error de autenticación",
          description: "No se encontró un token válido. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      try {
        const statsData = await api.getCommercialStats(token)
        setStats(statsData)
      } catch (error: any) {
        console.error('Error loading commercial stats:', error)
        toast({
          title: "Error al cargar estadísticas",
          description: "No se pudieron cargar las estadísticas. Intenta recargar la página.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const getGrowthBadge = (growth: number) => {
    const isPositive = growth > 0
    return (
      <Badge variant={isPositive ? "default" : "destructive"} className="flex items-center gap-1">
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(growth)}%
      </Badge>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h3 className="text-lg font-semibold mb-2">No se pudieron cargar las estadísticas</h3>
          <p className="text-muted-foreground mb-4">Ocurrió un error al obtener los datos</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Estadísticas</h1>
            <p className="text-muted-foreground">
              Análisis y métricas del rendimiento de leads
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.total_leads}</div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {stats.overview.leads_this_month} este mes
                </p>
                {getGrowthBadge(stats.monthly_trends.leads_growth)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.conversion_rate}%</div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  Este mes
                </p>
                {getGrowthBadge(stats.monthly_trends.conversion_growth)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.active_patients}</div>
              <p className="text-xs text-muted-foreground">
                En tratamiento actual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento Ingresos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getGrowthBadge(stats.monthly_trends.revenue_growth)}
              </div>
              <p className="text-xs text-muted-foreground">
                vs mes anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Lead Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Embudo de Conversión</CardTitle>
              <CardDescription>
                Distribución de leads por etapa del pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.funnel).map(([stage, count]) => {
                  const stageNames: {[key: string]: string} = {
                    nuevo: "Nuevo",
                    contactado: "Contactado", 
                    calificado: "Calificado",
                    cita_agendada: "Cita Agendada",
                    en_tratamiento: "En Tratamiento",
                    completado: "Completado"
                  }
                  const percentage = (count as number / stats.overview.total_leads * 100).toFixed(1)
                  
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{stageNames[stage]}</div>
                        <Badge variant="outline">{String(count)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{percentage}%</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Fuentes de Leads</CardTitle>
              <CardDescription>
                Distribución por canal de origen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.sources).map(([source, count]) => {
                  const sourceNames: {[key: string]: string} = {
                    website: "Sitio Web",
                    facebook: "Facebook",
                    instagram: "Instagram", 
                    referidos: "Referidos",
                    google: "Google",
                    otros: "Otros"
                  }
                  const total = Object.values(stats.sources).reduce((a: any, b: any) => a + b, 0) as number
                  const percentage = (count as number / total * 100).toFixed(1)
                  
                  return (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{sourceNames[source]}</div>
                        <Badge variant="outline">{String(count)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{percentage}%</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Médico</CardTitle>
            <CardDescription>
              Métricas de conversión y asignación por doctor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.doctors_performance.map((doctor: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{doctor.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {doctor.leads_assigned} leads asignados
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {doctor.conversion_rate}% conversión
                        </div>
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {doctor.active_patients} pacientes activos
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={doctor.conversion_rate > 20 ? "default" : "outline"}>
                        {doctor.conversion_rate > 20 ? "Excelente" : "Promedio"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}