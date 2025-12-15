"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ClientPortalLayout } from "@/components/dashboard/client-portal-layout"
import { 
  Stethoscope, 
  Calendar,
  User,
  Clock,
  TrendingUp,
  CheckCircle,
  Play,
  Pause,
  Image as ImageIcon,
  FileText
} from "lucide-react"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function PatientTreatmentsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [treatments, setTreatments] = useState<any[]>([])

  useEffect(() => {
    const loadTreatments = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // TODO: Implement patient treatments API
        // const response = await api.get('/api/v1/treatments/my-treatments', token)
        // setTreatments(response)
        
        // Mock data for now
        setTreatments([
          {
            id: "1",
            name: "Rejuvenecimiento Facial con Botox",
            description: "Tratamiento de líneas de expresión en zona fronto-temporal",
            status: "in_progress",
            doctor_name: "Dr. Carlos Mendez",
            start_date: "2024-11-25",
            estimated_end_date: "2024-12-25",
            total_sessions: 3,
            completed_sessions: 1,
            next_session_date: "2024-12-20T10:00:00Z",
            total_amount: 800,
            paid_amount: 400,
            progress_notes: [
              {
                date: "2024-11-25",
                note: "Primera sesión completada. Aplicación en zona fronto-temporal. Paciente tolera bien el procedimiento.",
                doctor: "Dr. Carlos Mendez"
              }
            ],
            before_photos: ["photo1.jpg"],
            after_photos: []
          },
          {
            id: "2", 
            name: "Limpieza Facial Profunda",
            description: "Tratamiento de limpieza y exfoliación facial",
            status: "completed",
            doctor_name: "Dr. María García",
            start_date: "2024-10-15",
            end_date: "2024-11-15",
            total_sessions: 4,
            completed_sessions: 4,
            total_amount: 400,
            paid_amount: 400,
            progress_notes: [
              {
                date: "2024-11-15",
                note: "Tratamiento completado exitosamente. Mejora notable en textura de la piel.",
                doctor: "Dr. María García"
              }
            ],
            before_photos: ["before1.jpg"],
            after_photos: ["after1.jpg"]
          }
        ])
        
        setLoading(false)
      } catch (error: any) {
        console.error('Error loading treatments:', error)
        toast({
          title: "Error",
          description: "Error al cargar los tratamientos",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadTreatments()
  }, [toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En Progreso</Badge>
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>
      case "paused":
        return <Badge variant="secondary">Pausado</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "paused":
        return <Pause className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0
  }

  const activeTreatments = treatments.filter(t => t.status === "in_progress")
  const completedTreatments = treatments.filter(t => t.status === "completed")

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
              <Stethoscope className="h-8 w-8 text-green-500" />
              Mis Tratamientos
            </h1>
            <p className="text-muted-foreground">
              Seguimiento de tus tratamientos médicos y estéticos
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tratamientos Activos</p>
                  <p className="text-2xl font-bold">{activeTreatments.length}</p>
                </div>
                <Play className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completados</p>
                  <p className="text-2xl font-bold">{completedTreatments.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sesiones</p>
                  <p className="text-2xl font-bold">
                    {treatments.reduce((sum, t) => sum + t.completed_sessions, 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Treatments */}
        {activeTreatments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Tratamientos Activos
              </CardTitle>
              <CardDescription>
                Tratamientos en curso que requieren seguimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeTreatments.map((treatment) => (
                  <div key={treatment.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(treatment.status)}
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {treatment.name}
                            {getStatusBadge(treatment.status)}
                          </h3>
                          <p className="text-muted-foreground">{treatment.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progreso del Tratamiento</span>
                        <span className="text-sm text-muted-foreground">
                          {treatment.completed_sessions}/{treatment.total_sessions} sesiones
                        </span>
                      </div>
                      <Progress 
                        value={calculateProgress(treatment.completed_sessions, treatment.total_sessions)} 
                        className="h-2"
                      />
                    </div>

                    {/* Treatment Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Doctor</p>
                          <p className="text-sm text-muted-foreground">{treatment.doctor_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Inicio</p>
                          <p className="text-sm text-muted-foreground">{formatDate(treatment.start_date)}</p>
                        </div>
                      </div>

                      {treatment.next_session_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Próxima Sesión</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(treatment.next_session_date)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Progress */}
                    <div className="mb-4 p-3 bg-muted rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Pago</span>
                        <span className="text-sm">
                          ${treatment.paid_amount} / ${treatment.total_amount}
                        </span>
                      </div>
                      <Progress 
                        value={(treatment.paid_amount / treatment.total_amount) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Latest Progress Note */}
                    {treatment.progress_notes.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Última Nota de Progreso</h4>
                        <div className="bg-muted p-3 rounded">
                          <p className="text-sm mb-1">{treatment.progress_notes[0].note}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(treatment.progress_notes[0].date)} - {treatment.progress_notes[0].doctor}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Historial Completo
                      </Button>
                      {(treatment.before_photos.length > 0 || treatment.after_photos.length > 0) && (
                        <Button variant="outline" size="sm">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Ver Fotos
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Treatments */}
        {completedTreatments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Tratamientos Completados
              </CardTitle>
              <CardDescription>
                Tratamientos finalizados exitosamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedTreatments.map((treatment) => (
                  <div key={treatment.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        <div>
                          <h3 className="font-semibold">{treatment.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{treatment.description}</p>
                          
                          <div className="flex gap-4 text-sm">
                            <span><strong>Período:</strong> {formatDate(treatment.start_date)} - {formatDate(treatment.end_date)}</span>
                            <span><strong>Doctor:</strong> {treatment.doctor_name}</span>
                            <span><strong>Sesiones:</strong> {treatment.completed_sessions}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                        {treatment.after_photos.length > 0 && (
                          <Button variant="outline" size="sm">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Resultados
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientPortalLayout>
  )
}