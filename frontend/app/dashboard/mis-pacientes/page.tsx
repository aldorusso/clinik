"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Phone,
  Mail,
  Heart,
  FileText
} from "lucide-react"

export default function MisPacientesPage() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Datos de ejemplo para mostrar la estructura - solo pacientes del doctor
  useEffect(() => {
    // Simulamos una carga de datos
    setTimeout(() => {
      setPacientes([
        {
          id: "1",
          name: "Ana Martínez",
          email: "ana.martinez@example.com",
          phone: "+52 555 1111111",
          status: "activo",
          last_visit: "2025-12-10",
          next_appointment: "2025-12-15",
          treatments_count: 3,
          notes: "Evolución favorable, continuar con el tratamiento",
          started_treatment: "2024-11-15T10:30:00Z"
        },
        {
          id: "2", 
          name: "Carlos López",
          email: "carlos.lopez@example.com",
          phone: "+52 555 2222222",
          status: "completado", 
          last_visit: "2025-11-28",
          next_appointment: null,
          treatments_count: 1,
          notes: "Tratamiento completado exitosamente",
          started_treatment: "2024-10-20T15:45:00Z"
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusBadge = (status: string) => {
    const statusMap = {
      activo: { label: "Activo", variant: "default" as const },
      completado: { label: "Completado", variant: "secondary" as const },
      pausado: { label: "Pausado", variant: "outline" as const },
      inactivo: { label: "Inactivo", variant: "destructive" as const }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">👥 Mis Pacientes</h1>
            <p className="text-muted-foreground">
              Pacientes bajo mi cuidado médico
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Pacientes</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pacientes.length}</div>
              <p className="text-xs text-muted-foreground">
                Bajo mi cuidado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pacientes.filter((paciente: any) => paciente.status === 'activo').length}
              </div>
              <p className="text-xs text-muted-foreground">
                En tratamiento actual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas Programadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pacientes.filter((paciente: any) => paciente.next_appointment).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Próximas consultas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pacientes.filter((paciente: any) => paciente.status === 'completado').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Tratamientos finalizados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mis pacientes por nombre, email o teléfono..."
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

        {/* Pacientes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Mis Pacientes</CardTitle>
            <CardDescription>
              Pacientes que están bajo mi cuidado médico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pacientes.map((paciente: any) => (
                <div key={paciente.id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{paciente.name}</h3>
                        {getStatusBadge(paciente.status)}
                        <Badge variant="outline">
                          {paciente.treatments_count} consultas
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {paciente.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {paciente.phone}
                        </div>
                        {paciente.last_visit && (
                          <div>
                            Última visita: {new Date(paciente.last_visit).toLocaleDateString()}
                          </div>
                        )}
                        {paciente.next_appointment && (
                          <div className="text-green-600">
                            Próxima cita: {new Date(paciente.next_appointment).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {paciente.notes && (
                        <div className="text-sm p-2 bg-muted/50 rounded">
                          <FileText className="h-3 w-3 inline mr-1" />
                          <strong>Notas:</strong> {paciente.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Ver Expediente
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        Nueva Cita
                      </Button>
                      {paciente.status === 'activo' && (
                        <Button size="sm">
                          Consulta
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {pacientes.length === 0 && (
              <div className="text-center py-8">
                <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No tienes pacientes asignados</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Los pacientes convertidos de tus leads aparecerán aquí.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}