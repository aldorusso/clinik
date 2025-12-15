"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye,
  Mail,
  Stethoscope
} from "lucide-react"
import { Appointment, AppointmentStatus, User as UserType, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function MisCitasPage() {
  const { toast } = useToast()
  const [citas, setCitas] = useState<Appointment[]>([])
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // Load current user
        const userData = await api.getCurrentUser(token)
        setCurrentUser(userData)

        // Load my appointments (as provider)
        const appointmentsData = await api.getAppointments(token, {
          provider_id: userData.id, // Filter by current doctor
          page_size: 100,
          order_by: 'scheduled_at',
          order_direction: 'desc'
        })
        
        setCitas(appointmentsData)
      } catch (error: any) {
        console.error('Error loading data:', error)
        toast({
          title: "Error",
          description: "Error al cargar las citas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusConfig = {
      scheduled: { label: "Programada", variant: "default" as const, color: "bg-blue-100 text-blue-800", icon: Clock },
      confirmed: { label: "Confirmada", variant: "default" as const, color: "bg-green-100 text-green-800", icon: CheckCircle },
      in_progress: { label: "En Consulta", variant: "default" as const, color: "bg-purple-100 text-purple-800", icon: Stethoscope },
      completed: { label: "Completada", variant: "default" as const, color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
      no_show: { label: "No Asistió", variant: "destructive" as const, color: "bg-red-100 text-red-800", icon: XCircle },
      cancelled_by_patient: { label: "Cancelada", variant: "outline" as const, color: "bg-gray-100 text-gray-800", icon: XCircle },
      cancelled_by_clinic: { label: "Cancelada", variant: "outline" as const, color: "bg-gray-100 text-gray-800", icon: XCircle },
      rescheduled: { label: "Reprogramada", variant: "default" as const, color: "bg-orange-100 text-orange-800", icon: AlertCircle }
    }

    const config = statusConfig[status] || statusConfig.scheduled
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className={config.color}>
        <IconComponent className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredCitas = citas.filter(cita => {
    const matchesSearch = searchTerm === "" || 
      cita.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === "all" || cita.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  // Calculate stats for the doctor
  const stats = {
    total: citas.length,
    hoy: citas.filter(cita => cita.is_today).length,
    pendientes: citas.filter(cita => cita.status === 'scheduled' || cita.status === 'confirmed').length,
    completadas: citas.filter(cita => cita.status === 'completed').length,
    proximas: citas.filter(cita => cita.is_upcoming).length
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-500" />
              Mis Citas
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus citas médicas - Dr. {currentUser?.first_name} {currentUser?.last_name}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hoy</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.hoy}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completadas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Próximas</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.proximas}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Buscar pacientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos los estados</option>
            <option value="scheduled">Programadas</option>
            <option value="confirmed">Confirmadas</option>
            <option value="in_progress">En Consulta</option>
            <option value="completed">Completadas</option>
            <option value="cancelled_by_patient">Canceladas</option>
          </select>
        </div>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Citas Médicas</CardTitle>
            <CardDescription>
              Lista de todas tus citas médicas programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCitas.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedStatus !== "all" 
                    ? "No se encontraron citas con los filtros aplicados" 
                    : "No tienes citas programadas"
                  }
                </p>
                {searchTerm || selectedStatus !== "all" ? (
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("")
                    setSelectedStatus("all")
                  }}>
                    Limpiar Filtros
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCitas.map((cita) => (
                  <div key={cita.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">
                            {cita.patient_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {cita.service_name || "Consulta General"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(cita.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(cita.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(cita.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{cita.patient_phone || "Sin teléfono"}</span>
                      </div>
                    </div>
                    
                    {cita.notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <strong>Notas:</strong> {cita.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}