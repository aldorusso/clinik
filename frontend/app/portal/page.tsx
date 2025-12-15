"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClientPortalLayout } from "@/components/dashboard/client-portal-layout"
import { 
  Calendar, 
  FileHeart, 
  Stethoscope, 
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Heart
} from "lucide-react"
import { api, User as UserType } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function PatientPortalPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [recentTreatments, setRecentTreatments] = useState<any[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // Load user data
        const userData = await api.getCurrentUser(token)
        setUser(userData)
        
        // TODO: Load patient-specific data
        // - Upcoming appointments
        // - Recent treatments
        // - Pending payments
        
        setLoading(false)
      } catch (error: any) {
        console.error('Error loading dashboard data:', error)
        toast({
          title: "Error",
          description: "Error al cargar la información",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [toast])

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 18) return "Buenas tardes"
    return "Buenas noches"
  }

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
        {/* Welcome Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" />
              {getWelcomeMessage()}, {user?.first_name || "Paciente"}
            </h1>
            <p className="text-muted-foreground">
              Bienvenido a tu portal de paciente - Tu salud es nuestra prioridad
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Paciente
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas Citas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                En los próximos 30 días
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tratamientos</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentTreatments.length}</div>
              <p className="text-xs text-muted-foreground">
                Tratamientos activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Historial</CardTitle>
              <FileHeart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Registros médicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturación</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$0</div>
              <p className="text-xs text-muted-foreground">
                Saldo pendiente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Citas
              </CardTitle>
              <CardDescription>
                Tus citas programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tienes citas programadas</p>
                  <Button variant="outline" className="mt-4">
                    Solicitar Cita
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 3).map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Consulta de seguimiento</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.scheduled_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Confirmada</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileHeart className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>
                Actualizaciones en tu historial médico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Example activity */}
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Cita completada</p>
                    <p className="text-xs text-muted-foreground">
                      Consulta de evaluación inicial - hace 3 días
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Recordatorio</p>
                    <p className="text-xs text-muted-foreground">
                      Tomar medicación según indicaciones - hace 1 día
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4">
                Ver Todo el Historial
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileHeart className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Portal del Paciente</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Desde aquí puedes gestionar tus citas, revisar tu historial médico, 
                  y mantener comunicación con tu equipo médico. Si tienes alguna pregunta, 
                  no dudes en contactarnos.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Información confidencial
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Acceso seguro
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Protección HIPAA
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientPortalLayout>
  )
}
