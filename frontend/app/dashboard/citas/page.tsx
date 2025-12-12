"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

export default function CitasPage() {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Datos de ejemplo para mostrar la estructura
  useEffect(() => {
    // Simulamos una carga de datos
    setTimeout(() => {
      setCitas([
        {
          id: "1",
          patient_name: "Ana Martínez",
          doctor_name: "Dr. Roberto Martínez",
          service: "Consulta de evaluación",
          date: "2025-12-15",
          time: "10:00",
          status: "confirmada",
          type: "consulta",
          phone: "+52 555 1111111",
          notes: "Primera consulta"
        },
        {
          id: "2",
          patient_name: "María González",
          doctor_name: "Dr. Roberto Martínez", 
          service: "Seguimiento",
          date: "2025-12-12",
          time: "14:30",
          status: "pendiente",
          type: "seguimiento",
          phone: "+52 555 2222222",
          notes: "Revisión mensual"
        },
        {
          id: "3",
          patient_name: "Carlos López",
          doctor_name: "Dr. Roberto Martínez",
          service: "Consulta inicial", 
          date: "2025-12-11",
          time: "09:00",
          status: "completada",
          type: "consulta",
          phone: "+52 555 3333333",
          notes: ""
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusBadge = (status: string) => {
    const statusMap = {
      confirmada: { label: "Confirmada", variant: "default" as const, icon: CheckCircle },
      pendiente: { label: "Pendiente", variant: "outline" as const, icon: AlertCircle },
      completada: { label: "Completada", variant: "secondary" as const, icon: CheckCircle },
      cancelada: { label: "Cancelada", variant: "destructive" as const, icon: XCircle },
      no_show: { label: "No Show", variant: "destructive" as const, icon: XCircle }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: "default" as const, 
      icon: Clock 
    }
    const IconComponent = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  const isPast = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr < today
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
          <h1 className="text-3xl font-bold">📅 Gestión de Citas</h1>
          <p className="text-muted-foreground">
            Administra todas las citas médicas de la clínica
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {citas.filter((cita: any) => isToday(cita.date)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Citas programadas hoy
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {citas.filter((cita: any) => cita.status === 'pendiente').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sin confirmar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {citas.filter((cita: any) => cita.status === 'confirmada').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Listas para atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {citas.filter((cita: any) => cita.status === 'completada').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar citas por paciente, doctor o servicio..."
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

      {/* Citas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Citas</CardTitle>
          <CardDescription>
            Todas las citas médicas programadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {citas.map((cita: any) => (
              <div 
                key={cita.id} 
                className={`border rounded-lg p-4 hover:bg-muted/50 ${
                  isToday(cita.date) ? 'border-blue-200 bg-blue-50/50' : ''
                } ${
                  isPast(cita.date) && cita.status !== 'completada' ? 'border-red-200 bg-red-50/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{cita.patient_name}</h3>
                      {getStatusBadge(cita.status)}
                      {isToday(cita.date) && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          HOY
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(cita.date).toLocaleDateString()} a las {cita.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {cita.doctor_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {cita.phone}
                      </div>
                    </div>
                    <div className="text-sm">
                      <strong>Servicio:</strong> {cita.service}
                      {cita.notes && (
                        <span className="text-muted-foreground ml-2">
                          • {cita.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cita.status === 'pendiente' && (
                      <Button variant="outline" size="sm">
                        Confirmar
                      </Button>
                    )}
                    {cita.status === 'confirmada' && !isPast(cita.date) && (
                      <Button variant="outline" size="sm">
                        Check-in
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {citas.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No hay citas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comienza agendando la primera cita.
              </p>
              <div className="mt-6">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Cita
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}