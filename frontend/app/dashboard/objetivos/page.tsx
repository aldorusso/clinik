"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { 
  Target, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

export default function ObjetivosPage() {
  const [objetivos, setObjetivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Datos de ejemplo para mostrar la estructura - objetivos del comercial
  useEffect(() => {
    // Simulamos una carga de datos
    setTimeout(() => {
      setObjetivos([
        {
          id: "1",
          title: "Leads Mensuales",
          description: "Capturar 50 leads nuevos este mes",
          target: 50,
          current: 32,
          period: "mensual",
          type: "leads",
          deadline: "2025-12-31",
          status: "en_progreso"
        },
        {
          id: "2", 
          title: "Conversión a Pacientes",
          description: "Convertir 10 leads en pacientes este mes",
          target: 10,
          current: 6,
          period: "mensual", 
          type: "conversiones",
          deadline: "2025-12-31",
          status: "en_progreso"
        },
        {
          id: "3",
          title: "Meta de Ingresos",
          description: "Generar $50,000 MXN en ventas",
          target: 50000,
          current: 35000,
          period: "mensual",
          type: "ingresos", 
          deadline: "2025-12-31",
          status: "en_progreso"
        },
        {
          id: "4",
          title: "Citas Agendadas",
          description: "Agendar 15 primeras consultas",
          target: 15,
          current: 15,
          period: "mensual",
          type: "citas",
          deadline: "2025-11-30", 
          status: "completado"
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusBadge = (status: string, progress: number) => {
    if (status === "completado") {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>
    }
    if (progress >= 90) {
      return <Badge variant="default"><Target className="h-3 w-3 mr-1" />Casi Listo</Badge>
    }
    if (progress >= 50) {
      return <Badge variant="secondary"><TrendingUp className="h-3 w-3 mr-1" />En Progreso</Badge>
    }
    return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Atrasado</Badge>
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      leads: Users,
      conversiones: Target,
      ingresos: DollarSign,
      citas: Calendar
    }
    return icons[type as keyof typeof icons] || Target
  }

  const formatValue = (type: string, value: number) => {
    if (type === "ingresos") {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(value)
    }
    return value.toString()
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

  const completedGoals = objetivos.filter((obj: any) => obj.status === 'completado').length
  const totalGoals = objetivos.length
  const avgProgress = objetivos.reduce((acc: number, obj: any) => acc + (obj.current / obj.target * 100), 0) / totalGoals

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🎯 Mis Objetivos</h1>
            <p className="text-muted-foreground">
              Seguimiento de metas y objetivos comerciales
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Objetivo
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Objetivos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGoals}</div>
              <p className="text-xs text-muted-foreground">
                Objetivos activos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedGoals}</div>
              <p className="text-xs text-muted-foreground">
                {((completedGoals / totalGoals) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgProgress.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                Avance general
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {objetivos.filter((obj: any) => obj.period === 'mensual' && obj.status !== 'completado').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Objetivos pendientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar objetivos por título o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>

        {/* Goals Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {objetivos.map((objetivo: any) => {
            const progress = (objetivo.current / objetivo.target) * 100
            const IconComponent = getTypeIcon(objetivo.type)
            const isOverdue = new Date(objetivo.deadline) < new Date() && objetivo.status !== 'completado'
            
            return (
              <Card key={objetivo.id} className={`hover:bg-muted/50 transition-colors ${isOverdue ? 'border-red-200' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg">{objetivo.title}</CardTitle>
                      </div>
                      <CardDescription>{objetivo.description}</CardDescription>
                    </div>
                    {getStatusBadge(objetivo.status, progress)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progreso</span>
                      <span className="font-medium">
                        {formatValue(objetivo.type, objetivo.current)} / {formatValue(objetivo.type, objetivo.target)}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {progress.toFixed(1)}% completado
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      Fecha límite: {new Date(objetivo.deadline).toLocaleDateString()}
                    </div>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        Vencido
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Actualizar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {objetivos.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No hay objetivos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comienza creando tu primer objetivo comercial.
              </p>
              <div className="mt-6">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Objetivo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}