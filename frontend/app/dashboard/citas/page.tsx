"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  AlertCircle,
  Edit,
  Eye,
  Mail,
  MapPin,
  CreditCard,
  Stethoscope,
  UserPlus,
  CalendarCheck,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  RefreshCw,
  X
} from "lucide-react"
import { Appointment, AppointmentStatus, AppointmentCreate, User as UserType, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function CitasPage() {
  const { toast } = useToast()
  const [citas, setCitas] = useState<Appointment[]>([])
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [availableProviders, setAvailableProviders] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("hoy")
  const [selectedProvider, setSelectedProvider] = useState<string>("")  // New: filter by doctor
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  // Form states
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

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // Load current user
        const userData = await api.getCurrentUser(token)
        setCurrentUser(userData)

        // Load appointments
        const appointmentsData = await api.getAppointments(token, {
          page_size: 100,
          order_by: 'scheduled_at',
          order_direction: 'asc'
        })
        setCitas(appointmentsData)
        
        // Debug appointments data
        console.log('Loaded appointments:', appointmentsData)
        console.log('Sample appointment:', appointmentsData[0])

        // Load available providers (doctors)
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

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusMap = {
      scheduled: { label: "Programada", variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
      confirmed: { label: "Confirmada", variant: "default" as const, icon: CheckCircle, color: "text-blue-600" },
      in_progress: { label: "En Consulta", variant: "secondary" as const, icon: Stethoscope, color: "text-green-600" },
      completed: { label: "Completada", variant: "secondary" as const, icon: CheckCircle2, color: "text-green-600" },
      no_show: { label: "No Asistió", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      cancelled_by_patient: { label: "Cancelada", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      cancelled_by_clinic: { label: "Cancelada", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      rescheduled: { label: "Reprogramada", variant: "outline" as const, icon: RefreshCw, color: "text-orange-600" }
    }
    
    const statusInfo = statusMap[status] || { 
      label: status, 
      variant: "default" as const, 
      icon: Clock,
      color: "text-gray-600"
    }
    const IconComponent = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant} className={`flex items-center gap-1 ${statusInfo.color}`}>
        <IconComponent className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

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

      toast({
        title: "Éxito",
        description: message,
      })
      
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
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
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
      
      // Reset form
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
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Filter appointments based on tab, search, and doctor
  const getFilteredAppointments = () => {
    let filtered = citas

    // Apply tab filter
    if (selectedTab === "hoy") {
      filtered = citas.filter(cita => cita.is_today)
    } else if (selectedTab === "pendientes") {
      filtered = citas.filter(cita => cita.status === 'scheduled')
    } else if (selectedTab === "confirmadas") {
      filtered = citas.filter(cita => cita.status === 'confirmed')
    } else if (selectedTab === "consulta") {
      filtered = citas.filter(cita => cita.status === 'in_progress')
    }

    // Apply doctor filter
    if (selectedProvider) {
      filtered = filtered.filter(cita => cita.provider_id === selectedProvider)
    }

    // Apply search filter
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

  // Calculate stats for receptionist dashboard
  const stats = {
    total: citas.length,
    hoy: citas.filter(cita => cita.is_today).length,
    pendientes: citas.filter(cita => cita.status === 'scheduled').length, // All pending, not just today
    confirmadas: citas.filter(cita => cita.status === 'confirmed').length, // All confirmed, not just today
    consulta: citas.filter(cita => cita.status === 'in_progress').length,
    completadas_hoy: citas.filter(cita => cita.status === 'completed' && cita.is_today).length,
    proximas: citas.filter(cita => cita.is_upcoming || (cita.status === 'scheduled' || cita.status === 'confirmed')).length,
    necesitan_confirmacion: citas.filter(cita => cita.needs_confirmation).length
  }
  
  // Debug stats
  console.log('Appointments stats:', stats)
  console.log('Total appointments:', citas.length)
  if (citas.length > 0) {
    console.log('First appointment status:', citas[0]?.status)
    console.log('First appointment is_today:', citas[0]?.is_today)
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = now.toDateString() === date.toDateString()
    
    if (isToday) {
      return `Hoy ${formatTime(dateString)}`
    }
    return `${formatDate(dateString)} ${formatTime(dateString)}`
  }

  const getProviderName = (providerId: string) => {
    const provider = availableProviders.find(p => p.id === providerId)
    return provider?.full_name || provider?.first_name || 'Proveedor'
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
        {/* Header with Role-specific Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              {currentUser?.role === 'medico' ? '📅 Mis Citas' : 'Panel de Recepción'}
            </h1>
            <p className="text-muted-foreground">
              {currentUser?.role === 'medico' 
                ? 'Agenda médica personal - Solo mis consultas' 
                : `Gestión integral de citas médicas • ${currentUser?.role === 'recepcionista' ? 'Recepcionista' : 'Personal clínico'}`
              }
            </p>
          </div>
          <div className="flex gap-2">
            {/* Solo mostrar botón de nueva cita para no médicos */}
            {currentUser?.role !== 'medico' && (
              <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Cita
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5" />
                    Agendar Nueva Cita
                  </DialogTitle>
                  <DialogDescription>
                    Complete la información del paciente y seleccione el horario disponible
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {/* Patient Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient_name">Nombre del Paciente *</Label>
                      <Input
                        id="patient_name"
                        placeholder="Nombre completo"
                        value={newAppointmentForm.patient_name}
                        onChange={(e) => setNewAppointmentForm({...newAppointmentForm, patient_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient_phone">Teléfono *</Label>
                      <Input
                        id="patient_phone"
                        placeholder="+52 55 1234 5678"
                        value={newAppointmentForm.patient_phone}
                        onChange={(e) => setNewAppointmentForm({...newAppointmentForm, patient_phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="patient_email">Email (Opcional)</Label>
                    <Input
                      id="patient_email"
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={newAppointmentForm.patient_email}
                      onChange={(e) => setNewAppointmentForm({...newAppointmentForm, patient_email: e.target.value})}
                    />
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider_id">Médico/Especialista *</Label>
                      <Select value={newAppointmentForm.provider_id} onValueChange={(value) => setNewAppointmentForm({...newAppointmentForm, provider_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar médico" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProviders.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4" />
                                {provider.full_name || `${provider.first_name} ${provider.last_name}`}
                                {provider.job_title && (
                                  <span className="text-xs text-muted-foreground">• {provider.job_title}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration_minutes">Duración (min)</Label>
                      <Select value={String(newAppointmentForm.duration_minutes)} onValueChange={(value) => setNewAppointmentForm({...newAppointmentForm, duration_minutes: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">60 minutos</SelectItem>
                          <SelectItem value="90">90 minutos</SelectItem>
                          <SelectItem value="120">120 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_date">Fecha *</Label>
                      <Input
                        id="scheduled_date"
                        type="date"
                        value={newAppointmentForm.scheduled_date}
                        onChange={(e) => setNewAppointmentForm({...newAppointmentForm, scheduled_date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_time">Hora *</Label>
                      <Input
                        id="scheduled_time"
                        type="time"
                        value={newAppointmentForm.scheduled_time}
                        onChange={(e) => setNewAppointmentForm({...newAppointmentForm, scheduled_time: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas adicionales</Label>
                    <Textarea
                      id="notes"
                      placeholder="Motivo de la consulta, síntomas, etc."
                      value={newAppointmentForm.notes}
                      onChange={(e) => setNewAppointmentForm({...newAppointmentForm, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAppointment} className="bg-blue-600 hover:bg-blue-700">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Agendar Cita
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.hoy}</div>
              <p className="text-xs text-muted-foreground">Citas programadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Confirmar</CardTitle>
              <PhoneCall className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
              <p className="text-xs text-muted-foreground">Necesitan confirmación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmadas}</div>
              <p className="text-xs text-muted-foreground">Listas para atender</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Consulta</CardTitle>
              <Stethoscope className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.consulta}</div>
              <p className="text-xs text-muted-foreground">Actualmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.completadas_hoy}</div>
              <p className="text-xs text-muted-foreground">Hoy</p>
            </CardContent>
          </Card>
        </div>

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
            <Select value={selectedProvider || "all"} onValueChange={(value) => setSelectedProvider(value === "all" ? "" : value)}>
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

          {/* Tabs for different views */}
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

            {/* Tab Content */}
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
                        <div 
                          key={cita.id} 
                          className={`border rounded-lg p-5 hover:bg-muted/50 transition-colors ${
                            cita.is_today ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                          } ${
                            cita.is_past_due && cita.status !== 'completed' ? 'border-l-4 border-l-red-500 bg-red-50/50' : ''
                          } ${
                            cita.status === 'in_progress' ? 'border-l-4 border-l-green-500 bg-green-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{cita.patient_name}</h3>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(cita.status)}
                                    {cita.is_today && (
                                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                                        <Clock className="h-3 w-3 mr-1" />
                                        HOY
                                      </Badge>
                                    )}
                                    {cita.is_past_due && cita.status !== 'completed' && (
                                      <Badge variant="destructive" className="text-red-600">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        RETRASADA
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">{formatDateTime(cita.scheduled_at)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Stethoscope className="h-4 w-4 text-purple-600" />
                                  <span>{cita.provider_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4 text-green-600" />
                                  <span>{cita.patient_phone}</span>
                                </div>
                              </div>

                              {(cita.service_name || cita.notes) && (
                                <div className="text-sm space-y-1">
                                  {cita.service_name && (
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4 text-indigo-600" />
                                      <span><strong>Servicio:</strong> {cita.service_name}</span>
                                    </div>
                                  )}
                                  {cita.notes && (
                                    <div className="flex items-start gap-2">
                                      <MessageSquare className="h-4 w-4 text-gray-600 mt-0.5" />
                                      <span className="text-muted-foreground">{cita.notes}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {cita.patient_email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {cita.patient_email}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 ml-4">
                              {cita.status === 'scheduled' && (
                                <Button 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(cita.id, 'confirmed')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirmar
                                </Button>
                              )}
                              
                              {cita.status === 'confirmed' && (
                                <Button 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(cita.id, 'in_progress')}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Iniciar
                                </Button>
                              )}
                              
                              {cita.status === 'in_progress' && (
                                <Button 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(cita.id, 'completed')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Completar
                                </Button>
                              )}
                              
                              <div className="flex gap-1">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`tel:${cita.patient_phone}`, '_self')}
                                  className="flex-1"
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}