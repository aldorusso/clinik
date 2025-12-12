"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Settings
} from "lucide-react"

export default function ServiciosPage() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Datos de ejemplo para mostrar la estructura
  useEffect(() => {
    // Simulamos una carga de datos
    setTimeout(() => {
      setServicios([
        {
          id: "1",
          name: "Consulta de Evaluación",
          category: "consultas",
          duration_minutes: 45,
          base_price: 1500,
          description: "Primera consulta para evaluar las necesidades del paciente",
          active: true,
          requires_appointment: true
        },
        {
          id: "2", 
          name: "Consulta de Seguimiento",
          category: "consultas",
          duration_minutes: 30,
          base_price: 1000,
          description: "Consulta de seguimiento y control",
          active: true,
          requires_appointment: true
        },
        {
          id: "3",
          name: "Paquete Básico",
          category: "paquetes",
          duration_minutes: 60,
          base_price: 5000,
          description: "Paquete de servicios básicos",
          active: true,
          requires_appointment: true
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      consultas: { label: "Consulta", variant: "default" as const },
      paquetes: { label: "Paquete", variant: "secondary" as const },
      tratamientos: { label: "Tratamiento", variant: "outline" as const }
    }
    
    const categoryInfo = categoryMap[category as keyof typeof categoryMap] || { 
      label: category, 
      variant: "default" as const 
    }
    return <Badge variant={categoryInfo.variant}>{categoryInfo.label}</Badge>
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}min`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${remainingMinutes}min`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🏥 Servicios</h1>
          <p className="text-muted-foreground">
            Configura los servicios disponibles en la clínica
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicios.length}</div>
            <p className="text-xs text-muted-foreground">
              Servicios configurados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {servicios.filter((servicio: any) => servicio.active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponibles para citas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(
                servicios.reduce((acc: number, servicio: any) => acc + servicio.base_price, 0) / servicios.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Precio base promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(
                servicios.reduce((acc: number, servicio: any) => acc + servicio.duration_minutes, 0) / servicios.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tiempo promedio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios por nombre o categoría..."
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

      {/* Servicios Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {servicios.map((servicio: any) => (
          <Card key={servicio.id} className="hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{servicio.name}</CardTitle>
                  {getCategoryBadge(servicio.category)}
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {servicio.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{formatPrice(servicio.base_price)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{formatDuration(servicio.duration_minutes)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={servicio.active ? "default" : "secondary"}>
                  {servicio.active ? "Activo" : "Inactivo"}
                </Badge>
                {servicio.requires_appointment && (
                  <span className="text-xs text-muted-foreground">
                    Requiere cita
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {servicios.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No hay servicios</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comienza creando el primer servicio de la clínica.
            </p>
            <div className="mt-6">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Servicio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  )
}