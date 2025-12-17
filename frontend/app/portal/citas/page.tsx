"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClientPortalLayout } from "@/components/dashboard/client-portal-layout"
import { 
  Calendar, 
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from "lucide-react"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function PatientAppointmentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAppointments = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // Get patient's appointments using the real API
        const response = await api.getPatientAppointments(token)
        setAppointments(response)
        setLoading(false)
      } catch (error: any) {
        console.error('Error loading appointments:', error)
        toast({
          title: "Error",
          description: "Error al cargar las citas",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadAppointments()
  }, [toast])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Confirmada</Badge>
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completada</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>
      case "no_show":
        return <Badge variant="secondary">No asistió</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "no_show":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.scheduled_at) > new Date()
  )
  
  const pastAppointments = appointments.filter(apt => 
    new Date(apt.scheduled_at) <= new Date()
  )

  if (loading) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ClientPortalLayout>
    )
  }

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-500" />
              Mis Citas Médicas
            </h1>
            <p className="text-muted-foreground">
              Gestiona y revisa tus citas médicas programadas
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Solicitar Nueva Cita
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximas Citas ({upcomingAppointments.length})
            </CardTitle>
            <CardDescription>
              Citas programadas para los próximos días
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No tienes citas programadas</p>
                <Button variant="outline">
                  Solicitar Nueva Cita
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => {
                  const dateTime = formatDateTime(appointment.scheduled_at)
                  return (
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {getStatusIcon(appointment.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{appointment.service_name}</h3>
                              {getStatusBadge(appointment.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="capitalize">{dateTime.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{dateTime.time} ({appointment.duration_minutes} min)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{appointment.doctor_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{appointment.location}</span>
                              </div>
                            </div>
                            
                            {appointment.notes && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Reagendar
                          </Button>
                          <Button variant="ghost" size="sm">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Historial de Citas ({pastAppointments.length})
              </CardTitle>
              <CardDescription>
                Citas anteriores y su estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastAppointments.map((appointment) => {
                  const dateTime = formatDateTime(appointment.scheduled_at)
                  return (
                    <div key={appointment.id} className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(appointment.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{appointment.service_name}</span>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {dateTime.date} a las {dateTime.time} - {appointment.doctor_name}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientPortalLayout>
  )
}