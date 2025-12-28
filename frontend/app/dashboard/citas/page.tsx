"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Plus,
  Search,
  CheckCircle,
  Eye,
  PhoneCall,
  Stethoscope,
  RefreshCw,
} from "lucide-react"
import { Appointment, AppointmentStatus, AppointmentCreate, User as UserType, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import {
  AppointmentCard,
  AppointmentsStatsCards,
  NewAppointmentDialog,
} from "@/components/appointments"

export default function CitasPage() {
  const { toast } = useToast()
  const { user: currentUser } = useUser()
  const [citas, setCitas] = useState<Appointment[]>([])
  const [availableProviders, setAvailableProviders] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("hoy")
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)

  const [newAppointmentForm, setNewAppointmentForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    provider_id: '',
    service_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    notes: '',
    type: 'consultation' as const
  })

  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        const appointmentsData = await api.getAppointments(token, {
          page_size: 100,
          order_by: 'scheduled_at',
          order_direction: 'asc'
        })
        setCitas(appointmentsData)

        const directoryData = await api.getMyTenantUsers(token)
        const providers = directoryData.filter(user =>
          user.role === 'medico' || user.role === 'tenant_admin' || user.role === 'manager'
        )
        setAvailableProviders(providers)
      } catch (error: any) {
        console.error('Error loading data:', error)
        toast({
          title: "Error",
          description: "Error al cargar la información",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const reloadAppointments = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const appointmentsData = await api.getAppointments(token, {
        page_size: 100,
        order_by: 'scheduled_at',
        order_direction: 'asc'
      })
      setCitas(appointmentsData)
    } catch (error: any) {
      console.error('Error reloading appointments:', error)
    }
  }

  const handleStatusUpdate = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const token = auth.getToken()
    if (!token) {
      toast({
        title: "Error de autenticación",
        description: "No se encontró un token válido. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      })
      return
    }

    try {
      await api.updateAppointmentStatus(token, appointmentId, newStatus)

      let message = "Estado actualizado correctamente"
      if (newStatus === 'confirmed') message = "Cita confirmada"
      else if (newStatus === 'in_progress') message = "Cita iniciada"
      else if (newStatus === 'completed') message = "Cita completada"
      else if (newStatus === 'no_show') message = "Paciente marcado como No Show"
      else if (newStatus === 'cancelled_by_patient') message = "Cita cancelada por paciente"
      else if (newStatus === 'cancelled_by_clinic') message = "Cita cancelada por clínica"

      toast({ title: "Éxito", description: message })
      reloadAppointments()
    } catch (error: any) {
      console.error('Error updating appointment status:', error)

      let errorMessage = "Error al actualizar el estado"
      if (error.message?.includes('CORS')) {
        errorMessage = "Error de conexión. Intenta recargar la página."
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Error de conexión con el servidor. Verifica tu internet."
      } else if (error.message && error.message !== '[object Object]') {
        errorMessage = error.message
      }

      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    }
  }

  const handleCreateAppointment = async () => {
    const token = auth.getToken()
    if (!token) return

    if (!newAppointmentForm.patient_name || !newAppointmentForm.patient_phone ||
        !newAppointmentForm.provider_id || !newAppointmentForm.scheduled_date ||
        !newAppointmentForm.scheduled_time) {
      toast({
        title: "Campos requeridos",
        description: "Complete todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (newAppointmentForm.patient_phone.length < 10) {
      toast({
        title: "Teléfono inválido",
        description: "El teléfono debe tener al menos 10 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      const scheduledAt = new Date(`${newAppointmentForm.scheduled_date}T${newAppointmentForm.scheduled_time}`)

      const appointmentData: AppointmentCreate = {
        patient_name: newAppointmentForm.patient_name,
        patient_phone: newAppointmentForm.patient_phone,
        patient_email: newAppointmentForm.patient_email || undefined,
        provider_id: newAppointmentForm.provider_id,
        service_id: newAppointmentForm.service_id || undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: newAppointmentForm.duration_minutes,
        notes: newAppointmentForm.notes || undefined,
        type: newAppointmentForm.type
      }

      await api.createAppointment(token, appointmentData)

      toast({
        title: "✓ Cita creada",
        description: `Cita agendada para ${newAppointmentForm.patient_name}`,
      })

      setNewAppointmentForm({
        patient_name: '',
        patient_phone: '',
        patient_email: '',
        provider_id: '',
        service_id: '',
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        notes: '',
        type: 'consultation'
      })

      setIsNewAppointmentOpen(false)
      reloadAppointments()
    } catch (error: any) {
      console.error('Error creating appointment:', error)

      let errorMessage = "Error al crear la cita"
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg || err.message).join(', ')
        } else {
          errorMessage = error.response.data.detail
        }
      } else if (error.message && error.message !== '[object Object]') {
        errorMessage = error.message
      }

      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    }
  }

  const getFilteredAppointments = () => {
    let filtered = citas

    if (selectedTab === "hoy") {
      filtered = citas.filter(cita => cita.is_today)
    } else if (selectedTab === "pendientes") {
      filtered = citas.filter(cita => cita.status === 'scheduled')
    } else if (selectedTab === "confirmadas") {
      filtered = citas.filter(cita => cita.status === 'confirmed')
    } else if (selectedTab === "consulta") {
      filtered = citas.filter(cita => cita.status === 'in_progress')
    }

    if (selectedProvider) {
      filtered = filtered.filter(cita => cita.provider_id === selectedProvider)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(cita =>
        cita.patient_name.toLowerCase().includes(search) ||
        cita.provider_name.toLowerCase().includes(search) ||
        cita.service_name?.toLowerCase().includes(search) ||
        cita.patient_email?.toLowerCase().includes(search) ||
        cita.patient_phone.toLowerCase().includes(search)
      )
    }

    return filtered
  }

  const filteredCitas = getFilteredAppointments()

  const stats = {
    total: citas.length,
    hoy: citas.filter(cita => cita.is_today).length,
    pendientes: citas.filter(cita => cita.status === 'scheduled').length,
    confirmadas: citas.filter(cita => cita.status === 'confirmed').length,
    consulta: citas.filter(cita => cita.status === 'in_progress').length,
    completadas_hoy: citas.filter(cita => cita.status === 'completed' && cita.is_today).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            {currentUser?.role === 'medico' ? 'Mis Citas' : 'Panel de Recepción'}
          </h1>
          <p className="text-muted-foreground">
            {currentUser?.role === 'medico'
              ? 'Agenda médica personal - Solo mis consultas'
              : `Gestión integral de citas médicas • ${currentUser?.role === 'recepcionista' ? 'Recepcionista' : 'Personal clínico'}`
            }
          </p>
        </div>
        <div className="flex gap-2">
          {currentUser?.role !== 'medico' && (
            <Button
              onClick={() => setIsNewAppointmentOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <AppointmentsStatsCards stats={stats} />

      {/* Search, Filters and Tabs */}
      <div className="flex flex-col space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, doctor, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedProvider || "all"}
            onValueChange={(value) => setSelectedProvider(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por médico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los médicos</SelectItem>
              {availableProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    {provider.full_name || `${provider.first_name} ${provider.last_name}`}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={reloadAppointments}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hoy" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Hoy ({stats.hoy})
            </TabsTrigger>
            <TabsTrigger value="pendientes" className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4" />
              Pendientes ({stats.pendientes})
            </TabsTrigger>
            <TabsTrigger value="confirmadas" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmadas ({stats.confirmadas})
            </TabsTrigger>
            <TabsTrigger value="consulta" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              En Consulta ({stats.consulta})
            </TabsTrigger>
            <TabsTrigger value="todas" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Todas ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedTab === 'hoy' && <><Calendar className="h-5 w-5" />Citas de Hoy</>}
                  {selectedTab === 'pendientes' && <><PhoneCall className="h-5 w-5" />Citas por Confirmar</>}
                  {selectedTab === 'confirmadas' && <><CheckCircle className="h-5 w-5" />Citas Confirmadas</>}
                  {selectedTab === 'consulta' && <><Stethoscope className="h-5 w-5" />Pacientes en Consulta</>}
                  {selectedTab === 'todas' && <><Eye className="h-5 w-5" />Todas las Citas</>}
                </CardTitle>
                <CardDescription>
                  {selectedTab === 'hoy' && 'Todas las citas programadas para el día de hoy'}
                  {selectedTab === 'pendientes' && 'Citas que necesitan confirmación telefónica'}
                  {selectedTab === 'confirmadas' && 'Citas confirmadas y listas para atender'}
                  {selectedTab === 'consulta' && 'Pacientes que están actualmente en consulta'}
                  {selectedTab === 'todas' && 'Vista general de todas las citas programadas'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCitas.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {searchTerm ? "No se encontraron citas" : "No hay citas"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm
                          ? "Intenta con otros términos de búsqueda"
                          : selectedTab === 'hoy'
                            ? "No hay citas programadas para hoy"
                            : `No hay citas en la categoría ${selectedTab}`
                        }
                      </p>
                      {!searchTerm && (
                        <Button onClick={() => setIsNewAppointmentOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Agendar Primera Cita
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredCitas.map((cita) => (
                      <AppointmentCard
                        key={cita.id}
                        appointment={cita}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Appointment Dialog */}
      <NewAppointmentDialog
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
        formData={newAppointmentForm}
        setFormData={setNewAppointmentForm}
        availableProviders={availableProviders}
        onSubmit={handleCreateAppointment}
      />
    </div>
  )
}
