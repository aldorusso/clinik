"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  UserCheck,
  Phone,
  Mail,
  Calendar
} from "lucide-react"

export default function MisLeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Datos de ejemplo para mostrar la estructura - solo leads asignados al doctor
  useEffect(() => {
    // Simulamos una carga de datos
    setTimeout(() => {
      setLeads([
        {
          id: "1",
          name: "Juan Pérez",
          email: "juan.perez@example.com",
          phone: "+52 555 1234567",
          status: "cita_agendada",
          source: "website",
          priority: "alta",
          assigned_at: "2025-12-10T10:30:00Z",
          next_appointment: "2025-12-15T10:00:00Z"
        },
        {
          id: "2", 
          name: "María González",
          email: "maria.gonzalez@example.com",
          phone: "+52 555 7654321",
          status: "en_tratamiento", 
          source: "facebook",
          priority: "media",
          assigned_at: "2025-12-08T15:45:00Z",
          next_appointment: "2025-12-20T14:00:00Z"
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusBadge = (status: string) => {
    const statusMap = {
      cita_agendada: { label: "Cita Agendada", variant: "default" as const },
      en_tratamiento: { label: "En Tratamiento", variant: "secondary" as const },
      completado: { label: "Completado", variant: "outline" as const }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      alta: "text-red-600",
      media: "text-yellow-600", 
      baja: "text-green-600"
    }
    return colors[priority as keyof typeof colors] || "text-gray-600"
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
            <h1 className="text-3xl font-bold">👨‍⚕️ Mis Leads Asignados</h1>
            <p className="text-muted-foreground">
              Leads que han sido asignados para mi consulta
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
              <p className="text-xs text-muted-foreground">
                Asignados a mi consulta
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Cita</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads.filter((lead: any) => lead.status === 'cita_agendada').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Próximas consultas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Tratamiento</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads.filter((lead: any) => lead.status === 'en_tratamiento').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Pacientes activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads.filter((lead: any) => lead.status === 'completado').length}
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
              placeholder="Buscar mis leads por nombre, email o teléfono..."
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

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Leads Asignados</CardTitle>
            <CardDescription>
              Leads que han sido asignados para mi atención médica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.map((lead: any) => (
                <div key={lead.id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{lead.name}</h3>
                        {getStatusBadge(lead.status)}
                        <span className={`text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                          {lead.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                        {lead.next_appointment && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Calendar className="h-3 w-3" />
                            Próxima cita: {new Date(lead.next_appointment).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Asignado el: {new Date(lead.assigned_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Ver Historial
                      </Button>
                      {lead.status === 'cita_agendada' && (
                        <Button size="sm">
                          Iniciar Consulta
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {leads.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No tienes leads asignados</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Los leads asignados para tu consulta aparecerán aquí.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}